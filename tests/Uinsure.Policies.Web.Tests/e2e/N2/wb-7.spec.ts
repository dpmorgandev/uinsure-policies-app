// bug-002 N2 · WB-7 · HTTP inspector: the exact request and response of every action, on every workbench screen.
// The reproduction of inv-009 #2, #5, #6 and #7 (I7, I8, I11, I12, I13), one test per acceptance line of N2:
//
// - Sell and Cancel show the request as sent and the response got in their inspector region, where main draws the
//   "not built yet" placeholder (SellPolicy.tsx, CancelPolicy.tsx: NotBuiltRegion).
// - After a send on every workbench screen the latest request and response are visible with no further click
//   (RequestsDrawer.tsx starts closed on every mount, and nothing opens it on a send).
// - On wb-claim the requests drawer never covers the Record this claim button, and the contentinfo footer is the last
//   box below main (RecordClaim.tsx mounts the sticky drawer inside its last section).
// - JSON request and response bodies are indented in the drawer; the wire text stays exact (api.ts sends compact
//   JSON, which the drawer prints on one line).
//
// On the live API (W1's support/api.ts, the node's port), each policy sold for the test through the API itself. Every
// expected value is the exchange the page itself saw (watchApi), never a figure written here.
import type { Locator, Page } from '@playwright/test';
import { expect, live, test } from '../W1/support/api';
import { serveTrace, setTheme, viewports } from '../U0b/support/app';
import { designFixtureDir } from '../U0b/support/trail';
import { sellStates } from '../W1/support/parity';
import { answered, apiToday, daysFromToday, field, requestOf, route, sell, sellForm, sellThroughApi, watchApi } from '../W1/support/workbench';
import type { Exchange } from '../W1/support/workbench';
import { cancelStates, openCancel, quote } from '../W2/support/cancel';
import { freshReference } from '../W3/support/fresh';

/** Every string, number or boolean anywhere in a JSON value, as text. */
function leaves(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(leaves);
  return Object.values(value as Record<string, unknown>).flatMap(leaves);
}

const apiPath = (e: Exchange): string => e.path.replace(/^\/api/, '');

/** The kit InspectorDrawer: an aside labelled by its heading. */
const drawerIn = (scope: Page | Locator): Locator => scope.getByRole('complementary', { name: 'The requests as sent' });

/** The drawer's item for this exchange: its request line reads "<METHOD> <path>". */
const itemFor = (drawer: Locator, e: Exchange): Locator =>
  drawer.getByRole('listitem').filter({ hasText: `${e.method} ${apiPath(e)}` }).first();

