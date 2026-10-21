// The workbench as a test drives it: its routes, the sell form, the requests the page sends to /api/… (the app's
// proxy to the API), and the API itself for a test's own setup. Every expected value a behaviour test asserts is
// what the API answered, read from the exchange the page saw or from the API directly, never a figure written here.
import { expect } from '@playwright/test';
import type { Locator, Page, Request, Route } from '@playwright/test';
import { apiUrl, live } from './api';

/** The workbench's routes (hash routing), from docs/ui/screens/<id>/screen.json. */
export const route = {
  home: '/#/workbench',
  sell: '/#/workbench/sell',
  policy: (reference: string): string => `/#/workbench/policies/${reference}`,
};

/** The rule page a rule chip links to (RULE-1's route, /rules/:ruleId). */
export const ruleHash = (ruleId: string): string => `#/rules/${ruleId}`;

export type PolicyType = 'BuyToLet' | 'Household';
export type PaymentMethod = 'Card' | 'DirectDebit' | 'Cheque';

export interface Holder {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface Property {
  addressLine1: string;
  addressLine2: string | null;
  addressLine3: string | null;
  postcode: string;
}

/** The body of POST /policies (the API contract). */
export interface SellRequest {
  reference: string;
  type: PolicyType;
  startDate: string;
  amount: number;
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
  policyholders: Holder[];
  property: Property;
}

export interface Term {
  termNumber: number;
  startDate: string;
  endDate: string;
  amount: number;
  paymentReference: string;
}

export interface Payment {
  reference: string;
  type: string;
  amount: number;
}

/** A policy as GET /policies/:reference (and a 201 from POST /policies) returns it. */
export interface Policy {
  reference: string;
  type: PolicyType;
  status: string;
  currentTermNumber: number;
  startDate: string;
  endDate: string;
  amount: number;
  hasClaims: boolean;
  autoRenew: boolean;
  policyholders: Holder[];
  property: Property;
  terms: Term[];
  payments: Payment[];
  refunds: unknown[];
  claims: unknown[];
  cancellation: unknown;
}

/** An RFC 9457 problem as the API writes it. */
export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  ruleId?: string;
  reference?: string;
  violations?: { ruleId: string; detail: string }[];
  errors?: Record<string, string[]>;
}

/** The sell form's values as a person types them: every field a string, a switch on or off. */
export interface SellForm {
  reference: string;
  type: PolicyType;
  startDate: string;
  amount: string;
  paymentMethod: PaymentMethod;
  autoRenew: boolean;
  policyholders: Holder[];
  property: { addressLine1: string; addressLine2: string; addressLine3: string; postcode: string };
}

/**
 * A date `days` after today (UTC), as yyyy-MM-dd. An input only, so a sale falls inside SELL-2's window
 * (today to today + 60, the API's UK calendar); a test asserts the dates the API returns, never this one.
 */
export function daysFromToday(days: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days)).toISOString().slice(0, 10);
}

/** A start date the API refuses under SELL-2 whatever today is: no backdating. */
export const PAST_START = '2020-01-01';

export const ADA: Holder = { firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: '1985-12-10' };
export const EDSGER: Holder = { firstName: 'Edsger', lastName: 'Dijkstra', dateOfBirth: '1979-05-11' };
export const BARBARA: Holder = { firstName: 'Barbara', lastName: 'Liskov', dateOfBirth: '1972-11-07' };
export const RADIA: Holder = { firstName: 'Radia', lastName: 'Perlman', dateOfBirth: '1988-01-18' };

/** A form a person could sell as it is: every value of its own, none equal to the screens' recorded ones. */
export function sellForm(reference: string, overrides: Partial<SellForm> = {}): SellForm {
  return {
    reference,
    type: 'Household',
    startDate: daysFromToday(30),
    amount: '527.18',
    paymentMethod: 'DirectDebit',
    autoRenew: true,
    policyholders: [ADA],
    property: { addressLine1: '12 Mill Lane', addressLine2: 'Floor 2', addressLine3: 'Castlefield', postcode: 'M15 4PS' },
    ...overrides,
  };
}

/** The request body these typed values make: an empty address line is sent as null. */
export function requestOf(form: SellForm): SellRequest {
  const orNull = (value: string): string | null => (value === '' ? null : value);
  return {
    reference: form.reference,
    type: form.type,
    startDate: form.startDate,
    amount: Number(form.amount),
    autoRenew: form.autoRenew,
    paymentMethod: form.paymentMethod,
    policyholders: form.policyholders.map((h) => ({ ...h })),
    property: {
      addressLine1: form.property.addressLine1,
      addressLine2: orNull(form.property.addressLine2),
      addressLine3: orNull(form.property.addressLine3),
      postcode: form.property.postcode,
    },
  };
}

