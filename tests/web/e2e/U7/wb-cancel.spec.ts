// The cancel screen (wb-cancel), U7's carries from W2's review (A1 R1, R2):
// - HONEST-1: it states the HTTP status it received, never a literal 200 or 201. The API's own cancellation is relayed
//   to the page with a different success status (200 in place of the API's 201), so a sentence that writes 201 itself
//   shows a status the page never received.
// - WB-4: after a 201 cancel it re-reads the policy, so its header's Policy status is the one the API holds now.
//
// On the live API (W1's support/api.ts, the node's port), each policy sold for the test through the API itself. Every
// expected value is the API's own answer, read from the exchange the page saw or from the API directly.
import { expect, live, test } from '../W1/support/api';
import type { Page } from '@playwright/test';
import { daysFromToday, readThroughApi, requestOf, sellForm, sellThroughApi, valueOf, watchApi } from '../W1/support/workbench';
import type { Policy } from '../W1/support/workbench';
import { REGION, askToCancel, cancelAnswered, cancelPath, confirmCancel, openCancel, quote, region } from '../W2/support/cancel';

/** A policy sold for the test, starting in 10 days, so a cancel 40 days on is past cooling-off and inside cover. */
async function soldPolicy(reference: string): Promise<Policy> {
  return sellThroughApi(requestOf(sellForm(reference, { startDate: daysFromToday(10), amount: '587.31', paymentMethod: 'Card' })));
}

/** Quotes 40 days on, confirms the cancel; resolves with the status the page received for it. */
async function quoteAndCancel(page: Page, reference: string): Promise<number> {
  const date = daysFromToday(40);
  await openCancel(page, reference);
  await quote(page, reference, date);
  await askToCancel(page, date);
  const answer = cancelAnswered(page, reference);
  await confirmCancel(page).click();
  return (await answer).status();
}

const policyStatus = (page: Page) => valueOf(region(page, REGION.dateAndQuote), 'Policy status');

test('HONEST-1 · the cancel screen states the status it received for the cancel, never a literal 201', async ({ page, api }) => {
  void api;
  const stored = await soldPolicy('U7-STATUS-1');
  // The API's own cancellation, relayed with 200 where the API answered 201: the body is the API's, the status the page's.
  await page.route(
    (url) => url.pathname === cancelPath(stored.reference),
    async (handled) => {
      if (handled.request().method() !== 'POST') return handled.fallback();
      const real = await handled.fetch();
      expect(real.status(), 'setup: the API cancels').toBe(201);
      return handled.fulfill({ response: real, status: 200 });
    },
  );
  const received = await quoteAndCancel(page, stored.reference);
  expect(received, 'setup: the page received 200').toBe(200);
  const main = page.getByRole('main');
  await expect(main, 'the cancel is shown as done').toContainText('Cancelled on', live);
  await expect(main, 'the status received, 200').toContainText(/answered 200\b/);
  await expect(main, 'no status the page never received').not.toContainText(/answered 201\b/);
});

test('WB-4 · after a 201 cancel, the cancel screen re-reads the policy from the API', async ({ page, api }) => {
  void api;
  const stored = await soldPolicy('U7-REREAD-1');
  const policyPath = `/api/policies/${stored.reference}`;
  const seen = watchApi(page);
  const status = await quoteAndCancel(page, stored.reference);
  expect(status, 'setup: the API cancels').toBe(201);
  const postAt = seen.findIndex((x) => x.method === 'POST' && x.path === cancelPath(stored.reference));
  expect(postAt, 'the cancel was sent').toBeGreaterThanOrEqual(0);
  await expect
    .poll(() => seen.slice(postAt + 1).filter((x) => x.method === 'GET' && x.path === policyPath).length, {
      message: `a GET ${policyPath} after the cancel`,
      ...live,
    })
    .toBeGreaterThanOrEqual(1);
});

test("WB-4 · after a 201 cancel, the header's Policy status is the one the API holds now", async ({ page, api }) => {
  void api;
  const stored = await soldPolicy('U7-REREAD-2');
  const status = await quoteAndCancel(page, stored.reference);
  expect(status, 'setup: the API cancels').toBe(201);
  const now = (await readThroughApi(stored.reference)).body as Policy;
  expect(now.status, 'setup: the API holds a status that moved with the cancel').not.toBe(stored.status);
  await expect(policyStatus(page), "the API's status now").toHaveText(now.status, live);
});