/** An item's request-and-response block, the kit's scroll region "Request #n, request and response". */
const exchangeOf = (item: Locator): Locator => item.getByRole('region', { name: /^Request #\d+, request and response$/ });

/** Waits until every request the page has sent is answered, and gives the newest. */
async function latestOf(seen: Exchange[]): Promise<Exchange> {
  await expect.poll(() => seen.length > 0 && seen.every((e) => e.done), { message: 'every request the page sent is answered', ...live }).toBe(true);
  return seen[seen.length - 1] as Exchange;
}

/** The newest item is this exchange, shown open: its line, its status, and its request and response, all visible. */
async function expectLatestShown(drawer: Locator, latest: Exchange): Promise<void> {
  const newest = drawer.getByRole('listitem').first();
  await expect(newest, 'the drawer shows the newest request').toBeVisible(live);
  await expect(newest, 'the newest item is the latest exchange').toContainText(`${latest.method} ${apiPath(latest)}`);
  await expect(newest).toContainText(String(latest.status));
  const shown = exchangeOf(newest);
  await expect(shown, "the latest exchange's request and response are shown, with no click").toBeVisible();
  for (const value of leaves(latest.requestBody)) await expect(shown, `the request's ${value}`).toContainText(value);
  for (const value of leaves(latest.responseBody)) await expect(shown, `the response's ${value}`).toContainText(value);
}

// ── Acceptance 1: Sell and Cancel build their inspector region ─────────────────────────────────────────────────

test('WB-7 · the sell screen shows the sale it sent and the 201 it got in its request-as-sent inspector region', async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  await sell(page, sellForm(freshReference('N2SI'), { amount: '611.29' }));
  const sale = await answered(seen, 'POST', '/api/policies');
  expect(sale.status, 'setup: the API sold the policy').toBe(201);
  const inspector = page.locator('[data-region="the-request-as-sent-inspector"]');
  await expect(inspector, 'the inspector region is on the page').toHaveCount(1);
  await expect(inspector, 'the region is built, not the not-built-yet placeholder').not.toHaveAttribute('data-built', 'false');
  await expect(inspector, 'the region claims WB-7').toHaveAttribute('data-req', 'WB-7');
  const item = itemFor(drawerIn(inspector), sale);
  await expect(item, 'the region lists POST /policies').toBeVisible(live);
  await expect(item).toContainText('201');
  const shown = exchangeOf(item);
  for (const value of leaves(sale.requestBody)) await expect(shown, `the request's ${value}`).toContainText(value);
  for (const value of leaves(sale.responseBody)) await expect(shown, `the response's ${value}`).toContainText(value);
});

test('WB-7 · the cancel screen shows the quote it asked for and the answer it got in its requests-as-sent inspector region', async ({ page, api }) => {
  void api;
  const reference = freshReference('N2CI');
  await sellThroughApi(requestOf(sellForm(reference, { startDate: daysFromToday(10), amount: '633.41', paymentMethod: 'Card' })));
  const seen = watchApi(page);
  await openCancel(page, reference);
  await quote(page, reference, daysFromToday(40));
  const quoted = await answered(seen, 'GET', `/api/policies/${reference}/cancellation-quote`);
  const inspector = page.locator('[data-region="the-requests-as-sent-inspector"]');
  await expect(inspector, 'the inspector region is on the page').toHaveCount(1);
  await expect(inspector, 'the region is built, not the not-built-yet placeholder').not.toHaveAttribute('data-built', 'false');
  await expect(inspector, 'the region claims WB-7').toHaveAttribute('data-req', 'WB-7');
  const item = itemFor(drawerIn(inspector), quoted);
  await expect(item, 'the region lists the quote request').toBeVisible(live);
  await expect(item).toContainText(String(quoted.status));
  const shown = exchangeOf(item);
  for (const value of leaves(quoted.responseBody)) await expect(shown, `the quote's ${value}`).toContainText(value);
});

// ── Acceptance 3: after a send, the latest exchange is shown with no further click ─────────────────────────────

test('WB-7 · after a sale on the sell screen the latest request and response are visible without a further click', async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  await sell(page, sellForm(freshReference('N2SL'), { amount: '602.17' }));
  await answered(seen, 'POST', '/api/policies');
  await expectLatestShown(drawerIn(page.getByRole('main')), await latestOf(seen));
});

test('WB-7 · after a quote on the cancel screen the latest request and response are visible without a further click', async ({ page, api }) => {
  void api;
  const reference = freshReference('N2CL');
  await sellThroughApi(requestOf(sellForm(reference, { startDate: daysFromToday(10), amount: '644.52', paymentMethod: 'Card' })));
  const seen = watchApi(page);
  await openCancel(page, reference);
  await quote(page, reference, daysFromToday(40));
  await expectLatestShown(drawerIn(page.getByRole('main')), await latestOf(seen));
});

test('WB-7 · after a claim on the claim screen the latest request and response are visible without a further click', async ({ page, api }) => {
  void api;
  const reference = freshReference('N2KL');
  const today = await apiToday(freshReference('N2KLP'));
  await sellThroughApi(requestOf(sellForm(reference, { startDate: today })));
  const seen = watchApi(page);
  await page.goto(route.claim(reference));
  await field(page, 'Claim date').fill(today);
  await field(page, 'Claim description').fill('Hail cracked the conservatory roof');
  await page.getByRole('main').getByRole('button', { name: 'Record this claim' }).click();
  await answered(seen, 'POST', `/api/policies/${reference}/claims`);
  await expectLatestShown(drawerIn(page.getByRole('main')), await latestOf(seen));
});