/** The typed values that make a recorded request body (docs/ui/fixture/api/), for the parity flows. */
export function formOf(body: SellRequest): SellForm {
  return {
    reference: body.reference,
    type: body.type,
    startDate: body.startDate,
    amount: String(body.amount),
    paymentMethod: body.paymentMethod,
    autoRenew: body.autoRenew,
    policyholders: body.policyholders.map((h) => ({ ...h })),
    property: {
      addressLine1: body.property.addressLine1,
      addressLine2: body.property.addressLine2 ?? '',
      addressLine3: body.property.addressLine3 ?? '',
      postcode: body.property.postcode,
    },
  };
}

const TYPE_LABEL: Record<PolicyType, string> = { BuyToLet: 'Buy to let', Household: 'Household' };

// ── The sell form ────────────────────────────────────────────────────────────────────────────────────────────

export const sellButton = (page: Page): Locator =>
  page.getByRole('main').getByRole('button', { name: /^(Sell this policy|Selling…)$/ });

export const sendAnywaySwitch = (page: Page): Locator => page.getByRole('main').getByRole('switch', { name: 'Send anyway' });

export const holderGroups = (page: Page): Locator => page.getByRole('main').getByRole('group', { name: /^Policyholder \d+$/ });

export const holder = (page: Page, n: number): Locator =>
  page.getByRole('main').getByRole('group', { name: `Policyholder ${n}`, exact: true });

export const addHolder = (page: Page): Locator => page.getByRole('main').getByRole('button', { name: 'Add another policyholder' });

export const field = (page: Page, label: string): Locator => page.getByRole('main').getByLabel(label, { exact: true });

/** Adds or removes policyholders until the form has `count`. */
export async function setHolderCount(page: Page, count: number): Promise<void> {
  const groups = holderGroups(page);
  await expect(groups.first(), 'the form shows a policyholder').toBeVisible();
  // Bounded: a form that doesn't add or remove fails the count below, as an assertion, instead of looping.
  for (let i = 0; i < 6 && (await groups.count()) !== count; i += 1) {
    const now = await groups.count();
    if (now < count) await addHolder(page).click();
    else await page.getByRole('main').getByRole('button', { name: `Remove policyholder ${now}` }).click();
  }
  await expect(groups, `the form holds ${count} policyholders`).toHaveCount(count);
}

/** Opens the sell form, and fails as an assertion when it isn't there. */
export async function openSell(page: Page): Promise<void> {
  await page.goto(route.sell);
  await expect(field(page, 'Policy reference'), 'the sell form is shown').toBeVisible();
}

/** Opens the sell form and types `form` into it, send anyway on or off as asked (off unless said). */
export async function fillSell(page: Page, form: SellForm, options: { sendAnyway?: boolean; open?: boolean } = {}): Promise<void> {
  if (options.open !== false) await openSell(page);
  else await expect(field(page, 'Policy reference'), 'the sell form is shown').toBeVisible();
  await expect(sendAnywaySwitch(page), 'the sell form has its send anyway switch').toBeVisible();
  await sendAnywaySwitch(page).setChecked(options.sendAnyway ?? false);
  await field(page, 'Policy reference').fill(form.reference);
  await page.getByRole('main').getByRole('radio', { name: TYPE_LABEL[form.type], exact: true }).check();
  await field(page, 'Start date').fill(form.startDate);
  await field(page, 'Amount').fill(form.amount);
  await field(page, 'Payment method').selectOption(form.paymentMethod);
  await page.getByRole('main').getByRole('switch', { name: 'Auto-renew' }).setChecked(form.autoRenew);
  await setHolderCount(page, form.policyholders.length);
  for (const [i, h] of form.policyholders.entries()) {
    const group = holder(page, i + 1);
    await group.getByLabel('First name', { exact: true }).fill(h.firstName);
    await group.getByLabel('Last name', { exact: true }).fill(h.lastName);
    await group.getByLabel(/^Date of birth/).fill(h.dateOfBirth);
  }
  await field(page, 'Address line 1').fill(form.property.addressLine1);
  await field(page, 'Address line 2').fill(form.property.addressLine2);
  await field(page, 'Address line 3').fill(form.property.addressLine3);
  await field(page, 'Postcode').fill(form.property.postcode);
}

/** Presses Sell this policy. */
export async function submitSell(page: Page): Promise<void> {
  await expect(sellButton(page), 'the sell form has its Sell this policy button').toBeVisible();
  await sellButton(page).click();
}

/** Opens the sell form, types `form`, and sends it. */
export async function sell(page: Page, form: SellForm, options: { sendAnyway?: boolean } = {}): Promise<void> {
  await fillSell(page, form, options);
  await submitSell(page);
}

