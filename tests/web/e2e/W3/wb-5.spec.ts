// WB-5 · Claims and renew. Record a claim and see the quote drop to £0; renew inside the window; cheque blocked for
// auto-renew. On the live API (DOCKET_API_PORT): every expected value is what the API answered, read from the
// exchange the page saw, never a figure written here. Renewing inside the window needs a policy eleven months old,
// which the live API (no demo clock, WB-8 cut) can't hold: that side is the client's unit test on the recorded
// answers; here the window's refusal (RENEW-1/2) and the cheque refusal (COULD-3) are driven live.
import type { Locator, Page } from '@playwright/test';
import { expect, live, test } from '../W1/support/api';
import { answerWith, exchangeAt } from '../W1/support/recorded';
import { answered, apiToday, field, hashOf, hold, region, requestOf, route, sellForm, sellThroughApi, watchApi } from '../W1/support/workbench';
import type { Policy } from '../W1/support/workbench';

const unique = (tag: string): string => ('W3' + tag + Date.now().toString(36).toUpperCase()).slice(0, 20);

const recordButton = (page: Page): Locator =>
  page.getByRole('main').getByRole('button', { name: /^(Record this claim|Recording…)$/ });
const renewButton = (page: Page): Locator => page.getByRole('main').getByRole('button', { name: /^(Renew policy|Renewing…)$/ });
const money = (n: number): string => '£' + n.toFixed(2);

interface Quote {
  totalRefund: number;
  ruleApplied: string;
}

test.describe('a claim', () => {
  test('WB-5 · recording a claim posts the claim date and description the person typed', async ({ page, api }) => {
    void api;
    const reference = unique('C');
    const today = await apiToday(unique('P'));
    await sellThroughApi(requestOf(sellForm(reference, { startDate: today })));
    const seen = watchApi(page);
    await page.goto(route.claim(reference));
    await field(page, 'Claim date').fill(today);
    await field(page, 'Claim description').fill('Burst pipe under the kitchen sink');
    await recordButton(page).click();
    const claim = await answered(seen, 'POST', `/api/policies/${reference}/claims`);
    expect(claim.requestBody).toEqual({ claimDate: today, description: 'Burst pipe under the kitchen sink' });
    expect(claim.status).toBe(201);
  });

  test('WB-5 · the quote before the claim and the quote after it are both shown, and the one after is £0.00 under COULD-2', async ({ page, api }) => {
    void api;
    const reference = unique('Q');
    const today = await apiToday(unique('P'));
    await sellThroughApi(requestOf(sellForm(reference, { startDate: today })));
    const seen = watchApi(page);
    await page.goto(route.claim(reference));
    await field(page, 'Claim date').fill(today);
    await recordButton(page).click();
    const quotePath = `/api/policies/${reference}/cancellation-quote`;
    const before = await answered(seen, 'GET', quotePath, 0);
    const after = await answered(seen, 'GET', quotePath, 1);
    const claimAt = seen.findIndex((e) => e.method === 'POST' && e.path === `/api/policies/${reference}/claims`);
    expect(claimAt, 'the claim is sent').toBeGreaterThanOrEqual(0);
    expect(seen.indexOf(before), 'the first quote is asked before the claim').toBeLessThan(claimAt);
    expect(seen.indexOf(after), 'the second quote is asked after the claim').toBeGreaterThan(claimAt);
    const b = before.responseBody as Quote;
    const a = after.responseBody as Quote;
    expect(b.totalRefund, 'setup: the API quotes a refund before the claim').toBeGreaterThan(0);
    expect(a.totalRefund).toBe(0);
    const quotes = region(page, 'refund-before-and-after-the-claim-two-quotes');
    await expect(quotes).toContainText(money(b.totalRefund), live);
    await expect(quotes).toContainText(money(a.totalRefund), live);
    const chip = quotes.getByRole('link', { name: a.ruleApplied, exact: true });
    await expect(chip).toBeVisible();
    expect(await hashOf(chip)).toBe(`#/rules/${a.ruleApplied}`);
  });

  test('WB-5 · a claim dated tomorrow is refused, and the page shows the rule the API answered as a chip', async ({ page, api }) => {
    void api;
    const reference = unique('T');
    const today = await apiToday(unique('P'));
    await sellThroughApi(requestOf(sellForm(reference, { startDate: today })));
    const tomorrow = new Date(today + 'T00:00:00Z');
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const seen = watchApi(page);
    await page.goto(route.claim(reference));
    await field(page, 'Claim date').fill(tomorrow.toISOString().slice(0, 10));
    await recordButton(page).click();
    const claim = await answered(seen, 'POST', `/api/policies/${reference}/claims`);
    expect(claim.status).toBe(422);
    const ruleId = (claim.responseBody as { ruleId: string }).ruleId;
    await expect(page.getByRole('main').getByRole('link', { name: ruleId, exact: true }).first()).toBeVisible(live);
  });
});

