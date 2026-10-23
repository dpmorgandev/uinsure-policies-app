// U8 · W3's carries under WB-5 (D1; W3 review A2 R4, A4 R1). On recorded answers (docs/ui/fixture/api/), served
// through page.route: these are about what the page draws from an answer, not about the API.
//
// - The policy view's actions region draws the reference's three kit Buttons (docs/ui/derived/U8/wb-policy/
//   populated.html: "Quote and cancel", "Record a claim", "Renew", each a kit-button), not only links.
// - The renew form never shows a payment method the term does not hold: no Card fallback when the read names no
//   payment for the current term (HONEST-1).
import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { live } from '../W1/support/api';
import { answerWith, exchangeAt } from '../W1/support/recorded';
import { field, region, route } from '../W1/support/workbench';
import type { Policy } from '../W1/support/workbench';

const READ_BACK = exchangeAt('045-get-1-sold-policy-reads-back-in-full-200.json', 1);
const ACTIONS = 'actions-quote-and-cancel-record-a-claim-renew';

const renewButton = (page: Page): Locator => page.getByRole('main').getByRole('button', { name: /^(Renew policy|Renewing…)$/ });

/** GET /api/policies/<reference> answered 200 with this body, every time. */
async function readAnswers(page: Page, body: Policy): Promise<void> {
  await page.route(
    (url) => url.pathname === `/api/policies/${body.reference}`,
    (handled) =>
      handled.request().method() === 'GET'
        ? handled.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) })
        : handled.fallback(),
  );
}

test("WB-5 · the policy view's actions region draws the reference's three kit Buttons: quote and cancel, record a claim, renew", async ({ page }) => {
  const reference = (READ_BACK.responseBody as Policy).reference;
  await answerWith(page, READ_BACK);
  await page.goto(route.policy(reference));
  await expect(page.getByRole('main'), 'setup: the read has landed').toContainText(`The API returned no claims for ${reference}.`, live);
  const buttons = region(page, ACTIONS).locator('[class*="kit-button__button"]');
  await expect(buttons, 'the actions region holds three kit Buttons, in the reference order').toHaveText(['Quote and cancel', 'Record a claim', 'Renew']);
});

test('WB-5 · the renew form shows no payment method when the current term holds no payment: no Card fallback', async ({ page }) => {
  // The recorded read-back (045, F2-MVFJQA9DQG) put on auto-renew, with no payment returned for its term: the
  // payment-method field has nothing from the term to show.
  const recorded = READ_BACK.responseBody as Policy;
  const termless: Policy = { ...recorded, autoRenew: true, payments: [] };
  await readAnswers(page, termless);
  await page.goto(route.renew(termless.reference));
  await expect(renewButton(page), 'setup: the read has landed on the screen').toBeEnabled(live);
  const method = field(page, 'Payment method');
  await expect
    .poll(async () => ((await method.count()) === 0 ? 'no field' : await method.inputValue()), {
      message: 'the payment method shown is not one the term does not hold',
    })
    .not.toMatch(/^(Card|DirectDebit|Cheque)$/);
});

test('WB-5 · the renew form shows no payment method when the term names a payment type the form does not list: no Card fallback', async ({
  page,
}) => {
  // The same read, with the term's payment answered as a type the form has no option for: the field still shows no
  // method in its place, Card least of all.
  const recorded = READ_BACK.responseBody as Policy;
  const current = recorded.terms.find((t) => t.termNumber === recorded.currentTermNumber);
  expect(current, 'setup: the read has its current term').toBeDefined();
  const unlisted: Policy = {
    ...recorded,
    autoRenew: true,
    payments: recorded.payments.map((p) => (p.reference === current?.paymentReference ? { ...p, type: 'BankTransfer' } : p)),
  };
  await readAnswers(page, unlisted);
  await page.goto(route.renew(unlisted.reference));
  await expect(renewButton(page), 'setup: the read has landed on the screen').toBeEnabled(live);
  const method = field(page, 'Payment method');
  await expect
    .poll(async () => ((await method.count()) === 0 ? 'no field' : await method.inputValue()), {
      message: 'the payment method shown is not one the term does not hold',
    })
    .not.toMatch(/^(Card|DirectDebit|Cheque)$/);
});
