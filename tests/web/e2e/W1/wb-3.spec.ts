// WB-3 · Problem details. Every 400/404/409/422 rendered from its ProblemDetails, each violation as a rule chip
// that links to RULE-1 for that rule. Each problem is the live API's own answer to what the test sent (send
// anyway on, so the form's checks don't stop it first), and every expected title, detail and rule is read from
// that answer. Parity on the recorded 422 (021) and 404 (053), against docs/ui/derived/W1/.
import { expect, live, test } from './support/api';
import { expectRegionComponents, expectRegionsInOrder, policyStates, sellStates } from './support/parity';
import {
  PAST_START,
  answered,
  datesShown,
  errorSummary,
  field,
  hashOf,
  readThroughApi,
  requestOf,
  route,
  sell,
  sellForm,
  sellThroughApi,
  watchApi,
} from './support/workbench';
import type { Page } from '@playwright/test';
import type { Exchange, Problem } from './support/workbench';

/** Sends a sale the API refuses under SELL-2 and SELL-7 (a past start, amount 0), and returns its 422. */
async function refusedSale(page: Page, reference: string): Promise<Problem> {
  const seen = watchApi(page);
  await sell(page, sellForm(reference, { startDate: PAST_START, amount: '0' }), { sendAnyway: true });
  const exchange = await answered(seen, 'POST', '/api/policies');
  expect(exchange.status, 'the API refuses the sale').toBe(422);
  const problem = exchange.responseBody as Problem;
  expect(problem.violations?.length ?? 0, 'the API names more than one broken rule').toBeGreaterThan(1);
  return problem;
}

/**
 * Sends a sale with the start date left empty (send anyway on), and returns the API's 400 and its first message
 * for the start date, under whichever key the API names it by (startDate, or $.startDate for a value it can't read).
 */
async function shapeRefused(page: Page, reference: string): Promise<{ exchange: Exchange; message: string }> {
  const seen = watchApi(page);
  await sell(page, sellForm(reference, { startDate: '' }), { sendAnyway: true });
  const exchange = await answered(seen, 'POST', '/api/policies');
  expect(exchange.status, 'the API answers 400').toBe(400);
  const errors = (exchange.responseBody as Problem).errors ?? {};
  const key = Object.keys(errors).find((k) => /(^|\.)startDate$/.test(k));
  expect(key, `the API names the start date field among ${Object.keys(errors).join(', ')}`).toBeDefined();
  const message = errors[key ?? '']?.[0] ?? '';
  expect(message, 'with a message').not.toBe('');
  return { exchange, message };
}

const escaped = (text: string): RegExp => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

