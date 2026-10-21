// The live API the workbench's acceptance tests drive: started from this worktree on DOCKET_API_PORT (the port
// the app's /api proxy is given), with a fresh SQLite file, once per Playwright run. Every worker of the run
// shares it, through a lock and a state file in the OS temp directory; a detached reaper (reaper.mjs) stops it
// when the run that started it has ended. An API already answering on the port that this run didn't start, and
// that no earlier W1 run left behind, is a setup fault: the run stops before any test, because its database
// can't be known to be fresh.
//
// Nothing here is a test: a build or start failure is a setup fault, thrown as one, never a red.
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test as base } from '@playwright/test';

/** The worktree the suite runs in (Playwright runs from src/web). */
export const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();

export const apiPort = Number(process.env.DOCKET_API_PORT ?? 5080);
/** The API itself, for a test's own setup and expected values. The app reaches it as /api/… through its proxy. */
export const apiUrl = `http://localhost:${apiPort}`;

const project = join(repoRoot, 'src', 'Uinsure.Policies.Api');
const reaper = join(repoRoot, 'tests', 'web', 'e2e', 'W1', 'support', 'reaper.mjs');
const stateDir = join(tmpdir(), `docket-w1-api-${apiPort}`);
const lockDir = join(stateDir, 'lock');
const stateFile = join(stateDir, 'state.json');

interface State {
  /** The Playwright runner the API was started for: every worker's parent. */
  runner: number;
  /** The `dotnet run` process this run started. */
  pid: number;
}

const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function stopTree(pid: number): void {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    // Already gone.
  }
}

async function ready(): Promise<boolean> {
  try {
    const answer = await fetch(`${apiUrl}/health/ready`, { signal: AbortSignal.timeout(5000) });
    return answer.status === 200;
  } catch {
    return false;
  }
}

function readState(): State | null {
  if (!existsSync(stateFile)) return null;
  try {
    return JSON.parse(readFileSync(stateFile, 'utf8')) as State;
  } catch {
    return null;
  }
}

async function withLock<T>(work: () => Promise<T>): Promise<T> {
  const deadline = Date.now() + 600_000;
  for (;;) {
    try {
      mkdirSync(lockDir);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      try {
        // A lock left by a worker that died mid-start is stale after five minutes.
        if (Date.now() - statSync(lockDir).mtimeMs > 300_000) rmSync(lockDir, { recursive: true, force: true });
      } catch {
        // Released between the two calls.
      }
      if (Date.now() > deadline) throw new Error(`setup: waited 10 minutes for the API lock at ${lockDir}`);
      await sleep(250);
    }
  }
  try {
    return await work();
  } finally {
    rmSync(lockDir, { recursive: true, force: true });
  }
}

async function start(runner: number): Promise<number> {
  const build = spawnSync('dotnet', ['build', project, '-nologo', '-v', 'q'], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 300_000,
    windowsHide: true,
  });
  if (build.status !== 0) throw new Error(`setup: dotnet build of the API failed\n${build.stdout ?? ''}${build.stderr ?? ''}`);

  // Each run's database and log are its own; an earlier run's are removed with it.
  for (const name of readdirSync(stateDir)) {
    if (!/^(policies|api)-\d+\./.test(name)) continue;
    try {
      rmSync(join(stateDir, name), { force: true });
    } catch {
      // Still held by a process on its way out; the next run removes it.
    }
  }
  const db = join(stateDir, `policies-${runner}.db`);
  const logPath = join(stateDir, `api-${runner}.log`);
  const log = openSync(logPath, 'w');
  const child = spawn('dotnet', ['run', '--no-build', '--no-launch-profile', '--project', project, '--urls', apiUrl], {
    cwd: repoRoot,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, ASPNETCORE_ENVIRONMENT: 'Development', ConnectionStrings__Policies: `Data Source=${db}` },
  });
  closeSync(log);
  child.unref();
  const pid = child.pid;
  if (pid === undefined) throw new Error('setup: dotnet run did not start');
  spawn(process.execPath, [reaper, String(runner), String(pid)], { detached: true, windowsHide: true, stdio: 'ignore' }).unref();

  for (let i = 0; i < 240; i += 1) {
    if (await ready()) return pid;
    if (!alive(pid)) break;
    await sleep(500);
  }
  stopTree(pid);
  const tail = existsSync(logPath) ? readFileSync(logPath, 'utf8').slice(-4000) : '';
  throw new Error(`setup: the API did not answer ${apiUrl}/health/ready\n${tail}`);
}

/** The API answers on its port for this run, started fresh if this run has none yet. */
export async function ensureApi(): Promise<void> {
  mkdirSync(stateDir, { recursive: true });
  const runner = process.ppid;
  await withLock(async () => {
    const state = readState();
    // This run's API: another worker started it. A busy moment is waited out, never answered with a restart.
    if (state !== null && state.runner === runner && alive(state.pid)) {
      for (let i = 0; i < 120; i += 1) {
        if (await ready()) return;
        await sleep(500);
      }
      throw new Error(`setup: this run's API at ${apiUrl} stopped answering /health/ready`);
    }
    // An API a previous run left behind: stop it, so this run starts on a fresh database.
    if (state !== null && alive(state.pid)) {
      stopTree(state.pid);
      for (let i = 0; i < 30 && (await ready()); i += 1) await sleep(500);
    }
    rmSync(stateFile, { force: true });
    // An API this run didn't start, and no earlier W1 run left: its database may hold what another run sold, so
    // nothing is tested on it. It isn't stopped either: whoever started it may still be using it.
    if (await ready()) {
      throw new Error(
        `setup: an API this run didn't start already answers on ${apiUrl}, so its database can't be known to be fresh. ` +
          `Stop it, or give the run a free DOCKET_API_PORT, and run again.`,
      );
    }
    const pid = await start(runner);
    writeFileSync(stateFile, JSON.stringify({ runner, pid } satisfies State));
  });
}

/** `test` with the live API: a test that names `api` runs with the API answering at that URL. */
export const test = base.extend<object, { api: string }>({
  api: [
    async ({}, use) => {
      await ensureApi();
      await use(apiUrl);
    },
    { scope: 'worker', timeout: 600_000 },
  ],
});

export { expect } from '@playwright/test';
