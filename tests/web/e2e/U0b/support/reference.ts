// Parity with the node's derived reference (docs/ui/derived/U0b/<screen>/<state>.html), structure first: the
// tagged regions in order, the catalogued components inside each, the shell's own components, the title and
// the navigation. The reference names a component by its data-comp root ("<id> · <tier> · <state>"); the built
// page may carry the same data-comp root, or the kit's own class for it (kit-<id>__<part>, the stylekit's
// CSS-module name), and either counts.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { BrowserContext, Page } from '@playwright/test';
import { derivedDir } from './trail';

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
  tabCurrent: string[];
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
  const tabs = document.querySelector('nav[aria-label^="Views of this node"]');
  return {
    title: document.title,
    regions,
    shell: unique(shell),
    navNotBuilt: nav ? Array.from(nav.querySelectorAll('[data-kind="nav entry"]')).map((el) => text(el).replace(/\s*not built yet\s*$/, '')) : [],
    navLinks: nav ? Array.from(nav.querySelectorAll('a')).map(text) : [],
    navCurrent: nav ? Array.from(nav.querySelectorAll('[aria-current="page"]')).map(text) : [],
    tabCurrent: tabs ? Array.from(tabs.querySelectorAll('[aria-current="page"]')).map(text) : [],
  };
}

/** Reads docs/ui/derived/U0b/<screen>/<state>.html in a page of its own beside the test's. */
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

/** The regions as [slug, req, built] in page order: what HONEST-1's parity compares. */
export function regionOrder(s: Structure): [string, string, boolean][] {
  return s.regions.map((r) => [r.slug, r.req.join(' '), r.built]);
}

export function regionNamed(s: Structure, slug: string): Region | undefined {
  return s.regions.find((r) => r.slug === slug);
}

/**
 * Runs in the page: every colour the page's own styles set from a literal rather than a token. Custom properties
 * (the tokens themselves) are skipped; every other colour-bearing property, inline style and SVG paint is read.
 */
export function literalColours(): string[] {
  const bad: string[] = [];
  const colourProperty = /(^|-)(color|background|border|outline|fill|stroke|shadow|caret|accent|column-rule|text-decoration)/;
  const literal =
    /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|\b(white|black|red|green|blue|yellow|orange|purple|gray|grey|pink|silver|navy|teal|maroon|olive|lime|aqua|fuchsia)\b/i;
  const read = (style: CSSStyleDeclaration, where: string): void => {
    for (let i = 0; i < style.length; i += 1) {
      const property = style.item(i);
      if (property.startsWith('--') || !colourProperty.test(property)) continue;
      const value = style.getPropertyValue(property);
      // `transparent` inside a shorthand reads back as rgba(0, 0, 0, 0): a keyword, not a colour.
      if (literal.test(value.replace(/rgba\(0,\s*0,\s*0,\s*0\)/g, 'transparent'))) bad.push(`${where} { ${property}: ${value} }`);
    }
  };
  const visit = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) read(rule.style, rule.selectorText);
      if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) visit(sheet.cssRules);
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('[style]'))) read(el.style, `<${el.tagName.toLowerCase()} style>`);
  for (const el of Array.from(document.querySelectorAll('[fill], [stroke]'))) {
    for (const name of ['fill', 'stroke']) {
      const value = el.getAttribute(name);
      if (value !== null && literal.test(value)) bad.push(`<${el.tagName.toLowerCase()} ${name}="${value}">`);
    }
  }
  return bad;
}
