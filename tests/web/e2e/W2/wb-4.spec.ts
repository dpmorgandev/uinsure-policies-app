// WB-4 · Cancel with quote. Quote, then cancel, showing `ruleApplied`, the day counts and the refund maths, and that
// quote and cancellation agree. W2's acceptance: cancel quotes first, cancels with the quoted date, and compares quote
// and cancellation; a successful cancel is shown; submitting shows one busy Cancel button and its request in flight
// (the screens drew two: g4 defects §3).
//
// On the live API (W1's support/api.ts, the node's port), each policy sold for the test through the API itself. Every
// expected value is the API's own answer, read from the exchange the page saw or from the API directly. axe on each
// state the screen reaches, both themes and widths; parity on the recorded states against docs/ui/derived/W2/wb-cancel/.
import { expect, live, test } from '../W1/support/api';
import type { Page } from '@playwright/test';
import { axeViolations, backgroundToken, setTheme, themes, tokenBackground, viewports } from '../U0b/support/app';
import type { Theme } from '../U0b/support/app';
import {
  cancelThroughApi,
  daysFromToday,
  hashOf,
  hold,
  readThroughApi,
  requestOf,
  ruleHash,
  sellForm,
  sellThroughApi,
  watchApi,
  sent,
} from '../W1/support/workbench';
import type { Policy, Problem } from '../W1/support/workbench';
import {
  REGION,
  anyCancel,
  askToCancel,
  cancelAnswered,
  cancelOn,
  cancelPath,
  cancelStates,
  cancellingButtons,
  cellsOf,
  compareRow,
  confirmCancel,
  confirmation,
  dateField,
  expectRegionComponents,
  expectRegionsInOrder,
  expectTokensOnly,
  goBack,
  nextQuote,
  numbersIn,
  openCancel,
  quote,
  quoteButton,
  quotePath,
  region,
} from './support/cancel';
import type { CancelResult, QuoteAnswer } from './support/cancel';

/**
 * A policy sold for the test, starting in 10 days: a quote 30 days on is past cooling-off and inside cover, whatever
 * today is. Its amount is its own (not a recorded one), so a canned page can't show it.
 */
async function soldPolicy(reference: string, amount = '612.47'): Promise<Policy> {
  return sellThroughApi(requestOf(sellForm(reference, { startDate: daysFromToday(10), amount, paymentMethod: 'Card' })));
}

/** A date to quote: inside the policy's cover, after its cooling-off. An input only; the API's answer is asserted. */
const QUOTE_DATE = (): string => daysFromToday(40);

/** Quotes, opens the confirmation, confirms; resolves with the cancellation's answer. */
async function quoteAndCancel(page: Page, reference: string, date: string): Promise<{ quoted: QuoteAnswer; cancelled: CancelResult; status: number }> {
  await openCancel(page, reference);
  const quoted = await quote(page, reference, date);
  await askToCancel(page, date);
  const answer = cancelAnswered(page, reference);
  await confirmCancel(page).click();
  const response = await answer;
  return { quoted, cancelled: (await response.json()) as CancelResult, status: response.status() };
}

