// WB-7 · HTTP inspector. The exact request and response of every action: the request log (/workbench/requests) and
// a screen's "Show requests" drawer hold each exchange the page sent to /api/…, its method, path, status, request
// body and response body as they went over the wire. On the live API; every expected value is the exchange the
// page itself saw.
import type { Locator, Page } from '@playwright/test';
import { expect, live, test } from '../W1/support/api';
import { answered, apiToday, field, requestOf, route, sellForm, sellThroughApi, watchApi } from '../W1/support/workbench';
import type { Exchange } from '../W1/support/workbench';
import { requestsStates } from './support/states';

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
  await field(page, 'Claim description').fill('Storm damage to the roof tiles');
  await page.getByRole('main').getByRole('button', { name: 'Record this claim' }).click();
  return answered(seen, 'POST', `/api/policies/${reference}/claims`);
}

const apiPath = (e: Exchange): string => e.path.replace(/^\/api/, '');

/** The log's table row for this exchange: the kit's RequestLog draws one <tr> per exchange. */
const logRow = (page: Page, e: Exchange): Locator =>
  page.getByRole('main').getByRole('row').filter({ hasText: apiPath(e) }).filter({ hasText: e.method }).first();

test('WB-7 · the request log lists the claim the page sent, with its method, path and status', async ({ page, api }) => {
  void api;
  const claim = await recordClaim(page);
  await page.goto(requestsRoute);
  const entry = logRow(page, claim);
  await expect(entry).toBeVisible(live);
  await expect(entry).toContainText('POST');
  await expect(entry).toContainText(String(claim.status));
});

test('WB-7 · the request log shows the exact request body and response body of the claim', async ({ page, api }) => {
  void api;
  const claim = await recordClaim(page);
  await page.goto(requestsRoute);
  await logRow(page, claim).getByRole('button', { name: /^Open request #\d+, POST / }).click(live);
  const main = page.getByRole('main');
  for (const value of leaves(claim.requestBody)) await expect(main, `the request's ${value}`).toContainText(value, live);
  for (const value of leaves(claim.responseBody)) await expect(main, `the response's ${value}`).toContainText(value, live);
});

// A2/I3: the exchange is shown as it went over the wire, headers included. The response headers are the ones the
// browser received for the claim; the page can't see headers the browser adds itself, so the request side isn't
// compared with a Postman recording here.
test("WB-7 · the request log's opened claim shows its response headers, holding the content type the API served", async ({ page, api }) => {
  void api;
  const reference = 'W3HDRCLAIM0001';
  const today = await apiToday('W3HDRPROBE0001');
  await sellThroughApi(requestOf(sellForm(reference, { startDate: today })));
  const seen = watchApi(page);
  await page.goto(route.claim(reference));
  await field(page, 'Claim date').fill(today);
  const claimPath = `/api/policies/${reference}/claims`;
  const response = page.waitForResponse((r) => new URL(r.url()).pathname === claimPath && r.request().method() === 'POST', live);
  await page.getByRole('main').getByRole('button', { name: 'Record this claim' }).click();
  const contentType = (await response).headers()['content-type'];
  expect(contentType, 'setup: the API served a content type').toMatch(/^application\/(problem\+)?json/);
  const claim = await answered(seen, 'POST', claimPath);
  await page.goto(requestsRoute);
  await logRow(page, claim).getByRole('button', { name: /^Open request #\d+, POST / }).click(live);
  const disclosure = page.getByRole('main').getByRole('button', { name: /^Response headers \(\d+\)$/ });
  await expect(disclosure, 'the opened exchange has a response-headers disclosure').toHaveCount(1, live);
  if ((await disclosure.getAttribute('aria-expanded')) !== 'true') await disclosure.click();
  const panel = page.locator(`[id="${await disclosure.getAttribute('aria-controls')}"]`);
  await expect(panel.locator('dt').filter({ hasText: /^content-type$/ })).toHaveCount(1);
  await expect(panel.locator('dd').filter({ hasText: contentType as string })).toHaveCount(1);
});

test("WB-7 · the claim page's Show requests drawer holds the claim exchange", async ({ page, api }) => {
  void api;
  const claim = await recordClaim(page);
  await page.getByRole('button', { name: 'Show requests' }).click();
  const drawer = page.getByRole('dialog').or(page.getByRole('complementary', { name: /requests/i }));
  await expect(drawer.first()).toContainText(apiPath(claim), live);
  await expect(drawer.first()).toContainText(String(claim.status));
});

// QA note 3d (AC3; g4-defects section 3, "wb-requests has two filters with two counts"): the reference's duplicate
// is a defect not to copy. The log region holds one way to filter the rows and one count of the rows shown.
test('WB-7 · the requests page has one filter and one count of the rows shown', async ({ page }) => {
  await requestsStates.populated.open(page);
  const log = page.locator('[data-region="request-log"]');
  await expect(log.getByRole('row').nth(1), 'setup: the log holds an exchange').toBeVisible();
  const counts = log.getByRole('status').filter({ hasText: /Showing \d+ of \d+/ });
  await expect(counts, 'one count of the rows shown').toHaveCount(1);
  const textFilters = await log.getByRole('textbox').count();
  const selectFilters = await log.locator('fieldset').count();
  expect({ textFilter: textFilters, filterBar: selectFilters }, 'one filter: a text filter or a filter bar, exactly one of them').toEqual(
    textFilters > 0 ? { textFilter: 1, filterBar: 0 } : { textFilter: 0, filterBar: 1 },
  );
});

test('WB-7 · reachable: the request log route answers with its filter', async ({ page }) => {
  // The log is the page's own and empty until the page sends something: one recorded policy read puts an exchange in it.
  await requestsStates.populated.open(page);
  await expect(page.getByRole('main').getByLabel('Filter requests')).toBeVisible();
});