test('WB-7 · after a renewal on the renew screen the latest request and response are visible without a further click', async ({ page, api }) => {
  void api;
  const reference = freshReference('N2RL');
  await sellThroughApi(requestOf(sellForm(reference, { autoRenew: false })));
  const seen = watchApi(page);
  await page.goto(route.renew(reference));
  await expect(field(page, 'Renewal amount')).toBeVisible(live);
  await field(page, 'Renewal amount').fill('538.26');
  await page.getByRole('main').getByRole('button', { name: 'Renew policy' }).click();
  await answered(seen, 'POST', `/api/policies/${reference}/renewals`);
  await expectLatestShown(drawerIn(page.getByRole('main')), await latestOf(seen));
});

// ── Acceptance 2: on wb-claim the drawer never covers the button; the footer is the last box ──────────────────

interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

for (const width of [1440, 390] as const) {
  test(`WB-7 · on the claim screen at ${width} the requests drawer never covers Record this claim at any scroll, and the footer is the last box below main`, async ({ page, api }) => {
    void api;
    await page.setViewportSize(viewports[width]);
    const reference = freshReference(`N2KO${width}`);
    const today = await apiToday(freshReference(`N2KOP${width}`));
    await sellThroughApi(requestOf(sellForm(reference, { startDate: today })));
    const seen = watchApi(page);
    await page.goto(route.claim(reference));
    await field(page, 'Claim date').fill(today);
    await field(page, 'Claim description').fill('Water came through the bay window');
    const button = page.getByRole('main').getByRole('button', { name: /^(Record this claim|Recording…)$/ });
    await button.click();
    await answered(seen, 'POST', `/api/policies/${reference}/claims`);
    await latestOf(seen);
    await expect(drawerIn(page), 'setup: the page has its requests drawer').toHaveCount(1);
    await expect(button, 'setup: the claim has been answered').toHaveText('Record this claim', live);

    // Every scroll position, top to bottom: where both are on screen, the drawer's box and the button's never meet.
    const covered = await page.evaluate(() => {
      const drawer = [...document.querySelectorAll('aside[aria-labelledby]')].find(
        (a) => document.getElementById(a.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() === 'The requests as sent',
      ) as HTMLElement;
      const target = [...document.querySelectorAll('main button')].find((b) => b.textContent?.trim() === 'Record this claim') as HTMLElement;
      const hits: { scrollY: number; drawer: Box; button: Box }[] = [];
      const box = (el: HTMLElement): Box => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      };
      const end = document.documentElement.scrollHeight - window.innerHeight;
      for (let y = 0; y <= end + 10; y += 10) {
        window.scrollTo(0, Math.min(y, end));
        const d = box(drawer);
        const b = box(target);
        const onScreen = (r: Box): boolean => r.bottom > 0 && r.top < window.innerHeight;
        const meet = d.top < b.bottom && b.top < d.bottom && d.left < b.right && b.left < d.right;
        if (onScreen(d) && onScreen(b) && meet) hits.push({ scrollY: window.scrollY, drawer: d, button: b });
      }
      return hits;
    });
    expect(covered, 'scroll positions where the drawer covers the Record this claim button').toEqual([]);

    // Scrolled to the end: main, then the drawer, then the footer last of all, below both.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const footer = await page.getByRole('contentinfo').boundingBox();
    const main = await page.getByRole('main').boundingBox();
    const drawer = await drawerIn(page).boundingBox();
    expect(footer, 'setup: the page has its contentinfo footer').not.toBeNull();
    const footerTop = (footer as { y: number }).y;
    expect(footerTop, 'the footer starts below the drawer').toBeGreaterThanOrEqual(Math.floor((drawer as { y: number; height: number }).y + (drawer as { height: number }).height));
    expect(footerTop, 'the footer starts below main').toBeGreaterThanOrEqual(Math.floor((main as { y: number; height: number }).y + (main as { height: number }).height));
  });
}

// ── Acceptance 4: bodies indented in the drawer, the wire text exact ───────────────────────────────────────────

