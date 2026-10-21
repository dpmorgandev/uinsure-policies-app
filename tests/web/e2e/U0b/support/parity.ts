// Parity with the node's derived reference (docs/ui/derived/U0b/), the built routes served on the design fixture
// (docs/ui/fixture/), so both sides read the same data. Structure only: the tagged regions in order, the
// catalogued components in each, the shell, the title and the navigation, and tokens in place of literal
// colours. Screenshots are the regression baselines' job. Parity tests are the only ones that may pass at the stub.
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { route, serveTrace, setTheme, themes, viewports } from './app';
import { literalColours, readBuilt, readReference, regionNamed, regionOrder } from './reference';
import type { Structure } from './reference';
import { designFixtureDir } from './trail';

export interface Screen {
  label: string;
  screen: string;
  state: string;
  path: string;
}

export const overview: Screen = { label: 'overview', screen: 'overview', state: 'populated', path: route.overview };
export const about: Screen = { label: 'about page', screen: 'about', state: 'populated', path: route.about };
// The populated activity reference is build/F3's; git-only is build/F0a's, which has no activity file.
export const activity: Screen = { label: 'activity page', screen: 'activity', state: 'populated', path: route.activity('build', 'F3') };
export const gitOnly: Screen = { label: "git-only node's activity page", screen: 'activity', state: 'git-only', path: route.activity('build', 'F0a') };

async function open(page: Page, s: Screen): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await page.goto(s.path);
}

/** The shell as parity compares it. The title only where the reference's frame names the node shown. */
function shellOf(s: Structure, withTitle: boolean): Record<string, unknown> {
  return {
    ...(withTitle ? { title: s.title } : {}),
    shell: s.shell,
    navLinks: s.navLinks,
    navNotBuilt: s.navNotBuilt,
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
      const region = regionNamed(await readBuilt(page, reference), slug);
      return region ? { req: region.req, comps: region.comps } : null;
    })
    .toEqual({ req: wanted?.req, comps: wanted?.comps });
}

/** The shell's components, the primary nav (links, not-built entries, the current one), the current tab, the title. */
export async function expectShell(page: Page, s: Screen, withTitle: boolean): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
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
