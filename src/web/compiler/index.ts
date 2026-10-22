// The trail compiler (trace-data skill): reads docs/ and git at one ref, never .claude/ and never the network
// (DATA-6, DATA-7), and writes only src/web/public/trace.json and the lazy chunks it names (DATA-1).
//   node compiler/index.ts --ref <ref>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { listDocs, listPaths, readBlob, readCommits, resolveRef } from './git.ts';
import { isTestSource, parseTests } from './test-sources.ts';
import { isHit, parseDenylist, scan } from './privacy.ts';
import { parseDag, parseRequirements, partsOf, sectionOf, splitFrontmatter, splitRootCause } from './plans.ts';
import { parseCompleteness, parseMatrix, parseWalkthrough } from './trace-files.ts';
import type { MatrixRow } from './trace-files.ts';

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
// Each plan's requirements file is read against its own matrix, as render-trace pairs them.
const PLAN_FILES = [
  { requirements: 'docs/requirements.md', matrix: 'docs/trace/requirements-matrix.md' },
  { requirements: 'docs/ui-requirements.md', matrix: 'docs/trace/ui-requirements-matrix.md' },
];

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
function fixesFinding(trailers: string[]): { round: number | null; id: string }[] {
  return trailers
    .flatMap((trailer) => trailer.split(','))
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
  const name = /\/(A\d+(?:\.\d+)?)-([^/]+)\.json$/.exec(file);
  const verdict = str(inner?.['verdict']);
  if (inner === null || name === null || verdict === null) return null;
  return {
    plan, node, round: name[1], agent: str(inner['agent']) ?? name[2], verdict, head: str(inner['head_sha']),
    attempt: num(outer?.['attempt']) ?? num(inner['attempt']), ts: str(outer?.['ts']),
    base: str(inner['base_sha']), diffFingerprint: str(inner['diff_fingerprint']), gateRefs: list(inner['gate_refs']),
    rulesCovered: list(inner['rules_covered']), rulesMissing: list(inner['rules_missing']),
    findings: Array.isArray(inner['findings']) ? inner['findings'] : [], file, raw: text, provenance: 'recorded',
  };
}