test('WB-7 · the claim screen drawer shows the claim request and response JSON indented, one key a line, while the wire text stays compact', async ({ page, api }) => {
  void api;
  const reference = freshReference('N2KI');
  const today = await apiToday(freshReference('N2KIP'));
  await sellThroughApi(requestOf(sellForm(reference, { startDate: today })));
  const seen = watchApi(page);
  const sentClaim = page.waitForRequest((r) => new URL(r.url()).pathname === `/api/policies/${reference}/claims` && r.method() === 'POST', live);
  await page.goto(route.claim(reference));
  await field(page, 'Claim date').fill(today);
  await field(page, 'Claim description').fill('Frozen pipe split in the loft');
  await page.getByRole('main').getByRole('button', { name: 'Record this claim' }).click();
  const claim = await answered(seen, 'POST', `/api/policies/${reference}/claims`);
  const wire = (await sentClaim).postData();
  expect(wire, 'the claim went over the wire as compact JSON, as the page built it').toBe(JSON.stringify(claim.requestBody));

  // Read whether or not the drawer is open: the layout of the bodies is this test's, the open state another's.
  const item = drawerIn(page).locator('li').filter({ hasText: `${claim.method} ${apiPath(claim)}` });
  await expect(item, 'setup: the drawer lists the claim').toHaveCount(1, live);
  const text = (await item.locator('pre').evaluate((el) => el.textContent ?? '')) as string;
  expect(text, 'the request body is not printed on one line').not.toContain(wire as string);
  for (const key of Object.keys(claim.requestBody as Record<string, unknown>)) {
    expect(text, `the request's ${key} starts its own indented line`).toMatch(new RegExp(`^[ \\t]+"?${key}"?\\s*:`, 'm'));
  }
  const response = claim.responseBody as Record<string, unknown>;
  expect(text, 'the response body is not printed on one line').not.toContain(JSON.stringify(response));
  for (const key of Object.keys(response)) {
    expect(text, `the response's ${key} starts its own indented line`).toMatch(new RegExp(`^[ \\t]+"?${key}"?\\s*:`, 'm'));
  }
});

// ── A1/I7: the inspector regions as signed off (docs/ui/screens/wb-sell/, docs/ui/screens/wb-cancel/) ──────────
// Parity compares data-req, data-comp and order only, so it can't see a region's heading or its dock. On the recorded
// populated states (docs/ui/fixture/api/), the design fixture serving the shell's trace data.

/** The signed-off headings of the two inspector regions. */
const SELL_RECEIPT = 'Receipt for rung 4: what was sent, what came back';
const CANCEL_REQUESTS = 'Requests';

async function recordedState(page: Page, width: 1440 | 390, open: (page: Page) => Promise<void>): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[width]);
  await open(page);
  await page.waitForLoadState('networkidle');
}

test('WB-7 · the sell screen\'s inspector region is the receipt section labelled "Receipt for rung 4: what was sent, what came back", holding the drawer', async ({ page }) => {
  await recordedState(page, 1440, sellStates.populated.open);
  const inspector = page.locator('[data-region="the-request-as-sent-inspector"]');
  await expect(inspector, 'setup: the inspector region is on the page').toHaveCount(1);
  await expect(inspector.getByRole('heading', { level: 2, name: SELL_RECEIPT, exact: true }), 'the region carries its signed-off heading').toHaveCount(1);
  const labelled = page.getByRole('region', { name: SELL_RECEIPT, exact: true });
  await expect(labelled, 'the region is labelled by that heading').toHaveAttribute('data-region', 'the-request-as-sent-inspector');
  await expect(drawerIn(labelled), 'the drawer sits inside the labelled region').toHaveCount(1);
});