test.describe('quote first', () => {
  test("WB-4 · the cancel screen opens on the policy by its reference, with the API's status and term dates", async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-OPEN-1');
    await openCancel(page, stored.reference);
    const top = region(page, REGION.dateAndQuote);
    await expect(top, 'the reference').toContainText(stored.reference, live);
    await expect(top, 'the status the API gave').toContainText(stored.status);
    await expect(top, "term 1's start").toContainText(stored.terms[0]?.startDate ?? 'a start date');
    await expect(top, "term 1's end").toContainText(stored.terms[0]?.endDate ?? 'an end date');
  });

  test('WB-4 · before a quote, no cancel is offered: the screen quotes first', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-FIRST-1');
    await openCancel(page, stored.reference);
    await expect(quoteButton(page), 'Quote this date is offered').toHaveText('Quote this date');
    await expect(anyCancel(page), 'no cancel until a date is quoted').toHaveCount(0);
  });

  test("WB-4 · Quote this date asks the API for the typed date's quote, and changes nothing", async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-QUOTE-1');
    const date = QUOTE_DATE();
    const seen = watchApi(page);
    await openCancel(page, stored.reference);
    await dateField(page).fill(date);
    const asked = nextQuote(page, stored.reference);
    await quoteButton(page).click();
    const request = new URL((await asked).url());
    expect(request.pathname).toBe(quotePath(stored.reference));
    expect(request.searchParams.get('cancellationDate'), 'the date as typed').toBe(date);
    await expect(cancelOn(page, date), 'the quote is answered and a cancel on its date offered').toBeVisible(live);
    expect(sent(seen, 'POST', cancelPath(stored.reference)), 'a quote sends no cancellation').toHaveLength(0);
    expect(((await readThroughApi(stored.reference)).body as Policy).cancellation, 'the policy is not cancelled').toBeNull();
  });

  test("WB-4 · a quote shows each term's ruleApplied, day counts and refund maths, as the API answered", async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-MATHS-1');
    await openCancel(page, stored.reference);
    const quoted = await quote(page, stored.reference, QUOTE_DATE());
    const term = quoted.terms[0];
    expect(term, 'setup: the quote has a term').toBeDefined();
    if (term === undefined) return;
    const sum = region(page, REGION.workedSum);
    const row = sum.getByRole('row').filter({ has: page.getByRole('rowheader', { name: String(term.termNumber), exact: true }) });
    await expect(row, "term 1's row").toHaveCount(1, live);
    const cells = await cellsOf(row);
    expect(cells, 'the rule applied').toContain(term.ruleApplied);
    const figures = numbersIn(cells);
    expect(figures, "the term's amount, from the policy").toContain(stored.terms[0]?.amount);
    expect(figures, 'days used').toContain(term.daysUsed);
    expect(figures, 'unused days').toContain(term.unusedDays);
    expect(figures, 'days in term').toContain(term.daysInTerm);
    expect(figures, 'the refund').toContain(term.refundAmount);
    expect(numbersIn([await sum.getByRole('row').filter({ hasText: 'Total refund' }).innerText()]), 'the total refund').toContain(
      quoted.totalRefund,
    );
  });

  test('WB-4 · the rule a quote applied is a rule chip that opens that rule', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-CHIP-1');
    await openCancel(page, stored.reference);
    const quoted = await quote(page, stored.reference, QUOTE_DATE());
    const chip = region(page, REGION.workedSum).getByRole('link', { name: quoted.ruleApplied, exact: true }).first();
    await expect(chip, `a ${quoted.ruleApplied} chip`).toBeVisible(live);
    expect(await hashOf(chip)).toBe(ruleHash(quoted.ruleApplied));
  });
});

test.describe('cancel with the quoted date', () => {
  test('WB-4 · Cancel on the quoted date asks to confirm first, and Go back sends nothing', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-BACK-1');
    const date = QUOTE_DATE();
    const seen = watchApi(page);
    await openCancel(page, stored.reference);
    await quote(page, stored.reference, date);
    await askToCancel(page, date);
    await expect(confirmation(page), 'the confirmation names the policy').toContainText(stored.reference);
    await goBack(page).click();
    await expect(confirmation(page), 'Go back closes the confirmation').toHaveCount(0);
    expect(sent(seen, 'POST', cancelPath(stored.reference)), 'nothing is sent').toHaveLength(0);
    expect(((await readThroughApi(stored.reference)).body as Policy).cancellation, 'the policy is not cancelled').toBeNull();
  });

  test('WB-4 · confirming sends the quoted date, not a date typed after the quote', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-CARRY-1');
    const quotedDate = QUOTE_DATE();
    const typedLater = daysFromToday(50);
    const seen = watchApi(page);
    await openCancel(page, stored.reference);
    await quote(page, stored.reference, quotedDate);
    await dateField(page).fill(typedLater);
    await askToCancel(page, quotedDate);
    const answer = cancelAnswered(page, stored.reference);
    await confirmCancel(page).click();
    await answer;
    const posts = sent(seen, 'POST', cancelPath(stored.reference));
    expect(posts, 'one cancellation').toHaveLength(1);
    expect(posts[0]?.requestBody, 'the quoted date, carried from the quote').toEqual({ cancellationDate: quotedDate });
    const after = (await readThroughApi(stored.reference)).body as Policy;
    expect(after.cancellation?.cancellationDate, 'the API cancelled on the quoted date').toBe(quotedDate);
  });

  test("WB-4 · a successful cancel is shown: the API's 201, its date, rule, total refund and refund reference", async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-DONE-1');
    const { cancelled, status } = await quoteAndCancel(page, stored.reference, QUOTE_DATE());
    expect(status, 'setup: the API cancels').toBe(201);
    const shown = region(page, REGION.compared);
    await expect(shown, 'the answer: 201').toContainText('201', live);
    await expect(shown, 'the cancellation date').toContainText(cancelled.cancellationDate);
    await expect(shown, 'the rule applied').toContainText(cancelled.ruleApplied);
    await expect(shown, "the refund's own reference, which only the cancellation holds").toContainText(cancelled.refunds[0]?.reference ?? 'a refund reference');
    await expect(cancelOn(page, cancelled.cancellationDate), 'a cancelled policy offers no second cancel').toHaveCount(0);
  });
});

