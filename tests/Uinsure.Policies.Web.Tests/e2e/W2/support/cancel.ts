// The cancel screen (wb-cancel, /workbench/policies/:reference/cancel) as W2's tests drive it: its controls, the
// requests it sends, and the recorded flows its parity and regression tests bring it to. W1's helpers (the live API,
// the sell setup, watching and holding /api/… requests) are reused as they are; nothing here redefines them.
//
// Every expected value a behaviour test asserts is what the API answered (the page's own exchange, or the API asked
// directly), never a figure written here. The recorded flows are for parity and the regression screenshots only.
import { expect } from '@playwright/test';
import type { Locator, Page, Request, Response, Route } from '@playwright/test';
import { serveTrace, setTheme, themes, viewports } from '../../U0b/support/app';
import { literalColours } from '../../U0b/support/reference';
import { live } from '../../W1/support/api';
import { exchangeAt, recordedDir } from '../../W1/support/recorded';
import type { RecordedExchange } from '../../W1/support/recorded';
import { designFixtureDir, readBuilt, readReference, regionNamed, regionOrder, unbuiltComps } from '../../W1/support/reference';
import type { Structure } from '../../W1/support/reference';
import { route } from '../../W1/support/workbench';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ── The screen ───────────────────────────────────────────────────────────────────────────────────────────────

/** The cancellation-date field (wb-cancel's populated reference: "Cancellation date"). */
export const dateField = (page: Page): Locator => page.getByRole('main').getByLabel('Cancellation date', { exact: true });

/** The first quote's control: "Quote this date", "Quoting…" while it runs. */
export const quoteButton = (page: Page): Locator =>
  page.getByRole('main').getByRole('button', { name: /^(Quote this date|Quote again|Quoting…)$/ });

/** The cancel that opens the confirmation, labelled with the quoted date it will send. */
export const cancelOn = (page: Page, date: string): Locator =>
  page.getByRole('main').getByRole('button', { name: `Cancel on ${date}`, exact: true });

/** Any cancel control offered on the page, whatever date it names. */
export const anyCancel = (page: Page): Locator => page.getByRole('button', { name: /^Cancel on / });

/** The confirmation the cancel opens first. */
export const confirmation = (page: Page): Locator => page.getByRole('dialog');

/** The confirmation's own cancel: it sends the request. */
export const confirmCancel = (page: Page): Locator => confirmation(page).getByRole('button', { name: /^Cancel policy/ });

export const goBack = (page: Page): Locator => confirmation(page).getByRole('button', { name: 'Go back', exact: true });

/** Every button on the page reading Cancelling…, hidden by a modal or not: there must be one (g4 §3, a duplicate). */
export const cancellingButtons = (page: Page): Locator => page.locator('button', { hasText: 'Cancelling…' });

/** The built page's regions, by the derived reference's slugs. */
export const REGION = {
  dateAndQuote: 'cancellation-date-and-quote',
  actions: 'quote-and-cancel-actions-each-busy-while-its-request-runs',
  problems: 'problems-cancel-3-cancel-4-cancel-7',
  workedSum: 'the-refund-as-a-worked-sum-per-term-with-the-rule-applied',
  compared: 'cancel-with-the-quoted-date-then-quote-and-cancellation-compared',
} as const;

export const region = (page: Page, slug: string): Locator => page.locator(`[data-region="${slug}"]`);

/** The API path the page asks for a quote on, under its /api proxy. */
export const quotePath = (reference: string): string => `/api/policies/${reference}/cancellation-quote`;
/** The API path the page posts a cancellation to, under its /api proxy. */
export const cancelPath = (reference: string): string => `/api/policies/${reference}/cancellation`;

/** The cancellation quote, as the API answers it (COULD-1). */
export interface QuoteAnswer {
  reference: string;
  cancellationDate: string;
  ruleApplied: string;
  totalRefund: number;
  terms: { termNumber: number; ruleApplied: string; daysInTerm: number; daysUsed: number; unusedDays: number; refundAmount: number }[];
  refunds: { type: string; amount: number; paymentReference: string }[];
  quotedOn: string;
}

/** The cancellation's 201, as the API answers it (CANCEL-1..3). */
export interface CancelResult {
  reference: string;
  cancellationDate: string;
  ruleApplied: string;
  totalRefund: number;
  terms: QuoteAnswer['terms'];
  refunds: { reference: string; type: string; amount: number; paymentReference: string }[];
}

/** Opens the cancel screen on a reference, and fails as an assertion when its date field isn't there. */
export async function openCancel(page: Page, reference: string): Promise<void> {
  await page.goto(route.cancel(reference));
  await expect(dateField(page), 'the cancel screen shows its cancellation date').toBeVisible(live);
}

/** The page's next quote request for this policy. */
export const nextQuote = (page: Page, reference: string): Promise<Request> =>
  page.waitForRequest((r) => new URL(r.url()).pathname === quotePath(reference) && r.method() === 'GET', live);

