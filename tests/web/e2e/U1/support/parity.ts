// Parity with U1's derived reference (docs/ui/derived/U1/), the built routes served on the design fixture
// (docs/ui/fixture/), so both sides read the same data. Structure only: the tagged regions in order, the catalogued
// components in each, the shell, the title and the navigation, and tokens in place of literal colours. The same
// checks as U0b's parity (tests/web/e2e/U0b/support/parity.ts), against U1's references. Parity tests are the only
// ones, with reachability, that may pass at the stub. A nav entry a later node builds (in transit against U1's own
// derived.json, ../../U0b/support/built.ts) is left out of the shell comparison: whether it is a link yet is that
// node's to prove. Every entry U1 settled is still compared exactly.
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { serveTrace, setTheme, themes, viewports } from '../../U0b/support/app';
import { builtAt } from '../../U0b/support/built';
import { designFixtureDir } from '../../U0b/support/trail';
import { route } from './app';
import { literalColours, readBuilt, readReference, regionNamed, regionOrder } from './reference';
import type { Structure } from './reference';

export interface Screen {
  label: string;
  screen: string;
  state: string;
  path: string;
}

// Each reference's own data in the design fixture: the populated rule page is GET-1 (build/F2), the long-content one
// COULD-2 (build/F3); the populated node page is build/F3, the git-only one build/F0a; the commit page is 3a092b0.
export const overview: Screen = { label: 'overview', screen: 'overview', state: 'populated', path: route.overview };
export const matrix: Screen = { label: 'requirements matrix', screen: 'matrix', state: 'populated', path: route.matrix };
export const rule: Screen = { label: 'rule page (GET-1)', screen: 'rule', state: 'populated', path: route.rule('GET-1') };
export const ruleLong: Screen = { label: 'rule page (COULD-2, the longest trail)', screen: 'rule', state: 'long-content', path: route.rule('COULD-2') };
export const node: Screen = { label: 'node page (build/F3)', screen: 'node', state: 'populated', path: route.node('build', 'F3') };
export const gitOnlyNode: Screen = { label: 'node page (build/F0a, git-only)', screen: 'node', state: 'git-only', path: route.node('build', 'F0a') };
export const commit: Screen = {
  label: 'commit page (3a092b0)',
  screen: 'commit',
  state: 'populated',
  path: route.commit('3a092b06f4691f5cb5ee8ed117d4e755e2095545'),
};

async function open(page: Page, s: Screen): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await page.goto(s.path);
}

const { settledNav } = builtAt('U1');

/** The shell as parity compares it: the nav's links and not-built entries are every entry but those in transit. */
function shellOf(s: Structure): Record<string, unknown> {
  return {
    title: s.title,
    shell: s.shell,
    navLinks: settledNav(s.navLinks),
    navNotBuilt: settledNav(s.navNotBuilt),
    navCurrent: s.navCurrent,
    tabCurrent: s.tabCurrent,
  };
}

function unbuiltComps(s: Structure): [string, string[]][] {
  return s.regions.filter((r) => !r.built).map((r) => [r.slug, r.comps]);
}

/** Every region of the reference, in its order, with its data-req; the unbuilt ones as the not-built-yet pattern. */
export async function expectRegionsInOrder(page: Page, s: Screen): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  await open(page, s);
  await expect
    .poll(async () => {
      const built = await readBuilt(page, reference);
      return { order: regionOrder(built), unbuilt: unbuiltComps(built) };
    })
    .toEqual({ order: regionOrder(reference), unbuilt: unbuiltComps(reference) });
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
export async function expectShell(page: Page, s: Screen): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  await open(page, s);
  await expect.poll(async () => shellOf(await readBuilt(page, reference))).toEqual(shellOf(reference));
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
