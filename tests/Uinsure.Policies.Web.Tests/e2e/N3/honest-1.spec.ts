// bug-002 N3 · HONEST-1 · the workbench shows no status the API never gave:
// - when the re-read after a 201 cancel fails, CancelPolicy.tsx keeps the read from before the cancel and shows it as
//   current, unmarked (inv-009 #18, I24; U7 review A1 R2);
// - a request whose fetch is rejected stays "Waiting" in the requests drawer and "pending" in the request log, since
//   loggingFetch leaves its status null (inv-011 I3, the N2 carry-over).
//
// On the live API (W1's support/api.ts, the node's port), each policy sold for the test through the API itself. Every
// expected value is the exchange the page itself saw (watchApi), never a figure written here.
import { expect, live, test } from '../W1/support/api';
import { answered, daysFromToday, requestOf, sell, sellForm, sellThroughApi, unreachable, watchApi } from '../W1/support/workbench';
import { askToCancel, cancelAnswered, confirmCancel, openCancel, quote } from '../W2/support/cancel';
import { freshReference } from '../W3/support/fresh';
import { drawerIn, headerField } from './support';

test('HONEST-1 · when the re-read after a 201 cancel fails, the cancel header marks the policy status as read before the cancel', async ({ page, api }) => {
  void api;
  const reference = freshReference('N3CR');
  await sellThroughApi(requestOf(sellForm(reference, { startDate: daysFromToday(10), amount: '641.27', paymentMethod: 'Card' })));
  const seen = watchApi(page);
  await openCancel(page, reference);
  const first = await answered(seen, 'GET', `/api/policies/${reference}`);
  expect(first.status, 'setup: the first policy read answered').toBe(200);
  const before = (first.responseBody as { status: string }).status;
  // Every later read of this policy is refused, as an API that has gone down after the cancel would.
  await page.route(
    (url) => url.pathname === `/api/policies/${reference}`,
    (handled) =>
      handled.request().method() === 'GET'
        ? handled.fulfill({ status: 503, contentType: 'application/problem+json', body: JSON.stringify({ status: 503, title: 'Service Unavailable' }) })
        : handled.fallback(),
  );
  const date = daysFromToday(40);
  await quote(page, reference, date);
  await askToCancel(page, date);
  const cancelled = cancelAnswered(page, reference);
  await confirmCancel(page).click();
  expect((await cancelled).status(), 'setup: the API cancelled the policy').toBe(201);
  await answered(seen, 'GET', `/api/policies/${reference}`, 1);
  const status = headerField(page, 'Status');
  await expect(status, 'the Status field says it was read before the cancel').toContainText(/read before the cancel/i, live);
  await expect(status, 'the marked status is the one the first read gave').toContainText(before);
});

test('HONEST-1 · a sale whose fetch is rejected reads as failed in the requests drawer and the request log, never Waiting', async ({ page, api }) => {
  void api;
  const reference = freshReference('N3RF');
  await unreachable(page, 'POST', '/api/policies');
  const seen = watchApi(page);
  await sell(page, sellForm(reference, { amount: '655.19' }));
  await expect.poll(() => seen.length > 0 && seen.every((e) => e.done), { message: 'the rejected sale has settled', ...live }).toBe(true);
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'The API did not answer', exact: true }),
    'setup: the screen shows the API did not answer',
  ).toBeVisible(live);

  const item = drawerIn(page).getByRole('listitem').filter({ hasText: 'POST /policies' }).first();
  await expect(item, 'setup: the drawer lists the rejected sale').toBeVisible(live);
  await expect(item, 'the drawer does not draw the rejected sale as waiting').not.toContainText(/waiting/i);
  await expect(item, 'the drawer draws the rejected sale as failed').toContainText(/fail/i);

  // The request log is the same page's log: a hash change, never a reload.
  await page.evaluate(() => {
    window.location.hash = '#/workbench/requests';
  });
  const row = page.getByRole('main').getByRole('row').filter({ hasText: '/policies' }).first();
  await expect(row, 'setup: the request log lists the rejected sale').toBeVisible(live);
  await expect(row, 'the log does not draw the rejected sale as pending').not.toContainText(/pending|waiting/i);
  await expect(row, 'the log draws the rejected sale as failed').toContainText(/fail/i);
});
