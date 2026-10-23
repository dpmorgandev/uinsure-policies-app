// VERIFY-1 · Verify it yourself. Beside every claim, the git command that re-checks it without the UI (the commands
// in docs/trace/README.md, filled in for that rule or node). On the `agents` fixture trail (agents/README.md, the
// `rules` fixture's commits): SELL-1's red is c2, its green c4 and its refactor c5; the about page names the
// snapshot's own SHA. A command is filled in: it names the commits or the ref it checks, and holds no placeholder.
// Parity on the design fixture against docs/ui/derived/U4/{rule,about}/.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { RE_VERIFY, VERIFY_RULE, auditEverywhere, compileAgents, openRegion, region, route, shaOf, short, snapshotOf } from './support/app';
import type { CompiledTrail } from './support/app';
import { about, expectRegionComponents, rule } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileAgents();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** The commands a region shows, as the kit's code blocks hold them. */
const commands = (scope: Locator): Locator => scope.locator('pre code');

test.describe("the rule page's verify it yourself", () => {
  test('VERIFY-1 · SELL-1 shows a git command to re-check its order, with no placeholder in it', async ({ page }) => {
    const verify = await openRegion(page, fixture, route.rule('SELL-1'), VERIFY_RULE);
    const command = commands(verify).first();
    await expect(command).toContainText(/^git /);
    await expect(command).not.toContainText(/‹|›|<branch>|<sha>/);
  });

  test('VERIFY-1 · the command and what to expect name SELL-1 and its red c2 before its green c4', async ({ page }) => {
    const verify = await openRegion(page, fixture, route.rule('SELL-1'), VERIFY_RULE);
    await expect(verify).toContainText('SELL-1');
    const text = (await verify.innerText()).replace(/\s+/g, ' ');
    const red = text.indexOf(short(shaOf(fixture, 'c2')));
    const green = text.indexOf(short(shaOf(fixture, 'c4')));
    expect(red, 'the red commit c2 is named').toBeGreaterThanOrEqual(0);
    expect(green, 'the green commit c4 is named').toBeGreaterThan(red);
  });

  test('VERIFY-1 · the printed red-to-green command, run where a merge sits between red and green, lists the red first and the green last, as the page says', async ({ page }) => {
    // A3 I6: a branch merged in between red and green holds a commit older than the red. The page's own command, its
    // SHAs swapped for this repo's red and green, must still give what its expectation promises.
    const verify = await openRegion(page, fixture, route.rule('SELL-1'), VERIFY_RULE);
    const printed = (await commands(verify).first().innerText()).trim();
    await expect(verify).toContainText(/first with trailer red/);
    await expect(verify).toContainText(/last with trailer green/);

    const root = mkdtempSync(join(tmpdir(), 'docket-verify-merge-'));
    try {
      const at = (date: string, ...args: string[]): string =>
        execFileSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } }).trim();
      at('2026-10-01T09:00:00Z', 'init', '-q', '-b', 'main');
      at('2026-10-01T09:00:00Z', 'config', 'user.email', 'fixture@example.com');
      at('2026-10-01T09:00:00Z', 'config', 'user.name', 'Fixture');
      at('2026-10-01T09:00:00Z', 'commit', '-q', '--allow-empty', '-m', 'base');
      at('2026-10-01T09:00:00Z', 'checkout', '-q', '-b', 'side');
      at('2026-10-02T09:00:00Z', 'commit', '-q', '--allow-empty', '-m', 'chore: side work older than the red');
      at('2026-10-02T09:00:00Z', 'checkout', '-q', 'main');
      at('2026-10-02T09:00:00Z', 'checkout', '-q', '-b', 'feature');
      at('2026-10-03T09:00:00Z', 'commit', '-q', '--allow-empty', '-m', 'test(SELL-1): red: the sale', '-m', 'TDD: red');
      const red = at('2026-10-03T09:00:00Z', 'rev-parse', 'HEAD');
      at('2026-10-04T09:00:00Z', 'merge', '-q', '--no-ff', '-m', 'merge side into feature', 'side');
      at('2026-10-05T09:00:00Z', 'commit', '-q', '--allow-empty', '-m', 'feat(SELL-1): green: the sale', '-m', 'TDD: green');
      const green = at('2026-10-05T09:00:00Z', 'rev-parse', 'HEAD');

      const swap = (text: string, from: string, to: string): string => text.replace(new RegExp(`\\b${short(from)}[0-9a-f]*\\b`, 'g'), to);
      const command = swap(swap(printed, shaOf(fixture, 'c2'), red), shaOf(fixture, 'c4'), green);
      expect(command, 'the printed command names this repo red and green once swapped').toContain(green);
      // The command split as a shell would: words, a double-quoted part kept whole within its word, its quotes dropped.
      const words = [...command.matchAll(/(?:"[^"]*"|[^\s"])+/g)].map((m) => m[0].replace(/"/g, ''));
      expect(words[0]).toBe('git');
      // One commit per line that opens with its abbreviated SHA (a trailer value can end in a newline of its own).
      const lines = at('2026-10-05T09:00:00Z', ...words.slice(1)).split('\n').filter((line) => /^[0-9a-f]{7,40}\b/.test(line));
      const abbrev = (sha: string): string => at('2026-10-05T09:00:00Z', 'rev-parse', '--short', sha);
      expect(lines[0], `the first line is the red with trailer red:\n${lines.join('\n')}`).toMatch(new RegExp(`^${abbrev(red)} red\\b`));
      expect(lines.at(-1), `the last line is the green with trailer green:\n${lines.join('\n')}`).toMatch(new RegExp(`^${abbrev(green)} green\\b`));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('VERIFY-1 · the rule page has no axe violation, light and dark, 1440 and 390', async ({ page }) => {
    await openRegion(page, fixture, route.rule('SELL-1'), VERIFY_RULE);
    await auditEverywhere(page, route.rule('SELL-1'), async (p) => {
      await expect(commands(region(p, VERIFY_RULE)).first()).toContainText(/^git /);
    });
  });
});

test.describe("the about page's re-verify with git", () => {
  test("VERIFY-1 · it gives the git commands to re-check the trail, filled in at the snapshot's SHA", async ({ page }) => {
    const verify = await openRegion(page, fixture, route.about, RE_VERIFY);
    const snap = snapshotOf(fixture.compiled);
    await expect(commands(verify).first()).toContainText(/^git /);
    await expect(verify).toContainText(snap.short);
    expect(await commands(verify).allInnerTexts(), 'no command holds a placeholder').not.toContainEqual(expect.stringMatching(/‹|›/));
  });

  test('VERIFY-1 · the about page has no axe violation, light and dark, 1440 and 390', async ({ page }) => {
    await openRegion(page, fixture, route.about, RE_VERIFY);
    const snap = snapshotOf(fixture.compiled);
    await auditEverywhere(page, route.about, async (p) => {
      await expect(region(p, RE_VERIFY)).toContainText(snap.short);
    });
  });
});

test.describe('parity', () => {
  test("VERIFY-1 · parity: the rule page's verify it yourself, its components", async ({ page }) => {
    await expectRegionComponents(page, rule, VERIFY_RULE);
  });

  test("VERIFY-1 · parity: the about page's re-verify with git, its components", async ({ page }) => {
    await expectRegionComponents(page, about, RE_VERIFY);
  });
});
