// @vitest-environment node
// DATA-1 · One compiled data file: a fresh clone F5s straight into Docket (bug-002 N1; inv-009 I1, I4, I5, I17).
// Each test asks the toolchain as a fresh clone meets it, never how the fix is wired in:
//   launch path   the slnLaunch "API and web" profile's web DebugTarget, run from launch.json on a copy of the web
//                 project with no node_modules: it restores packages or stops naming `npm ci`, never "Cannot find
//                 module …vite.js" (I1)
//   listen first  the dev server answers on its port while the trail compiles: /trace.json says it is compiling,
//                 then serves the compiled trail at HEAD. The trail is the `complete` fixture with 300 extra empty
//                 commits, so the compile takes long enough to be seen (I4)
//   preview       under `vite preview` a failed compile is reported and /trace.json answers 503, or preview compiles
//                 nothing at all (I17)
//   Node minimum  package.json engines.node and .nvmrc name the same minimum, at least the README's 22.22 (I5)
import { execFileSync, spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, rmdirSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { ACTIVITY, LOOP, git, placeHits, replayTrail } from '../compiler/support/trail';
import type { Trail } from '../compiler/support/trail';

const repoDir = fileURLToPath(new URL('../../../../', import.meta.url));
const webDir = fileURLToPath(new URL('../../../../src/Uinsure.Policies.Web/', import.meta.url));
const SLOW = 240_000;
const ANSI = /\u001b\[[0-9;]*m/g;

/** What a fresh clone has of the web project: its sources and config, no public/, no build output, no packages. */
const SKIP = new Set(['node_modules', 'public', 'dist', 'test-results', 'playwright-report']);

function copyWebTree(root: string): string {
  const to = join(root, 'src', 'Uinsure.Policies.Web');
  mkdirSync(to, { recursive: true });
  cpSync(webDir, to, {
    recursive: true,
    filter: (from) => {
      const rel = relative(webDir, from);
      return rel === '' || !SKIP.has(rel.split(sep)[0] ?? '');
    },
  });
  return to;
}

function linkModules(web: string): void {
  symlinkSync(join(webDir, 'node_modules'), join(web, 'node_modules'), 'junction');
}

function unlinkModules(web: string): void {
  const link = join(web, 'node_modules');
  try {
    unlinkSync(link);
  } catch {
    if (existsSync(link)) rmdirSync(link);
  }
}

/** A port the OS says is free now. */
async function freePort(): Promise<number> {
  return new Promise((done, fail) => {
    const probe = createServer();
    probe.once('error', fail);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      probe.close(() => done(port));
    });
  });
}

interface Running {
  child: ChildProcess;
  output(): string;
  /** Resolves when the output matches, or with false when the process exits or the time runs out first. */
  waitFor(pattern: RegExp, ms: number): Promise<boolean>;
  stop(): Promise<void>;
}

function launch(command: string, args: string[], cwd: string, shell = false): Running {
  const child = spawn(command, args, {
    cwd,
    shell,
    env: { ...process.env, DOCKET_API_PORT: '5095', BROWSER: 'none', FORCE_COLOR: '0', NO_COLOR: '1' },
    windowsHide: true,
  });
  let printed = '';
  const output = (): string => printed.replace(ANSI, '');
  child.stdout?.on('data', (chunk: Buffer) => (printed += chunk.toString()));
  child.stderr?.on('data', (chunk: Buffer) => (printed += chunk.toString()));
  const waitFor = (pattern: RegExp, ms: number): Promise<boolean> =>
    new Promise((done) => {
      if (pattern.test(output())) return done(true);
      const timer = setTimeout(() => finish(false), ms);
      const look = (): void => {
        if (pattern.test(output())) finish(true);
      };
      const finish = (found: boolean): void => {
        clearTimeout(timer);
        child.stdout?.off('data', look);
        child.stderr?.off('data', look);
        child.off('close', ended);
        done(found);
      };
      const ended = (): void => finish(pattern.test(output()));
      child.stdout?.on('data', look);
      child.stderr?.on('data', look);
      if (child.exitCode !== null) return finish(pattern.test(output()));
      child.on('close', ended);
    });
  const stop = async (): Promise<void> => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise<void>((done) => child.on('exit', () => done()));
    if (process.platform === 'win32' && child.pid !== undefined) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
    else child.kill();
    await exited;
  };
  return { child, output, waitFor, stop };
}

const viteBin = (web: string): string => join(web, 'node_modules', 'vite', 'bin', 'vite.js');

interface Answer {
  status: number;
  type: string;
  text: string;
}

async function ask(url: string): Promise<Answer | null> {
  try {
    const answer = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(60_000) });
    return { status: answer.status, type: answer.headers.get('content-type') ?? '', text: await answer.text() };
  } catch {
    return null;
  }
}

