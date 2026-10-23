// Parity with U3's derived reference (docs/ui/derived/U3/), the built routes served on the design fixture
// (docs/ui/fixture/), so both sides read the same data. Structure only: the tagged regions in order, the catalogued
// components in each, the shell, the title and the navigation, and tokens in place of literal colours. The reader is
// U0b's (tests/web/e2e/U0b/support/reference.ts). A region or nav entry a later node builds (in transit against U3's
// own derived.json, ../../U0b/support/built.ts) is compared by its place only, so these checks keep holding as later
// nodes land. Parity tests are the only ones, with reachability, that may pass at the stub.
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

// Each reference's own data in the design fixture (docs/ui/screens/<screen>/screen.json, its states).
export const loop: Screen = { label: 'loop page (build/F3)', screen: 'loop', state: 'populated', path: route.loop('build', 'F3') };
export const loopLong: Screen = { label: 'loop page (build/F1, the most events)', screen: 'loop', state: 'long-content', path: route.loop('build', 'F1') };
export const loopGitOnly: Screen = { label: 'loop page (build/F0a, git-only)', screen: 'loop', state: 'git-only', path: route.loop('build', 'F0a') };
export const verdict: Screen = {
  label: 'verdict page (build/F3 A2.3 reviewer)',
  screen: 'verdict',
  state: 'populated',
  path: route.verdict('build', 'F3', 'A2.3', 'reviewer'),
};
export const verdictLong: Screen = {
  label: 'verdict page (build/F2 A2 reviewer, the most findings)',
  screen: 'verdict',
  state: 'long-content',
  path: route.verdict('build', 'F2', 'A2', 'reviewer'),
};
export const finding: Screen = { label: 'finding page (build/F3 A1)', screen: 'finding', state: 'populated', path: route.findings('build', 'F3', 'A1') };
export const findingLong: Screen = {
  label: 'finding page (build/F1 D2, the longest round)',
  screen: 'finding',
  state: 'long-content',
  path: route.findings('build', 'F1', 'D2'),
};
export const node: Screen = { label: 'node page (build/F3)', screen: 'node', state: 'populated', path: route.node('build', 'F3') };
export const plan: Screen = { label: 'plan page (build)', screen: 'plan', state: 'populated', path: route.plan('build') };
export const about: Screen = { label: 'about page', screen: 'about', state: 'populated', path: route.about };

const { regionSettled, settledNav } = builtAt('U3');

/** Reads docs/ui/derived/U3/<screen>/<state>.html. U0b's reader joins docs/ui/derived/U0b with the screen given. */
function readReference(context: BrowserContext, screen: string, state: string): Promise<Structure> {
  return readFromU0b(context, `../U3/${screen}`, state);
}

async function open(page: Page, s: Screen): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await page.goto(s.path);
}

/**
 * The shell as parity compares it. The title only where the reference's frame names the entity shown: the loop's
 * variant states keep build/F3's frame. The nav's links and not-built entries are every entry but those in transit.
 */
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

/** The regions in page order: [slug, req, built] for a settled region, [slug] alone for one a later node builds. */
function settledOrder(s: Structure, screen: string): (string | boolean)[][] {
  return s.regions.map((r) => (regionSettled(screen, r.slug) ? [r.slug, r.req.join(' '), r.built] : [r.slug]));
}

/** The components of each region unbuilt at U3 and still unbuilt at the newest reference. */
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
  // U10: the shell is global, so it is compared with the newest derived reference (U4's shell), not U3's own.
  const reference = await readNewestReference(page.context(), s.screen, s.state);
  await open(page, s);
  await expect.poll(async () => shellOf(await readBuilt(page, reference), withTitle)).toEqual(shellOf(reference, withTitle));
}

/** No colour on the page from a literal: the screen's styles, inline styles and SVG paint use tokens only. */
export async function expectTokensOnly(page: Page, s: Screen): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  await open(page, s);
  await expect.poll(async () => (await readBuilt(page, reference)).regions.length).toBe(reference.regions.length);
  for (const theme of themes) {
    await setTheme(page, theme);
    expect.soft(await page.evaluate(literalColours), `literal colours, ${theme}`).toEqual([]);
  }
}