test.describe('422', () => {
  test('WB-3 · a 422 lists every violation the API returned, in its order, each with its detail and rule', async ({ page, api }) => {
    void api;
    const problem = await refusedSale(page, 'W1-422-1');
    const items = errorSummary(page).getByRole('listitem');
    const violations = problem.violations ?? [];
    await expect(items, 'one entry per violation').toHaveCount(violations.length);
    for (const [i, v] of violations.entries()) {
      await expect(items.nth(i), `violation ${i + 1}, as the API wrote it`).toContainText(v.detail);
      await expect(items.nth(i).getByRole('link', { name: v.ruleId, exact: true }), `violation ${i + 1}'s rule chip`).toBeVisible();
    }
  });

  test("WB-3 · each violation's rule chip links to that rule's page", async ({ page, api }) => {
    void api;
    const problem = await refusedSale(page, 'W1-422-2');
    const violations = problem.violations ?? [];
    for (const v of violations) {
      const chip = errorSummary(page).getByRole('link', { name: v.ruleId, exact: true });
      await expect(chip, `the ${v.ruleId} chip`).toBeVisible();
      expect(await hashOf(chip), `the ${v.ruleId} chip opens /rules/${v.ruleId}`).toBe(`#/rules/${v.ruleId}`);
    }
    const first = violations[0]?.ruleId ?? '';
    await errorSummary(page).getByRole('link', { name: first, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#/rules/${first}$`));
  });

  test('WB-3 · a violation the API names no field for is listed for the whole request, and no field is marked', async ({ page, api }) => {
    void api;
    const problem = await refusedSale(page, 'W1-422-3');
    const items = errorSummary(page).getByRole('listitem');
    await expect(items).toHaveCount(problem.violations?.length ?? 0);
    for (let i = 0; i < (problem.violations?.length ?? 0); i += 1) {
      await expect(items.nth(i), 'listed, not placed').toContainText('whole request');
    }
    await expect(page.getByRole('main').locator('[aria-invalid="true"]'), 'no field carries a violation it was not given').toHaveCount(0);
  });
});

test.describe('400', () => {
  test("WB-3 · a 400 lists the API's message for its field, and the entry takes focus to that field", async ({ page, api }) => {
    void api;
    const { message } = await shapeRefused(page, 'W1-400-1');
    const entry = errorSummary(page).getByRole('link', { name: message });
    await expect(entry, "the API's message, as a link to its field").toBeVisible();
    await entry.click();
    await expect(field(page, 'Start date'), 'the entry takes focus to the start date').toBeFocused();
    await expect(page, 'and stays on the sell form').toHaveURL(/#\/workbench\/sell$/);
  });

  test("WB-3 · a 400's field error sits beside its own field, and no field holding a value carries one", async ({ page, api }) => {
    void api;
    const { message } = await shapeRefused(page, 'W1-400-2');
    const start = field(page, 'Start date');
    await expect(start, 'the start date is marked').toHaveAttribute('aria-invalid', 'true');
    await expect(start, 'and described by the API message').toHaveAccessibleDescription(escaped(message));
    await expect(start, 'the field the error is about is the empty one').toHaveValue('');
    const marked = page.getByRole('main').locator('input[aria-invalid="true"], select[aria-invalid="true"]');
    await expect(marked, 'only the start date is marked').toHaveCount(1);
  });

  test('WB-3 · once the field is fixed and the sale goes through, no field carries an error', async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    const form = sellForm('W1-400-3');
    await sell(page, { ...form, startDate: '' }, { sendAnyway: true });
    const first = await answered(seen, 'POST', '/api/policies');
    expect(first.status, 'the API answers 400 without a start date').toBe(400);
    await expect(field(page, 'Start date')).toHaveAttribute('aria-invalid', 'true');
    await field(page, 'Start date').fill(form.startDate);
    await page.getByRole('main').getByRole('button', { name: 'Sell this policy' }).click();
    const second = await answered(seen, 'POST', '/api/policies', 1);
    expect(second.status, 'the API accepts the fixed sale').toBe(201);
    await expect(page.getByRole('main').getByRole('link', { name: 'Open policy W1-400-3' })).toBeVisible();
    await expect(page.getByRole('main').locator('[aria-invalid="true"]'), 'no field carries an error').toHaveCount(0);
    await expect(errorSummary(page), 'and no problem is listed').toHaveCount(0);
  });
});

test.describe('409', () => {
  test("WB-3 · a 409 shows the API's title and detail, with a SELL-1 rule chip", async ({ page, api }) => {
    void api;
    await sellThroughApi(requestOf(sellForm('W1-DUP-1')));
    const seen = watchApi(page);
    await sell(page, sellForm('w1-dup-1'));
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect(exchange.status, 'the API refuses a duplicate reference').toBe(409);
    const problem = exchange.responseBody as Problem;
    const main = page.getByRole('main');
    await expect(main, "the API's title").toContainText(problem.title ?? '');
    await expect(main, "the API's detail").toContainText(problem.detail ?? '');
    const chip = main.getByRole('link', { name: problem.ruleId ?? '', exact: true });
    await expect(chip, "the problem's rule chip").toBeVisible();
    expect(await hashOf(chip.first())).toBe(`#/rules/${problem.ruleId ?? ''}`);
  });
});

test.describe('404', () => {
  test("WB-3 · a 404 on the policy view shows the API's title, status and detail, with a GET-1 rule chip", async ({ page, api }) => {
    void api;
    const read = await readThroughApi('W1-NO-SUCH-1');
    expect(read.status, 'setup: the API has no such policy').toBe(404);
    const problem = read.body as Problem;
    await page.goto(route.policy('W1-NO-SUCH-1'));
    const banner = page.getByRole('main').getByRole('alert').filter({ hasText: problem.title ?? '' });
    await expect(banner, "the API's title").toBeVisible(live);
    await expect(banner, 'its status').toContainText(String(problem.status));
    await expect(banner, "the API's detail").toContainText(problem.detail ?? '');
    const chip = banner.getByRole('link', { name: problem.ruleId ?? '', exact: true });
    await expect(chip, "the problem's rule chip").toBeVisible();
    expect(await hashOf(chip)).toBe(`#/rules/${problem.ruleId ?? ''}`);
  });

  test('WB-3 · a 404 policy view shows no status, date or amount', async ({ page, api }) => {
    void api;
    const read = await readThroughApi('W1-NO-SUCH-2');
    expect(read.status, 'setup: the API has no such policy').toBe(404);
    await page.goto(route.policy('W1-NO-SUCH-2'));
    await expect(page.getByRole('main').getByRole('alert').filter({ hasText: (read.body as Problem).title ?? '' })).toBeVisible(live);
    expect(await datesShown(page), 'no date: none was returned').toEqual([]);
    await expect(page.getByRole('main'), 'no status: none was returned').not.toContainText(/\b(Pending|Active|Cancelled|Expired)\b/);
  });
});

test.describe('parity', () => {
  for (const s of [sellStates.error, policyStates.error]) {
    test(`WB-3 · parity: the ${s.label} keeps its reference's regions in order, the unbuilt ones as not built yet`, async ({ page }) => {
      await expectRegionsInOrder(page, s);
    });
  }

  test("WB-3 · parity: the sell form's error summary, after a 422, carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, sellStates.error, 'error-summary-every-problem-each-linked-to-its-field-and-its-rule');
  });

  test("WB-3 · parity: the policy view's record-level problem banner, after a 404, carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, policyStates.error, 'record-level-problem-banner-404-409');
  });
});
