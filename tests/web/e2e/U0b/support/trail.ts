// A fixture trail, replayed into a fresh git repo and compiled by the trail compiler as `npm run trace` runs it:
// `node src/web/compiler/index.ts --ref <ref>` from inside the repo it compiles, which writes its output to that
// repo's src/web/public/ (trace.json and the lazy chunks under trace/<plan>/<node>/). Nothing here throws when
// the compiler fails: a test asserts on what the run returned.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { expect } from '@playwright/test';
import { replay } from '../../../fixtures/trails/replay.mjs';

/** The worktree the suite runs in (Playwright runs from src/web). */
export const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
export const compilerDir = join(repoRoot, 'src', 'web', 'compiler');
export const compilerEntry = join(compilerDir, 'index.ts');
export const fixturesDir = join(repoRoot, 'tests', 'web', 'fixtures', 'trails');
/** The design fixture: the trail compiled at the G4 sign-off SHA, for parity only. */
export const designFixtureDir = join(repoRoot, 'docs', 'ui', 'fixture');
export const derivedDir = join(repoRoot, 'docs', 'ui', 'derived', 'U0b');

/** The fields of trace.json (v1.0.0) these tests read. Every one is optional: a test asserts it exists. */
export interface TraceIndex {
  schemaVersion?: string;
  compiledAt?: { ref?: string; sha?: string; utc?: string };
  problems?: { file?: string; line?: number | null; reason?: string }[];
  plans?: { id?: string; kind?: string; title?: string | null; status?: string | null; nodes?: string[] }[];
  nodes?: {
    plan?: string;
    id?: string;
    title?: string | null;
    status?: string | null;
    chunks?: { activity?: string | null; diffs?: string | null } | null;
  }[];
  harness?: { provenance?: string; agents?: { name?: string }[] } | null;
}

export interface Trail {
  root: string;
  /** Each fixture commit's full SHA, by its id in commits.json. */
  shas: Record<string, string>;
  /** The commit the trail was committed in, on top of the fixture's commits. */
  head: string;
  cleanup(): void;
}

export interface Compiled {
  status: number | null;
  /** stdout then stderr. */
  output: string;
  publicDir: string;
  /** trace.json as written, or null when the compiler wrote none (or wrote something that isn't JSON). */
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

/**
 * Replays a fixture (README.md beside replay.mjs), lets the test change the replayed tree, then commits the trail
 * and the changes, so the compiler finds them both in the work tree and at HEAD.
 */
export function replayTrail(name: string, prepare?: (root: string) => void): Trail {
  const root = mkdtempSync(join(tmpdir(), `docket-${name}-`));
  const { shas } = replay(join(fixturesDir, name), root);
  prepare?.(root);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'chore(trace): the fixture trail, committed for the compiler');
  const head = git(root, 'rev-parse', 'HEAD');
  return { root, shas, head, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

/** What a run may touch, for Node's permission model (`node --permission`). */
export interface Permissions {
  read: string[];
  write: string[];
}

export function compile(root: string, options: { ref?: string; permissions?: Permissions } = {}): Compiled {
  const publicDir = join(root, 'src', 'web', 'public');
  const flags = options.permissions
    ? [
        '--permission',
        ...options.permissions.read.map((p) => `--allow-fs-read=${p}`),
        ...options.permissions.write.map((p) => `--allow-fs-write=${p}`),
        '--allow-child-process',
      ]
    : [];
  const run = spawnSync(process.execPath, [...flags, compilerEntry, '--ref', options.ref ?? 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
  });
  const tracePath = join(publicDir, 'trace.json');
  let trace: TraceIndex | null = null;
  let unreadable = '';
  if (existsSync(tracePath)) {
    try {
      trace = JSON.parse(readFileSync(tracePath, 'utf8')) as TraceIndex;
    } catch (error) {
      unreadable = `\ntrace.json is not JSON: ${String(error)}`;
    }
  }
  return {
    status: run.status,
    output: `${run.stdout ?? ''}${run.stderr ?? ''}${run.error ? String(run.error) : ''}${unreadable}`,
    publicDir,
    trace,
    written: filesUnder(publicDir).map((rel) => `src/web/public/${rel}`),
  };
}

/** Every file in the work tree but .git/, with its content hash, keyed by repo-relative path. */
export function treeHashes(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of filesUnder(root, (r) => r === '.git')) {
    out[rel] = createHash('sha256').update(readFileSync(join(root, rel))).digest('hex');
  }
  return out;
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

/** The activity chunk trace.json names for a node, as written beside it. Asserts the chunk is named and exists. */
export function activityLines(run: Compiled, plan: string, node: string): ActivityLine[] {
  const chunk = run.trace?.nodes?.find((n) => n.plan === plan && n.id === node)?.chunks?.activity ?? null;
  expect(chunk, `${plan}/${node} names its activity chunk`).toBe(`trace/${plan}/${node}/activity.json`);
  const path = join(run.publicDir, chunk ?? '');
  expect(existsSync(path), `the chunk ${chunk} is written beside trace.json`).toBe(true);
  const lines = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  expect(Array.isArray(lines), 'the activity chunk is a list of lines').toBe(true);
  return lines as ActivityLine[];
}

/** A trail compiled once for a spec file: the replay, the run and its trace.json. */
export interface CompiledTrail {
  trail: Trail;
  compiled: Compiled;
}

export function compileFixture(name: string, prepare?: (root: string) => void): CompiledTrail {
  const trail = replayTrail(name, prepare);
  return { trail, compiled: compile(trail.root) };
}