// QA note 3a (AC3; g4-defects section 3: "wb-claim's description … ha[s] no <label>"): an aria-label alone is the
// defect. The visible words are the text area's <label>, so clicking them puts the focus in it. The read is answered
// with the recorded one (070, F3-MVFJRDH152): this is about the form, not the API.
test('WB-5 · the claim description text area has a visible <label> that focuses it', async ({ page }) => {
  const read = exchangeAt('070-could-2-claim-dated-today-201.json', 2);
  await answerWith(page, read);
  await page.goto(route.claim(read.path.split('/')[2] ?? ''));
  const description = page.getByRole('main').locator('textarea');
  await expect(description, 'setup: the claim form has its one text area').toHaveCount(1, live);
  const labels = await description.evaluate((el) => [...((el as HTMLTextAreaElement).labels ?? [])].map((l) => l.textContent?.trim()));
  expect(labels, 'the text area has one <label>, reading Claim description').toEqual(['Claim description']);
  await page.getByRole('main').locator('label', { hasText: /^Claim description$/ }).click();
  await expect(description).toBeFocused();
});

// QA finding (orchestrator, round A2): W3 builds the claim and renew screens, so the policy view no longer calls
// them not built and reaches both for its own policy. The read is the recorded read-back (045, F2-MVFJQA9DQG, no claims).
test('WB-5 · the policy view no longer calls claim or renew not built, and links to both for its policy', async ({ page }) => {
  const read = exchangeAt('045-get-1-sold-policy-reads-back-in-full-200.json', 1);
  const reference = (read.responseBody as Policy).reference;
  await answerWith(page, read);
  await page.goto(route.policy(reference));
  const main = page.getByRole('main');
  await expect(main, 'setup: the read has landed').toContainText(`The API returned no claims for ${reference}.`, live);
  const sentences = (await main.innerText()).split(/(?<=[.:])\s+|\n+/);
  const notBuilt = sentences.filter((s) => /not built yet/i.test(s) && /\b(claims?|renew(al|s)?)\b/i.test(s));
  expect(notBuilt, 'no claim or renew text says not built yet').toEqual([]);
  await expect(main.locator(`a[href="${route.claim(reference).slice(1)}"]`).first(), 'a link to record a claim on this policy').toBeVisible();
  await expect(main.locator(`a[href="${route.renew(reference).slice(1)}"]`).first(), 'a link to renew this policy').toBeVisible();
});

