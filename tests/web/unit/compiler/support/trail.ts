// The trail compiler's unit tests, in process: a fixture trail (tests/web/fixtures/trails/README.md) is replayed
// into a fresh git repo, the test may change it, the change is committed with the trail, and `compile()` runs on
// it with an injected clock. Nothing here throws when the compiler fails: a test asserts on what the run returned.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../../../../src/web/compiler/index';
import type { CompileFailure, Problem } from '../../../../../src/web/compiler/index';
import { replay } from '../../../fixtures/trails/replay.mjs';

export const fixturesDir = fileURLToPath(new URL('../../../fixtures/trails/', import.meta.url));

/** Generous: a replay is a handful of git commits, and Windows spawns slowly. */
export const SLOW = 60_000;

/** A fixed compile time, unlike every fixture commit's date (2026-10-18), so the stamp is the clock's. */
export const NOW = new Date(Date.UTC(2026, 9, 19, 8, 30, 15, 250));

/** The fields of trace.json (v1.0.0) these tests read. Every one is optional: a test asserts it exists. */
export interface TraceIndex {
  schemaVersion?: string;
  compiledAt?: { ref?: string; sha?: string; utc?: string };
  problems?: { file?: string | null; line?: number | null; reason?: string }[];
  rules?: { id?: string; status?: string | null; red?: string[]; green?: string[]; refactor?: string[] }[];
  plans?: { id?: string; kind?: string; title?: string | null; nodes?: string[] }[];
  nodes?: {
    plan?: string;
    id?: string;
    title?: string | null;
    rules?: string[];
    chunks?: { activity?: string | null; diffs?: string | null } | null;
  }[];
  commits?: {
    sha?: string;
    short?: string;
    subject?: string;
    plan?: string | null;
    node?: string | null;
    agent?: string | null;
    rule?: string[];
    tdd?: string | null;
  }[];
  events?: { plan?: string; node?: string; event?: string; detail?: string | null }[];
  harness?: Record<string, unknown> | null;
  [field: string]: unknown;
}

/**
 * One entry of an activity chunk: every field the activity screen reads (docs/ui/derived/U0b/activity/screen.json),
 * as the log line wrote it. `raw` is the malformed line kept as written. Not `commit.tdd`: no activity line holds
 * one, and the screen takes the TDD trailer from trace.json's commits.
 */
export interface ActivityLine {
  line?: number;
  ts?: string | null;
  attempt?: number | null;
  agent?: string | null;
  tool?: string | null;
  file?: string | null;
  command?: string | null;
  commit?: { sha?: string; subject?: string } | null;
  raw?: string;
}

export interface Trail {
  root: string;
  /** Each fixture commit's full SHA, by its id in commits.json. */
  shas: Record<string, string>;
  /** The commit the trail (and the test's changes) were committed in, on top of the fixture's commits. */
  head: string;
  cleanup(): void;
}

export interface Run {
  /** What compile() threw, or undefined when it returned. */
  error: unknown;
  /** The thrown error's problems, or undefined when it threw none (or did not throw). */
  problems: Problem[] | undefined;
  publicDir: string;
  /** trace.json as written, or null when none was written (or it isn't JSON). */
  trace: TraceIndex | null;
  /** Every file under src/web/public/ after the run, repo-relative with forward slashes. */
  written: string[];
}

export function git(root: string, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_DATE: '2026-10-18T17:00:00Z', GIT_COMMITTER_DATE: '2026-10-18T17:00:00Z' },
  }).trim();
}

export function filesUnder(dir: string, skip: (rel: string) => boolean = () => false, base = dir): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    const rel = relative(base, full).replace(/\\/g, '/');
    if (skip(rel)) return [];
    return statSync(full).isDirectory() ? filesUnder(full, skip, base) : [rel];
  });
}

export function writeIn(root: string, rel: string, text: string): void {
  const to = join(root, rel);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, text);
}

