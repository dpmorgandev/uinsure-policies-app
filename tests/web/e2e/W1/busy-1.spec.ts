// BUSY-1 · A running action shows it. The control that started a request shows a spinner and is disabled while
// it runs, so it can't be fired twice; its label says what is happening; aria-busy and aria-disabled are set; the
// form keeps its values; when the request ends, the control re-enables and the result or problem appears.
// Each request is held in flight by the test (support/workbench.ts `hold`), then let through to the live API.
// A wait for a held request to arrive, or for the API's answer once it is let go, has the live API's timeout
// (support/api.ts `live`): a worker's first request can take longer than expect's default to come through.
// Parity on the recorded states, against docs/ui/derived/W1/wb-sell/ and wb-home/.
import { expect, live, test } from './support/api';
import { expectRegionComponents, expectRegionsInOrder, homeStates, sellStates } from './support/parity';
import {
  ADA,
  EDSGER,
  field,
  fillSell,
  formValues,
  hold,
  openButton,
  openFromHome,
  requestOf,
  sellButton,
  sellForm,
  sellThroughApi,
  unreachable,
} from './support/workbench';
import type { Locator } from '@playwright/test';

/** BUSY-1's contract on a control, while its process runs. */
async function expectBusy(control: Locator, label: string): Promise<void> {
  await expect(control, `it says what is happening: ${label}`).toHaveText(label);
  await expect(control, 'it is disabled').toBeDisabled();
  await expect(control, 'aria-busy').toHaveAttribute('aria-busy', 'true');
  await expect(control, 'aria-disabled').toHaveAttribute('aria-disabled', 'true');
  await expect(control.locator('[class*="kit-spinner__spinner"]'), 'with the kit spinner').toHaveCount(1);
}

/** BUSY-1's contract on a control once its process has ended. */
async function expectIdle(control: Locator, label: string): Promise<void> {
  await expect(control, `it reads ${label} again`).toHaveText(label);
  await expect(control, 'it is enabled').toBeEnabled();
  await expect(control, 'not aria-busy').not.toHaveAttribute('aria-busy', 'true');
  await expect(control, 'not aria-disabled').not.toHaveAttribute('aria-disabled', 'true');
}

test.describe('selling', () => {
  test('BUSY-1 · while the sale is in flight, Sell shows Selling… with a spinner, disabled, aria-busy and aria-disabled', async ({ page, api }) => {
    void api;
    const held = await hold(page, 'POST', '/api/policies');
    await fillSell(page, sellForm('W1-BUSY-1'));
    await sellButton(page).click();
    await expect.poll(() => held.count(), { message: 'the sale is sent', ...live }).toBe(1);
    await expectBusy(sellButton(page), 'Selling…');
    held.release();
  });

  test('BUSY-1 · while the sale is in flight, the form keeps its values and says the request is in flight', async ({ page, api }) => {
    void api;
    const form = sellForm('W1-BUSY-2', { policyholders: [ADA, EDSGER] });
    const held = await hold(page, 'POST', '/api/policies');
    await fillSell(page, form);
    await sellButton(page).click();
    await expect.poll(() => held.count(), { message: 'the sale is sent', ...live }).toBe(1);
    await expect(sellButton(page)).toHaveText('Selling…');
    expect(await formValues(page, 2), 'every value as typed').toEqual(form);
    await expect(page.getByRole('main'), 'the page names the request in flight').toContainText('POST /policies');
    await expect(page.getByRole('main')).toContainText(/in flight/i);
    held.release();
  });

  test("BUSY-1 · a sale in flight can't be sent twice", async ({ page, api }) => {
    void api;
    const held = await hold(page, 'POST', '/api/policies');
    await fillSell(page, sellForm('W1-BUSY-3'));
    await sellButton(page).click();
    await expect.poll(() => held.count(), { message: 'the sale is sent', ...live }).toBe(1);
    await expect(sellButton(page)).toHaveText('Selling…');
    await sellButton(page).dispatchEvent('click');
    await field(page, 'Postcode').press('Enter');
    held.release();
    await expect(page.getByRole('main').getByRole('link', { name: 'Open policy W1-BUSY-3' }), 'the one sale is answered').toBeVisible(live);
    expect(held.count(), 'one request, however often it was pressed').toBe(1);
  });

  test("BUSY-1 · when the sale's answer comes, Sell re-enables and the result appears", async ({ page, api }) => {
    void api;
    const held = await hold(page, 'POST', '/api/policies');
    await fillSell(page, sellForm('W1-BUSY-4'));
    await sellButton(page).click();
    await expect.poll(() => held.count(), { message: 'the sale is sent', ...live }).toBe(1);
    await expect(sellButton(page)).toHaveText('Selling…');
    held.release();
    await expect(page.getByRole('main').getByRole('link', { name: 'Open policy W1-BUSY-4' }), 'the result').toBeVisible(live);
    await expectIdle(sellButton(page), 'Sell this policy');
  });

  test('BUSY-1 · when the API gives the sale no answer, Sell re-enables, the form keeps its values, and the problem appears', async ({ page }) => {
    const form = sellForm('W1-BUSY-5');
    await unreachable(page, 'POST', '/api/policies');
    await fillSell(page, form);
    await sellButton(page).click();
    const problem = page.getByRole('main').getByRole('alert').filter({ hasText: 'No response' });
    await expect(problem, 'the problem: no answer').toBeVisible();
    await expectIdle(sellButton(page), 'Sell this policy');
    expect(await formValues(page, 1), 'every value as typed').toEqual(form);
  });
});

