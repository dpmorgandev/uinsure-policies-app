// Which screens, regions and nav entries are built, read from the derived references rather than written into the
// tests, so U0b's not-built-yet checks keep holding as later nodes (U1, W1, …) land their screens (David's ruling,
// 2026-10-21, "derived"). The set comes from the newest derived reference on the branch: the
// docs/ui/derived/<node>/derived.json naming the most built nodes. Something built there but not by U0b is in
// transit: built by a later node that may not have landed yet, so U0b asserts nothing about its built state, and the
// node that builds it proves it in its own suite.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './trail';

export interface Derived {
  node: string;
  builtNodes: string[];
  /** Each screen the node's routes answer, with its regions as built or not built at that node. */
  screens: Record<string, { built: string[]; notBuilt: string[] }>;
  notBuiltScreens: string[];
}

const derivedRoot = join(repoRoot, 'docs', 'ui', 'derived');

function readDerived(node: string): Derived {
  return JSON.parse(readFileSync(join(derivedRoot, node, 'derived.json'), 'utf8')) as Derived;
}

/** U0b's own derived reference: what U0b built. */
export const own: Derived = readDerived('U0b');

/** The newest derived reference on the branch: the one naming the most built nodes (ties go to the later node id). */
export const newest: Derived = readdirSync(derivedRoot)
  .filter((node) => existsSync(join(derivedRoot, node, 'derived.json')))
  .sort()
  .map(readDerived)
  .reduce((best, d) => (d.builtNodes.length >= best.builtNodes.length ? d : best), own);

const screenBuilt = (d: Derived, screen: string): boolean => screen in d.screens;
const regionBuilt = (d: Derived, screen: string, slug: string): boolean => d.screens[screen]?.built.includes(slug) ?? false;

/** A screen whose built state is the same at U0b and at the newest reference: U0b may assert it either way. */
export const screenSettled = (screen: string): boolean => screenBuilt(own, screen) === screenBuilt(newest, screen);
export const screenUnbuilt = (screen: string): boolean => !screenBuilt(newest, screen);

/** A region whose built state is the same at U0b and at the newest reference. */
export const regionSettled = (screen: string, slug: string): boolean =>
  regionBuilt(own, screen, slug) === regionBuilt(newest, screen, slug);

interface ScreensJson {
  app: { primaryNav: string[]; screens: { id: string; name: string; route: string }[] };
}

const screensJson = JSON.parse(readFileSync(join(repoRoot, 'docs', 'ui', 'screens.json'), 'utf8')) as ScreensJson;

/** Every screen of the app, by id, in docs/ui/screens.json's order. */
export const screenIds: readonly string[] = screensJson.app.screens.map((s) => s.id);

/**
 * One route for each screen U0b doesn't build, on the fixture trails' node (build/F1), from docs/ui/screens.json's
 * routes. `commit` is a commit SHA in the trail served.
 */
export function screenPaths(commit: string): Record<string, string> {
  return {
    matrix: '/#/rules',
    rule: '/#/rules/SELL-1',
    plan: '/#/plans/build',
    node: '/#/plans/build/F1',
    walkthrough: '/#/plans/build/F1/commits',
    loop: '/#/plans/build/F1/loop',
    verdict: '/#/plans/build/F1/verdicts/A1/reviewer',
    finding: '/#/plans/build/F1/findings/A1',
    commit: `/#/commits/${commit}`,
    decisions: '/#/decisions',
    harness: '/#/harness',
    sessions: '/#/sessions',
    stats: '/#/stats',
    'wb-home': '/#/workbench',
    'wb-sell': '/#/workbench/sell',
    'wb-policy': '/#/workbench/policies/ABC-1',
    'wb-cancel': '/#/workbench/policies/ABC-1/cancel',
    'wb-claim': '/#/workbench/policies/ABC-1/claims/new',
    'wb-renew': '/#/workbench/policies/ABC-1/renew',
    'wb-requests': '/#/workbench/requests',
    'not-found': '/#/no-such-page',
  };
}

/** The primary nav's entries in order: each one's screen and the label it shows (the screen's name). */
export const primaryNav: readonly { screen: string; label: string }[] = screensJson.app.primaryNav.map((screen) => ({
  screen,
  label: screensJson.app.screens.find((s) => s.id === screen)?.name ?? screen,
}));
