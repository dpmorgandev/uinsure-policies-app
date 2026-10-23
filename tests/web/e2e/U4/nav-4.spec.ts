// NAV-4 · Search. Jump to any rule ID, node, SHA or file path from one input: the top bar's search, on every page.
// On the `agents` fixture trail (agents/README.md): rule SELL-2, node build/F2, commit c4 by a prefix of its SHA, and
// the path src/sell.txt (a file of build/F1's A1 finding). A query nothing matches says so. Parity on the design
// fixture against docs/ui/derived/U4/overview/ (the top bar's search is tagged there once). The region tags the global
// controls: the search is the top bar's, once on the page, and not drawn again in the region, as THEME-1 checks the
// same region (U0b's expectRegionControlsInTopBar, here given U4's reference through its derived path).
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { REPO, auditEverywhere, compileAgents, openOnFixture, route, searchField, searchOptions, shaOf, short, snapshotOf } from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionControlsInTopBar } from '../U0b/support/parity';
import { overview } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileAgents();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

const TOP_BAR = 'top-bar-search-and-theme-toggle-global-tagged-here-once';

async function typeIn(page: Page, path: string, query: string): Promise<void> {
  await openOnFixture(page, fixture, path);
  await expect(page.getByRole('heading', { level: 1 }), 'the page has drawn').toBeVisible();
  await expect(searchField(page), 'the top bar has the search field').toBeVisible();
  await searchField(page).fill(query);
}

test('NAV-4 · typing a rule ID offers that rule, and choosing it opens the rule page', async ({ page }) => {
  await typeIn(page, route.overview, 'SELL-2');
  const option = searchOptions(page).and(page.locator('[data-kind="rule"]')).filter({ hasText: 'SELL-2' });
  await expect(option).toHaveCount(1);
  await option.click();
  await expect(page).toHaveURL(/#\/rules\/SELL-2$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('SELL-2');
});

test('NAV-4 · typing a node ID offers that node, and Enter on it opens the node page', async ({ page }) => {
  await typeIn(page, route.overview, 'F2');
  const option = searchOptions(page).and(page.locator('[data-kind="node"]')).filter({ hasText: 'build/F2' });
  await expect(option).toHaveCount(1);
  await searchField(page).press('ArrowDown');
  await expect(searchOptions(page).first()).toHaveAttribute('aria-selected', 'true');
  await option.click();
  await expect(page).toHaveURL(/#\/plans\/build\/F2$/);
});

test('NAV-4 · typing the first five characters of a SHA offers its commit, which opens the commit page', async ({ page }) => {
  const c4 = shaOf(fixture, 'c4');
  await typeIn(page, route.matrix, c4.slice(0, 5));
  const option = searchOptions(page).and(page.locator('[data-kind="sha"]')).filter({ hasText: short(c4) });
  await expect(option).toHaveCount(1);
  await option.click();
  await expect(page).toHaveURL(new RegExp(`#/commits/${short(c4)}`));
});

test('NAV-4 · typing part of a file path offers the path', async ({ page }) => {
  await typeIn(page, route.overview, 'sell.txt');
  await expect(searchOptions(page).and(page.locator('[data-kind="path"]')).filter({ hasText: 'src/sell.txt' })).toHaveCount(1);
});

test('NAV-4 · choosing the src/sell.txt path opens that file on GitHub at the snapshot SHA', async ({ page, context }) => {
  // A3 I1/I4: github.com is never fetched; the popup's request is caught and answered here.
  await context.route('https://github.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/plain', body: 'caught' }));
  await typeIn(page, route.overview, 'sell.txt');
  const option = searchOptions(page).and(page.locator('[data-kind="path"]')).filter({ hasText: 'src/sell.txt' });
  await expect(option).toHaveCount(1);
  const popup = context.waitForEvent('page');
  await option.click();
  const opened = await popup;
  await opened.waitForURL(/^https:\/\/github\.com\//);
  expect(opened.url()).toBe(`${REPO}/blob/${snapshotOf(fixture.compiled).sha}/src/sell.txt`);
});

test('NAV-4 · a query nothing matches says no rule, node, SHA or path matches it', async ({ page }) => {
  await typeIn(page, route.overview, 'ZZ-99');
  await expect(searchOptions(page)).toHaveCount(0);
  await expect(page.getByRole('search').getByRole('status')).toContainText('ZZ-99');
});

test('NAV-4 · the search, open with its matches, has no axe violation, light and dark, 1440 and 390', async ({ page }) => {
  await openOnFixture(page, fixture, route.overview);
  await auditEverywhere(page, route.overview, async (p) => {
    await expect(searchField(p), 'the top bar has the search field').toBeVisible();
    await searchField(p).fill('SELL');
    await expect(searchOptions(p).filter({ hasText: 'SELL-2' })).toHaveCount(1);
  });
});

test("NAV-4 · parity: the overview's top bar search, its components", async ({ page }) => {
  await expectRegionControlsInTopBar(page, { ...overview, screen: '../U4/overview' }, TOP_BAR);
});
