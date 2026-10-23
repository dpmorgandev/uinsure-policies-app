// @vitest-environment node
// DATA-1 · One compiled data file: trace on start (David 2026-10-23, U10). trace.json is written to the web project's
// public/ folder, which git ignores, so a fresh clone has none and Docket opened on "Could not load trace.json" until
// someone ran `npm run trace`. Starting the dev server (F5's Vite dev server target, the StartupCommand, npx vite)
// compiles the trail first; a compile that fails is reported, never served as a silent empty trail.
// Each test is a fresh tree: a fixture trail replayed into a new git repo, the web project copied in beside it with no
// public/ (its node_modules linked, not copied), and Vite started from there on its own vite.config.ts, on a port the
// OS gives. Nothing here knows how the compile is wired in; it only asks the running server.
//   complete     compiles clean (tests/Uinsure.Policies.Web.Tests/fixtures/trails/complete/README.md): /trace.json is the trail at its HEAD
//   privacy-hit  fails the compile on two denylisted values (privacy-hit/README.md): activity.jsonl line 2 and
//                loop.jsonl line 3 are named in the console, no trace.json is served, and the page is still served
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmdirSync, symlinkSync, unlinkSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { ACTIVITY, LOOP, placeHits, replayTrail } from '../compiler/support/trail';
import type { Trail } from '../compiler/support/trail';

const webDir = fileURLToPath(new URL('../../../../src/Uinsure.Policies.Web/', import.meta.url));
/** Windows spawns slowly, and a cold Vite scans the app's dependencies on its first start. */
const SLOW = 150_000;
const START_TIMEOUT = 90_000;

/** What a fresh clone has of the web project: its sources and config, no public/, no build output. */
const SKIP = new Set(['node_modules', 'public', 'dist', 'test-results', 'playwright-report']);

function freshWebTree(root: string): string {
  const to = join(root, 'src', 'Uinsure.Policies.Web');
  mkdirSync(to, { recursive: true });
  cpSync(webDir, to, {
    recursive: true,
    filter: (from) => {
      const rel = relative(webDir, from);
      return rel === '' || !SKIP.has(rel.split(sep)[0] ?? '');
    },
  });
  expect(existsSync(join(to, 'public', 'trace.json')), 'setup: the fresh tree has no trace.json').toBe(false);
  symlinkSync(join(webDir, 'node_modules'), join(to, 'node_modules'), 'junction');
  return to;
}

function unlinkModules(web: string): void {
  const link = join(web, 'node_modules');
  try {
    unlinkSync(link);
  } catch {
    if (existsSync(link)) rmdirSync(link);
  }
}

interface Started {
  server: ChildProcess;
  /** The URL Vite printed, ending in '/', or null when it stopped first or never said. */
  url: string | null;
  /** Everything it printed so far, stdout and stderr, colour codes removed. */
  output(): string;
  /** Resolves when the output matches, or with false when the server exits or the time runs out first. */
  waitFor(pattern: RegExp, ms: number): Promise<boolean>;
  stop(): Promise<void>;
}