/** The values the sell form holds now, read back as typed. */
export async function formValues(page: Page, holders: number): Promise<SellForm> {
  const value = (locator: Locator): Promise<string> => locator.inputValue();
  const policyholders: Holder[] = [];
  for (let n = 1; n <= holders; n += 1) {
    const group = holder(page, n);
    policyholders.push({
      firstName: await value(group.getByLabel('First name', { exact: true })),
      lastName: await value(group.getByLabel('Last name', { exact: true })),
      dateOfBirth: await value(group.getByLabel(/^Date of birth/)),
    });
  }
  const household = await page.getByRole('main').getByRole('radio', { name: 'Household', exact: true }).isChecked();
  return {
    reference: await value(field(page, 'Policy reference')),
    type: household ? 'Household' : 'BuyToLet',
    startDate: await value(field(page, 'Start date')),
    amount: await value(field(page, 'Amount')),
    paymentMethod: (await value(field(page, 'Payment method'))) as PaymentMethod,
    autoRenew: await page.getByRole('main').getByRole('switch', { name: 'Auto-renew' }).isChecked(),
    policyholders,
    property: {
      addressLine1: await value(field(page, 'Address line 1')),
      addressLine2: await value(field(page, 'Address line 2')),
      addressLine3: await value(field(page, 'Address line 3')),
      postcode: await value(field(page, 'Postcode')),
    },
  };
}

/** The "As the API will store it" value of the reference preview. */
export const storedPreview = (page: Page): Locator =>
  page.getByRole('main').locator('output', { hasText: 'As the API will store it' });

// ── The home ─────────────────────────────────────────────────────────────────────────────────────────────────

export const openButton = (page: Page): Locator => page.getByRole('main').getByRole('button', { name: /^(Open policy|Opening…)$/ });

/** Opens the home and types `reference` into its open-by-reference field. */
export async function typeOnHome(page: Page, reference: string): Promise<void> {
  await page.goto(route.home);
  await expect(field(page, 'Policy reference'), "the home's open-by-reference field is shown").toBeVisible();
  await field(page, 'Policy reference').fill(reference);
  await expect(openButton(page), 'the home has its Open policy button').toBeVisible();
}

export async function openFromHome(page: Page, reference: string): Promise<void> {
  await typeOnHome(page, reference);
  await openButton(page).click();
}

/** The recent-policies list on the home: its links, newest first. */
export const recentList = (page: Page): Locator => page.getByRole('main').getByRole('list', { name: 'References, newest first' });

// ── What the page sends ──────────────────────────────────────────────────────────────────────────────────────

/** One request the page sent to /api/…, and the answer when it came. */
export interface Exchange {
  method: string;
  /** The path the page asked for, /api/… */
  path: string;
  requestBody: unknown;
  /** null while it runs, or when no answer came. */
  status: number | null;
  responseBody: unknown;
  /** The answer has been read, or the request failed. */
  done: boolean;
}

/** Every request the page sends to /api/… from now on, with its answer. */
export function watchApi(page: Page): Exchange[] {
  const seen: Exchange[] = [];
  const byRequest = new Map<Request, Exchange>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/')) return;
    let requestBody: unknown = null;
    const raw = request.postData();
    if (raw !== null) {
      try {
        requestBody = JSON.parse(raw) as unknown;
      } catch {
        requestBody = raw;
      }
    }
    const exchange: Exchange = { method: request.method(), path: url.pathname, requestBody, status: null, responseBody: null, done: false };
    seen.push(exchange);
    byRequest.set(request, exchange);
  });
  page.on('requestfailed', (request) => {
    const exchange = byRequest.get(request);
    if (exchange) exchange.done = true;
  });
  page.on('response', (response) => {
    const exchange = byRequest.get(response.request());
    if (!exchange) return;
    exchange.status = response.status();
    void response
      .text()
      .then((text) => {
        try {
          exchange.responseBody = JSON.parse(text) as unknown;
        } catch {
          exchange.responseBody = text;
        }
      })
      .catch(() => undefined)
      .finally(() => {
        exchange.done = true;
      });
  });
  return seen;
}

export const sent = (seen: Exchange[], method: string, path: string): Exchange[] =>
  seen.filter((e) => e.method === method && e.path === path);

/**
 * The `n`th request of this method and path, once answered. Fails, as an assertion, when the page never sends it.
 * Both waits are on a live round trip, a worker's first one included, so each has the live API's timeout.
 */
export async function answered(seen: Exchange[], method: string, path: string, n = 0): Promise<Exchange> {
  await expect
    .poll(() => sent(seen, method, path).length, { message: `the page sends ${method} ${path}`, ...live })
    .toBeGreaterThan(n);
  const exchange = sent(seen, method, path)[n] as Exchange;
  await expect.poll(() => exchange.done, { message: `${method} ${path} is answered`, ...live }).toBe(true);
  return exchange;
}

