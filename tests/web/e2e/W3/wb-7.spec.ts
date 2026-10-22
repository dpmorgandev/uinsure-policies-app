// WB-7 · HTTP inspector. The exact request and response of every action: the request log (/workbench/requests) and
// a screen's "Show requests" drawer hold each exchange the page sent to /api/…, its method, path, status, request
// body and response body as they went over the wire. On the live API; every expected value is the exchange the
// page itself saw.
import type { Page } from '@playwright/test';
import { expect, live, test } from '../W1/support/api';
import { answered, apiToday, field, requestOf, route, sellForm, sellThroughApi, watchApi } from '../W1/support/workbench';
import type { Exchange } from '../W1/support/workbench';

const unique = (tag: string): string => ('W3' + tag + Date.now().toString(36).toUpperCase()).slice(0, 20);
const requestsRoute = '/#/workbench/requests';

/** Every string, number or boolean anywhere in a JSON value, as text. */
function leaves(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(leaves);
  return Object.values(value as Record<string, unknown>).flatMap(leaves);
}

async function recordClaim(page: Page): Promise<Exchange> {
  const reference = unique('I');
  const today = await apiToday(unique('P'));
  await sellThroughApi(requestOf(sellForm(reference, { startDate: today })));
  const seen = watchApi(page);
  await page.goto(route.claim(reference));
  await field(page, 'Claim date').fill(today);
  await field(page, 'Description').fill('Storm damage to the roof tiles');
  await page.getByRole('main').getByRole('button', { name: 'Record this claim' }).click();
  return answered(seen, 'POST', `/api/policies/${reference}/claims`);
}

const apiPath = (e: Exchange): string => e.path.replace(/^\/api/, '');

test('WB-7 · the request log lists the claim the page sent, with its method, path and status', async ({ page, api }) => {
  void api;
  const claim = await recordClaim(page);
  await page.goto(requestsRoute);
  const entry = page.getByRole('main').getByRole('listitem').filter({ hasText: apiPath(claim) }).filter({ hasText: 'POST' });
  await expect(entry.first()).toBeVisible(live);
  await expect(entry.first()).toContainText(String(claim.status));
});

test('WB-7 · the request log shows the exact request body and response body of the claim', async ({ page, api }) => {
  void api;
  const claim = await recordClaim(page);
  await page.goto(requestsRoute);
  await page.getByRole('main').getByRole('listitem').filter({ hasText: apiPath(claim) }).filter({ hasText: 'POST' }).first().click();
  const main = page.getByRole('main');
  for (const value of leaves(claim.requestBody)) await expect(main, `the request's ${value}`).toContainText(value, live);
  for (const value of leaves(claim.responseBody)) await expect(main, `the response's ${value}`).toContainText(value, live);
});

test("WB-7 · the claim page's Show requests drawer holds the claim exchange", async ({ page, api }) => {
  void api;
  const claim = await recordClaim(page);
  await page.getByRole('button', { name: 'Show requests' }).click();
  const drawer = page.getByRole('dialog').or(page.getByRole('complementary', { name: /requests/i }));
  await expect(drawer.first()).toContainText(apiPath(claim), live);
  await expect(drawer.first()).toContainText(String(claim.status));
});

test('WB-7 · reachable: the request log route answers with its filter', async ({ page }) => {
  await page.goto(requestsRoute);
  await expect(page.getByRole('main').getByLabel('Filter requests')).toBeVisible();
});