/** The answer to the page's next quote request for this policy. */
export const quoteAnswered = (page: Page, reference: string): Promise<Response> =>
  page.waitForResponse((r) => new URL(r.url()).pathname === quotePath(reference) && r.request().method() === 'GET', live);

/** The answer to the page's next cancellation for this policy. */
export const cancelAnswered = (page: Page, reference: string): Promise<Response> =>
  page.waitForResponse((r) => new URL(r.url()).pathname === cancelPath(reference) && r.request().method() === 'POST', live);

/** Types a date and quotes it; resolves with the API's answer to the quote. */
export async function quote(page: Page, reference: string, date: string): Promise<QuoteAnswer> {
  await dateField(page).fill(date);
  await expect(quoteButton(page), 'the cancel screen has its quote button').toBeVisible();
  const answer = quoteAnswered(page, reference);
  await quoteButton(page).click();
  const response = await answer;
  expect(response.status(), `the API quotes ${reference} for ${date}`).toBe(200);
  return (await response.json()) as QuoteAnswer;
}

/** Opens the confirmation from the cancel labelled with the quoted date. */
export async function askToCancel(page: Page, date: string): Promise<void> {
  await expect(cancelOn(page, date), `a cancel on the quoted date ${date} is offered`).toBeVisible(live);
  await cancelOn(page, date).click();
  await expect(confirmation(page), 'the cancel asks to confirm first').toBeVisible();
}

/** Every cell's text in a table row, trimmed. */
export async function cellsOf(row: Locator): Promise<string[]> {
  return (await row.locator('th, td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
}

/** The numbers a list of cell texts holds, as numbers: 360.05 and "360.05" and "£360.05" are the same figure. */
export function numbersIn(cells: string[]): number[] {
  return cells.flatMap((c) => [...c.replace(/,/g, '').matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0])));
}

/** The comparison table's row for one of the API's field names (the first cell names the field). */
export const compareRow = (page: Page, field: string): Locator =>
  region(page, REGION.compared).getByRole('row').filter({ has: page.getByRole('rowheader', { name: field, exact: true }) });

// ── The recorded flows (parity and regression only) ──────────────────────────────────────────────────────────

/** The recordings wb-cancel's states name (docs/ui/screens/wb-cancel/screen.json). */
export const CANCEL_REC = {
  /** COULD-1, a quote changes nothing: F3-MVFJRBS7C7 quoted for 2026-12-02 (the populated and submitting states). */
  quoted: '069-could-1-quote-changes-nothing-200.json',
  /** CANCEL-4, quoting a cancelled policy: 409 (the api-error state, reached on the quote). */
  quoteRefused: '077-cancel-4-quote-a-cancelled-policy-409.json',
} as const;

/** The clock of the populated state's recording, for the regression screenshots. */
export const CANCEL_NOW = (JSON.parse(readFileSync(join(recordedDir, CANCEL_REC.quoted), 'utf8')) as { recordedAt: string }).recordedAt;

const quotedPolicy = exchangeAt(CANCEL_REC.quoted, 3);
const quotedQuote = exchangeAt(CANCEL_REC.quoted, 2);
const refusedSale = exchangeAt(CANCEL_REC.quoteRefused, 0);
const refusedQuote = exchangeAt(CANCEL_REC.quoteRefused, 2);

/** The recorded path's query, cancellationDate's value. */
const dateOf = (exchange: RecordedExchange): string => new URL(exchange.path, 'http://x').searchParams.get('cancellationDate') ?? '';
const referenceOf = (exchange: RecordedExchange): string => (exchange.responseBody as { reference: string }).reference;

function fulfil(handled: Route, exchange: RecordedExchange): Promise<void> {
  return handled.fulfill({
    status: exchange.status,
    contentType: exchange.responseHeaders['content-type'] ?? 'application/json',
    body: JSON.stringify(exchange.responseBody),
  });
}

/** GET /api/policies/:reference answered with a recorded policy body. */
async function answerPolicy(page: Page, reference: string, exchange: RecordedExchange): Promise<void> {
  await page.route(
    (url) => url.pathname === `/api/policies/${reference}`,
    (handled) => (handled.request().method() === 'GET' ? fulfil(handled, exchange) : handled.fallback()),
  );
}

/** The quote for the recorded date answered with the recorded quote; a quote for another date is left alone. */
async function answerQuote(page: Page, reference: string, exchange: RecordedExchange): Promise<void> {
  await page.route(
    (url) => url.pathname === quotePath(reference),
    (handled) => {
      const asked = new URL(handled.request().url()).searchParams.get('cancellationDate');
      return handled.request().method() === 'GET' && asked === dateOf(exchange) ? fulfil(handled, exchange) : handled.fallback();
    },
  );
}

/** Clicks the quote, and gives its answer a moment to land (it may never come, at red). */
async function quoteAndSettle(page: Page, reference: string, date: string): Promise<void> {
  await dateField(page).fill(date);
  const answer = page.waitForResponse((r) => new URL(r.url()).pathname === quotePath(reference), { timeout: 5000 }).catch(() => null);
  await quoteButton(page).click();
  await answer;
}

