// PERF-1 · Fast from cold. First screen interactive in under 2 s on a laptop from a static host. PERF-1 is on no screen
// region, so it is tested off-screen: the app marks its first screen interactive as the performance mark
// `docket:interactive`, and from a cold browser context (no cache) on the design fixture (docs/ui/fixture/, the
// largest trace.json the app is drawn from) the mark lands within 2000 ms of navigation start. At cold load the app
// asks for trace.json and no lazy chunk; a chunk is asked for only when its screen opens.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { recordRequests, serveTrace, setTheme, viewports } from '../U0b/support/app';
import { designFixtureDir } from '../U0b/support/trail';

const MARK = 'docket:interactive';
const BUDGET_MS = 2000;

/** The startTime of the app's interactive mark, or null while it has none. */
async function interactiveAt(page: Page): Promise<number | null> {
  return page.evaluate((name) => performance.getEntriesByName(name, 'mark')[0]?.startTime ?? null, MARK);
}

test('PERF-1 · from cold, the overview marks itself interactive within 2 s of navigation', async ({ page }) => {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await page.goto('/#/');
  await expect.poll(() => interactiveAt(page), { message: `the app records ${MARK}`, timeout: 5000 }).not.toBeNull();
  expect(await interactiveAt(page)).toBeLessThan(BUDGET_MS);
});

test('PERF-1 · the interactive mark is recorded once the page is drawn, not before its data', async ({ page }) => {
  await serveTrace(page, designFixtureDir);
  await page.goto('/#/rules');
  await expect.poll(() => interactiveAt(page), { message: `the app records ${MARK}`, timeout: 5000 }).not.toBeNull();
  const traceDone = await page.evaluate(
    () => (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).find((r) => r.name.endsWith('/trace.json'))?.responseEnd ?? null,
  );
  expect(traceDone, 'trace.json was fetched').not.toBeNull();
  expect(await interactiveAt(page)).toBeGreaterThanOrEqual(traceDone ?? Number.POSITIVE_INFINITY);
});

test('PERF-1 · a deep link from cold marks itself interactive within 2 s, asking for no lazy chunk it does not draw', async ({ page }) => {
  const requests = recordRequests(page);
  await serveTrace(page, designFixtureDir);
  await page.goto('/#/rules/GET-1');
  await expect.poll(() => interactiveAt(page), { message: `the app records ${MARK}`, timeout: 5000 }).not.toBeNull();
  expect(await interactiveAt(page)).toBeLessThan(BUDGET_MS);
  expect(requests.filter((url) => /\/trace\/[^/]+\/[^/]+\/(activity|diffs)\.json$/.test(url.pathname)).map((u) => u.pathname)).toEqual([]);
});
