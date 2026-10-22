// The regression suite: every built screen, in each drawn state its node's tests reach, photographed at 1440 and 390,
// light and dark, against its baseline (docs/ui/baselines/<screen>/<state>-<width>-<theme>.png, through the config's
// snapshotPathTemplate). These guard the look, not a rule, so their titles carry no rule prefix.
//
// The data is fixed, so a run tomorrow draws the same pixels:
// - every screen's shell reads the design fixture's trace.json (docs/ui/fixture/), served by the test;
// - a workbench screen's /api/… requests are answered from the recorded API answers (docs/ui/fixture/api/), through
//   the same flows W1's parity uses; any other /api/… request is refused in the browser, so nothing reaches a network;
// - the browser's clock is fixed (Date only; timers still run) at the moment the data was recorded: the design
//   fixture's compiledAt for an explorer screen, the recordings' own recordedAt for a workbench screen, so the sell
//   form's own date checks agree with the answers it is shown;
// - the locale and time zone are fixed (en-GB, Europe/London), so no number or date is formatted by the machine's.
//
// Each test waits until its state is drawn (the snapshot's footer stamp, the theme on <html>, the fonts, the colour
// transitions, and the state's own marker), then compares one full-page screenshot. Until the baselines are written
// at the trace step, every test is meant to fail on its missing baseline alone; a wait above timing out is a setup
// fault, not that failure.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import type { Locator, Page, Route } from '@playwright/test';
import { serveTrace, setTheme, themes, viewports } from '../../U0b/support/app';
import type { Theme } from '../../U0b/support/app';
import { designFixtureDir } from '../../U0b/support/trail';
import { REC, recordedDir } from '../../W1/support/recorded';
import { openButton, sellButton } from '../../W1/support/workbench';

export const widths = [1440, 390] as const;
export type Width = (typeof widths)[number];

interface DesignFixture {
  compiledAt: { sha: string; utc: string };
}

const designFixture = JSON.parse(readFileSync(join(designFixtureDir, 'trace.json'), 'utf8')) as DesignFixture;

/** The snapshot the shell's footer stamps: the design fixture's. */
export const fixtureShort = designFixture.compiledAt.sha.slice(0, 7);

/** An explorer screen's clock: the moment the design fixture was compiled. */
export const EXPLORER_NOW = designFixture.compiledAt.utc;

/** A workbench screen's clock: the moment the SELL-1 sale the workbench's states are built on was recorded. */
export const WORKBENCH_NOW = (JSON.parse(readFileSync(join(recordedDir, REC.sold), 'utf8')) as { recordedAt: string }).recordedAt;

/** One drawn state of a screen: how a fresh page reaches it, and how a test knows it is drawn. */
export interface State {
  /** The state's name, as the screen's references name it (docs/ui/screens/<screen>/screen.json). */
  name: string;
  /** Brings a fresh page, its trace data, theme and width already set, to the state. */
  open(page: Page): Promise<void>;
  /** Resolves once the state's own content is on the page. */
  drawn(page: Page): Promise<void>;
}

/** Every request to /api/… that no recorded answer takes is refused in the browser: no test reaches a network. */
async function refuseUnrecordedApi(page: Page): Promise<void> {
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (handled: Route) => handled.abort('blockedbyclient'),
  );
}

/** The page has drawn what its data says, in this theme, with its fonts in and no colour still fading. */
async function settled(page: Page, theme: Theme): Promise<void> {
  await expect(page.locator('html'), `the ${theme} theme is applied`).toHaveAttribute('data-theme', theme);
  await expect(page.getByRole('contentinfo'), "the footer stamps the design fixture's snapshot").toContainText(fixtureShort);
  await expect(page.locator('[data-region]').first(), 'the screen draws its regions').toBeAttached();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((running) => running instanceof CSSTransition)
        .map((running) => running.finished.catch(() => undefined)),
    );
  });
}

/** Every request the page sent has been answered or refused: the state a static or recorded answer leaves. */
export async function idle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/** A busy control (BUSY-1) is showing its request in flight. Its request is held, so the network never idles. */
export function busy(control: (page: Page) => Locator, label: string): (page: Page) => Promise<void> {
  return async (page) => {
    const shown = control(page);
    await expect(shown, `the control shows ${label}`).toHaveAccessibleName(label);
    await expect(shown, 'the control is aria-busy').toHaveAttribute('aria-busy', 'true');
  };
}

export const selling = busy(sellButton, 'Selling…');
export const opening = busy(openButton, 'Opening…');

/** An explorer screen's state: a route of the app on the design fixture. */
export function at(name: string, path: string, drawn: (page: Page) => Promise<void> = idle): State {
  return { name, open: (page) => page.goto(path).then(() => undefined), drawn };
}

/** The browser's locale and time zone for every regression test: `test.use(fixedFormats)` in each spec. */
export const fixedFormats = { locale: 'en-GB', timezoneId: 'Europe/London' } as const;

/** One regression test: its title, and what it does on a fresh page. */
export interface Case {
  title: string;
  run(page: Page): Promise<void>;
}

/**
 * The screen's regression tests: one per state, width and theme, titled `<screen> · <state> <width> <theme>`, each
 * comparing the page with docs/ui/baselines/<screen>/<state>-<width>-<theme>.png. The name is given as its path's
 * segments, so the screen's folder is kept: a single string would have its slash flattened to a dash. Each spec
 * declares the tests itself (`for (const c of cases(…)) test(c.title, …)`), so each is collected under its own file.
 */
export function cases(screen: string, now: string, states: readonly State[]): Case[] {
  return states.flatMap((state) =>
    widths.flatMap((width) =>
      themes.map((theme) => ({
        title: `${screen} · ${state.name} ${width} ${theme}`,
        run: async (page: Page) => {
          await page.clock.setFixedTime(new Date(now));
          await refuseUnrecordedApi(page);
          await serveTrace(page, designFixtureDir);
          await setTheme(page, theme);
          await page.setViewportSize(viewports[width]);
          await state.open(page);
          await state.drawn(page);
          await settled(page, theme);
          await expect(page).toHaveScreenshot([screen, `${state.name}-${width}-${theme}.png`], { fullPage: true });
        },
      })),
    ),
  );
}
