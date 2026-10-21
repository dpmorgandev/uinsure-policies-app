// WB-9 · Recent policies. The references this browser has sold or opened, kept in local storage; no list
// endpoint (David, 2026-10-19). Each test starts in a fresh browser context, so its list holds only what it did,
// on the live API. Parity on two recorded sales, against docs/ui/derived/W1/wb-home/.
import { expect, test } from './support/api';
import { expectRegionComponents, expectShell, expectTokensOnly, homeStates } from './support/parity';
import {
  PAST_START,
  answered,
  openFromHome,
  readThroughApi,
  recentList,
  requestOf,
  route,
  sell,
  sellForm,
  sellThroughApi,
  watchApi,
} from './support/workbench';
import type { Page } from '@playwright/test';
import type { Policy } from './support/workbench';

/** Sells `reference` through the form and returns what the API stored. */
async function soldHere(page: Page, reference: string): Promise<Policy> {
  const seen = watchApi(page);
  await sell(page, sellForm(reference));
  const exchange = await answered(seen, 'POST', '/api/policies');
  expect(exchange.status, `the API sells ${reference}`).toBe(201);
  await expect(page.getByRole('main').getByRole('link', { name: `Open policy ${(exchange.responseBody as Policy).reference}` })).toBeVisible();
  return exchange.responseBody as Policy;
}

/** Opens `reference` from the home and waits for its view. */
async function openedHere(page: Page, reference: string): Promise<void> {
  await openFromHome(page, reference);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Policy ${reference}`);
}

const items = (page: Page) => recentList(page).getByRole('listitem');

test('WB-9 · a browser that has sold or opened nothing shows the list empty, and says so', async ({ page }) => {
  await page.goto(route.home);
  const recent = page.getByRole('main').getByRole('region', { name: 'Recent policies in this browser' });
  await expect(recent, 'the recent-policies section').toBeVisible();
  await expect(recent).toContainText('No policy has been sold or opened in this browser yet');
  await expect(recentList(page), 'no list of references').toHaveCount(0);
});

test('WB-9 · a policy sold in this browser is listed on the home as sold', async ({ page, api }) => {
  void api;
  const stored = await soldHere(page, 'W1-RECENT-1');
  await page.goto(route.home);
  await expect(items(page)).toHaveCount(1);
  await expect(items(page).first().getByRole('link', { name: stored.reference, exact: true })).toBeVisible();
  await expect(items(page).first()).toContainText('Sold');
});

test('WB-9 · a policy opened in this browser by reference is listed on the home as opened', async ({ page, api }) => {
  void api;
  const stored = await sellThroughApi(requestOf(sellForm('W1-RECENT-2')));
  await openedHere(page, stored.reference);
  await page.goto(route.home);
  await expect(items(page)).toHaveCount(1);
  await expect(items(page).first().getByRole('link', { name: stored.reference, exact: true })).toBeVisible();
  await expect(items(page).first()).toContainText('Opened');
});

test('WB-9 · the list is newest first', async ({ page, api }) => {
  void api;
  const first = await soldHere(page, 'W1-RECENT-3');
  const second = await sellThroughApi(requestOf(sellForm('W1-RECENT-4')));
  await openedHere(page, second.reference);
  await page.goto(route.home);
  await expect(recentList(page).getByRole('link')).toHaveText([second.reference, first.reference]);
});

test("WB-9 · a recent policy's link opens that policy, not another", async ({ page, api }) => {
  void api;
  const older = await soldHere(page, 'W1-RECENT-5');
  await soldHere(page, 'W1-RECENT-6');
  await page.goto(route.home);
  await recentList(page).getByRole('link', { name: older.reference, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#/workbench/policies/${older.reference}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Policy ${older.reference}`);
});

test("WB-9 · the list is kept in this browser's local storage: it survives a reload, and another browser doesn't see it", async ({ page, browser, api }) => {
  void api;
  const stored = await soldHere(page, 'W1-RECENT-7');
  await page.goto(route.home);
  await page.reload();
  await expect(recentList(page).getByRole('link', { name: stored.reference, exact: true }), 'after a reload').toBeVisible();
  const other = await browser.newContext();
  try {
    const elsewhere = await other.newPage();
    await elsewhere.goto(route.home);
    await expect(elsewhere.getByRole('main'), 'another browser').toContainText('No policy has been sold or opened in this browser yet');
  } finally {
    await other.close();
  }
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole('main'), 'with local storage cleared').toContainText('No policy has been sold or opened in this browser yet');
});

test('WB-9 · a sale the API refused is not listed', async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  await sell(page, sellForm('W1-RECENT-8', { startDate: PAST_START }), { sendAnyway: true });
  const exchange = await answered(seen, 'POST', '/api/policies');
  expect(exchange.status, 'the API refuses the sale').toBe(422);
  await page.goto(route.home);
  await expect(page.getByRole('main')).toContainText('No policy has been sold or opened in this browser yet');
});

test('WB-9 · a reference the API has no policy for is not listed', async ({ page, api }) => {
  void api;
  const read = await readThroughApi('W1-RECENT-9');
  expect(read.status, 'setup: the API has no such policy').toBe(404);
  const seen = watchApi(page);
  await openFromHome(page, 'W1-RECENT-9');
  const exchange = await answered(seen, 'GET', '/api/policies/W1-RECENT-9');
  expect(exchange.status).toBe(404);
  await page.goto(route.home);
  await expect(page.getByRole('main')).toContainText('No policy has been sold or opened in this browser yet');
});

test("WB-9 · reachable: the primary nav's Workbench entry opens the workbench home, marked current", async ({ page }) => {
  await page.goto('/#/');
  const nav = page.getByRole('navigation', { name: /^Primary/ });
  await expect(nav.getByRole('link', { name: 'Workbench' }), 'the primary nav links the workbench').toBeVisible();
  await nav.getByRole('link', { name: 'Workbench' }).click();
  await expect(page).toHaveURL(/#\/workbench$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workbench');
  await expect(nav.getByRole('link', { name: 'Workbench' })).toHaveAttribute('aria-current', 'page');
});

test.describe('parity', () => {
  test("WB-9 · parity: the workbench home's recent policies carry their reference's components", async ({ page }) => {
    await expectRegionComponents(page, homeStates.populated, 'recent-policies-kept-in-this-browser');
  });

  test("WB-9 · parity: the workbench home has its reference's title, shell and navigation", async ({ page }) => {
    await expectShell(page, homeStates.populated);
  });

  test('WB-9 · parity: the workbench home colours only from tokens, light and dark', async ({ page }) => {
    await expectTokensOnly(page, homeStates.populated);
  });
});
