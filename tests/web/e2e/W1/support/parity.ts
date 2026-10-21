// Parity with W1's derived reference (docs/ui/derived/W1/), each built route brought to a reference state by the
// recorded API answers that state names (docs/ui/fixture/api/), so both sides show the same exchange, and the
// shell served the design fixture's trace.json. Structure only: the tagged regions in order (the unbuilt ones as
// not built yet), the catalogued components in each, the shell, the title and the navigation, and tokens in
// place of literal colours. Parity tests are the only ones that may pass at the stub, so a flow here never
// asserts on behaviour: it does what a person would, and the comparison polls until the page matches or times out.
//
// wb-policy's long-content state is a fake-clock test (CancelRenewedPolicyTests), not an exchange the API can be
// asked for, so no flow reaches it; its regions are the populated state's.
import { expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import { serveTrace, setTheme, themes, viewports } from '../../U0b/support/app';
import { literalColours } from '../../U0b/support/reference';
import { REC, answerWith, exchangeAt } from './recorded';
import type { RecordedExchange } from './recorded';
import { designFixtureDir, readBuilt, readReference, regionNamed, regionOrder, unbuiltComps } from './reference';
import type { Structure } from './reference';
import { fillSell, formOf, hold, openButton, route, sellButton, typeOnHome, unreachable } from './workbench';
import type { SellRequest } from './workbench';

export interface Screen {
  label: string;
  screen: 'wb-home' | 'wb-sell' | 'wb-policy';
  state: string;
  /** Brings the page to the reference's state, from a fresh page. */
  open(page: Page): Promise<void>;
}

const bodyOf = (exchange: RecordedExchange): SellRequest => exchange.requestBody as SellRequest;
const sold = exchangeAt(REC.sold, 0);
const soldReadBack = exchangeAt(REC.sold, 1);
const refused = exchangeAt(REC.refused, 0);
const otherSale = exchangeAt(REC.readBack, 0);
const readBack = exchangeAt(REC.readBack, 1);
const unknown = exchangeAt(REC.unknown, 0);

/** POST /api/policies answered from the recording whose request carries the same reference. */
async function answerSales(page: Page, sales: RecordedExchange[]): Promise<void> {
  await page.route(
    (url) => url.pathname === '/api/policies',
    (handled: Route) => {
      if (handled.request().method() !== 'POST') return handled.fallback();
      const typed = (handled.request().postDataJSON() as { reference?: string } | null)?.reference ?? '';
      const sale = sales.find((s) => bodyOf(s).reference === typed.trim().toUpperCase());
      if (sale === undefined) return handled.fallback();
      return handled.fulfill({ status: sale.status, contentType: 'application/json', body: JSON.stringify(sale.responseBody) });
    },
  );
}

/** Clicks Sell, and gives the answer a moment to land before the flow moves on (it may never come, at the stub). */
async function sellAndSettle(page: Page): Promise<void> {
  const answer = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/policies', { timeout: 5000 }).catch(() => null);
  await sellButton(page).click();
  await answer;
}

export const homeStates: Record<'populated' | 'submitting' | 'unreachable', Screen> = {
  populated: {
    label: 'workbench home',
    screen: 'wb-home',
    state: 'populated',
    // F1-MVFJOFJ8IS then F2-MVFJQA9DQG, both sold in this browser: the reference's list, newest first.
    open: async (page) => {
      await answerSales(page, [sold, otherSale]);
      await answerWith(page, soldReadBack);
      await answerWith(page, readBack);
      await fillSell(page, formOf(bodyOf(sold)));
      await sellAndSettle(page);
      await fillSell(page, formOf(bodyOf(otherSale)));
      await sellAndSettle(page);
      await page.goto(route.home);
    },
  },
  submitting: {
    label: 'workbench home, opening a policy',
    screen: 'wb-home',
    state: 'submitting',
    open: async (page) => {
      await hold(page, 'GET', `/api${soldReadBack.path}`);
      await typeOnHome(page, bodyOf(sold).reference);
      await openButton(page).click();
    },
  },
  unreachable: {
    label: 'workbench home, the API not answering',
    screen: 'wb-home',
    state: 'api-unreachable',
    open: async (page) => {
      await unreachable(page, 'GET', `/api${soldReadBack.path}`);
      await typeOnHome(page, bodyOf(sold).reference);
      await openButton(page).click();
    },
  },
};

export const sellStates: Record<'populated' | 'submitting' | 'error' | 'unreachable', Screen> = {
  populated: {
    label: 'sell form, after a 201',
    screen: 'wb-sell',
    state: 'populated',
    open: async (page) => {
      await answerWith(page, sold);
      await answerWith(page, soldReadBack);
      await fillSell(page, formOf(bodyOf(sold)));
      await sellButton(page).click();
    },
  },
  submitting: {
    label: 'sell form, the sale in flight',
    screen: 'wb-sell',
    state: 'submitting',
    open: async (page) => {
      await hold(page, 'POST', '/api/policies');
      await fillSell(page, formOf(bodyOf(sold)));
      await sellButton(page).click();
    },
  },
  error: {
    label: 'sell form, sent anyway and answered 422',
    screen: 'wb-sell',
    state: 'api-error',
    open: async (page) => {
      await answerWith(page, refused);
      await fillSell(page, formOf(bodyOf(refused)), { sendAnyway: true });
      await sellButton(page).click();
    },
  },
  unreachable: {
    label: 'sell form, the API not answering',
    screen: 'wb-sell',
    state: 'api-unreachable',
    open: async (page) => {
      await unreachable(page, 'POST', '/api/policies');
      await fillSell(page, formOf(bodyOf(sold)));
      await sellButton(page).click();
    },
  },
};

export const policyStates: Record<'populated' | 'error' | 'unreachable', Screen> = {
  populated: {
    label: 'policy view',
    screen: 'wb-policy',
    state: 'populated',
    open: async (page) => {
      await answerWith(page, readBack);
      await page.goto(route.policy(readBack.path.replace('/policies/', '')));
    },
  },
  error: {
    label: 'policy view, answered 404',
    screen: 'wb-policy',
    state: 'api-error',
    open: async (page) => {
      await answerWith(page, unknown);
      await page.goto(route.policy(unknown.path.replace('/policies/', '')));
    },
  },
  unreachable: {
    label: 'policy view, the API not answering',
    screen: 'wb-policy',
    state: 'api-unreachable',
    open: async (page) => {
      await unreachable(page, 'GET', `/api${readBack.path}`);
      await page.goto(route.policy(readBack.path.replace('/policies/', '')));
    },
  },
};

async function prepare(page: Page, s: Screen): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await s.open(page);
}

