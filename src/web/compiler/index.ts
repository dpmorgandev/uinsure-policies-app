// The trail compiler (trace-data skill): reads docs/ and git at one ref, never .claude/ and never the network
// (DATA-6, DATA-7), and writes only src/web/public/trace.json and the lazy chunks it names (DATA-1).
//   node compiler/index.ts --ref <ref>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { listDocs, readBlob, readCommits, resolveRef } from './git.ts';
import { isHit, parseDenylist, scan } from './privacy.ts';
import { parseDag, parseRequirements } from './plans.ts';
import { parseCompleteness, parseMatrix, parseWalkthrough } from './trace-files.ts';

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
const MATRIX = 'docs/trace/requirements-matrix.md';
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

/** A verdict file: `A<round>-<agent>.json`, the verdict itself either bare or under `verdict`. Null when it is neither. */
function verdictOf(file: string, text: string, plan: string, node: string): Json | null {
  let record: unknown;
  try {
    record = JSON.parse(text);
  } catch {
    return null;
  }
  const outer = typeof record === 'object' && record !== null ? (record as Json) : null;
  const inner = typeof outer?.['verdict'] === 'object' && outer['verdict'] !== null ? (outer['verdict'] as Json) : outer;
  const name = /\/(A\d+)-([^/]+)\.json$/.exec(file);
  const verdict = str(inner?.['verdict']);
  if (inner === null || name === null || verdict === null) return null;
  return {
    plan, node, round: name[1], agent: str(inner['agent']) ?? name[2], verdict, head: str(inner['head_sha']),
    rulesCovered: list(inner['rules_covered']), rulesMissing: list(inner['rules_missing']),
    findings: Array.isArray(inner['findings']) ? inner['findings'] : [], file,
  };
}