test.describe('a renewal', () => {
  test('WB-5 · the renew form shows the current term amount and payment method as its defaults', async ({ page, api }) => {
    void api;
    // A2/I2: DirectDebit is neither the form's first-paint value nor any fallback, so only a screen that reads the
    // current term's payment can show it. A literal reference: the e2e API starts on a fresh database each run.
    const reference = 'W3RENEWDD0001';
    const policy = await sellThroughApi(requestOf(sellForm(reference, { paymentMethod: 'DirectDebit', autoRenew: true, amount: '611.42' })));
    expect(policy.payments.map((p) => p.type), 'setup: the API took the sale paid by DirectDebit').toEqual(['DirectDebit']);
    const seen = watchApi(page);
    await page.goto(route.renew(reference));
    await answered(seen, 'GET', `/api/policies/${reference}`);
    await expect(renewButton(page), 'the read has landed on the screen').toBeEnabled(live);
    await expect(field(page, 'Renewal amount')).toHaveValue(policy.amount.toFixed(2), live);
    await expect(field(page, 'Payment method')).toHaveValue('DirectDebit');
    await renewButton(page).click();
    const renewal = await answered(seen, 'POST', `/api/policies/${reference}/renewals`);
    expect(renewal.requestBody).toEqual({ amount: policy.amount, paymentMethod: 'DirectDebit' });
  });

  test('WB-5 · a policy not on auto-renew has no payment method field, and its renewal sends none', async ({ page, api }) => {
    void api;
    const reference = unique('O');
    await sellThroughApi(requestOf(sellForm(reference, { autoRenew: false })));
    const seen = watchApi(page);
    await page.goto(route.renew(reference));
    await expect(field(page, 'Renewal amount')).toBeVisible(live);
    await expect(field(page, 'Payment method')).toHaveCount(0);
    await field(page, 'Renewal amount').fill('544.10');
    await renewButton(page).click();
    const renewal = await answered(seen, 'POST', `/api/policies/${reference}/renewals`);
    expect(renewal.requestBody).toEqual({ amount: 544.1 });
  });

  test('WB-5 · an amount typed before the policy read answers is kept, and the renewal sends it, not the term default', async ({ page, api }) => {
    void api;
    const reference = unique('H');
    const policy = await sellThroughApi(requestOf(sellForm(reference, { autoRenew: false, amount: '527.18' })));
    expect(policy.amount.toFixed(2), 'setup: the default differs from what the person types').not.toBe('472.30');
    const readPath = `/api/policies/${reference}`;
    const read = await hold(page, 'GET', readPath);
    const seen = watchApi(page);
    await page.goto(route.renew(reference));
    await expect.poll(() => read.count(), { message: 'the page asks for the policy', ...live }).toBeGreaterThan(0);
    const amount = field(page, 'Renewal amount');
    // A screen may instead hold the field until the read answers; then the person types once it has.
    const typedEarly = await amount.isEditable();
    if (typedEarly) await amount.fill('472.30');
    read.release();
    await answered(seen, 'GET', readPath);
    await expect(renewButton(page), 'the read has landed on the screen').toBeEnabled(live);
    if (!typedEarly) await amount.fill('472.30');
    await expect(amount).toHaveValue('472.30');
    await renewButton(page).click();
    const renewal = await answered(seen, 'POST', `/api/policies/${reference}/renewals`);
    expect(renewal.requestBody).toEqual({ amount: 472.3 });
  });

  test('WB-5 · cheque on an auto-renewing policy is refused, and the page shows the COULD-3 violation as a rule chip', async ({ page, api }) => {
    void api;
    const reference = unique('K');
    await sellThroughApi(requestOf(sellForm(reference, { autoRenew: true })));
    const seen = watchApi(page);
    await page.goto(route.renew(reference));
    await field(page, 'Renewal amount').fill('472.30');
    await field(page, 'Payment method').selectOption('Cheque');
    await renewButton(page).click();
    const renewal = await answered(seen, 'POST', `/api/policies/${reference}/renewals`);
    expect(renewal.requestBody).toEqual({ amount: 472.3, paymentMethod: 'Cheque' });
    expect(renewal.status).toBe(422);
    const violations = (renewal.responseBody as { violations: { ruleId: string }[] }).violations.map((v) => v.ruleId);
    expect(violations, 'setup: the API refuses cheque under COULD-3').toContain('COULD-3');
    const chip = page.getByRole('main').getByRole('link', { name: 'COULD-3', exact: true }).first();
    await expect(chip).toBeVisible(live);
    expect(await hashOf(chip)).toBe('#/rules/COULD-3');
  });

  test("WB-5 · a renewal outside the window shows RENEW-1/2 with the window the API's detail names", async ({ page, api }) => {
    void api;
    const reference = unique('W');
    await sellThroughApi(requestOf(sellForm(reference)));
    const seen = watchApi(page);
    await page.goto(route.renew(reference));
    await field(page, 'Renewal amount').fill('501.99');
    await renewButton(page).click();
    const renewal = await answered(seen, 'POST', `/api/policies/${reference}/renewals`);
    expect(renewal.status).toBe(422);
    const body = renewal.responseBody as { detail: string; violations?: { ruleId: string; detail: string }[] };
    const window = (body.violations ?? []).find((v) => v.ruleId === 'RENEW-1/2')?.detail ?? body.detail;
    await expect(page.getByRole('main')).toContainText(window, live);
  });

  // A2/I1: the accepted renewal, drawn by the screen. The live API can't hold a policy inside its window (no demo
  // clock), so the page's two requests are answered through page.route: the read with the recorded read-back (045,
  // F2-MVFJQA9DQG, auto-renew off), the renewal with a 201 built from it plus a second term on the fake-clock test's
  // values (docs/ui/fixture/api/fake-clock/Renewal_30_days_before_the_end_is_accepted.txt: 446.83, Card). Built here,
  // not live. Its new term's dates appear nowhere in the read, so only a screen that draws the 201 body can show them.
  test("WB-5 · a renewal inside the window is accepted, and the page draws the 201 body's new term last on the timeline", async ({ page }) => {
    const read = exchangeAt('045-get-1-sold-policy-reads-back-in-full-200.json', 1);
    const before = read.responseBody as Policy;
    const reference = before.reference;
    const newTerm = { termNumber: 2, startDate: '2027-11-18', endDate: '2028-11-17', amount: 446.83, paymentReference: 'PAY-W3-NOT-LIVE-TERM-2' };
    const renewed: Policy = {
      ...before,
      terms: [...before.terms, newTerm],
      payments: [...before.payments, { reference: newTerm.paymentReference, type: 'Card', amount: 446.83 }],
    };
    expect(JSON.stringify(before), "setup: the new term's dates are not in the read").not.toMatch(/2027-11-18|2028-11-17/);
    await answerWith(page, read);
    const posted: unknown[] = [];
    await page.route(
      (url) => url.pathname === `/api/policies/${reference}/renewals`,
      (handled) => {
        if (handled.request().method() !== 'POST') return handled.fallback();
        posted.push(handled.request().postDataJSON());
        return handled.fulfill({ status: 201, contentType: 'application/json; charset=utf-8', body: JSON.stringify(renewed) });
      },
    );
    await page.goto(route.renew(reference));
    await expect(renewButton(page), 'the read has landed on the screen').toBeEnabled(live);
    await field(page, 'Renewal amount').fill('446.83');
    await renewButton(page).click();
    await expect.poll(() => posted.length, { message: 'the page sends the renewal', ...live }).toBe(1);
    expect(posted[0]).toEqual({ amount: 446.83 });
    await expect(page.getByRole('main')).toContainText('Renewed. The policy now has 2 terms, the new one last.', live);
    const rungs = region(page, 'the-new-term-last-on-the-timeline').locator('li:not([data-kind="gap"])');
    await expect(rungs.last()).toContainText('Term 2 ends', live);
    await expect(rungs.last()).toContainText(newTerm.endDate);
    await expect(rungs.nth(-2)).toContainText('Term 2 starts');
    await expect(rungs.nth(-2)).toContainText(newTerm.startDate);
  });
});
