// @vitest-environment node
// DATA-1 · One compiled data file. These tests guard the toolchain the DATA-1 acceptance suite runs on: the
// suite is red only if Playwright can load it, and the typecheck is a gate only if it passes on any machine
// with nothing but src/web's own lockfile-pinned packages. Each reproduces a finding of U0b round A1.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const webDir = fileURLToPath(new URL('../../../../src/web/', import.meta.url));
const playwrightCli = join(webDir, 'node_modules', '@playwright', 'test', 'cli.js');
const tscBin = join(webDir, 'node_modules', 'typescript', 'bin', 'tsc');

/** U0b's rules: each one's acceptance specs must load and be listed. */
const nodeRules = ['DATA-1', 'DATA-3', 'DATA-5', 'DATA-6', 'DATA-7', 'THEME-1', 'SEC-1', 'BRAND-1', 'HONEST-1', 'A11Y-1', 'RESP-1'];

/** A path as seen from src/web, with forward slashes, so a failure names no local absolute path. */
const fromWeb = (file: string): string => relative(webDir, resolve(webDir, file)).split('\\').join('/');

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

  // Finding I2: tsc took @types/node from a node_modules above the checkout, so the typecheck passed by accident.
  test('DATA-1 · the typecheck takes Node types only from src/web\'s own pinned @types/node', () => {
    const run = spawnSync(process.execPath, [tscBin, '--noEmit', '--listFilesOnly', '-p', 'tsconfig.json'], {
      cwd: webDir,
      encoding: 'utf8',
      timeout: 120_000,
    });
    expect(run.status, `${run.stdout ?? ''}${run.stderr ?? ''}`).toBe(0);

    const nodeTypes = (run.stdout ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== '' && /[\\/]@types[\\/]node[\\/]/.test(line))
      .map(fromWeb);
    expect(nodeTypes.length, 'the program loads Node types (vite.config.ts and the e2e support use node:)').toBeGreaterThan(0);
    // Each copy of @types/node the program loads, as the directory it was found in (seen from src/web).
    const copies = [...new Set(nodeTypes.map((file) => file.slice(0, file.indexOf('@types/node/') + '@types/node'.length)))];
    expect(
      copies.filter((dir) => isAbsolute(dir) || dir !== 'node_modules/@types/node'),
      'every Node type file resolves under src/web/node_modules/@types/node',
    ).toEqual([]);

    const pkg = JSON.parse(readFileSync(join(webDir, 'package.json'), 'utf8')) as {
      devDependencies?: Record<string, string>;
    };
    expect(pkg.devDependencies?.['@types/node'] ?? '(absent)', '@types/node is an exact 22.x devDependency of src/web').toMatch(
      /^22\.\d+\.\d+$/,
    );
  }, 150_000);
});
