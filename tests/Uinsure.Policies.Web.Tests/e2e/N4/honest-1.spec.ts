// bug-002 N4 · HONEST-1 · the workbench draws no state the API never gave (the three lines carried from bug-002 N3):
// - Sell and Cancel draw the header Status as a pass tick whatever its value (SellPolicy.tsx: `value: 'pass'`;
//   CancelPolicy.tsx: `stale ? 'warn' : 'pass'`), so a Pending sale and a Cancelled policy both read as a pass. The
//   policy view already maps each status to a tone (PolicyView.tsx STATUS_TAGS); the screens must share one mapping
//   (N3 review A1 R3).
// - A fetch that is rejected never got an answer, yet the requests drawer announces "Request #n answered" and tags it
//   "Problem" (kit InspectorDrawer) (N3 review A1 R4).
// - Moving from one policy's cancel route straight to another's keeps the cancel screen's state: the quote, the
//   cancel's answer and any stale mark of the first policy (pre-existing on main; N3 QA step 12).
//
// On the live API (W1's support/api.ts, the node's port), each policy sold for the test through the API itself. Every
// expected value is the exchange the page itself saw (watchApi) or the policy view's own drawing, never a figure
// written here.
import type { Page } from '@playwright/test';
import { expect, live, test } from '../W1/support/api';
import { answered, daysFromToday, requestOf, route, sell, sellForm, sellThroughApi, unreachable, watchApi } from '../W1/support/workbench';
import { askToCancel, cancelAnswered, confirmCancel, dateField, openCancel, quote } from '../W2/support/cancel';
import { freshReference } from '../W3/support/fresh';
import { drawerIn, headerField } from '../N3/support';

/** The kit StatusTag in the live header's Status field: its data-status is the tone it is drawn in. */
const statusTag = (page: Page) => headerField(page, 'Status').locator('[data-status]');

/** The tone the policy view draws for this policy's header Status, read from the page itself. */
async function policyViewTone(page: Page, reference: string): Promise<string | null> {
  await page.goto(route.policy(reference));
  const tag = statusTag(page);
  await expect(tag, 'setup: the policy view draws its header Status').toHaveCount(1, live);
  return tag.getAttribute('data-status');
}

test("HONEST-1 · after a 201 sale of a Pending policy the sell header's Status is not drawn as a pass, but in the policy view's tone", async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  const reference = freshReference('N4ST');
  await sell(page, sellForm(reference, { startDate: daysFromToday(20), amount: '633.21' }));
  const sale = await answered(seen, 'POST', '/api/policies');
  expect(sale.status, 'setup: the API sold the policy').toBe(201);
  const returned = (sale.responseBody as { status: string }).status;
  expect(returned, 'setup: a sale starting in 20 days is Pending').toBe('Pending');
  await expect(headerField(page, 'Status'), 'setup: the Status field holds the 201 status').toContainText(returned, live);
  const tone = await statusTag(page).getAttribute('data-status');
  expect(tone, 'a Pending policy is never drawn as a pass tick').not.toBe('pass');
  expect(tone, 'the sell header draws Pending in the tone the policy view gives it').toBe(await policyViewTone(page, reference));
});

test("HONEST-1 · after a 201 cancel the cancel header's Status, Cancelled, is not drawn as a pass, but in the policy view's tone", async ({ page, api }) => {
  void api;
  const reference = freshReference('N4CT');
  await sellThroughApi(requestOf(sellForm(reference, { startDate: daysFromToday(10), amount: '646.38', paymentMethod: 'Card' })));
  const seen = watchApi(page);
  await openCancel(page, reference);
  const date = daysFromToday(40);
  await quote(page, reference, date);
  await askToCancel(page, date);
  const cancelled = cancelAnswered(page, reference);
  await confirmCancel(page).click();
  expect((await cancelled).status(), 'setup: the API cancelled the policy').toBe(201);
  const reread = await answered(seen, 'GET', `/api/policies/${reference}`, 1);
  const held = (reread.responseBody as { status: string }).status;
  expect(held, 'setup: the re-read after the cancel says Cancelled').toBe('Cancelled');
  await expect(headerField(page, 'Status'), 'setup: the Status field holds the re-read status').toContainText(held, live);
  const tone = await statusTag(page).getAttribute('data-status');
  expect(tone, 'a Cancelled policy is never drawn as a pass tick').not.toBe('pass');
  expect(tone, 'the cancel header draws Cancelled in the tone the policy view gives it').toBe(await policyViewTone(page, reference));
});

