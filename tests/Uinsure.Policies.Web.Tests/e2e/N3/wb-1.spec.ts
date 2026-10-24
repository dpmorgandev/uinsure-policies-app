// bug-002 N3 · WB-1 · the header's Status is the status the API returned (inv-009 #3, I9). SellPolicy.tsx passes no
// status to PageHeader, so the Sell header reads the kit's default "not in this screen's data" before and after a
// sale; CancelPolicy.tsx passes none either, so Cancel's reads "not returned" while its policy read holds the status.
//
// On the live API (W1's support/api.ts, the node's port), each policy sold for the test through the API itself. Every
// expected value is the exchange the page itself saw (watchApi), never a figure written here.
import { expect, live, test } from '../W1/support/api';
import { answered, daysFromToday, requestOf, route, sell, sellButton, sellForm, sellThroughApi, watchApi } from '../W1/support/workbench';
import { openCancel } from '../W2/support/cancel';
import { freshReference } from '../W3/support/fresh';
import { headerField } from './support';

test("WB-1 · before any answer the sell header's Status says nothing has been sold yet, never \"not in this screen's data\"", async ({ page, api }) => {
  void api;
  await page.goto(route.sell);
  await expect(sellButton(page), 'setup: the sell form is shown').toBeVisible(live);
  const status = headerField(page, 'Status');
  await expect(status, 'setup: the sell header draws its Status field').toHaveCount(1);
  await expect(status, "the Status gap is not the kit's default label").not.toContainText("not in this screen's data");
  await expect(status, 'the Status says no sale has been made yet').toContainText(/nothing (has been )?sold yet/i);
});

test("WB-1 · after a 201 sale the sell header's Status reads the status the API returned", async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  await sell(page, sellForm(freshReference('N3SS'), { amount: '617.43' }));
  const sale = await answered(seen, 'POST', '/api/policies');
  expect(sale.status, 'setup: the API sold the policy').toBe(201);
  const returned = (sale.responseBody as { status: string }).status;
  const status = headerField(page, 'Status');
  await expect(status, "the Status field holds the 201's status").toContainText(returned, live);
  await expect(status).not.toContainText("not in this screen's data");
});

test("WB-1 · the cancel header's Status reads the policy status the API holds", async ({ page, api }) => {
  void api;
  const reference = freshReference('N3CS');
  await sellThroughApi(requestOf(sellForm(reference, { startDate: daysFromToday(10), amount: '628.14', paymentMethod: 'Card' })));
  const seen = watchApi(page);
  await openCancel(page, reference);
  const read = await answered(seen, 'GET', `/api/policies/${reference}`);
  expect(read.status, 'setup: the API read the policy').toBe(200);
  const held = (read.responseBody as { status: string }).status;
  const status = headerField(page, 'Status');
  await expect(status, "the Status field holds the policy read's status").toContainText(held, live);
  await expect(status, 'the Status is not drawn as missing').not.toContainText('not returned');
});
