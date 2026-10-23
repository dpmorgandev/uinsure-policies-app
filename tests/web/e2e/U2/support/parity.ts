// Parity with U2's derived reference (docs/ui/derived/U2/), the built routes served on the design fixture
// (docs/ui/fixture/), so both sides read the same data. Structure only: the tagged regions in order, the catalogued
// components in each, the shell, the title and the navigation, and tokens in place of literal colours. The reader is
// U0b's (tests/web/e2e/U0b/support/reference.ts), pointed at docs/ui/derived/U2. Parity tests are the only ones,
// with reachability, that may pass at the stub.
//
// A region or nav entry a later node builds (in transit against U2's own derived.json, ../../U0b/support/built.ts) is
// compared by its place only: whether it is built yet is that node's to prove, so these checks hold before and after
// it lands. Everything U2 settled is still compared exactly.
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

// Each reference's own data in the design fixture: the plan is build; the populated node and walkthrough are
// build/F3, the git-only ones build/F0a; the populated commit is 3a092b0 (F3 #42), the long-content one 949a082
// (F3 #51); the rule page is GET-1 (build/F2).
export const plan: Screen = { label: 'plan page (build)', screen: 'plan', state: 'populated', path: route.plan('build') };
export const overview: Screen = { label: 'overview', screen: 'overview', state: 'populated', path: route.overview };
export const node: Screen = { label: 'node page (build/F3)', screen: 'node', state: 'populated', path: route.node('build', 'F3') };
export const gitOnlyNode: Screen = { label: 'node page (build/F0a, git-only)', screen: 'node', state: 'git-only', path: route.node('build', 'F0a') };
export const walkthrough: Screen = {
  label: 'walkthrough (build/F3)',
  screen: 'walkthrough',
  state: 'populated',
  path: route.walkthrough('build', 'F3'),
};
export const gitOnlyWalkthrough: Screen = {
  label: 'walkthrough (build/F0a, git-only)',
  screen: 'walkthrough',
  state: 'git-only',
  path: route.walkthrough('build', 'F0a'),
};
export const commit: Screen = {
  label: 'commit page (3a092b0)',
  screen: 'commit',
  state: 'populated',
  path: route.commit('3a092b06f4691f5cb5ee8ed117d4e755e2095545'),
};
export const longCommit: Screen = {
  label: 'commit page (949a082, a long diff)',
  screen: 'commit',
  state: 'long-content',
  path: route.commit('949a082716abe6f49b64266f4abda6bf9f823d93'),
};
export const rule: Screen = { label: 'rule page (GET-1)', screen: 'rule', state: 'populated', path: route.rule('GET-1') };

const { regionSettled, settledNav } = builtAt('U2');

/** Reads docs/ui/derived/U2/<screen>/<state>.html: U0b's reader joins docs/ui/derived/U0b with ../U2/<screen>. */
function readReference(context: BrowserContext, screen: string, state: string): Promise<Structure> {
  return readFromU0b(context, `../U2/${screen}`, state);
}

async function open(page: Page, s: Screen): Promise<void> {
  await serveTrace(page, designFixtureDir);
  await setTheme(page, 'light');
  await page.setViewportSize(viewports[1440]);
  await page.goto(s.path);
}

/** The shell as parity compares it; the title only where the reference's title is the page's own, not its state's. */
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

/** The components of each region unbuilt at U2 and still unbuilt at the newest reference. */
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
  // U10: the shell is global, so it is compared with the newest derived reference (U4's shell), not U2's own.
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