test.describe('quote and cancellation compared', () => {
  test('WB-4 · after the cancel, quote and cancellation are compared field by field, and agree', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-AGREE-1');
    const { quoted, cancelled } = await quoteAndCancel(page, stored.reference, QUOTE_DATE());
    const shown = region(page, REGION.compared);
    await expect(shown, 'the verdict').toContainText(/Agree on all \d+ compared fields/, live);
    for (const field of ['cancellationDate', 'ruleApplied', 'totalRefund'] as const) {
      const row = compareRow(page, field);
      await expect(row, `a row for ${field}`).toHaveCount(1);
      await expect(row, `${field} agrees`).toContainText('Agrees');
      const cells = await cellsOf(row);
      expect(cells.join(' '), `${field}: the quote's and the cancellation's value`).toContain(String(quoted[field]));
      expect(cells.join(' ')).toContain(String(cancelled[field]));
    }
  });

  test("WB-4 · when the cancellation's total refund differs from the quote's, the comparison says they differ on totalRefund", async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-DIFFER-1');
    // The API's own cancellation, its totalRefund alone moved by 1.00: the page must compare, not assume.
    await page.route(
      (url) => url.pathname === cancelPath(stored.reference),
      async (handled) => {
        if (handled.request().method() !== 'POST') return handled.fallback();
        const real = await handled.fetch();
        const body = (await real.json()) as CancelResult;
        return handled.fulfill({ response: real, json: { ...body, totalRefund: Number((body.totalRefund + 1).toFixed(2)) } });
      },
    );
    await quoteAndCancel(page, stored.reference, QUOTE_DATE());
    const shown = region(page, REGION.compared);
    await expect(shown, 'the verdict names the field').toContainText(/Differ on 1 of \d+ compared fields: totalRefund/, live);
    await expect(compareRow(page, 'totalRefund'), 'totalRefund differs').toContainText('Differs');
    await expect(compareRow(page, 'ruleApplied'), 'ruleApplied still agrees').toContainText('Agrees');
  });

  test('WB-4 · a cancel refused because the policy was cancelled meanwhile shows the 409 under CANCEL-4, and compares nothing', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-409-1');
    const date = QUOTE_DATE();
    await openCancel(page, stored.reference);
    await quote(page, stored.reference, date);
    await cancelThroughApi(stored.reference, { cancellationDate: daysFromToday(20) });
    await askToCancel(page, date);
    const answer = cancelAnswered(page, stored.reference);
    await confirmCancel(page).click();
    const response = await answer;
    expect(response.status(), 'setup: the API refuses a second cancel').toBe(409);
    const problem = (await response.json()) as Problem;
    const alert = page.getByRole('main').getByRole('alert');
    await expect(alert, "the API's detail").toContainText(problem.detail ?? 'a detail', live);
    const chip = alert.getByRole('link', { name: 'CANCEL-4', exact: true });
    await expect(chip).toBeVisible();
    expect(await hashOf(chip)).toBe(ruleHash('CANCEL-4'));
    await expect(region(page, REGION.compared), 'no verdict on a refused cancel').not.toContainText(/Agree on all|Differ on/);
  });
});

