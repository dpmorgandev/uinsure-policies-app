// Parity with W1's derived reference (docs/ui/derived/W1/<screen>/<state>.html), structure first: the tagged
// regions in order, the catalogued components inside each, the shell's own components, the title and the
// navigation. The reference names a component by its data-comp root ("<id> · <tier> · <state>"); the built page
// may carry the same data-comp root, or the kit's own class for it (kit-<id>__<part>, the stylekit's CSS-module
// name), and either counts. The same reading as U0b's (tests/Uinsure.Policies.Web.Tests/e2e/U0b/support/reference.ts), on W1's pages.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { BrowserContext, Page } from '@playwright/test';
import { repoRoot } from './api';

export const derivedDir = join(repoRoot, 'docs', 'ui', 'derived', 'W1');
/** The design fixture's trace.json, so the shell shows the snapshot the references were derived from. */
export const designFixtureDir = join(repoRoot, 'docs', 'ui', 'fixture');

export interface Region {
  slug: string;
  req: string[];
  built: boolean;
  comps: string[];
}

export interface Structure {
  title: string;
  regions: Region[];
  /** Components outside every region: the shell's. */
  shell: string[];
  /** Not-built nav entries in the primary nav, by label. */
  navNotBuilt: string[];
  /** Links in the primary nav, by label. */
  navLinks: string[];
  navCurrent: string[];
}

interface Wanted {
  regions: Record<string, string[]>;
  shell: string[];
}

/** Runs in the page. `want` null reads a reference; given the reference's components, it reads a built page. */
function readStructure(want: Wanted | null): Structure {
  const idOf = (el: Element): string => (el.getAttribute('data-comp') ?? '').split('·')[0]?.trim() ?? '';
  const outside = (el: Element): boolean => el.closest('[data-region]') === null;
  const unique = (ids: string[]): string[] => [...new Set(ids.filter((id) => id !== ''))].sort();
  const roots = (scope: ParentNode, id: string): Element[] =>
    Array.from(scope.querySelectorAll(`[data-comp^="${id} "], [class^="kit-${id}__"], [class*=" kit-${id}__"]`));
  const text = (el: Element): string => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

  const regions = Array.from(document.querySelectorAll('[data-region]')).map((el) => {
    const slug = el.getAttribute('data-region') ?? '';
    const comps = want
      ? (want.regions[slug] ?? []).filter((id) => roots(el, id).length > 0)
      : unique(Array.from(el.querySelectorAll('[data-comp]')).map(idOf));
    return {
      slug,
      req: (el.getAttribute('data-req') ?? '').split(/\s+/).filter((r) => r !== '').sort(),
      built: el.getAttribute('data-built') !== 'false',
      comps: unique(comps),
    };
  });
  const shell = want
    ? want.shell.filter((id) => roots(document, id).some(outside))
    : unique(Array.from(document.querySelectorAll('[data-comp]')).filter(outside).map(idOf));

  const nav = document.querySelector('nav[aria-label^="Primary"]');
  return {
    title: document.title,
    regions,
    shell: unique(shell),
    navNotBuilt: nav ? Array.from(nav.querySelectorAll('[data-kind="nav entry"]')).map((el) => text(el).replace(/\s*not built yet\s*$/, '')) : [],
    navLinks: nav ? Array.from(nav.querySelectorAll('a')).map(text) : [],
    navCurrent: nav ? Array.from(nav.querySelectorAll('[aria-current="page"]')).map(text) : [],
  };
}

/** Reads docs/ui/derived/W1/<screen>/<state>.html in a page of its own beside the test's. */
export async function readReference(context: BrowserContext, screen: string, state: string): Promise<Structure> {
  const page = await context.newPage();
  try {
    await page.goto(pathToFileURL(join(derivedDir, screen, `${state}.html`)).href);
    return await page.evaluate(readStructure, null);
  } finally {
    await page.close();
  }
}

export async function readBuilt(page: Page, reference: Structure): Promise<Structure> {
  const want: Wanted = {
    regions: Object.fromEntries(reference.regions.map((r) => [r.slug, r.comps])),
    shell: reference.shell,
  };
  return page.evaluate(readStructure, want);
}

/** The regions as [slug, req, built] in page order. */
export function regionOrder(s: Structure): [string, string, boolean][] {
  return s.regions.map((r) => [r.slug, r.req.join(' '), r.built]);
}

export function regionNamed(s: Structure, slug: string): Region | undefined {
  return s.regions.find((r) => r.slug === slug);
}

export function unbuiltComps(s: Structure): [string, string[]][] {
  return s.regions.filter((r) => !r.built).map((r) => [r.slug, r.comps]);
}