export function readIn(root: string, rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

/** Replaces a placeholder the fixture holds (privacy-hit/README.md) with a value, and checks it was there. */
export function replaceIn(root: string, rel: string, placeholder: string, value: string): void {
  const text = readIn(root, rel);
  if (!text.includes(placeholder)) throw new Error(`fixture setup: ${rel} holds no ${placeholder}`);
  writeIn(root, rel, text.replace(placeholder, value));
}

/** Replays a fixture, lets the test change the replayed tree, then commits the trail and the change. */
export function replayTrail(name: string, prepare?: (root: string) => void): Trail {
  const root = mkdtempSync(join(tmpdir(), `docket-unit-${name}-`));
  const { shas } = replay(join(fixturesDir, name), root);
  prepare?.(root);
  git(root, 'add', '-A');
  // Empty when the fixture has no trail/ and the test changes nothing (requirements-shapes): the commit is still made.
  git(root, 'commit', '-q', '--allow-empty', '-m', 'chore(trace): the fixture trail, committed for the compiler');
  const head = git(root, 'rev-parse', 'HEAD');
  return { root, shas, head, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

/** Runs compile() in process on a replayed repo, at a fixed clock unless the test gives one. */
export function run(root: string, options: { ref?: string; now?: Date } = {}): Run {
  const at = options.now ?? NOW;
  let error: unknown;
  try {
    compile({ root, ref: options.ref ?? 'HEAD', now: () => new Date(at.getTime()) });
  } catch (thrown) {
    error = thrown;
  }
  const publicDir = join(root, 'src', 'web', 'public');
  const tracePath = join(publicDir, 'trace.json');
  let trace: TraceIndex | null = null;
  if (existsSync(tracePath)) {
    try {
      trace = JSON.parse(readFileSync(tracePath, 'utf8')) as TraceIndex;
    } catch {
      trace = null;
    }
  }
  const failure = error as Partial<CompileFailure> | undefined;
  return {
    error,
    problems: Array.isArray(failure?.problems) ? failure.problems : undefined,
    publicDir,
    trace,
    written: filesUnder(publicDir).map((rel) => `src/web/public/${rel}`),
  };
}

/** What the run threw, as text for an assertion message. */
export function thrown(r: Run): string {
  if (r.error === undefined) return 'compile() returned';
  return r.error instanceof Error ? `compile() threw: ${r.error.message}` : `compile() threw ${String(r.error)}`;
}

/** Each problem as "<file>:<line>", once each, sorted. */
export function locations(problems: readonly Problem[] | undefined): string[] {
  return [...new Set((problems ?? []).map((p) => `${p.file}:${p.line}`))].sort();
}

/** The activity chunk trace.json names for a node, as written beside it, or null when it names or writes none. */
export function activity(r: Run, plan: string, node: string): ActivityLine[] | null {
  const chunk = r.trace?.nodes?.find((n) => n.plan === plan && n.id === node)?.chunks?.activity ?? null;
  if (chunk === null || !existsSync(join(r.publicDir, chunk))) return null;
  const lines = JSON.parse(readFileSync(join(r.publicDir, chunk), 'utf8')) as unknown;
  return Array.isArray(lines) ? (lines as ActivityLine[]) : null;
}

/** Every file under a directory with its content hash, keyed by relative path. */
export function hashes(dir: string, skip: (rel: string) => boolean = () => false): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of filesUnder(dir, skip)) {
    out[rel] = createHash('sha256').update(readFileSync(join(dir, rel))).digest('hex');
  }
  return out;
}

// The values privacy-hit/README.md describes, made from parts so that no file in this repo holds one: the
// pre-commit privacy scan would refuse it.
export const TOKEN = ['gh', 'p_', 'FixtureTokenNotARealOne'.padEnd(36, '0')].join('');
export const USER_PATH = ['C:', 'Users', 'fixture-person', 'notes.txt'].join('/');
export const ACTIVITY = 'docs/trace/build/F1/activity.jsonl';
export const LOOP = 'docs/trace/build/F1/loop.jsonl';
export const DENYLIST = 'docs/trace/privacy-denylist.txt';

/** Places the privacy-hit fixture's two placeholders: activity.jsonl line 2 and loop.jsonl line 3. */
export function placeHits(root: string, token: string = TOKEN, path: string = USER_PATH): void {
  replaceIn(root, ACTIVITY, '{{privacy-hit:token}}', token);
  replaceIn(root, LOOP, '{{privacy-hit:path}}', path);
}