test.describe('busy', () => {
  test('WB-4 · while a quote is in flight, its button shows Quoting…, disabled and aria-busy, and the date is kept', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-QBUSY-1');
    const date = QUOTE_DATE();
    const held = await hold(page, 'GET', quotePath(stored.reference));
    await openCancel(page, stored.reference);
    await dateField(page).fill(date);
    await quoteButton(page).click();
    await expect.poll(() => held.count(), { message: 'the quote is asked for', ...live }).toBe(1);
    await expect(quoteButton(page)).toHaveText('Quoting…');
    await expect(quoteButton(page)).toBeDisabled();
    await expect(quoteButton(page)).toHaveAttribute('aria-busy', 'true');
    await expect(dateField(page), 'the date is kept').toHaveValue(date);
    held.release();
    await expect(cancelOn(page, date), 'the quote lands').toBeVisible(live);
  });

  test('WB-4 · while the cancel is in flight, one Cancel button shows Cancelling…, disabled and aria-busy, and the request is named in flight', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-CBUSY-1');
    const date = QUOTE_DATE();
    const held = await hold(page, 'POST', cancelPath(stored.reference));
    await openCancel(page, stored.reference);
    await quote(page, stored.reference, date);
    await askToCancel(page, date);
    await confirmCancel(page).click();
    await expect.poll(() => held.count(), { message: 'the cancel is sent', ...live }).toBe(1);
    await expect(cancellingButtons(page), 'one busy Cancel button, not two').toHaveCount(1);
    const busy = cancellingButtons(page);
    await expect(busy).toBeDisabled();
    await expect(busy).toHaveAttribute('aria-busy', 'true');
    await expect(busy).toHaveAttribute('aria-disabled', 'true');
    await expect(busy.locator('[class*="kit-spinner__spinner"]'), 'with the kit spinner').toHaveCount(1);
    await expect(page.getByRole('main'), 'the request in flight is named').toContainText(`POST /policies/${stored.reference}/cancellation`);
    await expect(page.getByRole('main')).toContainText(/in flight/i);
    held.release();
  });

  test("WB-4 · a cancel in flight can't be sent twice", async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-CBUSY-2');
    const date = QUOTE_DATE();
    const held = await hold(page, 'POST', cancelPath(stored.reference));
    await openCancel(page, stored.reference);
    await quote(page, stored.reference, date);
    await askToCancel(page, date);
    await confirmCancel(page).click();
    await expect.poll(() => held.count(), { message: 'the cancel is sent', ...live }).toBe(1);
    await expect(cancellingButtons(page)).toHaveCount(1);
    await cancellingButtons(page).dispatchEvent('click');
    held.release();
    await expect(region(page, REGION.compared), 'the one cancel is answered').toContainText(/Agree on all|Differ on/, live);
    expect(held.count(), 'one request, however often it was pressed').toBe(1);
  });
});

test.describe('axe', () => {
  const widths = [1440, 390] as const;

  async function themeApplied(page: Page, theme: Theme): Promise<void> {
    await expect(page.locator('html'), `the ${theme} theme has been applied`).toHaveAttribute('data-theme', theme);
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((running) => running instanceof CSSTransition)
          .map((running) => running.finished.catch(() => undefined)),
      ),
    );
  }

  async function auditEverywhere(page: Page): Promise<void> {
    for (const theme of themes) {
      for (const width of widths) {
        await setTheme(page, theme);
        await page.setViewportSize(viewports[width]);
        await themeApplied(page, theme);
        expect(await backgroundToken(page), `the ${theme} theme's tokens are in force at ${width}`).toBe(tokenBackground[theme]);
        expect.soft(await axeViolations(page), `axe, ${theme} at ${width}`).toEqual([]);
      }
    }
  }

  test('WB-4 · the cancel screen, quoted, has no axe violation, light and dark, at 1440 and 390', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-AXE-1');
    const date = QUOTE_DATE();
    await openCancel(page, stored.reference);
    await quote(page, stored.reference, date);
    await expect(cancelOn(page, date)).toBeVisible(live);
    await auditEverywhere(page);
  });

  test('WB-4 · the cancel screen, asking to confirm, has no axe violation, light and dark, at 1440 and 390', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-AXE-2');
    const date = QUOTE_DATE();
    await openCancel(page, stored.reference);
    await quote(page, stored.reference, date);
    await askToCancel(page, date);
    await auditEverywhere(page);
  });

  test('WB-4 · the cancel screen, cancelled and compared, has no axe violation, light and dark, at 1440 and 390', async ({ page, api }) => {
    void api;
    const stored = await soldPolicy('W2-AXE-3');
    await quoteAndCancel(page, stored.reference, QUOTE_DATE());
    await expect(region(page, REGION.compared)).toContainText(/Agree on all|Differ on/, live);
    await auditEverywhere(page);
  });
});

test.describe('parity', () => {
  for (const s of [cancelStates.populated, cancelStates.submitting, cancelStates.error, cancelStates.unreachable]) {
    test(`WB-4 · parity: the ${s.label} keeps its reference's regions in order, the unbuilt ones as not built yet`, async ({ page }) => {
      await expectRegionsInOrder(page, s);
    });
  }

  for (const slug of [REGION.dateAndQuote, REGION.actions, REGION.workedSum, REGION.compared]) {
    test(`WB-4 · parity: the quoted cancel screen's region ${slug} carries its reference's components`, async ({ page }) => {
      await expectRegionComponents(page, cancelStates.populated, slug);
    });
  }

  test('WB-4 · parity: the quoted cancel screen takes its colours from tokens only, light and dark', async ({ page }) => {
    await expectTokensOnly(page, cancelStates.populated);
  });
});
