// Parity with the node's derived reference (docs/ui/derived/U0b/), the built routes served on the design fixture
// (docs/ui/fixture/), so both sides read the same data. Structure only: the tagged regions in order, the
// catalogued components in each, the shell, the title and the navigation, and tokens in place of literal
// colours. Screenshots are the regression baselines' job. Parity tests are the only ones that may pass at the stub.
// A nav entry or region a later node builds (in transit, ./built.ts) is compared by its place only: whether it is
// built yet is that node's to prove, so these checks hold before and after it lands.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { route, serveTrace, setTheme, themes, viewports } from './app';
import { primaryNav, regionSettled, screenSettled } from './built';
import { literalColours, readBuilt, readReference, regionNamed } from './reference';
import type { Structure } from './reference';
import { derivedDir, designFixtureDir } from './trail';

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

/** The primary nav's labels whose screen a later node builds: whether each is a link yet is that node's to prove. */
const navInTransit = new Set(primaryNav.filter((entry) => !screenSettled(entry.screen)).map((entry) => entry.label));
const settledNav = (labels: string[]): string[] => labels.filter((label) => !navInTransit.has(label));

/**
 * The shell as parity compares it. The title only where the reference's frame names the node shown. The nav's links
 * and not-built entries are every entry but those in transit, each still on its own side.
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

/** The components of each region unbuilt at U0b and still unbuilt at the newest reference. */
function unbuiltComps(s: Structure, screen: string): [string, string[]][] {
  return s.regions.filter((r) => !r.built && regionSettled(screen, r.slug)).map((r) => [r.slug, r.comps]);
}

/**
 * Every region of the reference, in its order, with its data-req; the unbuilt ones as the not-built-yet pattern. A
 * region a later node builds keeps its place in the order; its data-req and built state are that node's to prove.
 */
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
      const region = regionNamed(await readBuilt(page, reference), slug);
      return region ? { req: region.req, comps: region.comps } : null;
    })
    .toEqual({ req: wanted?.req, comps: wanted?.comps });
}

type Role = Parameters<Page['getByRole']>[0];

/** Each catalogued component in one region of the reference, with the ARIA role its root answers to. */
async function regionControls(context: BrowserContext, s: Screen, slug: string): Promise<{ comp: string; role: string }[]> {
  const page = await context.newPage();
  try {
    await page.goto(pathToFileURL(join(derivedDir, s.screen, `${s.state}.html`)).href);
    return await page.locator(`[data-region="${slug}"] [data-comp]`).evaluateAll((roots) =>
      roots.map((el) => ({ comp: (el.getAttribute('data-comp') ?? '').split('·')[0]?.trim() ?? '', role: el.getAttribute('role') ?? '' })),
    );
  } finally {
    await page.close();
  }
}

/**
 * A region that tags global controls (the reference draws them inside it, "tagged here once"): the built region keeps
 * its data-req, and each control the reference draws there, by its role, is the top bar's, once on the page, and is
 * not drawn again inside the region.
 */
export async function expectRegionControlsInTopBar(page: Page, s: Screen, slug: string): Promise<void> {
  const reference = await readReference(page.context(), s.screen, s.state);
  const wanted = regionNamed(reference, slug);
  expect(wanted, `the reference has region ${slug}`).toBeDefined();
  const controls = await regionControls(page.context(), s, slug);
  expect(controls.length, `the reference's ${slug} draws at least one control`).toBeGreaterThan(0);
  expect(controls.map((c) => c.comp).sort(), `the reference's ${slug} draws its components as controls`).toEqual(wanted?.comps);
  for (const c of controls) expect(c.role, `the reference's ${c.comp} root names its role`).not.toBe('');
  await open(page, s);
  await expect.poll(async () => regionNamed(await readBuilt(page, reference), slug)?.req ?? null).toEqual(wanted?.req);
  const region = page.locator(`[data-region="${slug}"]`);
  for (const { comp, role } of controls) {
    await expect(page.getByRole('banner').getByRole(role as Role), `the ${comp} (${role}) is in the top bar`).toHaveCount(1);
    await expect(page.getByRole(role as Role), `one ${comp} (${role}) on the page`).toHaveCount(1);
    await expect(region.getByRole(role as Role), `the ${comp} (${role}) is not drawn again in ${slug}`).toHaveCount(0);
  }
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
