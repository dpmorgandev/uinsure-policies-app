// VERIFY-1 · Verify it yourself. Beside every claim, the git command that re-checks it without the UI (the commands
// in docs/trace/README.md, filled in for that rule or node). On the `agents` fixture trail (agents/README.md, the
// `rules` fixture's commits): SELL-1's red is c2, its green c4 and its refactor c5; the about page names the
// snapshot's own SHA. A command is filled in: it names the commits or the ref it checks, and holds no placeholder.
// Parity on the design fixture against docs/ui/derived/U4/{rule,about}/.
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
