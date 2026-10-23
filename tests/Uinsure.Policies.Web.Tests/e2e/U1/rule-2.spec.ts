// RULE-2 · Red before green, visibly. The rule page shows the red commit before the green one, with dates, and flags
// any rule where that order doesn't hold. On the `rules` fixture trail: SELL-1's red c2 (2026-10-16) comes before its
// green c4 (2026-10-17); GET-1's green c11 was committed before its red c12, so GET-1 is flagged (rules/README.md).
// Parity on the design fixture against docs/ui/derived/U1/rule/.
import { expect, test } from '@playwright/test';
import { SIGNATURE, auditEverywhere, compileRules, openOnFixture, openRule, region, route, rungCommits, rungOf, shaOf } from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, rule } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRules();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** Where a commit's rung sits in the spine: its index among the commit rungs, or -1. */
async function positionOf(page: Parameters<typeof rungCommits>[0], id: string): Promise<number> {
  return (await rungCommits(page, fixture)).indexOf(id);
}

test.describe('red before green', () => {
  test("RULE-2 · SELL-1's red commit, c2, sits above its green commit, c4", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    await expect.poll(() => positionOf(page, 'c2'), 'the red rung is drawn').toBeGreaterThanOrEqual(0);
    expect(await positionOf(page, 'c2'), 'red above green').toBeLessThan(await positionOf(page, 'c4'));
  });

  test("RULE-2 · SELL-1's page says the order holds, naming red at #2 above green at #4", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const held = region(page, SIGNATURE).locator('[data-order="held"]');
    await expect(held).toContainText('#2');
    await expect(held).toContainText('#4');
  });

  test("RULE-2 · SELL-1's red rung shows its date, 2026-10-16, and its green rung its date, 2026-10-17", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const red = rungOf(page, shaOf(fixture, 'c2')).first();
    const green = rungOf(page, shaOf(fixture, 'c4')).first();
    await expect(red).toContainText('2026-10-16');
    await expect(red).not.toContainText('2026-10-17');
    await expect(green).toContainText('2026-10-17');
    await expect(green).not.toContainText('2026-10-16');
  });

  test("RULE-2 · SELL-2's page shows the finding's red test, c7, above its fix, c8, after the first red and green", async ({ page }) => {
    await openRule(page, fixture, 'SELL-2');
    await expect.poll(() => rungCommits(page, fixture)).toEqual(['c2', 'c3', 'c4', 'c7', 'c8']);
  });
});

test.describe('flagged when the order does not hold', () => {
  test("RULE-2 · GET-1, whose green c11 came before its red c12, is flagged: the order is violated", async ({ page }) => {
    await openRule(page, fixture, 'GET-1');
    const violated = region(page, SIGNATURE).locator('[data-order="violated"]');
    await expect(violated).toBeVisible();
    await expect(violated).toContainText(/order violated/i);
    await expect(violated).toContainText('#2');
    await expect(violated).toContainText('#3');
  });

  test("RULE-2 · GET-1's spine draws its green c11 above its red c12, as the commits were made, not reordered", async ({ page }) => {
    await openRule(page, fixture, 'GET-1');
    await expect.poll(() => rungCommits(page, fixture)).toEqual(['c11', 'c12']);
  });

  test("RULE-2 · GET-1's two out-of-order rungs each carry an out-of-order mark in words", async ({ page }) => {
    await openRule(page, fixture, 'GET-1');
    await expect(rungOf(page, shaOf(fixture, 'c11')).first()).toContainText(/out of order/i);
    await expect(rungOf(page, shaOf(fixture, 'c12')).first()).toContainText(/out of order/i);
  });

  test('RULE-2 · SELL-1, whose order holds, carries no out-of-order flag', async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const held = region(page, SIGNATURE).locator('[data-order="held"]');
    await expect(held, "the order statement is SELL-1's").toContainText('#2');
    await expect(held, "the order statement is SELL-1's").toContainText('#4');
    await expect(region(page, SIGNATURE).locator('[data-order="violated"]')).toHaveCount(0);
    await expect(region(page, SIGNATURE)).not.toContainText(/out of order/i);
  });
});

test.describe('axe', () => {
  test("RULE-2 · GET-1's flagged rule page on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    await openOnFixture(page, fixture, route.rule('GET-1'));
    await auditEverywhere(page, route.rule('GET-1'), async (p) => {
      await expect(region(p, SIGNATURE).locator('[data-order="violated"]')).toBeVisible();
    });
  });
});

test.describe('parity', () => {
  test("RULE-2 · parity: the red-before-green region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, rule, SIGNATURE);
  });
});
