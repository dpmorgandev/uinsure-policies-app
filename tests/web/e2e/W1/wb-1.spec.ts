// WB-1 · Sell form. Every field of the sell request, 1–3 policyholders, the reference normalisation preview
// (SELL-1). The sales run on the live API (support/api.ts), each test with references of its own; every value a
// test expects back is the API's answer. Parity on the recorded SELL-1 exchange, against docs/ui/derived/W1/wb-sell/.
import { expect, test } from './support/api';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, sellStates } from './support/parity';
import {
  ADA,
  BARBARA,
  EDSGER,
  addHolder,
  answered,
  field,
  fillSell,
  holder,
  holderGroups,
  openSell,
  readThroughApi,
  region,
  requestOf,
  route,
  sell,
  sellForm,
  setHolderCount,
  storedPreview,
  valueOf,
  watchApi,
} from './support/workbench';
import type { Policy } from './support/workbench';

test.describe('the request', () => {
  test('WB-1 · the sell form sends every field of the sell request as filled in', async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    const form = sellForm('W1-FULL-1', { policyholders: [ADA, EDSGER] });
    await sell(page, form);
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect(exchange.requestBody, 'the body is the sell request, field by field').toEqual(requestOf(form));
  });

  test('WB-1 · Buy to let, Card, auto-renew off and empty address lines are sent as chosen, the empty lines as null', async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    const form = sellForm('W1-FULL-2', {
      type: 'BuyToLet',
      paymentMethod: 'Card',
      autoRenew: false,
      property: { addressLine1: '3 Tib Street', addressLine2: '', addressLine3: '', postcode: 'M4 1SH' },
    });
    await sell(page, form);
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect(exchange.requestBody, 'the body carries each choice, and null for each empty address line').toEqual(requestOf(form));
  });
});

test.describe('the answer', () => {
  test('WB-1 · a sale the API accepts shows the policy as the API stored it: its reference, status and term dates', async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    await sell(page, sellForm('W1-ANSWER-1'));
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect(exchange.status, 'the API accepts the sale').toBe(201);
    const stored = exchange.responseBody as Policy;
    const main = page.getByRole('main');
    await expect(main, 'the stored reference').toContainText(stored.reference);
    await expect(main, 'the status the API gave it').toContainText(stored.status);
    await expect(main, "the term's end date, which only the API knows").toContainText(stored.endDate);
  });

  test('WB-1 · a sold policy opens its policy view, with the dates the API returned', async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    await sell(page, sellForm('W1-OPEN-1'));
    const stored = (await answered(seen, 'POST', '/api/policies')).responseBody as Policy;
    const link = page.getByRole('main').getByRole('link', { name: `Open policy ${stored.reference}` });
    await expect(link, 'the answered form links the policy it sold').toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#/workbench/policies/${stored.reference}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Policy ${stored.reference}`);
    const term = region(page, 'status-and-current-term');
    await expect(valueOf(term, 'Start date'), "the current term's start, as the API returned it").toHaveText(stored.startDate);
    await expect(valueOf(term, 'End date'), "the current term's end, as the API returned it").toHaveText(stored.endDate);
  });
});

test.describe('policyholders, 1 to 3', () => {
  test("WB-1 · the form starts with one policyholder, who can't be removed", async ({ page }) => {
    await openSell(page);
    await expect(holderGroups(page), 'one policyholder to start').toHaveCount(1);
    await expect(holder(page, 1).getByLabel('First name', { exact: true }), 'with its own fields').toBeVisible();
    await expect(page.getByRole('main').getByRole('button', { name: /^Remove policyholder/ }), 'the last one has no Remove').toHaveCount(0);
  });

  test('WB-1 · with two policyholders either can be removed, and the other keeps its values', async ({ page }) => {
    await openSell(page);
    await setHolderCount(page, 2);
    await holder(page, 1).getByLabel('First name', { exact: true }).fill(ADA.firstName);
    await holder(page, 2).getByLabel('First name', { exact: true }).fill(EDSGER.firstName);
    await expect(page.getByRole('main').getByRole('button', { name: /^Remove policyholder/ }), 'each of the two has Remove').toHaveCount(2);
    await page.getByRole('main').getByRole('button', { name: 'Remove policyholder 1' }).click();
    await expect(holderGroups(page)).toHaveCount(1);
    await expect(holder(page, 1).getByLabel('First name', { exact: true }), "the one left keeps its own value").toHaveValue(EDSGER.firstName);
  });

  test('WB-1 · at two policyholders the form offers a third', async ({ page }) => {
    await openSell(page);
    await setHolderCount(page, 2);
    await expect(addHolder(page), 'Add is offered below the limit').toBeVisible();
  });

  test('WB-1 · at three policyholders the form offers no fourth', async ({ page }) => {
    await openSell(page);
    await setHolderCount(page, 3);
    await expect(holder(page, 3).getByLabel('First name', { exact: true }), 'the third has its own fields').toBeVisible();
    await expect(addHolder(page), 'Add is gone at the limit').toHaveCount(0);
  });

  test('WB-1 · three policyholders are sent, and the policy view lists all three as the API returned them', async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    const form = sellForm('W1-THREE-1', { policyholders: [ADA, EDSGER, BARBARA] });
    await sell(page, form);
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect((exchange.requestBody as { policyholders?: unknown[] }).policyholders, 'all three are sent').toEqual(form.policyholders);
    const read = await readThroughApi('W1-THREE-1');
    expect(read.status, 'setup: the API holds the policy').toBe(200);
    const stored = read.body as Policy;
    await page.goto(route.policy(stored.reference));
    const holders = region(page, 'policyholders-and-property');
    for (const h of stored.policyholders) {
      await expect(holders, `${h.firstName} ${h.lastName}`).toContainText(h.firstName);
      await expect(holders).toContainText(h.lastName);
      await expect(holders).toContainText(h.dateOfBirth);
    }
  });
});

