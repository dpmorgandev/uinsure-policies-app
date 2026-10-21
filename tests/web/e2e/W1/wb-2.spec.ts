// WB-2 · Policy view. By reference: status, current term, terms timeline (the dates the API returns; no window is
// shaded or computed), holders, property, payments, refunds, claims. Each test sells its own policy straight
// through the live API (setup), then reads what the view shows against the API's own GET of it. Parity on the
// recorded GET-1 exchanges, against docs/ui/derived/W1/wb-policy/ and wb-home/.
import { expect, live, test } from './support/api';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, homeStates, policyStates } from './support/parity';
import {
  ADA,
  EDSGER,
  apiToday,
  askApi,
  cancelThroughApi,
  claimThroughApi,
  datesIn,
  datesShown,
  field,
  openFromHome,
  readThroughApi,
  region,
  relay,
  requestOf,
  route,
  sellForm,
  sellThroughApi,
  valueOf,
} from './support/workbench';
import type { Policy, Problem } from './support/workbench';

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
    await expect(page).toHaveURL(new RegExp(`#/workbench/policies/${policy.reference}$`), live);
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
    await expect(term, 'the status, in words').toContainText(policy.status, live);
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
    await expect(timeline, 'the timeline names the policy it dates').toContainText(policy.reference, live);
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
    await expect(region(page, 'status-and-current-term')).toContainText(policy.endDate, live);
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
    await expect(rows, 'one row per policyholder').toHaveCount(policy.policyholders.length, live);
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
    await expect(payments, 'one row per payment').toHaveCount(policy.payments.length, live);
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
    await expect(region(page, 'payments-and-refunds'), 'refunds: none returned').toContainText(/no refunds/i, live);
    await expect(region(page, 'claims'), 'claims: none returned').toContainText(/no claims/i);
    await expect(
      region(page, 'cancellation-summary-from-get-per-term-breakdown-from-the-logged-cancel-response'),
      'cancellation: null',
    ).toContainText(/not been cancelled/i);
  });
});

/** The policy view's terms timeline. */
const TIMELINE = 'terms-timeline-terms-payments-claims-cancellation-dates-the-api-returned-only';
const CANCELLATION = 'cancellation-summary-from-get-per-term-breakdown-from-the-logged-cancel-response';

/**
 * Sells `reference` to start in 30 days and cancels it through its cancellation endpoint today, before its start
 * (CANCEL-1a), so the API refunds the payment in full. Returns the policy as the API's GET then answers it.
 */
async function cancelledPolicy(reference: string): Promise<Policy> {
  await sellThroughApi(requestOf(sellForm(reference, { policyholders: [ADA, EDSGER] })));
  await cancelThroughApi(reference);
  const read = await readThroughApi(reference);
  expect(read.status, `setup: the API reads ${reference} back`).toBe(200);
  const policy = read.body as Policy;
  expect(policy.cancellation, 'setup: the API reports a cancellation').not.toBeNull();
  expect(policy.cancellation?.totalRefund ?? 0, 'setup: the API refunds more than 0').toBeGreaterThan(0);
  expect(policy.refunds.length, 'setup: the API lists a refund').toBeGreaterThan(0);
  return policy;
}

/**
 * Sells `reference` to start on the API's today and records a claim on it that day (COULD-2: a claim falls inside
 * the term and on or before today). Returns the policy as the API's GET then answers it.
 */
async function claimedPolicy(reference: string, probeReference: string): Promise<Policy> {
  const today = await apiToday(probeReference);
  await sellThroughApi(requestOf(sellForm(reference, { startDate: today })));
  await claimThroughApi(reference, { claimDate: today, description: 'Escape of water from the boiler' });
  const read = await readThroughApi(reference);
  expect(read.status, `setup: the API reads ${reference} back`).toBe(200);
  const policy = read.body as Policy;
  expect(policy.claims.length, 'setup: the API lists a claim').toBeGreaterThan(0);
  return policy;
}