test('HONEST-1 · a sale whose fetch is rejected is announced and tagged as failed in the requests drawer, never answered or Problem', async ({ page, api }) => {
  void api;
  const reference = freshReference('N4RJ');
  await unreachable(page, 'POST', '/api/policies');
  const seen = watchApi(page);
  await sell(page, sellForm(reference, { amount: '652.47' }));
  await expect.poll(() => seen.length > 0 && seen.every((e) => e.done), { message: 'setup: the rejected sale has settled', ...live }).toBe(true);
  const drawer = drawerIn(page);
  const item = drawer.getByRole('listitem').filter({ hasText: 'POST /policies' }).first();
  await expect(item, 'setup: the drawer lists the rejected sale').toBeVisible(live);
  const tag = item.locator('[data-status]').first();
  await expect(tag, 'the tag does not call the rejected sale a Problem').not.toContainText(/problem/i);
  await expect(tag, 'the tag says the rejected sale failed').toContainText(/fail/i);
  const announced = drawer.getByRole('status');
  await expect(announced, 'the drawer does not announce the rejected sale as answered').not.toContainText(/answered/i);
  await expect(announced, 'the drawer announces the rejected sale as failed').toContainText(/fail/i);
});

test("HONEST-1 · moving from one policy's cancel route straight to another's carries no quote, cancel, answer or stale mark across", async ({ page, api }) => {
  void api;
  const first = freshReference('N4RA');
  const second = freshReference('N4RB');
  await sellThroughApi(requestOf(sellForm(first, { startDate: daysFromToday(10), amount: '659.12', paymentMethod: 'Card' })));
  await sellThroughApi(requestOf(sellForm(second, { startDate: daysFromToday(12), amount: '661.35', paymentMethod: 'Card' })));
  const seen = watchApi(page);
  await openCancel(page, first);
  const date = daysFromToday(40);
  await quote(page, first, date);
  await askToCancel(page, date);
  const cancelled = cancelAnswered(page, first);
  await confirmCancel(page).click();
  expect((await cancelled).status(), 'setup: the API cancelled the first policy').toBe(201);
  const main = page.getByRole('main');
  await expect(main, "setup: the first policy's cancel is drawn").toContainText(new RegExp(`Cancelled on ${date}`), live);

  // Straight to the second policy's cancel route: a hash change, as a link or the address bar would make it.
  await page.evaluate((hash) => {
    window.location.hash = hash;
  }, `#/workbench/policies/${second}/cancel`);
  const read = await answered(seen, 'GET', `/api/policies/${second}`);
  expect(read.status, 'setup: the second policy was read').toBe(200);
  const held = (read.responseBody as { status: string }).status;
  await expect(headerField(page, 'Status'), "setup: the header holds the second policy's status").toContainText(held, live);

  await expect(main, "no answer of the first policy's cancel is carried").not.toContainText(/Cancelled on/);
  await expect(main, "no quote of the first policy is carried").not.toContainText(/Quote returned/);
  await expect(main.getByRole('button', { name: /^Cancel on / }), "no cancel on the first policy's quoted date is offered").toHaveCount(0);
  await expect(dateField(page), "the first policy's date is not carried into the field").toHaveValue('');
  await expect(main, 'no stale mark is carried').not.toContainText(/read before the cancel/i);
});