/** Requests the test holds in flight until it lets them go: BUSY-1's window. */
export interface Hold {
  /** How many matching requests the page has sent. */
  count(): number;
  release(): void;
}

/** Holds every `method` request to `path` (/api/…) until released, then lets it through to the API. */
export async function hold(page: Page, method: string, path: string): Promise<Hold> {
  let count = 0;
  let release: () => void = () => undefined;
  const gate = new Promise<void>((done) => {
    release = done;
  });
  await page.route(
    (url) => url.pathname === path,
    async (handled: Route) => {
      if (handled.request().method() !== method) return handled.fallback();
      count += 1;
      await gate;
      // The page may have closed while the request was held: nothing is left to let through.
      return handled.continue().catch(() => undefined);
    },
  );
  return { count: () => count, release: () => release() };
}

/** Every `method` request to `path` fails as if the API weren't there. */
export async function unreachable(page: Page, method: string, path: string): Promise<void> {
  await page.route(
    (url) => url.pathname === path,
    (handled: Route) => (handled.request().method() === method ? handled.abort('connectionrefused') : handled.fallback()),
  );
}

// ── The API, for a test's own setup ──────────────────────────────────────────────────────────────────────────

/** fetch, with the reason a request never reached the API named in the error (a setup fault, not a red). */
async function call(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    const cause = (error as { cause?: { code?: string; message?: string } }).cause;
    throw new Error(`setup: ${init?.method ?? 'GET'} ${url} reached no API (${cause?.code ?? cause?.message ?? String(error)})`);
  }
}

/** Sells a policy straight through the API: a test's setup, never the behaviour under test. */
export async function sellThroughApi(body: SellRequest): Promise<Policy> {
  const answer = await call(`${apiUrl}/policies`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await answer.text();
  expect(answer.status, `setup: the API sells ${body.reference}\n${text}`).toBe(201);
  return JSON.parse(text) as Policy;
}

/** GET /policies/:reference straight from the API: what the policy view must show. */
export async function readThroughApi(reference: string): Promise<{ status: number; body: unknown }> {
  const answer = await call(`${apiUrl}/policies/${encodeURIComponent(reference)}`);
  const text = await answer.text();
  return { status: answer.status, body: JSON.parse(text) as unknown };
}

/** One answer of the API, as it came: its status, content type and body text. */
export interface RawAnswer {
  status: number;
  contentType: string;
  text: string;
}

/** GET of an API path (/policies/…, a query string kept as written) straight from the API: a test's setup. */
export async function askApi(path: string): Promise<RawAnswer> {
  const answer = await call(`${apiUrl}${path}`);
  return { status: answer.status, contentType: answer.headers.get('content-type') ?? '', text: await answer.text() };
}

/** The page's GET of an /api/… path is answered with `answer`, exactly as the API gave it. */
export async function relay(page: Page, path: string, answer: RawAnswer): Promise<void> {
  await page.route(
    (url) => url.pathname === path,
    (handled: Route) =>
      handled.request().method() === 'GET'
        ? handled.fulfill({ status: answer.status, contentType: answer.contentType, body: answer.text })
        : handled.fallback(),
  );
}

/** Every yyyy-MM-dd anywhere in a JSON value. */
export function datesIn(value: unknown): Set<string> {
  const dates = new Set<string>();
  for (const m of JSON.stringify(value).matchAll(/\d{4}-\d{2}-\d{2}/g)) dates.add(m[0]);
  return dates;
}

/** Every yyyy-MM-dd the page's main content shows. */
export async function datesShown(page: Page): Promise<string[]> {
  const text = await page.getByRole('main').innerText();
  return [...new Set([...text.matchAll(/\d{4}-\d{2}-\d{2}/g)].map((m) => m[0]))];
}

/** A key-value list's value for `term` (a <dt> and the <dd> after it). */
export const valueOf = (scope: Locator, term: string): Locator =>
  scope.locator(`xpath=.//dt[normalize-space(.)="${term}"]/following-sibling::dd[1]`);

/** A region of the built page by its slug (the derived reference's data-region). */
export const region = (page: Page, slug: string): Locator => page.locator(`[data-region="${slug}"]`);

/** The sell page's error summary: the alert titled "There is a problem". */
export const errorSummary = (page: Page): Locator =>
  page.getByRole('main').getByRole('alert').filter({ hasText: 'There is a problem' });

/** The rule a link opens, read from where its href resolves: '#/rules/SELL-2' for a SELL-2 chip. */
export async function hashOf(link: Locator): Promise<string> {
  return link.evaluate((a) => new URL((a as HTMLAnchorElement).href).hash);
}
