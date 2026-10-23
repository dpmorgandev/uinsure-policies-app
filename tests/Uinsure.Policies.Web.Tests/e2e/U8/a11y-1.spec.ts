// U8 · A11Y-1 for W3's screens (D1; W3 review A4 R3): wb-claim, wb-renew and wb-requests have no axe violation,
// light and dark, at 1440 and 390. Each screen is brought to its reference states by W3's own flows on the recorded
// answers (../W3/support/states.ts), with the design fixture's trace.json, and audited once the state has landed.
// These guard screens W3 already built: they may pass on the HEAD they are written against (a coverage line, the
// gate.axe receipt's tests), and are not a red for a missing behaviour.
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { axeViolations, backgroundToken, serveTrace, setTheme, themes, tokenBackground, viewports } from '../U0b/support/app';
import type { Theme } from '../U0b/support/app';
import { designFixtureDir } from '../W1/support/reference';
import { claimStates, renewStates, requestsStates } from '../W3/support/states';
import type { W3Screen } from '../W3/support/states';

const widths = [1440, 390] as const;

/** The theme has taken effect, and the kit's controls have finished fading their colours to it. */
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

const screens: [string, W3Screen[]][] = [
  ['the record-a-claim screen', Object.values(claimStates)],
  ['the renew screen', Object.values(renewStates)],
  ['the request log', Object.values(requestsStates)],
];

for (const [name, states] of screens) {
  for (const s of states) {
    test(`A11Y-1 · ${name} (${s.screen} ${s.state}) has no axe violation, light and dark, at 1440 and 390`, async ({ page }) => {
      await serveTrace(page, designFixtureDir);
      await s.open(page);
      await expect(page.locator(`[data-region]`).first(), `setup: ${s.screen} ${s.state} has drawn its regions`).toBeVisible();
      await expect(page.getByRole('main')).not.toContainText(/is in flight/);
      await auditEverywhere(page);
    });
  }
}