const ANSI = /\u001b\[[0-9;]*m/g;
/** How long the console may take to show every problem after 'Local:': stderr and stdout are two pipes, read in no fixed order. */
const PROBLEMS_TIMEOUT = 30_000;

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Matches output that names every one of `parts`, in any order. */
const namesAll = (...parts: string[]): RegExp => new RegExp(parts.map((p) => `(?=[\\s\\S]*${escape(p)})`).join(''));

/** Starts Vite in `web` as `npx vite` does (its bin, its own config), on a port the OS gives. */
async function startVite(web: string): Promise<Started> {
  const server = spawn(process.execPath, [join(web, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', '0', '--host', 'localhost'], {
    cwd: web,
    env: { ...process.env, DOCKET_API_PORT: '5095', BROWSER: 'none', FORCE_COLOR: '0' },
    windowsHide: true,
  });
  let printed = '';
  const output = (): string => printed.replace(ANSI, '');
  server.stdout?.on('data', (chunk: Buffer) => (printed += chunk.toString()));
  server.stderr?.on('data', (chunk: Buffer) => (printed += chunk.toString()));
  const url = await new Promise<string | null>((done) => {
    const timer = setTimeout(() => done(null), START_TIMEOUT);
    const look = (): void => {
      const found = /Local:\s+(http:\/\/\S+)/.exec(output());
      if (found) {
        clearTimeout(timer);
        done(found[1]?.endsWith('/') ? found[1] : `${found[1] ?? ''}/`);
      }
    };
    server.stdout?.on('data', look);
    server.stderr?.on('data', look);
    server.on('exit', () => {
      clearTimeout(timer);
      done(null);
    });
  });
  const waitFor = (pattern: RegExp, ms: number): Promise<boolean> =>
    new Promise((done) => {
      if (pattern.test(output())) return done(true);
      const timer = setTimeout(() => finish(false), ms);
      const look = (): void => {
        if (pattern.test(output())) finish(true);
      };
      const finish = (found: boolean): void => {
        clearTimeout(timer);
        server.stdout?.off('data', look);
        server.stderr?.off('data', look);
        server.off('close', ended);
        done(found);
      };
      const ended = (): void => finish(pattern.test(output()));
      server.stdout?.on('data', look);
      server.stderr?.on('data', look);
      if (server.exitCode !== null) return finish(pattern.test(output()));
      server.on('close', ended);
    });
  const stop = async (): Promise<void> => {
    if (server.exitCode !== null) return;
    const exited = new Promise<void>((done) => server.on('exit', () => done()));
    if (process.platform === 'win32' && server.pid !== undefined) spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true });
    else server.kill();
    await exited;
  };
  return { server, url, output, waitFor, stop };
}

async function onFreshTree(trail: Trail, check: (started: Started) => Promise<void>): Promise<void> {
  const web = freshWebTree(trail.root);
  const started = await startVite(web);
  try {
    await check(started);
  } finally {
    await started.stop();
    unlinkModules(web);
    trail.cleanup();
  }
}

/** /trace.json as the running server answers it. */
async function askTrace(started: Started): Promise<{ status: number; type: string; text: string }> {
  const answer = await fetch(`${started.url ?? ''}trace.json`, { headers: { accept: 'application/json' } });
  return { status: answer.status, type: answer.headers.get('content-type') ?? '', text: await answer.text() };
}

describe('the dev server compiles the trail before it serves', () => {
  test('DATA-1 · a fresh tree started with npx vite serves /trace.json, compiled from the trail at its HEAD', async () => {
    const trail = replayTrail('complete');
    await onFreshTree(trail, async (started) => {
      expect(started.url, `setup: Vite starts and says where\n${started.output()}`).not.toBeNull();
      const served = await askTrace(started);
      expect(served.status, `/trace.json answers 200\n${served.text.slice(0, 300)}\n${started.output()}`).toBe(200);
      const trace = JSON.parse(served.text) as { schemaVersion?: string; compiledAt?: { sha?: string } };
      expect(trace.schemaVersion, 'the answer is a compiled trace').toBe('1.0.0');
      expect(trace.compiledAt?.sha, "compiled from this tree's trail, at its HEAD").toBe(trail.head);
    });
  }, SLOW);

  test('DATA-1 · a compile that fails is reported in the console, naming each problem, and no trace.json is served', async () => {
    const trail = replayTrail('privacy-hit', (root) => placeHits(root));
    await onFreshTree(trail, async (started) => {
      expect(started.url, `the dev server still starts, so the page can say what failed\n${started.output()}`).not.toBeNull();
      await started.waitFor(namesAll(`${ACTIVITY}:2`, `${LOOP}:3`), PROBLEMS_TIMEOUT);
      const said = started.output();
      expect(said, 'the console names the failed compile and each problem by file and line').toContain(`${ACTIVITY}:2`);
      expect(said).toContain(`${LOOP}:3`);
      const served = await askTrace(started);
      const isTrace = served.status === 200 && served.type.includes('json') && served.text.includes('"schemaVersion"');
      expect(isTrace, `no trail is served as /trace.json: ${served.status} ${served.type}`).toBe(false);
      const page = await fetch(started.url ?? '', { headers: { accept: 'text/html' } });
      expect(page.status, 'the page is served, so Docket can say the trail could not be loaded').toBe(200);
    });
  }, SLOW);
});