test('WB-7 · the cancel screen\'s inspector region is headed "Requests", with the drawer docked inside it below the heading', async ({ page }) => {
  await recordedState(page, 1440, cancelStates.populated.open);
  const inspector = page.locator('[data-region="the-requests-as-sent-inspector"]');
  await expect(inspector, 'setup: the inspector region is on the page').toHaveCount(1);
  await expect(inspector.getByRole('heading', { level: 2, name: CANCEL_REQUESTS, exact: true }), 'the region carries its signed-off heading').toHaveCount(1);
  const layout = await inspector.evaluate((region, name) => {
    const drawer = [...region.querySelectorAll('aside[aria-labelledby]')].find(
      (a) => document.getElementById(a.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() === name,
    );
    const dock = drawer?.parentElement ?? null;
    return {
      firstChild: region.firstElementChild ? `${region.firstElementChild.tagName.toLowerCase()} ${region.firstElementChild.textContent?.trim() ?? ''}` : null,
      dockIsRegionChild: dock !== null && dock !== region && dock.parentElement === region,
      dockHoldsOnlyTheDrawer: dock !== null && dock !== region && dock.childElementCount === 1,
      dockAfterHeading: dock !== null && region.firstElementChild !== null && dock.previousElementSibling === region.firstElementChild,
    };
  }, 'The requests as sent');
  expect(layout, 'the heading first, then the dock holding the drawer alone').toEqual({
    firstChild: `h2 ${CANCEL_REQUESTS}`,
    dockIsRegionChild: true,
    dockHoldsOnlyTheDrawer: true,
    dockAfterHeading: true,
  });
});

for (const width of [1440, 390] as const) {
  test(`WB-7 · on the cancel screen at ${width} the requests drawer never covers the Requests heading at any scroll`, async ({ page }) => {
    await recordedState(page, width, cancelStates.populated.open);
    const inspector = page.locator('[data-region="the-requests-as-sent-inspector"]');
    const heading = inspector.getByRole('heading', { level: 2, name: CANCEL_REQUESTS, exact: true });
    await expect(heading, 'the region carries its signed-off heading').toHaveCount(1);
    await expect(drawerIn(inspector), 'setup: the region holds the drawer').toHaveCount(1);
    const covered = await inspector.evaluate((region, name) => {
      const drawer = [...region.querySelectorAll('aside[aria-labelledby]')].find(
        (a) => document.getElementById(a.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() === name,
      ) as HTMLElement;
      const title = region.querySelector(':scope > h2') as HTMLElement;
      const hits: { scrollY: number }[] = [];
      const end = document.documentElement.scrollHeight - window.innerHeight;
      for (let y = 0; y <= end + 10; y += 10) {
        window.scrollTo(0, Math.min(y, end));
        const d = drawer.getBoundingClientRect();
        const h = title.getBoundingClientRect();
        const onScreen = (r: DOMRect): boolean => r.bottom > 0 && r.top < window.innerHeight;
        const meet = d.top < h.bottom && h.top < d.bottom && d.left < h.right && h.left < d.right;
        if (onScreen(d) && onScreen(h) && meet) hits.push({ scrollY: window.scrollY });
      }
      return hits;
    }, 'The requests as sent');
    expect(covered, 'scroll positions where the drawer covers the Requests heading').toEqual([]);
  });

  test(`WB-7 · on the cancel screen at ${width}, scrolled to the end, the page ends at the footer's bottom`, async ({ page }) => {
    await recordedState(page, width, cancelStates.populated.open);
    await expect(drawerIn(page.locator('[data-region="the-requests-as-sent-inspector"]')), 'setup: the inspector holds the drawer').toHaveCount(1);
    await expect(page.getByRole('contentinfo'), 'setup: the page has its contentinfo footer').toHaveCount(1);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const measured = await page.evaluate(() => {
      // The contentinfo footer: a footer not scoped to main or to a sectioning element.
      const footer = [...document.querySelectorAll('footer')].find((f) => f.closest('main, article, aside, nav, section') === null) as HTMLElement;
      return { scrollHeight: document.documentElement.scrollHeight, footerBottom: Math.round(footer.getBoundingClientRect().bottom + window.scrollY) };
    });
    expect(Math.abs(measured.scrollHeight - measured.footerBottom), `no page below the footer: ${JSON.stringify(measured)}`).toBeLessThanOrEqual(1);
  });
}

// ── A2/I1, I2: the sell receipt heading is seen, not only present (the cancel checks above, on wb-sell) ─────────
// A bare sticky drawer after the h2 has the whole receipt section as its sticky range, so it rides up over the h2.

for (const width of [1440, 390] as const) {
  test(`WB-7 · on the sell screen at ${width} the requests drawer never covers the receipt heading at any scroll`, async ({ page }) => {
    await recordedState(page, width, sellStates.populated.open);
    const inspector = page.locator('[data-region="the-request-as-sent-inspector"]');
    const heading = inspector.getByRole('heading', { level: 2, name: SELL_RECEIPT, exact: true });
    await expect(heading, 'the region carries its signed-off heading').toHaveCount(1);
    await expect(drawerIn(inspector), 'setup: the region holds the drawer').toHaveCount(1);
    await expect(drawerIn(inspector).getByRole('listitem').first(), 'setup: the drawer lists the sale').toBeVisible(live);
    const covered = await inspector.evaluate((region, name) => {
      const drawer = [...region.querySelectorAll('aside[aria-labelledby]')].find(
        (a) => document.getElementById(a.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() === name,
      ) as HTMLElement;
      const title = region.querySelector(':scope > h2') as HTMLElement;
      const hits: { scrollY: number }[] = [];
      const end = document.documentElement.scrollHeight - window.innerHeight;
      for (let y = 0; y <= end + 10; y += 10) {
        window.scrollTo(0, Math.min(y, end));
        const d = drawer.getBoundingClientRect();
        const h = title.getBoundingClientRect();
        const onScreen = (r: DOMRect): boolean => r.bottom > 0 && r.top < window.innerHeight;
        const meet = d.top < h.bottom && h.top < d.bottom && d.left < h.right && h.left < d.right;
        if (onScreen(d) && onScreen(h) && meet) hits.push({ scrollY: window.scrollY });
      }
      return hits;
    }, 'The requests as sent');
    expect(covered, `scroll positions where the drawer covers the "${SELL_RECEIPT}" heading`).toEqual([]);
  });

  // Scrolled to the end in a live window the sticky drawer is back in its own place, so the page already ends at the
  // footer on a bare drawer: the blank band under the drawer in the regression shots is the drawer having left its
  // place. So this test pins both: the page ends at the footer, and the drawer keeps one place on the page at every
  // scroll (as cancel's docked drawer does), leaving nothing blank below it.
  test(`WB-7 · on the sell screen at ${width} the requests drawer keeps its place on the page at every scroll, and scrolled to the end the page ends at the footer's bottom`, async ({ page }) => {
    await recordedState(page, width, sellStates.populated.open);
    const inspector = page.locator('[data-region="the-request-as-sent-inspector"]');
    await expect(drawerIn(inspector), 'setup: the inspector holds the drawer').toHaveCount(1);
    await expect(drawerIn(inspector).getByRole('listitem').first(), 'setup: the drawer lists the sale').toBeVisible(live);
    await expect(page.getByRole('contentinfo'), 'setup: the page has its contentinfo footer').toHaveCount(1);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const measured = await page.evaluate(() => {
      // The contentinfo footer: a footer not scoped to main or to a sectioning element.
      const footer = [...document.querySelectorAll('footer')].find((f) => f.closest('main, article, aside, nav, section') === null) as HTMLElement;
      return { scrollHeight: document.documentElement.scrollHeight, footerBottom: Math.round(footer.getBoundingClientRect().bottom + window.scrollY) };
    });
    expect(Math.abs(measured.scrollHeight - measured.footerBottom), `no page below the footer: ${JSON.stringify(measured)}`).toBeLessThanOrEqual(1);

    const places = await inspector.evaluate((region, name) => {
      const drawer = [...region.querySelectorAll('aside[aria-labelledby]')].find(
        (a) => document.getElementById(a.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() === name,
      ) as HTMLElement;
      const tops = new Set<number>();
      const end = document.documentElement.scrollHeight - window.innerHeight;
      for (let y = 0; y <= end + 10; y += 10) {
        window.scrollTo(0, Math.min(y, end));
        tops.add(Math.round(drawer.getBoundingClientRect().top + window.scrollY));
      }
      return [...tops].sort((a, b) => a - b);
    }, 'The requests as sent');
    expect(places, "the drawer's top on the page, at every scroll top to bottom: one place only").toHaveLength(1);
  });
}
