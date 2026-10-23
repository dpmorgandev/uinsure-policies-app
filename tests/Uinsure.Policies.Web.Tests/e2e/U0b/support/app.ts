// The built app (vite preview on DOCKET_APP_PORT), served the trace data a test chooses. The static host serves
// src/Uinsure.Policies.Web/public/ beside the app, so a test answers the same paths from a compiled fixture's public/ or from the
// design fixture: /trace.json and the lazy chunks under /trace/<plan>/<node>/.
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { Compiled } from './trail';

/** Where the app links a commit: the repository the footer names. */
export const REPO = 'https://github.com/dpmorgandev/uinsure-policies-api';

export type Theme = 'light' | 'dark';
export const themes: readonly Theme[] = ['light', 'dark'];

export const viewports = {
  1440: { width: 1440, height: 900 },
  1280: { width: 1280, height: 800 },
  390: { width: 390, height: 844 },
} as const;
export type Width = keyof typeof viewports;

/** The node's built routes (hash routing). */
export const route = {
  overview: '/#/',
  about: '/#/about',
  activity: (plan: string, node: string): string => `/#/plans/${plan}/${node}/activity`,
};

/** The fixture trails' node: `build/F1` in every fixture. */
export const fixtureNode = { plan: 'build', node: 'F1' } as const;

export const builtRoutes: readonly { name: string; path: string }[] = [
  { name: 'overview', path: route.overview },
  { name: 'about page', path: route.about },
  { name: 'activity page', path: route.activity(fixtureNode.plan, fixtureNode.node) },
];

const isTraceData = (url: URL): boolean => url.pathname === '/trace.json' || url.pathname.startsWith('/trace/');

/**
 * Answers /trace.json and /trace/** from `dir`, as the static host would from src/Uinsure.Policies.Web/public/. `null` answers 404
 * (nothing could be read). `hold`, when given, keeps every answer back until it settles.
 */
export async function serveTrace(page: Page, dir: string | null, hold?: Promise<void>): Promise<void> {
  await page.route(isTraceData, async (handled) => {
    if (hold) await hold;
    if (dir === null) return handled.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
    const base = resolve(dir);
    const path = decodeURIComponent(new URL(handled.request().url()).pathname).replace(/^\/+/, '');
    const file = resolve(base, path);
    if (!file.startsWith(base + sep) || !existsSync(file)) {
      return handled.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
    }
    return handled.fulfill({ status: 200, contentType: 'application/json', body: readFileSync(file) });
  });
}

/** Every request the page makes from now on. */
export function recordRequests(page: Page): URL[] {
  const seen: URL[] = [];
  page.on('request', (request) => seen.push(new URL(request.url())));
  return seen;
}

export interface Snapshot {
  ref: string;
  sha: string;
  short: string;
  /** compiledAt.utc as trace.json holds it, e.g. 2026-10-20T10:11:12Z. */
  utc: string;
}

const UTC = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?Z$/;

/** The compiled fixture's stamp. Fails, as an assertion, until the compiler writes trace.json with one. */
export function snapshotOf(compiled: Compiled): Snapshot {
  expect(compiled.status, `the compiler exits 0 on the fixture trail\n${compiled.output}`).toBe(0);
  expect(compiled.trace, 'the compiler wrote trace.json for the fixture trail').not.toBeNull();
  const at = compiled.trace?.compiledAt;
  expect(at?.sha, 'trace.json records the full SHA it was compiled from').toMatch(/^[0-9a-f]{40}$/);
  expect(at?.utc, 'trace.json records the UTC time it was compiled').toMatch(UTC);
  expect(typeof at?.ref, 'trace.json records the ref it was compiled at').toBe('string');
  const sha = at?.sha ?? '';
  return { ref: at?.ref ?? '', sha, short: sha.slice(0, 7), utc: at?.utc ?? '' };
}

/** "2026-10-20T10:11:12Z" as the kit's timestamp shows it in UTC: "2026-10-20 10:11:12 UTC". */
export function utcText(utc: string): string {
  const m = UTC.exec(utc);
  return m ? `${m[1]} ${m[2]} UTC` : utc;
}

export function isoOf(utc: string): string {
  return new Date(utc).toISOString();
}

/** DATA-3's footer: the snapshot's short SHA, linked to its commit, and its time, shown in UTC. */
export async function expectFooterStamp(page: Page, snap: Snapshot): Promise<void> {
  const footer = page.getByRole('contentinfo');
  await expect(footer.locator(`a[href="${REPO}/commit/${snap.sha}"]`), 'the footer links the snapshot SHA to its commit').toContainText(snap.short);
  await expect(footer.locator(`time[datetime="${isoOf(snap.utc)}"]`).first(), 'the footer gives the compiled-at time').toBeAttached();
  await expect(footer, 'the footer shows the compiled-at time in UTC').toContainText(utcText(snap.utc));
}

/** HONEST-1: nothing was read, so nothing is stated about a snapshot: no SHA, no time, no "compiled from". */
export async function expectNoSnapshotClaim(page: Page): Promise<void> {
  await expect(page.locator('a[href*="/commit/"]'), 'no commit is linked as the snapshot').toHaveCount(0);
  await expect(page.locator('time'), 'no compiled-at time is given').toHaveCount(0);
  await expect(page.locator('body'), 'no snapshot is stated').not.toContainText('Snapshot compiled from');
}

export async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.emulateMedia({ colorScheme: theme });
}

/**
 * The colour --color-background resolves to on <html>, the token the two themes set differently, read by its value
 * and not its spelling: the canvas serialises any spelling of an opaque colour (#fff, white, rgb(255 255 255)) as
 * #rrggbb. A value that isn't a colour comes back as it was declared, so it matches no theme.
 */
export async function backgroundToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const declared = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
    const context = document.createElement('canvas').getContext('2d');
    if (context === null || !CSS.supports('color', declared)) return `not a colour: "${declared}"`;
    context.fillStyle = declared;
    return String(context.fillStyle);
  });
}

export const tokenBackground: Record<Theme, string> = { light: '#ffffff', dark: '#1b1d21' };

/** axe at WCAG 2.2 AA: every violation, as "<rule> (<impact>): <targets>". */
export async function axeViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map(
    (v) => `${v.id} (${v.impact ?? 'no impact'}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
}

/** How far the page scrolls sideways, in CSS pixels: 0 when it doesn't. */
export async function sidewaysScroll(page: Page): Promise<number> {
  return page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
}

/** A raw placeholder from the screens (‹nodeId›, ‹ruleId›, ‹planId›, ‹reference›, …). */
export const PLACEHOLDER = /‹[^›]*›/;
