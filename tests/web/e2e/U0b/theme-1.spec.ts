// THEME-1 · Light and dark. Both themes from the same tokens, following the system setting, with a manual toggle
// in the top bar: data-theme="light" | "dark" on <html>. On the `complete` fixture trail; parity on the design
// fixture against docs/ui/derived/U0b/.
import { expect, test } from '@playwright/test';
import { backgroundToken, expectFooterStamp, route, serveTrace, setTheme, snapshotOf, tokenBackground } from './support/app';
import { about, activity, expectRegionComponents, expectTokensOnly, overview } from './support/parity';
import { compileFixture } from './support/trail';
import type { CompiledTrail } from './support/trail';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileFixture('complete');
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

test('THEME-1 · with no choice made, the theme follows the system setting, dark and light', async ({ page }) => {
  const snap = snapshotOf(fixture.compiled);
  await serveTrace(page, fixture.compiled.publicDir);
  await setTheme(page, 'dark');
  await page.goto(route.overview);
  await expectFooterStamp(page, snap);
  await expect(page.getByRole('banner').getByRole('radio', { name: 'System' })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await backgroundToken(page)).toBe(tokenBackground.dark);
  await setTheme(page, 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await backgroundToken(page)).toBe(tokenBackground.light);
});

test("THEME-1 · the top bar's toggle overrides the system setting, holds across pages, and System hands it back", async ({ page }) => {
  const snap = snapshotOf(fixture.compiled);
  await serveTrace(page, fixture.compiled.publicDir);
  await setTheme(page, 'light');
  await page.goto(route.overview);
  await expectFooterStamp(page, snap);
  const bar = page.getByRole('banner');
  await bar.getByRole('radio', { name: 'Dark' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await backgroundToken(page)).toBe(tokenBackground.dark);
  await page.getByRole('navigation', { name: /^Primary/ }).getByRole('link', { name: 'How to read this' }).click();
  await expect(page).toHaveURL(/#\/about$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(bar.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await bar.getByRole('radio', { name: 'System' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await setTheme(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await bar.getByRole('radio', { name: 'Light' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await backgroundToken(page)).toBe(tokenBackground.light);
});

test.describe('parity', () => {
  test("THEME-1 · parity: the overview's top-bar region carries the search and the theme toggle", async ({ page }) => {
    await expectRegionComponents(page, overview, 'top-bar-search-and-theme-toggle-global-tagged-here-once');
  });

  for (const s of [overview, about, activity]) {
    test(`THEME-1 · parity: the ${s.label} colours only from tokens, light and dark`, async ({ page }) => {
      await expectTokensOnly(page, s);
    });
  }
});
