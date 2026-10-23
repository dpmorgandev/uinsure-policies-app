// Parity with U4's derived reference (docs/ui/derived/U4/), the built routes served on the design fixture
// (docs/ui/fixture/), so both sides read the same data. Structure only: the tagged regions in order, the catalogued
// components in each, and tokens in place of literal colours. The reader is U0b's
// (tests/Uinsure.Policies.Web.Tests/e2e/U0b/support/reference.ts). A region a later node builds (in transit against U4's own derived.json,
// ../../U0b/support/built.ts) is compared by its place only, so these checks keep holding as later nodes land.
// Parity tests are the only ones, with reachability, that may pass at the stub.
import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { serveTrace, setTheme, themes, viewports } from '../../U0b/support/app';
import { builtAt } from '../../U0b/support/built';
import { literalColours, readBuilt, readReference as readFromU0b, regionNamed } from '../../U0b/support/reference';
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
export const decisions: Screen = { label: 'decisions page', screen: 'decisions', state: 'populated', path: route.decisions };
export const notFound: Screen = { label: 'not-found page', screen: 'not-found', state: 'populated', path: '/#/no/such/page' };
export const sessions: Screen = {
  label: 'sessions page (f6-done-merged open)',
  screen: 'sessions',
  state: 'populated',
  path: route.session('20261019-151542-f6-done-merged'),
};
export const activity: Screen = { label: 'activity page (build/F3)', screen: 'activity', state: 'populated', path: route.activity('build', 'F3') };
export const commit: Screen = {
  label: 'commit page (build/F3 3a092b0)',
  screen: 'commit',
  state: 'populated',
  path: route.commit('3a092b06f4691f5cb5ee8ed117d4e755e2095545'),
};
export const node: Screen = { label: 'node page (build/F3)', screen: 'node', state: 'populated', path: route.node('build', 'F3') };
export const about: Screen = { label: 'about page', screen: 'about', state: 'populated', path: route.about };
export const rule: Screen = { label: 'rule page (GET-1)', screen: 'rule', state: 'populated', path: route.rule('GET-1') };
export const overview: Screen = { label: 'overview', screen: 'overview', state: 'populated', path: route.overview };

const { regionSettled } = builtAt('U4');

/** Reads docs/ui/derived/U4/<screen>/<state>.html. U0b's reader joins docs/ui/derived/U0b with the screen given. */
function readReference(context: BrowserContext, screen: string, state: string): Promise<Structure> {
  return readFromU0b(context, `../U4/${screen}`, state);
}

async function open(page: Page, s: Screen): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await page.goto(s.path);
}

/** The regions in page order: [slug, req, built] for a settled region, [slug] alone for one a later node builds. */
function settledOrder(s: Structure, screen: string): (string | boolean)[][] {
  return s.regions.map((r) => (regionSettled(screen, r.slug) ? [r.slug, r.req.join(' '), r.built] : [r.slug]));
}

/** Every region of the reference, in its order, with its data-req and whether it is built. */
export async function expectRegionsInOrder(page: Page, s: Screen): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  await open(page, s);
  await expect.poll(async () => settledOrder(await readBuilt(page, reference), s.screen)).toEqual(settledOrder(reference, s.screen));
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
      return found ? { req: found.req, comps: found.comps, built: found.built } : null;
    })
    .toEqual({ req: wanted?.req, comps: wanted?.comps, built: wanted?.built });
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