test.describe('the reference as stored', () => {
  test('WB-1 · the preview shows a typed reference trimmed and upper-cased, as the API will store it', async ({ page }) => {
    await openSell(page);
    await field(page, 'Policy reference').fill('  w1-norm-a ');
    await expect(storedPreview(page), 'trimmed and upper-cased').toContainText('W1-NORM-A');
    await expect(storedPreview(page)).toContainText('Valid');
  });

  test('WB-1 · the preview marks a 2-character reference invalid', async ({ page }) => {
    await openSell(page);
    await field(page, 'Policy reference').fill('w1');
    await expect(storedPreview(page)).toContainText('W1');
    await expect(storedPreview(page)).toContainText('Invalid pattern');
  });

  test('WB-1 · the preview marks a 3-character reference valid', async ({ page }) => {
    await openSell(page);
    await field(page, 'Policy reference').fill('w1a');
    await expect(storedPreview(page)).toContainText('W1A');
    await expect(storedPreview(page)).toContainText('Valid');
  });

  test('WB-1 · the preview marks a 20-character reference valid', async ({ page }) => {
    const twenty = 'w1-twenty-characters';
    expect(twenty).toHaveLength(20);
    await openSell(page);
    await field(page, 'Policy reference').fill(twenty);
    await expect(storedPreview(page)).toContainText(twenty.toUpperCase());
    await expect(storedPreview(page)).toContainText('Valid');
  });

  test('WB-1 · the preview marks a 21-character reference invalid', async ({ page }) => {
    const twentyOne = 'w1-twentyone-charactr';
    expect(twentyOne).toHaveLength(21);
    await openSell(page);
    await field(page, 'Policy reference').fill(twentyOne);
    await expect(storedPreview(page)).toContainText(twentyOne.toUpperCase());
    await expect(storedPreview(page)).toContainText('Invalid pattern');
  });

  test('WB-1 · the API stores the reference the preview showed', async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    await fillSell(page, sellForm('  w1-norm-b '));
    await expect(storedPreview(page)).toContainText('W1-NORM-B');
    const previewed = (await storedPreview(page).locator('code').first().textContent())?.trim();
    await page.getByRole('main').getByRole('button', { name: 'Sell this policy' }).click();
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect(exchange.status, 'the API accepts the sale').toBe(201);
    expect((exchange.responseBody as Policy).reference, 'the API stored what the preview showed').toBe(previewed);
  });
});

test.describe('reachable', () => {
  test("WB-1 · reachable: the workbench home's Sell a new policy link opens the sell form", async ({ page }) => {
    await page.goto(route.home);
    const link = page.getByRole('main').getByRole('link', { name: 'Sell a new policy' });
    await expect(link, 'the home links the sell form').toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/#\/workbench\/sell$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sell a policy');
  });
});

test.describe('parity', () => {
  test('WB-1 · parity: the sell form keeps its reference\'s regions in order, the unbuilt ones as not built yet', async ({ page }) => {
    await expectRegionsInOrder(page, sellStates.populated);
  });

  test("WB-1 · parity: the sell form has its reference's title, shell and navigation", async ({ page }) => {
    await expectShell(page, sellStates.populated);
  });

  for (const slug of [
    'policy-fields-reference-type-start-date-amount-payment-method-auto-renew',
    'reference-as-stored-normalisation-preview',
    'policyholders-1-to-3',
    'property',
  ]) {
    test(`WB-1 · parity: the sell form's ${slug} region carries its reference's components`, async ({ page }) => {
      await expectRegionComponents(page, sellStates.populated, slug);
    });
  }

  test('WB-1 · parity: the sell form colours only from tokens, light and dark', async ({ page }) => {
    await expectTokensOnly(page, sellStates.populated);
  });
});