export function compile(options: CompileOptions): void {
  const { root, ref } = options;
  const sha = resolveRef(root, ref);
  if (sha === null) {
    // The ref's own tree can't be read, so the ref is scanned with HEAD's denylist; it is named only when that finds it clean.
    const head = resolveRef(root, 'HEAD');
    const text = head !== null && listDocs(root, head).includes(DENYLIST) ? readBlob(root, head, DENYLIST) : null;
    const clean = text !== null && !isHit(parseDenylist(text, DENYLIST).list, ref);
    fail([{ file: null, line: null, reason: clean ? `the ref ${ref} names no commit` : 'the ref names no commit' }]);
  }

  const paths = new Set(listDocs(root, sha));
  if (!paths.has(DENYLIST)) fail([{ file: DENYLIST, line: null, reason: 'the privacy denylist is missing' }]);
  const denylist = parseDenylist(readBlob(root, sha, DENYLIST), DENYLIST);
  if (denylist.problems.length > 0) fail(denylist.problems);

  const fatal: Problem[] = [];
  const problems: Problem[] = [];
  if (isHit(denylist.list, ref)) fatal.push({ file: 'the ref', line: null, reason: 'matches the privacy denylist' });
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

  const commits = readCommits(root, sha).map((commit) => {
    // Subject and every trailer value: a hit names the commit, never the text.
    if ([commit.subject, ...Object.values(commit.trailers)].some((value) => isHit(denylist.list, value))) {
      fatal.push({ file: `commit ${commit.sha.slice(0, 7)}`, line: null, reason: 'matches the privacy denylist' });
    }
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
      date: commit.date,
    };
  });

  const plans: Json[] = [];
  const nodes: Json[] = [];
  const verdicts: Json[] = [];
  const decisions: Json[] = [];
  // A commit's row in its node's walkthrough (RULE-2), by short SHA.
  const places = new Map<string, number>();
  const chunks = new Map<string, unknown>();
  for (const { path, dag } of dags) {
    if (dag.id === null) {
      // A path from git is scanned before it is said; a hit fails the compile without naming the path.
      if (isHit(denylist.list, path)) fatal.push({ file: 'a plan file', line: null, reason: 'its path matches the privacy denylist' });
      problems.push({ file: isHit(denylist.list, path) ? null : path, line: null, reason: 'the plan has no plan_id' });
      continue;
    }
    plans.push({ id: dag.id, kind: dag.kind, title: dag.title, source: path, nodes: dag.nodes.map((node) => node.id) });
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
              : { line, ts: str(record['ts']), attempt: num(record['attempt']), agent: str(record['agent']), tool: str(record['tool']), file: str(record['file']), command: str(record['command']), commit: record['commit'] ?? null },
          ),
        );
      }
      // The loop events are U3's and stay out of trace.json; U1 takes the human decisions from them (NAV-1).
      const loopPath = `${dir}/loop.jsonl`;
      const loopText = read(loopPath);
      for (const { line, record } of loopText === null ? [] : readLines(loopPath, loopText, problems)) {
        const kind = /^(pause1|pause2|signoff)(\(|$)/.exec(str(record?.['event']) ?? '')?.[1];
        if (record !== null && kind !== undefined) {
          decisions.push({
            kind, who: null, what: str(record['detail']), when: str(record['ts']),
            plan: dag.id, node: node.id, evidence: { file: loopPath, line },
          });
        }
      }
      for (const path of [...paths].filter((p) => p.startsWith(`${dir}/verdicts/`) && p.endsWith('.json'))) {
        const verdict = verdictOf(path, read(path) ?? '', dag.id, node.id);
        if (verdict === null) problems.push({ file: path, line: null, reason: 'the verdict file is not a verdict' });
        else verdicts.push(verdict);
      }
      const readme = read(`${dir}/README.md`);
      const walkthrough = read(`${dir}/walkthrough.md`);
      for (const [short, row] of walkthrough === null ? [] : parseWalkthrough(walkthrough)) places.set(short, row);
      const { completeness, reasons } = parseCompleteness(readme);
      nodes.push({
        plan: dag.id, id: node.id, title: node.title, owner: node.owner, status: node.status, attempt: node.attempt,
        // A node with no README, activity or loop has no trail; its completeness is null, never OK (DATA-4).
        trail: readme !== null || activityText !== null || loopText !== null,
        completeness, completenessReasons: reasons, rules: node.rules,
        readme, walkthrough: [], chunks: { activity: activityChunk, diffs: null },
      });
    }
  }

  const matrixText = read(MATRIX);
  const matrix = matrixText === null ? new Map() : parseMatrix(MATRIX, matrixText);
  const seen = new Set<string>();
  const rules = rows
    .filter((row) => !seen.has(row.id) && seen.add(row.id))
    .map((row) => {
      const cells = matrix.get(row.id) ?? null;
      const commitsOf = (short: string | null): string[] => (short === null ? [] : [short]);
      return {
        id: row.id, title: row.title, priority: row.priority,
        feature: nodes.find((n) => list(n['rules']).includes(row.id))?.['id'] ?? null,
        // A rule is built when its matrix row holds a test count; no matrix row, no status (never a default).
        status: cells === null ? null : cells.tests === null ? 'not-built' : 'built',
        red: commitsOf(cells?.red ?? null), green: commitsOf(cells?.green ?? null), refactor: commitsOf(cells?.refactor ?? null),
        qaStep: cells?.qaStep ?? null, signoff: cells?.signoff ?? null, tests: [], matrix: cells,
      };
    });
  const placed = commits.map((commit) => ({
    ...commit,
    order: [...places].find(([short]) => commit.sha.startsWith(short))?.[1] ?? null,
  }));

  if (fatal.length > 0) fail(fatal);

  const trace = {
    schemaVersion: SCHEMA_VERSION,
    compiledAt: { ref, sha, utc: (options.now ?? (() => new Date()))().toISOString() },
    problems, rules, plans, nodes, commits: placed, events: [], verdicts, findings: [], decisions, sessions: [], harness,
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
