// WB-2 · Policy view. By reference: status, current term, terms timeline (the dates the API returns; no window is
// shaded or computed), holders, property, payments, refunds, claims. Each test sells its own policy straight
// through the live API (setup), then reads what the view shows against the API's own GET of it. Parity on the
// recorded GET-1 exchanges, against docs/ui/derived/W1/wb-policy/ and wb-home/.
import { expect, test } from './support/api';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, homeStates, policyStates } from './support/parity';
import {
  ADA,
  EDSGER,
  datesIn,
  datesShown,
  field,
  openFromHome,
  readThroughApi,
  region,
  requestOf,
  route,
  sellForm,
  sellThroughApi,
  valueOf,
} from './support/workbench';
import type { Policy } from './support/workbench';

/** Sells `reference` through the API and returns the policy as the API's GET answers it. */
async function soldPolicy(reference: string): Promise<Policy> {
  await sellThroughApi(requestOf(sellForm(reference, { policyholders: [ADA, EDSGER] })));
  const read = await readThroughApi(reference);
  expect(read.status, `setup: the API reads ${reference} back`).toBe(200);
  return read.body as Policy;
}

test.describe('open by reference', () => {
  test("WB-2 · the home's policy reference field has a visible label that names it", async ({ page }) => {
    await page.goto(route.home);
    const label = page.getByRole('main').locator('label', { hasText: /^\s*Policy reference\s*$/ });
    await expect(label, 'a <label> reads "Policy reference"').toBeVisible();
    await label.click();
    await expect(field(page, 'Policy reference'), 'the label belongs to the reference field').toBeFocused();
  });

  test('WB-2 · a reference opened on the home opens that policy, as the API returned it', async ({ page, api }) => {
    void api;
    const policy = await soldPolicy('W1-HOME-1');
    await openFromHome(page, policy.reference);
    await expect(page).toHaveURL(new RegExp(`#/workbench/policies/${policy.reference}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Policy ${policy.reference}`);
    await expect(region(page, 'status-and-current-term')).toContainText(policy.status);
  });
});

test.describe('the policy', () => {
  test('WB-2 · the policy view shows the status and current term as the API returns them', async ({ page, api }) => {
    void api;
    const policy = await soldPolicy('W1-VIEW-1');
    await page.goto(route.policy(policy.reference));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Policy ${policy.reference}`);
    const term = region(page, 'status-and-current-term');
    await expect(term, 'the status, in words').toContainText(policy.status);
    await expect(valueOf(term, 'Current term number')).toHaveText(String(policy.currentTermNumber));
    await expect(valueOf(term, 'Start date')).toHaveText(policy.startDate);
    await expect(valueOf(term, 'End date')).toHaveText(policy.endDate);
    await expect(valueOf(term, 'Amount')).toContainText(policy.amount.toFixed(2));
    await expect(valueOf(term, 'Has claims')).toHaveText(String(policy.hasClaims));
    await expect(valueOf(term, 'Auto renew')).toHaveText(String(policy.autoRenew));
  });

  test("WB-2 · the terms timeline shows each term's start and end, as the API returns them", async ({ page, api }) => {
    void api;
    const policy = await soldPolicy('W1-TIME-1');
    await page.goto(route.policy(policy.reference));
    const timeline = region(page, 'terms-timeline-terms-payments-claims-cancellation-dates-the-api-returned-only');
    await expect(timeline, 'the timeline names the policy it dates').toContainText(policy.reference);
    for (const t of policy.terms) {
      await expect(timeline.locator(`time[datetime="${t.startDate}"]`).first(), `term ${t.termNumber} starts`).toHaveText(t.startDate);
      await expect(timeline.locator(`time[datetime="${t.endDate}"]`).first(), `term ${t.termNumber} ends`).toHaveText(t.endDate);
      await expect(timeline, `term ${t.termNumber}'s payment`).toContainText(t.paymentReference);
    }
  });

  test("WB-2 · the policy view shows no date the API didn't return", async ({ page, api }) => {
    void api;
    const policy = await soldPolicy('W1-DATES-1');
    await page.goto(route.policy(policy.reference));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Policy ${policy.reference}`);
    await expect(region(page, 'status-and-current-term')).toContainText(policy.endDate);
    const returned = datesIn(policy);
    const invented = (await datesShown(page)).filter((d) => !returned.has(d));
    expect(invented, 'every date on the view is one the API returned').toEqual([]);
  });

  test('WB-2 · the policy view lists the policyholders and the property as the API returns them', async ({ page, api }) => {
    void api;
    const policy = await soldPolicy('W1-HOLD-1');
    await page.goto(route.policy(policy.reference));
    const people = region(page, 'policyholders-and-property');
    const rows = people.getByRole('table').first().locator('tbody tr');
    await expect(rows, 'one row per policyholder').toHaveCount(policy.policyholders.length);
    for (const [i, h] of policy.policyholders.entries()) {
      await expect(rows.nth(i), `policyholder ${i + 1}, in the API's order`).toContainText(h.firstName);
      await expect(rows.nth(i)).toContainText(h.lastName);
      await expect(rows.nth(i)).toContainText(h.dateOfBirth);
    }
    await expect(valueOf(people, 'Address line 1')).toHaveText(policy.property.addressLine1);
    await expect(valueOf(people, 'Address line 2')).toHaveText(policy.property.addressLine2 ?? '');
    await expect(valueOf(people, 'Address line 3')).toHaveText(policy.property.addressLine3 ?? '');
    await expect(valueOf(people, 'Postcode')).toHaveText(policy.property.postcode);
  });

  test('WB-2 · the policy view lists the payments as the API returns them', async ({ page, api }) => {
    void api;
    const policy = await soldPolicy('W1-PAY-1');
    await page.goto(route.policy(policy.reference));
    const money = region(page, 'payments-and-refunds');
    const payments = money.getByRole('table').first().locator('tbody tr');
    await expect(payments, 'one row per payment').toHaveCount(policy.payments.length);
    for (const [i, p] of policy.payments.entries()) {
      await expect(payments.nth(i)).toContainText(p.reference);
      await expect(payments.nth(i)).toContainText(p.type);
      await expect(payments.nth(i)).toContainText(p.amount.toFixed(2));
    }
  });

  test('WB-2 · a policy with no refunds, claims or cancellation says so, as the API returns it', async ({ page, api }) => {
    void api;
    const policy = await soldPolicy('W1-NONE-1');
    expect(policy.refunds, 'setup: no refunds').toEqual([]);
    expect(policy.claims, 'setup: no claims').toEqual([]);
    expect(policy.cancellation, 'setup: no cancellation').toBeNull();
    await page.goto(route.policy(policy.reference));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Policy ${policy.reference}`);
    await expect(region(page, 'payments-and-refunds'), 'refunds: none returned').toContainText(/no refunds/i);
    await expect(region(page, 'claims'), 'claims: none returned').toContainText(/no claims/i);
    await expect(
      region(page, 'cancellation-summary-from-get-per-term-breakdown-from-the-logged-cancel-response'),
      'cancellation: null',
    ).toContainText(/not been cancelled/i);
  });
});

test.describe('reachable', () => {
  test("WB-2 · reachable: a policy's route answers with the policy view", async ({ page }) => {
    await page.goto(route.policy('W1-ROUTE-1'));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Policy /);
  });
});

test.describe('parity', () => {
  for (const s of [policyStates.populated, policyStates.unreachable, homeStates.populated]) {
    test(`WB-2 · parity: the ${s.label} keeps its reference's regions in order, the unbuilt ones as not built yet`, async ({ page }) => {
      await expectRegionsInOrder(page, s);
    });
  }

  test("WB-2 · parity: the policy view has its reference's title, shell and navigation", async ({ page }) => {
    await expectShell(page, policyStates.populated);
  });

  for (const slug of [
    'status-and-current-term',
    'terms-timeline-terms-payments-claims-cancellation-dates-the-api-returned-only',
    'policyholders-and-property',
    'payments-and-refunds',
    'claims',
    'cancellation-summary-from-get-per-term-breakdown-from-the-logged-cancel-response',
  ]) {
    test(`WB-2 · parity: the policy view's ${slug} region carries its reference's components`, async ({ page }) => {
      await expectRegionComponents(page, policyStates.populated, slug);
    });
  }

  test("WB-2 · parity: the workbench home's open-a-policy-by-reference region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, homeStates.populated, 'open-a-policy-by-reference');
  });

  test('WB-2 · parity: the policy view colours only from tokens, light and dark', async ({ page }) => {
    await expectTokensOnly(page, policyStates.populated);
  });
});
