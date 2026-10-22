// W3's screens (wb-claim, wb-renew, wb-requests) brought to their derived reference states (docs/ui/derived/W3/)
// by the recorded API answers each state names (docs/ui/fixture/api/), for parity and the regression baselines.
// A flow here does what a person would and never asserts on behaviour: parity may pass at the stub.
//
// Not reached by any flow: wb-claim and wb-renew's `submitting` (a held request, left to the BUSY-1 tests), and
// wb-requests' `long-content` (ten cancel fixtures run through the app). wb-requests' `populated` is reached with the
// exchanges one policy read leaves in the log, not the reference's ten: parity compares structure, not rows.
import { expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import { serveTrace, setTheme, themes, viewports } from '../../U0b/support/app';
import { literalColours } from '../../U0b/support/reference';
import { answerWith, exchangeAt } from '../../W1/support/recorded';
import type { RecordedExchange } from '../../W1/support/recorded';
import { designFixtureDir, readBuilt, readReference, regionNamed, regionOrder, unbuiltComps } from '../../W1/support/reference';
import { route, unreachable } from '../../W1/support/workbench';

export interface W3Screen {
  label: string;
  screen: 'wb-claim' | 'wb-renew' | 'wb-requests';
  state: string;
  open(page: Page): Promise<void>;
}

const CLAIM = '070-could-2-claim-dated-today-201.json';
const CLAIM_REFUSED = '084-could-2a-claim-dated-tomorrow-422.json';
const RENEW_WINDOW = '092-renew-1-2-renew-on-the-day-of-sale-422.json';
const RENEW_THREE = '094-renew-1-2-auto-renew-off-card-and-amount-0-today-422.json';
const READ_BACK = '045-get-1-sold-policy-reads-back-in-full-200.json';

// 070 records no cancellation quote, so wb-claim's populated flow answers its two quote GETs with the nearest
// recorded quotes, each the API's real answer for another policy, kept as recorded: before the claim, 069's
// (CANCEL-1c, a refund); after it, 072's (COULD-2, 0.00 on a policy with a claim). Parity compares structure.
const QUOTE_BEFORE = exchangeAt('069-could-1-quote-changes-nothing-200.json', 2);
const QUOTE_AFTER = exchangeAt('072-could-2-quote-for-a-policy-with-a-claim-quotes-nothing-200.json', 2);

const refOf = (path: string): string => path.split('/')[2] ?? '';

/** Clicks a button by name and gives the answer a moment to land (it may never come, at the stub). */
async function press(page: Page, name: string, path: string): Promise<void> {
  const answer = page.waitForResponse((r) => new URL(r.url()).pathname === path, { timeout: 5000 }).catch(() => null);
  await page.getByRole('main').getByRole('button', { name }).click({ timeout: 5000 }).catch(() => undefined);
  await answer;
}

async function fill(page: Page, label: string, value: string): Promise<void> {
  await page.getByRole('main').getByLabel(label, { exact: true }).fill(value, { timeout: 5000 }).catch(() => undefined);
}

/**
 * The page's GET requests to `path` (/api/…, any query) are answered with these recorded answers, one each, in
 * order; any further one falls through.
 */
async function answerInTurn(page: Page, path: string, answers: RecordedExchange[]): Promise<void> {
  let next = 0;
  await page.route(
    (url) => url.pathname === path,
    (handled: Route) => {
      const answer = answers[next];
      if (handled.request().method() !== 'GET' || answer === undefined) return handled.fallback();
      next += 1;
      return handled.fulfill({
        status: answer.status,
        contentType: answer.responseHeaders['content-type'] ?? 'application/json',
        body: JSON.stringify(answer.responseBody),
      });
    },
  );
}

async function claimFlow(page: Page, file: string, quotes: RecordedExchange[] = []): Promise<void> {
  const read = exchangeAt(file, 2);
  const post = exchangeAt(file, 1);
  await answerWith(page, read);
  await answerWith(page, post);
  if (quotes.length > 0) await answerInTurn(page, `/api${read.path}/cancellation-quote`, quotes);
  await page.goto(route.claim(refOf(read.path)));
  const body = post.requestBody as { claimDate: string; description?: string };
  await fill(page, 'Claim date', body.claimDate);
  // The reference names the text-area by its aria-label, 'Claim description' (docs/ui/derived/W3/wb-claim/populated.html).
  if (body.description !== undefined) await fill(page, 'Claim description', body.description);
  await press(page, 'Record this claim', `/api${post.path}`);
}

async function renewFlow(page: Page, file: string): Promise<void> {
  const read = exchangeAt(file, 2);
  const post = exchangeAt(file, 1);
  await answerWith(page, read);
  await answerWith(page, post);
  await page.goto(route.renew(refOf(read.path)));
  const body = post.requestBody as { amount: number; paymentMethod?: string };
  await fill(page, 'Renewal amount', body.amount.toFixed(2));
  if (body.paymentMethod !== undefined) {
    await page.getByRole('main').getByLabel('Payment method', { exact: true }).selectOption(body.paymentMethod, { timeout: 5000 }).catch(() => undefined);
  }
  await press(page, 'Renew policy', `/api${post.path}`);
}

export const claimStates: Record<'populated' | 'error' | 'unreachable', W3Screen> = {
  populated: { label: 'record a claim', screen: 'wb-claim', state: 'populated', open: (page) => claimFlow(page, CLAIM, [QUOTE_BEFORE, QUOTE_AFTER]) },
  error: { label: 'record a claim, refused 422', screen: 'wb-claim', state: 'api-error', open: (page) => claimFlow(page, CLAIM_REFUSED) },
  unreachable: {
    label: 'record a claim, the API not answering',
    screen: 'wb-claim',
    state: 'api-unreachable',
    open: async (page) => {
      const read = exchangeAt(CLAIM, 2);
      await unreachable(page, 'GET', `/api${read.path}`);
      await page.goto(route.claim(refOf(read.path)));
    },
  },
};

export const renewStates: Record<'populated' | 'error' | 'unreachable', W3Screen> = {
  populated: { label: 'renew', screen: 'wb-renew', state: 'populated', open: (page) => renewFlow(page, RENEW_WINDOW) },
  error: { label: 'renew, refused with three violations', screen: 'wb-renew', state: 'api-error', open: (page) => renewFlow(page, RENEW_THREE) },
  unreachable: {
    label: 'renew, the API not answering',
    screen: 'wb-renew',
    state: 'api-unreachable',
    open: async (page) => {
      const read = exchangeAt(RENEW_WINDOW, 2);
      await unreachable(page, 'GET', `/api${read.path}`);
      await page.goto(route.renew(refOf(read.path)));
    },
  },
};

export const requestsStates: Record<'populated', W3Screen> = {
  populated: {
    label: 'request log',
    screen: 'wb-requests',
    state: 'populated',
    open: async (page) => {
      const read = exchangeAt(READ_BACK, 1);
      await answerWith(page, read);
      await page.goto(route.policy(refOf(read.path)));
      await page.waitForResponse((r) => new URL(r.url()).pathname === `/api${read.path}`, { timeout: 5000 }).catch(() => null);
      await page.goto('/#/workbench/requests');
    },
  },
};

/** W1's reader is rooted at docs/ui/derived/W1; W3's references sit beside it, one folder over. */
const w3 = (screen: string): string => `../W3/${screen}`;

async function prepare(page: Page, s: W3Screen): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await s.open(page);
}

