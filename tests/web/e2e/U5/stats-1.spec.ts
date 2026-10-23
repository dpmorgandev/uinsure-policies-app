// STATS-1 · Delivery stats. Commits per agent, attempts per node, elapsed time per node from the trail timestamps,
// shown as facts, never as scores. U5's acceptance, as the signed-off screen draws it (docs/ui/derived/U5/stats/):
// each node of the build plan with its first-to-last verdict stamps, its verdicts by round, its attempt count and its
// last verdict. On the `complete` trail with U5's overlay (tests/web/fixtures/trails/complete/README.md): build/F1,
// attempt 1, A1 reviewer PASS and A1 security PASS, both stamped 2026-10-18T16:00:00Z. Parity on the design fixture.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { FACTS, auditEverywhere, compileU5, heading, openOnFixture, region, route, traceAnswered } from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, stats } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileU5();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

async function f1Row(page: Page) {
  await openOnFixture(page, fixture, route.stats);
  // U10 (U5 carry): the facts region is drawn within 5s of trace.json's answer, every run. The wait for the answer is
  // setup (traceAnswered); a run that missed 5s had been timing trace.json under load, not the stats page.
  await traceAnswered(page);
  const facts = region(page, FACTS);
  await expect(facts, 'the facts region is drawn within 5s of the trace').toBeVisible({ timeout: 5_000 });
  return facts.locator('table').first().locator('tbody tr').filter({ has: page.locator('th', { hasText: 'F1' }) });
}

test("STATS-1 · F1's row shows its attempt count from the plan, 1", async ({ page }) => {
  const row = await f1Row(page);
  await expect(row).toHaveCount(1);
  await expect(row.locator('td[data-numeric="true"]').first()).toHaveText('1');
});

test("STATS-1 · F1's row lists its verdicts by round: A1, reviewer PASS and security PASS", async ({ page }) => {
  const row = await f1Row(page);
  await expect(row).toContainText('A1: reviewer PASS, security PASS.');
});

test("STATS-1 · F1's row stamps its first and last verdict from the trail, 2026-10-18T16:00:00Z", async ({ page }) => {
  const row = await f1Row(page);
  await expect(row).toContainText('2026-10-18T16:00:00Z');
});

test("STATS-1 · F1's last verdict reads PASS at A1", async ({ page }) => {
  const row = await f1Row(page);
  await expect(row).toContainText('PASS at A1');
});

test('STATS-1 · the figures are facts, never scores: no score, rank or grade on the page', async ({ page }) => {
  const row = await f1Row(page);
  await expect(row).toHaveCount(1);
  await expect(page.getByRole('main')).not.toContainText(/\b(score|rank|grade)\b/i);
});

test('STATS-1 · reachable: the stats route answers with its own heading', async ({ page }) => {
  await openOnFixture(page, fixture, route.stats);
  await expect(heading(page)).toBeVisible();
});

test('STATS-1 · the stats page has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
  await openOnFixture(page, fixture, route.stats);
  await auditEverywhere(page, route.stats, async (p) => {
    await expect(region(p, FACTS).locator('tbody tr').first()).toBeVisible();
  });
});

test("STATS-1 · parity: the stats page keeps its reference's regions in order", async ({ page }) => {
  await expectRegionsInOrder(page, stats);
});

test("STATS-1 · parity: the facts region carries its reference's components", async ({ page }) => {
  await expectRegionComponents(page, stats, FACTS);
});

test("STATS-1 · parity: the stats page's shell, primary nav and title are its reference's", async ({ page }) => {
  await expectShell(page, stats, true);
});

test('STATS-1 · parity: the stats page uses tokens only, no literal colour', async ({ page }) => {
  await expectTokensOnly(page, stats);
});
