// WB-6 · Send it anyway. A switch that turns off client-side validation, so the API's own violations can be
// shown. Each case is tried on both sides of the switch: off, the form's own check stops the request before it
// leaves; on, the body goes to the live API as typed, and the page shows what the API answered. Parity on the
// recorded SELL-1 (003) and the sent-anyway 422 (021), against docs/ui/derived/W1/wb-sell/.
import { expect, test } from './support/api';
import { expectRegionComponents, sellStates } from './support/parity';
import {
  ADA,
  BARBARA,
  EDSGER,
  PAST_START,
  RADIA,
  addHolder,
  answered,
  errorSummary,
  field,
  fillSell,
  holder,
  requestOf,
  sell,
  sellButton,
  sellForm,
  sendAnywaySwitch,
  sent,
  watchApi,
} from './support/workbench';
import type { Page } from '@playwright/test';
import type { Exchange, Policy, Problem } from './support/workbench';

/** After pressing Sell with a value the form's checks catch: the field is marked, and no request has left. */
async function expectCaughtOnTheForm(page: Page, seen: Exchange[], label: string): Promise<void> {
  const input = field(page, label);
  await expect(input, `the form marks the ${label.toLowerCase()}`).toHaveAttribute('aria-invalid', 'true');
  // The check has run by now; a request it let through would have been sent by the same press.
  await expect(sellButton(page), 'the form is ready again').toBeEnabled();
  expect(sent(seen, 'POST', '/api/policies'), 'nothing is sent').toEqual([]);
}

test.describe('a start date outside the sale window', () => {
  test("WB-6 · with send anyway off, the form's own check catches it and nothing is sent", async ({ page }) => {
    const seen = watchApi(page);
    await sell(page, sellForm('W1-SA-OFF-1', { startDate: PAST_START }));
    await expectCaughtOnTheForm(page, seen, 'Start date');
  });

  test("WB-6 · with send anyway on, it is sent as typed, and the API's own violation is shown", async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    await sell(page, sellForm('W1-SA-ON-1', { startDate: PAST_START }), { sendAnyway: true });
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect((exchange.requestBody as { startDate?: unknown }).startDate, 'the start date as typed').toBe(PAST_START);
    expect(exchange.status, 'the API answers for itself').toBe(422);
    const violation = (exchange.responseBody as Problem).violations?.[0];
    expect(violation, 'the API names the rule').toBeDefined();
    await expect(errorSummary(page), "the API's words").toContainText(violation?.detail ?? '');
    await expect(errorSummary(page).getByRole('link', { name: violation?.ruleId ?? '', exact: true })).toBeVisible();
  });

  test("WB-6 · turning send anyway off again puts the form's checks back", async ({ page }) => {
    const seen = watchApi(page);
    await fillSell(page, sellForm('W1-SA-BACK-1', { startDate: PAST_START }), { sendAnyway: true });
    await sendAnywaySwitch(page).setChecked(false);
    await sellButton(page).click();
    await expectCaughtOnTheForm(page, seen, 'Start date');
  });
});

test.describe('a reference that breaks the pattern', () => {
  test("WB-6 · with send anyway off, the form's own check catches it and nothing is sent", async ({ page }) => {
    const seen = watchApi(page);
    await sell(page, sellForm('w1_bad_1'));
    await expectCaughtOnTheForm(page, seen, 'Policy reference');
  });

  test("WB-6 · with send anyway on, it is sent exactly as typed, and the API's 400 is shown", async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    await sell(page, sellForm('w1_bad_2'), { sendAnyway: true });
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect((exchange.requestBody as { reference?: unknown }).reference, 'the reference as typed').toBe('w1_bad_2');
    expect(exchange.status, 'the API answers for itself').toBe(400);
    const errors = (exchange.responseBody as Problem).errors ?? {};
    const message = Object.values(errors)[0]?.[0] ?? '';
    expect(message, 'the API says what is wrong').not.toBe('');
    await expect(errorSummary(page), "the API's words").toContainText(message);
  });

  test('WB-6 · with send anyway on, a reference with spaces and lower case is sent as typed, and stored as the API normalises it', async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    await sell(page, sellForm('  w1-raw-1 '), { sendAnyway: true });
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect((exchange.requestBody as { reference?: unknown }).reference, 'spaces and case kept').toBe('  w1-raw-1 ');
    expect(exchange.status, 'the API accepts it').toBe(201);
    const stored = (exchange.responseBody as Policy).reference;
    await expect(page.getByRole('main').getByRole('link', { name: `Open policy ${stored}` }), 'the page shows what the API stored').toBeVisible();
  });
});

test.describe('a fourth policyholder', () => {
  test('WB-6 · with send anyway off, the form stops at three policyholders', async ({ page }) => {
    await fillSell(page, sellForm('W1-SA-FOUR-1', { policyholders: [ADA, EDSGER, BARBARA] }));
    await expect(addHolder(page), 'no fourth with the checks on').toHaveCount(0);
  });

  test("WB-6 · with send anyway on, a fourth can be added and is sent, and the API's own violation is shown", async ({ page, api }) => {
    void api;
    const seen = watchApi(page);
    const form = sellForm('W1-SA-FOUR-2', { policyholders: [ADA, EDSGER, BARBARA, RADIA] });
    await fillSell(page, form, { sendAnyway: true });
    await expect(holder(page, 4).getByLabel('First name', { exact: true }), 'the fourth has its own fields').toHaveValue(RADIA.firstName);
    await sellButton(page).click();
    const exchange = await answered(seen, 'POST', '/api/policies');
    expect((exchange.requestBody as { policyholders?: unknown }).policyholders, 'all four are sent').toEqual(requestOf(form).policyholders);
    expect(exchange.status, 'the API answers for itself').toBe(422);
    const violations = (exchange.responseBody as Problem).violations ?? [];
    expect(violations.length, 'the API names the rule').toBeGreaterThan(0);
    for (const v of violations) {
      await expect(errorSummary(page), `${v.ruleId}, in the API's words`).toContainText(v.detail);
    }
  });
});

test.describe('parity', () => {
  test("WB-6 · parity: the sell form's send anyway switch carries its reference's components, off", async ({ page }) => {
    await expectRegionComponents(page, sellStates.populated, 'send-it-anyway-client-checks-off');
  });

  test("WB-6 · parity: the sell form's send anyway switch carries its reference's components, on with the API's answer", async ({ page }) => {
    await expectRegionComponents(page, sellStates.error, 'send-it-anyway-client-checks-off');
  });
});