export async function expectRegionsInOrder(page: Page, s: W3Screen): Promise<void> {
  const reference = await readReference(page.context(), w3(s.screen), s.state);
  await prepare(page, s);
  await expect
    .poll(async () => {
      const built = await readBuilt(page, reference);
      return { order: regionOrder(built), unbuilt: unbuiltComps(built) };
    })
    .toEqual({ order: regionOrder(reference), unbuilt: unbuiltComps(reference) });
}

export async function expectEveryRegionsComponents(page: Page, s: W3Screen): Promise<void> {
  const reference = await readReference(page.context(), w3(s.screen), s.state);
  await prepare(page, s);
  await expect
    .poll(async () => {
      const built = await readBuilt(page, reference);
      return reference.regions.map((r) => {
        const found = regionNamed(built, r.slug);
        return [r.slug, found ? { req: found.req, comps: found.comps } : null];
      });
    })
    .toEqual(reference.regions.map((r) => [r.slug, { req: r.req, comps: r.comps }]));
}

export async function expectTokensOnly(page: Page, s: W3Screen): Promise<void> {
  const reference = await readReference(page.context(), w3(s.screen), s.state);
  await prepare(page, s);
  await expect.poll(async () => (await readBuilt(page, reference)).regions.length).toBe(reference.regions.length);
  for (const theme of themes) {
    await setTheme(page, theme);
    expect.soft(await page.evaluate(literalColours), `literal colours, ${theme}`).toEqual([]);
  }
}
