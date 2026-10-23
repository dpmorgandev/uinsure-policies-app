// NAV-5 · Guided tour. A short, optional path through one rule end to end, for the reader with no guide. U5's
// acceptance, as the signed-off about page draws it (docs/ui/derived/U5/about/): step 4, "Follow one rule", five
// numbered stops (Overview, Requirements matrix, Rule, Walkthrough, Commit) in that order, and a start link that
// opens the requirements matrix. On the `complete` trail with U5's overlay; parity on the design fixture.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { TOUR, auditEverywhere, compileU5, hrefTo, openOnFixture, region, route } from './support/app';
import type { CompiledTrail } from './support/app';
import { about, expectRegionComponents, expectRegionsInOrder } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileU5();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

async function openTour(page: Page) {
  await openOnFixture(page, fixture, route.about);
  const tour = region(page, TOUR);
  await expect(tour, 'the tour region is drawn').toBeVisible();
  return tour;
}

test('NAV-5 · the tour lists its five stops in order: Overview, Requirements matrix, Rule, Walkthrough, Commit', async ({ page }) => {
  const tour = await openTour(page);
  await expect(tour.locator('ol > li > a')).toHaveText(['Overview', 'Requirements matrix', 'Rule', 'Walkthrough', 'Commit']);
});

test('NAV-5 · the tour says it is optional and follows one rule', async ({ page }) => {
  const tour = await openTour(page);
  await expect(tour.getByRole('heading', { name: 'Follow one rule' })).toBeVisible();
  await expect(tour).toContainText('Optional.');
});

test("NAV-5 · the tour's start link opens the requirements matrix", async ({ page }) => {
  const tour = await openTour(page);
  const start = tour.getByRole('link', { name: /^Start the tour/ });
  await expect(start).toHaveAttribute('href', hrefTo(route.matrix));
  await start.click();
  await expect(page).toHaveURL(hrefTo(route.matrix));
});

test("NAV-5 · the tour's first two stops link to the overview and the matrix", async ({ page }) => {
  const tour = await openTour(page);
  await expect(tour.getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute('href', /#\/$/);
  await expect(tour.getByRole('link', { name: 'Requirements matrix', exact: true })).toHaveAttribute('href', hrefTo(route.matrix));
});

test('NAV-5 · the about page with the tour has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
  await openOnFixture(page, fixture, route.about);
  await auditEverywhere(page, route.about, async (p) => {
    await expect(region(p, TOUR).locator('ol > li').first()).toBeVisible();
  });
});

test("NAV-5 · parity: the about page keeps its reference's regions in order, the tour built", async ({ page }) => {
  await expectRegionsInOrder(page, about);
});

test("NAV-5 · parity: the tour region carries its reference's components", async ({ page }) => {
  await expectRegionComponents(page, about, TOUR);
});
