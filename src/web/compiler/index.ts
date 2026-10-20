// The trail compiler (trace-data skill): reads docs/ and git at one ref, never .claude/ and never the network
// (DATA-6, DATA-7), and writes only src/web/public/trace.json and the lazy chunks it names (DATA-1).
//   node compiler/index.ts --ref <ref>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { listDocs, readBlob, readCommits, resolveRef } from './git.ts';
import { parseDenylist, scan } from './privacy.ts';
import { parseDag, parseRequirements } from './plans.ts';

export interface CompileOptions {
  root: string;
  ref: string;
  now?: () => Date;
}

export interface Problem {
  file: string | null;
  line: number | null;
  reason: string;
}

export interface CompileFailure extends Error {
  problems: Problem[];
}

const SCHEMA_VERSION = '1.0.0';
const DENYLIST = 'docs/trace/privacy-denylist.txt';
const HARNESS = 'docs/trace/harness.json';
const REQUIREMENTS = ['docs/requirements.md', 'docs/ui-requirements.md'];

type Json = Record<string, unknown>;

function fail(problems: Problem[]): never {
  const message = `the compile found ${problems.length} problem(s): ${problems.map((p) => `${p.file}:${p.line} ${p.reason}`).join('; ')}`;
  throw Object.assign(new Error(message), { problems }) as CompileFailure;
}

/** The records of a JSON-lines file; a line that is not a JSON object is a problem and is kept as raw. */
function readLines(file: string, text: string, problems: Problem[]): { line: number; record: Json | null; raw: string }[] {
  return text
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, line: index + 1 }))
    .filter(({ raw }) => raw.trim() !== '')
    .map(({ raw, line }) => {
      let record: Json | null = null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) record = parsed as Json;
      } catch {
        record = null;
      }
      if (record === null) problems.push({ file, line, reason: 'the line is not a JSON object' });
      return { line, record, raw };
    });
}

const str = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const num = (value: unknown): number | null => (typeof value === 'number' ? value : null);
const list = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);

/** `A1/I1` is round 1, finding I1; a form not in this shape keeps its id and has no round. */
function fixesFinding(trailer: string | undefined): { round: number | null; id: string }[] {
  return (trailer ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const form = /^A(\d+)\/(.+)$/.exec(item);
      return { round: form ? Number(form[1]) : null, id: form ? (form[2] ?? item) : item };
    });
}