/** Every region of the reference, in its order, with its data-req; the unbuilt ones as the not-built-yet pattern. */
export async function expectRegionsInOrder(page: Page, s: Screen): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  await prepare(page, s);
  await expect
    .poll(async () => {
      const built = await readBuilt(page, reference);
      return { order: regionOrder(built), unbuilt: unbuiltComps(built) };
    })
    .toEqual({ order: regionOrder(reference), unbuilt: unbuiltComps(reference) });
}

/** One region of the reference, with its data-req and the catalogued components inside it. */
export async function expectRegionComponents(page: Page, s: Screen, slug: string): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
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

function shellOf(s: Structure): Record<string, unknown> {
  return { title: s.title, shell: s.shell, navLinks: s.navLinks, navNotBuilt: s.navNotBuilt, navCurrent: s.navCurrent };
}

/** The title, the shell's components and the primary nav (links, not-built entries, the current one). */
export async function expectShell(page: Page, s: Screen): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  await prepare(page, s);
  await expect.poll(async () => shellOf(await readBuilt(page, reference))).toEqual(shellOf(reference));
}

/** No colour on the page from a literal: the screen's styles, inline styles and SVG paint use tokens only. */
export async function expectTokensOnly(page: Page, s: Screen): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  await prepare(page, s);
  await expect.poll(async () => (await readBuilt(page, reference)).regions.length).toBe(reference.regions.length);
  for (const theme of themes) {
    await setTheme(page, theme);
    expect.soft(await page.evaluate(literalColours), `literal colours, ${theme}`).toEqual([]);
  }
}