const isTrace = (a: Answer | null): boolean => a !== null && a.status === 200 && a.text.includes('"schemaVersion"');
const shaOf = (a: Answer): string | undefined => (JSON.parse(a.text) as { compiledAt?: { sha?: string } }).compiledAt?.sha;
const pause = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

/** Adds `count` empty commits, each with a full set of loop trailers, on the trail's branch, in one git process. */
function addCommits(root: string, count: number): void {
  const branch = git(root, 'symbolic-ref', 'HEAD');
  const from = git(root, 'rev-parse', 'HEAD');
  let stream = '';
  for (let n = 1; n <= count; n++) {
    const message = `refactor(F1): tidy step ${n}\n\nAgent: builder\nPlan: build\nNode: F1\nRule: SELL-1\nTDD: refactor\n`;
    stream += `commit ${branch}\ncommitter Fixture <fixture@example.com> ${1792332000 + n} +0000\ndata ${Buffer.byteLength(message)}\n${message}`;
    if (n === 1) stream += `from ${from}\n`;
    stream += '\n';
  }
  execFileSync('git', ['fast-import', '--quiet'], { cwd: root, input: stream });
}

/** Reads a JSON file that may carry // line comments (VS's launch.json is JSONC). */
function readJsonc(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, ''));
}

describe('a fresh clone F5s straight into Docket', () => {
  test('DATA-1 · on a clone with no node_modules, the F5 web target restores packages or stops naming npm ci, never "Cannot find module"', async () => {
    const profiles = readJsonc(join(repoDir, 'Uinsure.Policies.slnLaunch')) as { Name: string; Projects: { Path: string; DebugTarget?: string }[] }[];
    const web = profiles.find((p) => p.Name === 'API and web')?.Projects.find((p) => p.Path.endsWith('Docket.Web.esproj'));
    expect(web?.DebugTarget, 'setup: the API and web profile names a web debug target').toBeTruthy();

    const root = mkdtempSync(join(tmpdir(), 'docket-first-run-'));
    try {
      const tree = copyWebTree(root);
      expect(existsSync(join(tree, 'node_modules')), 'setup: the fresh tree has no node_modules').toBe(false);
      const launchJson = readJsonc(join(tree, '.vscode', 'launch.json')) as {
        configurations: { name: string; program?: string; args?: string[]; runtimeExecutable?: string; runtimeArgs?: string[]; cwd?: string }[];
      };
      const target = launchJson.configurations.find((c) => c.name === web?.DebugTarget);
      expect(target, `setup: launch.json has the "${web?.DebugTarget ?? ''}" configuration`).toBeDefined();
      const fill = (value: string): string => value.split('${workspaceFolder}').join(tree);
      const runtime = target?.runtimeExecutable === undefined ? process.execPath : fill(target.runtimeExecutable);
      const args = [...(target?.runtimeArgs ?? []), ...(target?.program === undefined ? [] : [target.program]), ...(target?.args ?? [])]
        .map(fill)
        .filter((a) => a !== '--open');
      const running = launch(runtime, args, fill(target?.cwd ?? '${workspaceFolder}'), runtime !== process.execPath);
      try {
        await running.waitFor(/npm ci|Local:\s+http/, 60_000);
        const said = running.output();
        expect(said, 'node is not left to fail on a vite.js that was never restored').not.toMatch(/Cannot find module/);
        expect(said, 'the launch path restores packages, or stops naming the command, before Vite starts').toContain('npm ci');
        expect(said, 'and says where to run it').toMatch(/Uinsure\.Policies\.Web/);
      } finally {
        await running.stop();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, SLOW);

  test('DATA-1 · the dev server answers on its port while the trail compiles: /trace.json says it is compiling, then serves the compiled trail', async () => {
    const trail: Trail = replayTrail('complete', (root) => addCommits(root, 300));
    const web = copyWebTree(trail.root);
    linkModules(web);
    const port = await freePort();
    const running = launch(process.execPath, [viteBin(web), '--port', String(port), '--strictPort', '--host', '127.0.0.1'], web);
    try {
      const answers: Answer[] = [];
      const deadline = Date.now() + 180_000;
      while (Date.now() < deadline && running.child.exitCode === null) {
        const answer = await ask(`http://127.0.0.1:${port}/trace.json`);
        if (answer !== null) {
          answers.push(answer);
          if (isTrace(answer)) break;
        }
        await pause(50);
      }
      const first = answers[0];
      expect(first, `the dev server answers at all\n${running.output()}`).toBeDefined();
      expect(isTrace(first ?? null), `the port answers before the compile ends, so its first /trace.json is not yet the trail\n${running.output()}`).toBe(false);
      expect(first?.text ?? '', `the first answer says the trail is compiling: ${first?.status ?? '-'} ${first?.text.slice(0, 200) ?? ''}`).toMatch(/compil/i);
      const last = answers[answers.length - 1];
      expect(isTrace(last ?? null), `once the compile ends, /trace.json is the compiled trail\n${running.output()}`).toBe(true);
      expect(last === undefined ? undefined : shaOf(last), "compiled from this tree's trail, at its HEAD").toBe(trail.head);
    } finally {
      await running.stop();
      unlinkModules(web);
      trail.cleanup();
    }
  }, SLOW);

  test('DATA-1 · under vite preview a failed compile is reported on the console and /trace.json answers 503, or preview compiles nothing', async () => {
    /** Starts `vite preview` on a fresh tree of the trail, over a dist/ an earlier build left (with its own trace.json). */
    const preview = async (trail: Trail): Promise<{ web: string; port: number; running: Running; up: boolean }> => {
      const web = copyWebTree(trail.root);
      linkModules(web);
      mkdirSync(join(web, 'dist'), { recursive: true });
      writeFileSync(join(web, 'dist', 'index.html'), '<!doctype html><title>Docket</title>\n');
      writeFileSync(join(web, 'dist', 'trace.json'), JSON.stringify({ schemaVersion: '1.0.0', compiledAt: { sha: 'an-earlier-build' } }));
      const port = await freePort();
      const running = launch(process.execPath, [viteBin(web), 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], web);
      const up = await running.waitFor(/Local:\s+http/, 120_000);
      return { web, port, running, up };
    };

    // Does preview compile at all? On a trail that compiles clean, a compile writes public/trace.json.
    const clean = replayTrail('complete');
    let compiles = false;
    const probe = await preview(clean);
    try {
      expect(probe.up, `setup: vite preview starts\n${probe.running.output()}`).toBe(true);
      const until = Date.now() + 20_000;
      while (!compiles && Date.now() < until) {
        compiles = existsSync(join(probe.web, 'public', 'trace.json'));
        if (!compiles) await pause(250);
      }
    } finally {
      await probe.running.stop();
      unlinkModules(probe.web);
      clean.cleanup();
    }
    if (!compiles) return; // preview never compiles: the dist/ it serves is what the build made, and nothing is hidden

    // It compiles, so a failed compile must be as loud as under the dev server.
    const failing = replayTrail('privacy-hit', (root) => placeHits(root));
    const run = await preview(failing);
    try {
      expect(run.up, `the preview server still starts, so the page can say what failed\n${run.running.output()}`).toBe(true);
      const said = run.running.output();
      expect(said, 'preview compiles, so the console names the failed compile and each problem by file and line').toContain(`${ACTIVITY}:2`);
      expect(said).toContain(`${LOOP}:3`);
      const served = await ask(`http://127.0.0.1:${run.port}/trace.json`);
      expect(served?.status, `/trace.json answers 503, never the earlier build's trail: ${served?.status ?? '-'} ${served?.text.slice(0, 200) ?? ''}`).toBe(503);
    } finally {
      await run.running.stop();
      unlinkModules(run.web);
      failing.cleanup();
    }
  }, SLOW);

  test('DATA-1 · package.json declares the Node minimum in engines, and .nvmrc names the same version, at least 22.22', () => {
    const pkg = JSON.parse(readFileSync(join(webDir, 'package.json'), 'utf8')) as { engines?: { node?: string } };
    const range = pkg.engines?.node ?? '';
    const minimum = /^>=\s*v?(\d+)\.(\d+)(?:\.(\d+))?$/.exec(range.trim());
    expect(minimum, `package.json engines.node is a ">=" minimum: "${range}"`).not.toBeNull();
    const [major, minor, patch] = [Number(minimum?.[1]), Number(minimum?.[2]), Number(minimum?.[3] ?? 0)];
    expect(major * 1000 + minor, 'at least the 22.22 the README states (jsdom and react-router need it)').toBeGreaterThanOrEqual(22_022);

    const nvmrc = join(webDir, '.nvmrc');
    expect(existsSync(nvmrc), 'src/Uinsure.Policies.Web/.nvmrc exists').toBe(true);
    const named = /^v?(\d+)\.(\d+)(?:\.(\d+))?$/.exec(existsSync(nvmrc) ? readFileSync(nvmrc, 'utf8').trim() : '');
    expect(named, '.nvmrc names one version').not.toBeNull();
    expect([Number(named?.[1]), Number(named?.[2]), Number(named?.[3] ?? 0)], '.nvmrc names the engines minimum').toEqual([major, minor, patch]);
  });
});