// inv-006 I3: the refund, claim and cancellation sections and rungs, populated, read against the API's own GET.
test.describe('a policy with refunds, claims and a cancellation', () => {
  test("WB-2 · a cancelled policy's refunds are listed one row each, with the API's reference, type, amount and payment reference", async ({ page, api }) => {
    void api;
    const policy = await cancelledPolicy('W1-REFUND-1');
    await page.goto(route.policy(policy.reference));
    const refunds = region(page, 'payments-and-refunds').getByRole('table', { name: /^Refunds on / }).locator('tbody tr');
    await expect(refunds, 'one row per refund').toHaveCount(policy.refunds.length, live);
    for (const [i, r] of policy.refunds.entries()) {
      await expect(refunds.nth(i), `refund ${i + 1}, in the API's order`).toContainText(r.reference);
      await expect(refunds.nth(i)).toContainText(r.type);
      await expect(refunds.nth(i)).toContainText(r.amount.toFixed(2));
      await expect(refunds.nth(i)).toContainText(r.paymentReference);
    }
  });

  test("WB-2 · a cancelled policy's cancellation summary shows the API's cancellationDate, ruleApplied and totalRefund", async ({ page, api }) => {
    void api;
    const policy = await cancelledPolicy('W1-CANCEL-1');
    const cancellation = policy.cancellation as NonNullable<Policy['cancellation']>;
    await page.goto(route.policy(policy.reference));
    const summary = region(page, CANCELLATION);
    await expect(valueOf(summary, 'Cancellation date')).toHaveText(cancellation.cancellationDate, live);
    await expect(valueOf(summary, 'Rule applied')).toHaveText(cancellation.ruleApplied);
    await expect(valueOf(summary, 'Total refund')).toContainText(cancellation.totalRefund.toFixed(2));
  });

  test("WB-2 · a cancelled policy's timeline has a rung dated at the API's cancellationDate", async ({ page, api }) => {
    void api;
    const policy = await cancelledPolicy('W1-CANRUNG-1');
    const date = (policy.cancellation as NonNullable<Policy['cancellation']>).cancellationDate;
    await page.goto(route.policy(policy.reference));
    const timeline = region(page, TIMELINE);
    const rung = timeline
      .getByRole('listitem')
      .filter({ hasText: 'Cancelled' })
      .filter({ has: page.locator(`time[datetime="${date}"]`) });
    await expect(rung, 'one cancellation rung, dated as the API dated it').toHaveCount(1, live);
    await expect(rung.locator(`time[datetime="${date}"]`)).toHaveText(date);
  });

  test("WB-2 · a policy's claims are listed one row each, with the API's reference, claimDate and description", async ({ page, api }) => {
    void api;
    const policy = await claimedPolicy('W1-CLAIM-1', 'W1-CLAIM-1-T');
    await page.goto(route.policy(policy.reference));
    const claims = region(page, 'claims').getByRole('table').locator('tbody tr');
    await expect(claims, 'one row per claim').toHaveCount(policy.claims.length, live);
    for (const [i, c] of policy.claims.entries()) {
      await expect(claims.nth(i), `claim ${i + 1}, in the API's order`).toContainText(c.reference);
      await expect(claims.nth(i)).toContainText(c.claimDate);
      await expect(claims.nth(i)).toContainText(c.description ?? '');
    }
  });

  test("WB-2 · a policy's timeline has a rung dated at each of the API's claimDates", async ({ page, api }) => {
    void api;
    const policy = await claimedPolicy('W1-CLMRUNG-1', 'W1-CLMRUNG-1-T');
    await page.goto(route.policy(policy.reference));
    const timeline = region(page, TIMELINE);
    const claimRungs = timeline.getByRole('listitem').filter({ hasText: 'Claim recorded' });
    await expect(claimRungs, 'one rung per claim').toHaveCount(policy.claims.length, live);
    for (const c of policy.claims) {
      const rung = claimRungs.filter({ hasText: c.reference });
      await expect(rung.locator(`time[datetime="${c.claimDate}"]`), `claim ${c.reference}'s rung`).toHaveText(c.claimDate);
    }
  });
});

// inv-006 I5: the view words a policy it couldn't read from the problem the API returned, not as "not found".
test.describe('a problem that is not a 404', () => {
  test("WB-2 · a policy view the API answers 400 shows the API's 400, and never says the policy was not found", async ({ page, api }) => {
    void api;
    const policy = await soldPolicy('W1-BAD-1');
    // The API reads a reference that fails SELL-1's pattern as a 404 (GET-1, recorded in 055), so no reference the
    // view can be opened on draws a 400 from it, and the view's own GET can't carry a query parameter (the reference
    // is one encoded path segment). So the live API is asked for this policy with an unknown query parameter, and
    // its 400 is relayed to the page's GET as it came.
    const refused = await askApi(`/policies/${policy.reference}?colour=red`);
    expect(refused.status, 'setup: the API refuses an unknown query parameter').toBe(400);
    const problem = JSON.parse(refused.text) as Problem;
    const message = Object.values(problem.errors ?? {})[0]?.[0] ?? '';
    expect(message, "setup: the API's 400 names a message").not.toBe('');
    await relay(page, `/api/policies/${policy.reference}`, refused);
    await page.goto(route.policy(policy.reference));
    const main = page.getByRole('main');
    await expect(main, "the API's message").toContainText(message, live);
    await expect(region(page, 'status-and-current-term'), "the API's status").toContainText('400');
    await expect(main, 'the API said 400, not that the policy was not found').not.toContainText(/not found/i);
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
