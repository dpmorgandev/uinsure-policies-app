// U5's routes (sessions, harness, stats, and the guided tour on the about page) and its fixture: the clean
// `complete` trail (build/F1, run once) with U5's overlay laid over it (tests/web/fixtures/overlays/u5/README.md):
// three dated context snapshots and one undated, and a generated harness file of two agents, two skills, two hooks.
import { cpSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { compileFixture, repoRoot } from '../../U0b/support/trail';
import type { CompiledTrail } from '../../U0b/support/trail';

export { auditEverywhere, openOnFixture, region } from '../../U1/support/app';
export { heading, hrefTo, primaryNav, rowTexts } from '../../U2/support/app';
export type { CompiledTrail } from '../../U0b/support/trail';

export const overlayDir = join(repoRoot, 'tests', 'web', 'fixtures', 'overlays', 'u5', 'tree');

/** U5's routes (hash routing). */
export const route = {
  sessions: '/#/sessions',
  harness: '/#/harness',
  stats: '/#/stats',
  about: '/#/about',
  matrix: '/#/rules',
  plan: (plan: string): string => `/#/plans/${plan}`,
};

/** The `complete` trail with U5's overlay, compiled once for a spec file. */
export function compileU5(): CompiledTrail {
  return compileFixture('complete', (root) => cpSync(overlayDir, root, { recursive: true }));
}

/** The regions (docs/ui/derived/U5/<screen>/screen.json). */
export const TIMELINE = 'snapshot-timeline';
export const AGENTS = 'agents';
export const HOOKS = 'hooks';
export const FACTS = 'facts-per-agent-and-node';
export const TOUR = 'guided-tour-entry-one-rule-end-to-end-could';

/** The rows of every table in `scope`, each as its text, whitespace collapsed, in page order. */
export async function allRowTexts(scope: Locator): Promise<string[]> {
  return scope
    .locator('table tbody tr')
    .evaluateAll((rows) => rows.map((tr) => (tr.textContent ?? '').replace(/\s+/g, ' ').trim()));
}

/** The row of any table in `scope` whose header cell or first cell reads `key`. */
export function rowOf(scope: Locator, key: string | RegExp): Locator {
  return scope.locator('table tbody tr').filter({ has: scope.page().locator('th, td').filter({ hasText: key }) });
}

/** The page's main content as text, whitespace collapsed. */
export async function mainText(page: Page): Promise<string> {
  return ((await page.getByRole('main').textContent()) ?? '').replace(/\s+/g, ' ').trim();
}
