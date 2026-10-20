// @vitest-environment node
// DATA-1 · One compiled data file. These tests guard the toolchain the DATA-1 acceptance suite runs on: the
// suite is red only if Playwright can load it, and the typecheck is a gate only if it passes on any machine
// with nothing but src/web's own lockfile-pinned packages. Each reproduces a finding of U0b round A1.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const webDir = fileURLToPath(new URL('../../../../src/web/', import.meta.url));
const playwrightCli = join(webDir, 'node_modules', '@playwright', 'test', 'cli.js');

/** U0b's rules: each one's acceptance specs must load and be listed. */
const nodeRules = ['DATA-1', 'DATA-3', 'DATA-5', 'DATA-6', 'DATA-7', 'THEME-1', 'SEC-1', 'BRAND-1', 'HONEST-1', 'A11Y-1', 'RESP-1'];

describe('the DATA-1 toolchain', () => {
  // Finding I1: tsconfig's catch-all `paths` sent '@playwright/test' to its CJS index, so the config failed to load.
  test('DATA-1 · Playwright loads its config and lists every U0b rule\'s acceptance tests, with no module error', () => {
    const run = spawnSync(process.execPath, [playwrightCli, 'test', '--list'], {
      cwd: webDir,
      encoding: 'utf8',
      env: { ...process.env, DOCKET_APP_PORT: '4171', DOCKET_API_PORT: '5081' },
      timeout: 120_000,
    });
    const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;

    expect(output, 'no module or resolution error while loading the config and specs').not.toMatch(
      /SyntaxError|does not provide an export named|ERR_MODULE_NOT_FOUND|Cannot find module/,
    );
    expect(run.status, output).toBe(0);
    expect(
      nodeRules.filter((id) => !output.includes(`${id} · `)),
      'every U0b rule has at least one listed test',
    ).toEqual([]);
  }, 150_000);
});