/** A line of a loop.jsonl as an event: the event name gives its kind (gate.<gate>, state(…), or the name before its argument). */
function eventOf(plan: string, node: string, line: number, record: Json | null, raw: string): Json {
  const event = str(record?.['event']);
  const kind = event === null ? null : event.startsWith('gate.') ? 'gate' : (/^[^(]*/.exec(event)?.[0] ?? event);
  const ok = record?.['ok'];
  return {
    plan, node, line, ts: str(record?.['ts']), attempt: num(record?.['attempt']), event, kind,
    gate: kind === 'gate' ? event?.slice('gate.'.length) ?? null : null,
    cmd: str(record?.['cmd']), exit: num(record?.['exit']), expect: str(record?.['expect']),
    ok: typeof ok === 'boolean' ? ok : null, head: str(record?.['head']), detail: str(record?.['detail']),
    source: str(record?.['source']), raw, provenance: 'generated',
  };
}

/** A findings/<round>.md: its frontmatter, then the round's JSON bare or in a ```json fence. Null JSON is unreadable. */
function roundOf(text: string): { frontmatter: Record<string, unknown> | null; round: Json | null } {
  const { frontmatter, body } = splitFrontmatter(text);
  const fenced = /^\s*```json\r?\n([\s\S]*?)\r?\n```/.exec(body);
  let round: Json | null = null;
  try {
    const parsed: unknown = JSON.parse(fenced ? (fenced[1] ?? '') : body);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) round = parsed as Json;
  } catch {
    round = null;
  }
  return { frontmatter, round };
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
  const rows = PLAN_FILES.flatMap(({ requirements, matrix }) =>
    parseRequirements(read(requirements) ?? '').map((row) => ({ ...row, file: requirements, matrix })),
  );

  // Test names are emitted, so each is scanned; the source files are not (a hit names the file and line, never the text).
  const testNames = listPaths(root, sha, 'tests').filter(isTestSource).flatMap((path) => parseTests(path, readBlob(root, sha, path)));
  for (const test of testNames) {
    if (isHit(denylist.list, test.name)) fatal.push({ file: test.file, line: test.line, reason: 'matches the privacy denylist' });
  }

  const slashOfPart = new Map(rows.flatMap((row) => (row.id.includes('/') ? partsOf(row.id).map((part) => [part, row.id] as const) : [])));
  const commits = readCommits(root, sha).map((commit) => {
    // Subject and every line of every trailer: a hit names the commit, never the text.
    if ([commit.subject, ...Object.values(commit.trailers).flat()].some((value) => isHit(denylist.list, value))) {
      fatal.push({ file: `commit ${commit.sha.slice(0, 7)}`, line: null, reason: 'matches the privacy denylist' });
    }
    // Agent, Plan, Node and TDD are single-valued: a repeat keeps its first line.
    const [Agent, Plan, Node, TDD] = ['Agent', 'Plan', 'Node', 'TDD'].map((key) => commit.trailers[key]?.[0]);
    // `Rule: none` is the harness's sentinel for no rule. A part on a commit is its slash rule's (RENEW-1 is RENEW-1/2's).
    const rule = (commit.trailers['Rule'] ?? [])
      .flatMap((value) => value.split(','))
      .map((id) => id.trim())
      .filter((id) => id !== '' && id !== 'none')
      .map((id) => slashOfPart.get(id) ?? id)
      .filter((id, at, all) => all.indexOf(id) === at);
    return {
      sha: commit.sha,
      short: commit.sha.slice(0, 7),
      subject: commit.subject,
      plan: Plan ?? null,
      node: Node ?? null,
      agent: Agent ?? null,
      rule,
      tdd: TDD ?? null,
      fixesFinding: fixesFinding(commit.trailers['Fixes-Finding'] ?? []),
      date: commit.date,
      parents: commit.parents,
    };
  });

  const plans: Json[] = [];
  const nodes: Json[] = [];
  const verdicts: Json[] = [];
  const events: Json[] = [];
  const findings: Json[] = [];
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
      const loopPath = `${dir}/loop.jsonl`;
      const loopText = read(loopPath);
      for (const { line, record, raw } of loopText === null ? [] : readLines(loopPath, loopText, problems)) {
        events.push(eventOf(dag.id, node.id, line, record, raw));
        // The human decisions are taken from the same lines (NAV-1).
        // signoff(<sha>) and merged(<sha>) name the commit signed off and the merge commit.
        const event = /^(pause1|pause2|signoff|merged)(?:\(([^)]*)\))?$/.exec(str(record?.['event']) ?? '');
        if (record !== null && event !== null) {
          decisions.push({
            kind: event[1] === 'merged' ? 'merge' : event[1], sha: event[2] ?? null, who: null, what: str(record['detail']), when: str(record['ts']),
            plan: dag.id, node: node.id, evidence: { file: loopPath, line },
          });
        }
      }
      for (const path of [...paths].filter((p) => p.startsWith(`${dir}/verdicts/`) && p.endsWith('.json'))) {
        const verdict = verdictOf(path, read(path) ?? '', dag.id, node.id);
        if (verdict === null) problems.push({ file: path, line: null, reason: 'the verdict file is not a verdict' });
        else verdicts.push(verdict);
      }
      for (const path of [...paths].filter((p) => p.startsWith(`${dir}/findings/`) && p.endsWith('.md'))) {
        const { frontmatter, round } = roundOf(read(path) ?? '');
        if (round === null || !Array.isArray(round['findings'])) {
          problems.push({ file: path, line: null, reason: 'the findings round has no readable JSON' });
          continue;
        }
        const name = str(frontmatter?.['round']) ?? /\/([^/]+)\.md$/.exec(path)?.[1] ?? null;
        for (const item of round['findings'] as unknown[]) {
          const finding = typeof item === 'object' && item !== null ? (item as Json) : {};
          const id = str(finding['id']);
          const text = str(finding['root_cause']);
          findings.push({
            plan: dag.id, node: node.id, round: name, id,
            kind: str(round['source']) === 'david' ? 'steer' : 'investigator',
            attempt: num(round['attempt']) ?? num(frontmatter?.['attempt']), source: str(round['source_ref']), file: path,
            rule: str(finding['rule_id']), layer: str(finding['layer']), files: list(finding['files']),
            ...(text === null ? { symptom: null, cause: null, fixDirection: null } : splitRootCause(text)),
            testable: typeof finding['testable'] === 'boolean' ? finding['testable'] : null,
            suggestedTest: str(finding['suggested_test']), untestableReason: str(finding['untestable_reason']),
            // The commits whose Fixes-Finding names this round and finding, oldest first.
            fixedBy: commits
              .filter((c) => c.plan === dag.id && c.node === node.id && c.fixesFinding.some((f) => `A${f.round}` === name && f.id === id))
              .map((c) => c.sha),
            provenance: 'recorded',
          });
        }
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

  // An investigation has a plan file of its own and no DAG; its parent node is where it rejoins the spine (LOOP-2).
  for (const path of [...paths].filter((p) => /^docs\/plans\/(active|archive)\/inv-[^/]+\.plan\.md$/.test(p))) {
    const text = read(path) ?? '';
    const { frontmatter } = splitFrontmatter(text);
    const id = typeof frontmatter?.['plan_id'] === 'string' ? frontmatter['plan_id'] : null;
    if (id === null) {
      problems.push({ file: isHit(denylist.list, path) ? null : path, line: null, reason: 'the plan has no plan_id' });
      continue;
    }
    plans.push({
      id, kind: 'inv', title: typeof frontmatter?.['title'] === 'string' ? frontmatter['title'] : null, source: path, nodes: [],
      frontmatter, question: sectionOf(text, 'Question'), hypothesis: sectionOf(text, 'Hypothesis'),
    });
  }

  const matrices = new Map(
    PLAN_FILES.map(({ matrix }) => {
      const text = read(matrix);
      return [matrix, text === null ? new Map<string, MatrixRow>() : parseMatrix(matrix, text, problems)] as const;
    }),
  );
  const seen = new Set<string>();
  const rules = rows
    .filter((row) => !seen.has(row.id) && seen.add(row.id))
    .map((row) => {
      const cells = matrices.get(row.matrix)?.get(row.id) ?? null;
      const ids = [row.id, ...partsOf(row.id)];
      const commitsOf =(short: string | null): string[] => (short === null ? [] : [short]);
      return {
        id: row.id, title: row.title, priority: row.priority, feature: row.feature,
        interpretation: row.interpretation, source: { file: row.file, line: row.line },
        // A rule is built when its matrix row holds a test count; no matrix row, no status (never a default).
        status: cells === null ? null : cells.tests === null ? 'not-built' : 'built',
        red: commitsOf(cells?.red ?? null), green: commitsOf(cells?.green ?? null), refactor: commitsOf(cells?.refactor ?? null),
        qaStep: cells?.qaStep ?? null, signoff: cells?.signoff ?? null, matrix: cells,
        // A slash rule also takes the tests traited with its parts (RULE-1); a test traited with both parts is listed once.
        tests: testNames
          .filter((t) => ids.includes(t.rule))
          .filter((t, at, own) => own.findIndex((o) => o.file === t.file && o.line === t.line) === at)
          .map(({ name, file, parameterised }) => ({ name, file, parameterised })),
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
    problems, rules, plans, nodes, commits: placed, events, verdicts, findings, decisions, sessions: [], harness,
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
