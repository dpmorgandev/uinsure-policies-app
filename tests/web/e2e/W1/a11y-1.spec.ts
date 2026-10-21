// A11Y-1 · WCAG 2.2 AA, checked with axe on every route W1 builds (the workbench home, the sell form, the policy
// view), light and dark, at 1440 and 390. Each audit runs on the page showing the live API's own answer to what
// the test did, never on canned content: it first waits for a value only that answer holds. The theme follows
// the system setting and the width the window, so each state is audited in all four without being rebuilt.
import { expect, live, test } from './support/api';
import type { Page } from '@playwright/test';
import { axeViolations, backgroundToken, setTheme, themes, tokenBackground, viewports } from '../U0b/support/app';
import type { Theme } from '../U0b/support/app';
import {
  PAST_START,
  answered,
  errorSummary,
  fillSell,
  readThroughApi,
  recentList,
  requestOf,
  route,
  sell,
  sellForm,
  sellThroughApi,
  storedPreview,
  watchApi,
} from './support/workbench';
import type { Policy, Problem } from './support/workbench';

const widths = [1440, 390] as const;

/**
 * Waits until a switch of system theme has taken effect. The page applies it from its matchMedia listener, after
 * emulateMedia has resolved, so <html> carries the new theme a moment later; then the kit's controls fade their
 * colours to it over --duration-short. Only once both are done are the theme's colours the ones on the page.
 */
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

/** axe on the page as it stands, in each theme and width. */
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

test('A11Y-1 · the workbench home, listing a policy sold here, has no axe violation, light and dark, at 1440 and 390', async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  await sell(page, sellForm('W1-AXE-1'));
  const stored = (await answered(seen, 'POST', '/api/policies')).responseBody as Policy;
  await page.goto(route.home);
  await expect(recentList(page).getByRole('link', { name: stored.reference, exact: true })).toBeVisible();
  await auditEverywhere(page);
});

test('A11Y-1 · the sell form, filled in, has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
  await fillSell(page, sellForm('  w1-axe-2 '));
  await expect(storedPreview(page)).toContainText('W1-AXE-2');
  await auditEverywhere(page);
});

test('A11Y-1 · the sell form, answered 201, has no axe violation, light and dark, at 1440 and 390', async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  await sell(page, sellForm('W1-AXE-3'));
  const stored = (await answered(seen, 'POST', '/api/policies')).responseBody as Policy;
  await expect(page.getByRole('main').getByRole('link', { name: `Open policy ${stored.reference}` })).toBeVisible();
  await auditEverywhere(page);
});

test('A11Y-1 · the sell form, sent anyway and answered 422, has no axe violation, light and dark, at 1440 and 390', async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  await sell(page, sellForm('W1-AXE-4', { startDate: PAST_START, amount: '0' }), { sendAnyway: true });
  const problem = (await answered(seen, 'POST', '/api/policies')).responseBody as Problem;
  await expect(errorSummary(page)).toContainText(problem.violations?.[0]?.detail ?? 'a violation');
  await auditEverywhere(page);
});

test('A11Y-1 · the sell form, answered 400 on a field, has no axe violation, light and dark, at 1440 and 390', async ({ page, api }) => {
  void api;
  const seen = watchApi(page);
  await sell(page, sellForm('W1-AXE-5', { startDate: '' }), { sendAnyway: true });
  const exchange = await answered(seen, 'POST', '/api/policies');
  expect(exchange.status).toBe(400);
  await expect(page.getByRole('main').locator('[aria-invalid="true"]').first(), 'the field the API named is marked').toBeVisible();
  await auditEverywhere(page);
});

test('A11Y-1 · the policy view has no axe violation, light and dark, at 1440 and 390', async ({ page, api }) => {
  void api;
  const stored = await sellThroughApi(requestOf(sellForm('W1-AXE-6')));
  await page.goto(route.policy(stored.reference));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Policy ${stored.reference}`);
  await expect(page.getByRole('main')).toContainText(stored.endDate, live);
  await auditEverywhere(page);
});

test('A11Y-1 · the policy view, answered 404, has no axe violation, light and dark, at 1440 and 390', async ({ page, api }) => {
  void api;
  const read = await readThroughApi('W1-AXE-NONE');
  expect(read.status, 'setup: the API has no such policy').toBe(404);
  await page.goto(route.policy('W1-AXE-NONE'));
  await expect(page.getByRole('main')).toContainText((read.body as Problem).detail ?? 'a detail', live);
  await auditEverywhere(page);
});
