// Parity with U5's derived reference (docs/ui/derived/U5/), the built routes served on the design fixture
// (docs/ui/fixture/), so both sides read the same data. Structure only: the tagged regions in order, the catalogued
// components in each, the shell, the title and the navigation, and tokens in place of literal colours. The reader is
// U0b's (tests/Uinsure.Policies.Web.Tests/e2e/U0b/support/reference.ts), pointed at docs/ui/derived/U5. Parity tests are the only ones,
// with reachability, that may pass at the stub.
//
// A region or nav entry a later node builds (in transit against U5's own derived.json, ../../U0b/support/built.ts) is
// compared by its place only, so these checks hold before and after it lands.
import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { serveTrace, setTheme, themes, viewports } from '../../U0b/support/app';
import { builtAt } from '../../U0b/support/built';
import { literalColours, readBuilt, readNewestReference, readReference as readFromU0b, regionNamed } from '../../U0b/support/reference';
import type { Structure } from '../../U0b/support/reference';
import { designFixtureDir } from '../../U0b/support/trail';
import { route } from './app';

export interface Screen {
  label: string;
  screen: string;
  state: string;
  path: string;
}

// Each reference's own data in the design fixture: the sessions list, the fixture's harness block, the build plan's
// stats, and the about page's tour.
export const sessions: Screen = { label: 'sessions', screen: 'sessions', state: 'populated', path: route.sessions };
export const harness: Screen = { label: 'harness', screen: 'harness', state: 'populated', path: route.harness };
export const stats: Screen = { label: 'delivery stats', screen: 'stats', state: 'populated', path: route.stats };
export const about: Screen = { label: 'how to read this', screen: 'about', state: 'populated', path: route.about };

const { regionSettled, settledNav } = builtAt('U5');

/** Reads docs/ui/derived/U5/<screen>/<state>.html: U0b's reader joins docs/ui/derived/U0b with ../U5/<screen>. */
function readReference(context: BrowserContext, screen: string, state: string): Promise<Structure> {
  return readFromU0b(context, `../U5/${screen}`, state);
}

async function open(page: Page, s: Screen): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await page.goto(s.path);
}

function shellOf(s: Structure, withTitle: boolean): Record<string, unknown> {
  return {
    ...(withTitle ? { title: s.title } : {}),
    shell: s.shell,
    navLinks: settledNav(s.navLinks),
    navNotBuilt: settledNav(s.navNotBuilt),
    navCurrent: s.navCurrent,
    tabCurrent: s.tabCurrent,
  };
}

function settledOrder(s: Structure, screen: string): (string | boolean)[][] {
  return s.regions.map((r) => (regionSettled(screen, r.slug) ? [r.slug, r.req.join(' '), r.built] : [r.slug]));
}

function unbuiltComps(s: Structure, screen: string): [string, string[]][] {
  return s.regions.filter((r) => !r.built && regionSettled(screen, r.slug)).map((r) => [r.slug, r.comps]);
}

/** Every region of the reference, in its order, with its data-req; the unbuilt ones as the not-built-yet pattern. */
export async function expectRegionsInOrder(page: Page, s: Screen): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  await open(page, s);
  await expect
    .poll(async () => {
      const built = await readBuilt(page, reference);
      return { order: settledOrder(built, s.screen), unbuilt: unbuiltComps(built, s.screen) };
    })
    .toEqual({ order: settledOrder(reference, s.screen), unbuilt: unbuiltComps(reference, s.screen) });
}

/** One region of the reference, with its data-req and the catalogued components inside it. */
export async function expectRegionComponents(page: Page, s: Screen, slug: string): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  const wanted = regionNamed(reference, slug);
  expect(wanted, `the reference has region ${slug}`).toBeDefined();
  await open(page, s);
  await expect
    .poll(async () => {
      const found = regionNamed(await readBuilt(page, reference), slug);
      return found ? { req: found.req, comps: found.comps } : null;
    })
    .toEqual({ req: wanted?.req, comps: wanted?.comps });
}

/** The shell's components, the primary nav (links, not-built entries, the current one), the current tab, the title. */
export async function expectShell(page: Page, s: Screen, withTitle: boolean): Promise<void> {
  // U10: the shell is global, so it is compared with the newest derived reference (U4's shell), not U5's own.
  const reference = await readNewestReference(page.context(), s.screen, s.state);
  await open(page, s);
  await expect.poll(async () => shellOf(await readBuilt(page, reference), withTitle)).toEqual(shellOf(reference, withTitle));
}

/** No literal colour on the page in either theme: tokens only. */
export async function expectTokensOnly(page: Page, s: Screen): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  await open(page, s);
  await expect.poll(async () => (await readBuilt(page, reference)).regions.length).toBe(reference.regions.length);
  for (const theme of themes) {
    await setTheme(page, theme);
    expect.soft(await page.evaluate(literalColours), `literal colours, ${theme}`).toEqual([]);
  }
}