test.describe('opening a policy', () => {
  test('BUSY-1 · while a policy is opening, Open policy shows Opening… with a spinner, disabled, aria-busy and aria-disabled', async ({ page, api }) => {
    void api;
    const stored = await sellThroughApi(requestOf(sellForm('W1-BUSY-6')));
    const held = await hold(page, 'GET', `/api/policies/${stored.reference}`);
    await openFromHome(page, stored.reference);
    await expect.poll(() => held.count(), { message: 'the policy is asked for', ...live }).toBe(1);
    await expectBusy(openButton(page), 'Opening…');
    await expect(field(page, 'Policy reference'), 'the reference is kept').toHaveValue(stored.reference);
    held.release();
  });

  test("BUSY-1 · when the policy's answer comes, its view opens", async ({ page, api }) => {
    void api;
    const stored = await sellThroughApi(requestOf(sellForm('W1-BUSY-7')));
    const held = await hold(page, 'GET', `/api/policies/${stored.reference}`);
    await openFromHome(page, stored.reference);
    await expect.poll(() => held.count(), { message: 'the policy is asked for', ...live }).toBe(1);
    await expect(openButton(page)).toHaveText('Opening…');
    held.release();
    await expect(page).toHaveURL(new RegExp(`#/workbench/policies/${stored.reference}$`), live);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Policy ${stored.reference}`);
  });

  test('BUSY-1 · when the API gives Open policy no answer, it re-enables, the reference is kept, and the problem appears with Try again', async ({ page }) => {
    await unreachable(page, 'GET', '/api/policies/W1-BUSY-8');
    await openFromHome(page, 'W1-BUSY-8');
    const problem = page.getByRole('main').getByRole('alert').filter({ hasText: 'No response' });
    await expect(problem, 'the problem: no answer').toBeVisible();
    await expect(problem.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expectIdle(openButton(page), 'Open policy');
    await expect(field(page, 'Policy reference'), 'the reference is kept').toHaveValue('W1-BUSY-8');
  });
});

test.describe('parity', () => {
  for (const s of [sellStates.submitting, sellStates.unreachable, homeStates.submitting, homeStates.unreachable]) {
    test(`BUSY-1 · parity: the ${s.label} keeps its reference's regions in order, the unbuilt ones as not built yet`, async ({ page }) => {
      await expectRegionsInOrder(page, s);
    });
  }

  test("BUSY-1 · parity: the sell form's submit region, in flight, carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, sellStates.submitting, 'submit-busy-while-the-sell-request-runs-spinner-disabled');
  });

  test("BUSY-1 · parity: the workbench home's request status, opening a policy, carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, homeStates.submitting, 'open-by-reference-busy-while-the-policy-loads');
  });
});
