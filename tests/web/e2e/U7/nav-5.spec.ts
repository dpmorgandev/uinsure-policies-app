// NAV-5 · Guided tour, U7's carries from U5's review (A1 R1, R2): the tour follows one rule end to end, so its
// Walkthrough and Commit stops open the node of the rule its Rule stop opens, and those three stop targets are pinned.
//
// On the `rules` fixture trail (tests/web/fixtures/trails/rules/README.md): SELL-1 is the first built rule, red at c2
// and green at c4 in build/F1. The first node in the trace with walkthrough rows is build/F0a (git-only), not
// SELL-1's node, and F1's first commit (c1) is its plan-status commit, which carries no rule: a tour that picks its
// rule, its node and its commit separately sends the reader to three unrelated places.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { compileFixture } from '../U0b/support/trail';
import type { CompiledTrail } from '../U0b/support/trail';
import { TOUR, openOnFixture, region, route } from '../U5/support/app';
import { shaOf, short } from '../U1/support/app';

let rules: CompiledTrail;
test.beforeAll(() => {
  rules = compileFixture('rules');
});
test.afterAll(() => {
  rules?.trail.cleanup();
});

/** A stop of the tour, by its label. */
const stop = (tour: Locator, label: string): Locator => tour.locator('ol > li > a').filter({ hasText: new RegExp(`^${label}$`) });

async function openTour(page: Page): Promise<Locator> {
  await openOnFixture(page, rules, route.about);
  const tour = region(page, TOUR);
  await expect(tour.locator('ol > li > a'), 'the tour draws its five stops').toHaveCount(5);
  return tour;
}

/** The rule the tour's Rule stop opens, read from its href once it names a rule (before the trace loads it is #/rules). */
async function ruleOfTour(tour: Locator): Promise<string> {
  await expect(stop(tour, 'Rule')).toHaveCount(1);
  await expect(stop(tour, 'Rule'), 'the Rule stop names a rule').toHaveAttribute('href', /^#\/rules\/.+$/);
  const href = (await stop(tour, 'Rule').getAttribute('href')) ?? '';
  return decodeURIComponent(/^#\/rules\/(.+)$/.exec(href)?.[1] ?? href);
}

// Each built rule on the rules trail: its node (the matrix) and its red and green commits (the README's commit table).
const BUILT: Record<string, { node: string; commits: string[] }> = {
  'SELL-1': { node: 'F1', commits: ['c2', 'c4'] },
  'SELL-2': { node: 'F1', commits: ['c2', 'c4'] },
  'GET-1': { node: 'F2', commits: ['c12', 'c11'] },
};

test("NAV-5 · the tour's Rule and Walkthrough stops are pinned: SELL-1, then the walkthrough of its node, build/F1", async ({ page }) => {
  const tour = await openTour(page);
  await expect(stop(tour, 'Rule'), 'the first built rule').toHaveAttribute('href', '#/rules/SELL-1');
  await expect(stop(tour, 'Walkthrough'), "SELL-1's node").toHaveAttribute('href', '#/plans/build/F1/commits');
});

test("NAV-5 · the tour's Commit stop is pinned: SELL-1's red commit, c2, not its node's first commit", async ({ page }) => {
  const tour = await openTour(page);
  await expect(stop(tour, 'Commit')).toHaveAttribute('href', `#/commits/${shaOf(rules, 'c2')}`);
});

test("NAV-5 · the tour's Walkthrough stop opens the node of the rule its Rule stop opens", async ({ page }) => {
  const tour = await openTour(page);
  const ruleId = await ruleOfTour(tour);
  const built = BUILT[ruleId];
  expect(built, `the Rule stop opens a built rule (${ruleId})`).toBeDefined();
  await expect(stop(tour, 'Walkthrough'), `${ruleId}'s node`).toHaveAttribute('href', `#/plans/build/${built?.node ?? '?'}/commits`);
});

test("NAV-5 · the tour's Commit stop opens one of the red or green commits of the rule its Rule stop opens", async ({ page }) => {
  const tour = await openTour(page);
  const ruleId = await ruleOfTour(tour);
  const built = BUILT[ruleId];
  expect(built, `the Rule stop opens a built rule (${ruleId})`).toBeDefined();
  const own = (built?.commits ?? []).map((id) => shaOf(rules, id));
  await expect(stop(tour, 'Commit'), 'the Commit stop names a commit').toHaveAttribute('href', /^#\/commits\/.+$/);
  const href = (await stop(tour, 'Commit').getAttribute('href')) ?? '';
  const sha = /^#\/commits\/([0-9a-f]{7,40})$/.exec(href)?.[1] ?? '';
  expect(
    own.some((full) => sha !== '' && full.startsWith(sha)),
    `the Commit stop (${href}) opens one of ${ruleId}'s own commits (${own.map(short).join(', ')})`,
  ).toBe(true);
});
