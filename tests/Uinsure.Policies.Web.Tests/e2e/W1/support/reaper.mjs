// Stops the API the W1 suite started once the Playwright run that wanted it has ended.
// Spawned detached by support/api.ts: node reaper.mjs <runner pid> <api pid>. It checks once a second and exits
// as soon as the API is gone, by its hand or another's, so it never outlives the run by more than that second.
import { spawnSync } from 'node:child_process';

const [runner, api] = process.argv.slice(2).map(Number);

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function stop(pid) {
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

const tick = setInterval(() => {
  if (!alive(api)) {
    clearInterval(tick);
    return;
  }
  if (!alive(runner)) {
    clearInterval(tick);
    stop(api);
  }
}, 1000);