export function compile(options: CompileOptions): void {
  const { root, ref } = options;
  const sha = resolveRef(root, ref);
  if (sha === null) fail([{ file: null, line: null, reason: `the ref ${ref} names no commit` }]);

  const paths = new Set(listDocs(root, sha));
  if (!paths.has(DENYLIST)) fail([{ file: DENYLIST, line: null, reason: 'the privacy denylist is missing' }]);
  const denylist = parseDenylist(readBlob(root, sha, DENYLIST), DENYLIST);
  if (denylist.problems.length > 0) fail(denylist.problems);

  const fatal: Problem[] = [];
  const problems: Problem[] = [];
  const read = (path: string): string | null => {
    if (!paths.has(path)) return null;
    const text = readBlob(root, sha, path);
    fatal.push(...scan(denylist.list, path, text));
    return text;
  };

  const harnessText = read(HARNESS);
  let harness: unknown = null;
  if (harnessText !== null) {
    try {
      harness = JSON.parse(harnessText);
    } catch {
      fatal.push({ file: HARNESS, line: null, reason: 'the harness file is not JSON' });
    }
  }

  const dags = [...paths]
    .filter((path) => /^docs\/plans\/(active|archive)\/[^/]+\.dag\.yaml$/.test(path))
    .map((path) => ({ path, dag: parseDag(read(path) ?? '') }));
  const rows = REQUIREMENTS.flatMap((path) => parseRequirements(read(path) ?? ''));

  const commits = readCommits(root, sha).map((commit, order) => {
    fatal.push(...scan(denylist.list, `git commit ${commit.sha.slice(0, 7)}`, commit.subject).map((p) => ({ ...p, line: null })));
    const { Agent, Plan, Node, Rule, TDD } = commit.trailers;
    return {
      sha: commit.sha,
      short: commit.sha.slice(0, 7),
      subject: commit.subject,
      plan: Plan ?? null,
      node: Node ?? null,
      agent: Agent ?? null,
      rule: (Rule ?? '').split(',').map((id) => id.trim()).filter(Boolean),
      tdd: TDD ?? null,
      fixesFinding: fixesFinding(commit.trailers['Fixes-Finding']),
      order,
    };
  });

  const plans: Json[] = [];
  const nodes: Json[] = [];
  const events: Json[] = [];
  const verdicts: Json[] = [];
  const chunks = new Map<string, unknown>();
  for (const { path, dag } of dags) {
    if (dag.id === null) {
      problems.push({ file: path, line: null, reason: 'the plan has no plan_id' });
      continue;
    }
    plans.push({ id: dag.id, kind: dag.kind, title: dag.title, nodes: dag.nodes.map((node) => node.id) });
    for (const node of dag.nodes) {
      const dir = `docs/trace/${dag.id}/${node.id}`;
      const activityPath = `${dir}/activity.jsonl`;
      const activityText = read(activityPath);
      const activityChunk = activityText === null ? null : `trace/${dag.id}/${node.id}/activity.json`;
      if (activityText !== null && activityChunk !== null) {
        chunks.set(
          activityChunk,
          readLines(activityPath, activityText, problems).map(({ line, record, raw }) =>
            record === null
              ? { line, raw }
              : { line, ts: str(record['ts']), agent: str(record['agent']), tool: str(record['tool']), file: str(record['file']), command: str(record['command']), commit: record['commit'] ?? null },
          ),
        );
      }
      const loopPath = `${dir}/loop.jsonl`;
      for (const { line, record, raw } of readLines(loopPath, read(loopPath) ?? '', problems)) {
        const event = str(record?.['event']);
        events.push({
          plan: dag.id, node: node.id, line, event, kind: event === null ? null : event.replace(/[.(].*$/, ''),
          gate: event?.startsWith('gate.') ? event.slice(5) : null,
          cmd: str(record?.['cmd']), exit: num(record?.['exit']), expect: str(record?.['expect']),
          ok: typeof record?.['ok'] === 'boolean' ? record['ok'] : null, head: str(record?.['head']), detail: str(record?.['detail']),
          raw: record === null ? raw : null,
        });
      }
      for (const path of [...paths].filter((p) => p.startsWith(`${dir}/verdicts/`) && p.endsWith('.json')).sort()) {
        const envelope = read(path);
        let body: Json | null = null;
        try {
          body = (JSON.parse(envelope ?? '') as Json)['verdict'] as Json;
        } catch {
          problems.push({ file: path, line: null, reason: 'the verdict file is not JSON with a verdict' });
        }
        if (body === null) continue;
        verdicts.push({
          plan: dag.id, node: node.id, round: Number(/\/A(\d+)-[^/]+$/.exec(path)?.[1] ?? NaN) || null,
          agent: str(body['agent']), verdict: str(body['verdict']), head: str(body['head_sha']),
          rulesCovered: list(body['rules_covered']), rulesMissing: list(body['rules_missing']),
          findings: Array.isArray(body['findings']) ? body['findings'] : [],
        });
      }
      nodes.push({
        plan: dag.id, id: node.id, title: node.title, status: node.status, attempt: node.attempt,
        completeness: null, completenessReasons: [], rules: node.rules,
        readme: read(`${dir}/README.md`), walkthrough: [], chunks: { activity: activityChunk, diffs: null },
      });
    }
  }

  const seen = new Set<string>();
  const rules = rows
    .filter((row) => !seen.has(row.id) && seen.add(row.id))
    .map((row) => {
      const commitsOf = (tdd: string): string[] => commits.filter((c) => c.tdd === tdd && c.rule.includes(row.id)).map((c) => c.sha);
      const green = commitsOf('green');
      return {
        id: row.id, title: row.title, priority: row.priority,
        feature: nodes.find((n) => list(n['rules']).includes(row.id))?.['id'] ?? null,
        status: green.length > 0 ? 'built' : 'not-built',
        red: commitsOf('red'), green, refactor: commitsOf('refactor'), qaStep: null, signoff: null, tests: [],
      };
    });

  if (fatal.length > 0) fail(fatal);

  const trace = {
    schemaVersion: SCHEMA_VERSION,
    compiledAt: { ref, sha, utc: (options.now ?? (() => new Date()))().toISOString() },
    problems, rules, plans, nodes, commits, events, verdicts, findings: [], decisions: [], sessions: [], harness,
  };
  const out = join(root, 'src', 'web', 'public');
  for (const [name, content] of [['trace.json', trace], ...chunks] as [string, unknown][]) {
    mkdirSync(dirname(join(out, name)), { recursive: true });
    writeFileSync(join(out, name), JSON.stringify(content));
  }
}

function main(): void {
  const at = process.argv.indexOf('--ref');
  const ref = at >= 0 ? (process.argv[at + 1] ?? 'HEAD') : 'HEAD';
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  try {
    compile({ root, ref });
  } catch (error) {
    const problems = (error as Partial<CompileFailure>).problems;
    if (problems === undefined) throw error;
    for (const p of problems) console.error(`${p.file ?? '-'}:${p.line ?? '-'} ${p.reason}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) main();