export interface CancelState {
  label: string;
  state: 'populated' | 'submitting' | 'api-error' | 'api-unreachable';
  open(page: Page): Promise<void>;
}

const quotedRef = referenceOf(quotedPolicy);
const quotedDate = dateOf(quotedQuote);
const refusedRef = referenceOf(refusedSale);

export const cancelStates: Record<'populated' | 'submitting' | 'error' | 'unreachable', CancelState> = {
  populated: {
    label: 'cancel screen, quoted and ready to cancel',
    state: 'populated',
    open: async (page) => {
      await answerPolicy(page, quotedRef, quotedPolicy);
      await answerQuote(page, quotedRef, quotedQuote);
      await openCancel(page, quotedRef);
      await quoteAndSettle(page, quotedRef, quotedDate);
    },
  },
  submitting: {
    label: 'cancel screen, the cancel in flight',
    state: 'submitting',
    open: async (page) => {
      await answerPolicy(page, quotedRef, quotedPolicy);
      await answerQuote(page, quotedRef, quotedQuote);
      // The cancel is held for as long as the page lives: the recording holds no cancel of this policy.
      await page.route(
        (url) => url.pathname === cancelPath(quotedRef),
        (handled) => (handled.request().method() === 'POST' ? new Promise<void>(() => undefined) : handled.fallback()),
      );
      await openCancel(page, quotedRef);
      await quoteAndSettle(page, quotedRef, quotedDate);
      await cancelOn(page, quotedDate).click();
      await confirmCancel(page).click();
    },
  },
  // The reference's api-error is a cancel refused 409 under CANCEL-4, with no quote recorded for its date; the
  // recording that reaches CANCEL-4 through the screen's own first step is 077, a quote of a cancelled policy refused
  // 409. Its policy is answered with the sale's body, the only read of it recorded.
  error: {
    label: 'cancel screen, the quote refused 409',
    state: 'api-error',
    open: async (page) => {
      await answerPolicy(page, refusedRef, refusedSale);
      await answerQuote(page, refusedRef, refusedQuote);
      await openCancel(page, refusedRef);
      await quoteAndSettle(page, refusedRef, dateOf(refusedQuote));
    },
  },
  unreachable: {
    label: 'cancel screen, the API not answering the quote',
    state: 'api-unreachable',
    open: async (page) => {
      await answerPolicy(page, quotedRef, quotedPolicy);
      await page.route(
        (url) => url.pathname === quotePath(quotedRef),
        (handled) => (handled.request().method() === 'GET' ? handled.abort('connectionrefused') : handled.fallback()),
      );
      await openCancel(page, quotedRef);
      await dateField(page).fill(quotedDate);
      await quoteButton(page).click();
    },
  },
};

// ── Parity with docs/ui/derived/bug-002-N2/wb-cancel/ ────────────────────────────────────────────────────────

/**
 * W1's reader joins docs/ui/derived/W1 with the screen it is given, so the screen is passed as a relative path.
 * bug-002 N2 (A1/I2) builds the cancel screen's requests-as-sent inspector under WB-7, so the reference is N2's
 * derivation, where that region is built and none is left as not built yet. W2's (../W2/wb-cancel) still drew the
 * inspector as the placeholder.
 */
const readCancelReference = (page: Page, state: string): Promise<Structure> =>
  readReference(page.context(), '../bug-002-N2/wb-cancel', state);

async function prepare(page: Page, s: CancelState): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await s.open(page);
}

/** Every region of the reference, in its order, with its data-req; the unbuilt ones as the not-built-yet pattern. */
export async function expectRegionsInOrder(page: Page, s: CancelState): Promise<void> {
  const reference = await readCancelReference(page, s.state);
  await prepare(page, s);
  await expect
    .poll(async () => {
      const built = await readBuilt(page, reference);
      return { order: regionOrder(built), unbuilt: unbuiltComps(built) };
    })
    .toEqual({ order: regionOrder(reference), unbuilt: unbuiltComps(reference) });
}

/** One region of the reference, with its data-req and the catalogued components inside it. */
export async function expectRegionComponents(page: Page, s: CancelState, slug: string): Promise<void> {
  const reference = await readCancelReference(page, s.state);
  const wanted = regionNamed(reference, slug);
  expect(wanted, `the reference has region ${slug}`).toBeDefined();
  await prepare(page, s);
  await expect
    .poll(async () => {
      const found = regionNamed(await readBuilt(page, reference), slug);
      return found ? { req: found.req, comps: found.comps } : null;
    })
    .toEqual({ req: wanted?.req, comps: wanted?.comps });
}

/** No colour on the page from a literal: the screen's styles, inline styles and SVG paint use tokens only. */
export async function expectTokensOnly(page: Page, s: CancelState): Promise<void> {
  const reference = await readCancelReference(page, s.state);
  await prepare(page, s);
  await expect.poll(async () => (await readBuilt(page, reference)).regions.length).toBe(reference.regions.length);
  for (const theme of themes) {
    await setTheme(page, theme);
    expect.soft(await page.evaluate(literalColours), `literal colours, ${theme}`).toEqual([]);
  }
}
