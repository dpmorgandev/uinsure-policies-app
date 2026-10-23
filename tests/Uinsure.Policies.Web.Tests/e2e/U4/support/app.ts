// U4's routes and the `agents` fixture trail (tests/Uinsure.Policies.Web.Tests/fixtures/trails/agents/README.md), on top of U3's, U1's and
// U0b's helpers for the built app (vite preview on DOCKET_APP_PORT): serving trace data, themes, widths, axe and the
// commit links. U4 builds the decisions, not-found and sessions screens, the activity page's agent lanes, the commit
// page's trailer agent against the hook agent, the node page's who-touched-what, the about and rule pages'
// verify-it-yourself commands, the overview's latest human decisions and the top bar's search
// (docs/ui/derived/U4/derived.json).
import type { Locator, Page } from '@playwright/test';
import { compileFixture } from '../../U0b/support/trail';
import type { CompiledTrail } from '../../U0b/support/trail';
import { route as u3 } from '../../U3/support/app';

export { REPO, auditEverywhere, openOnFixture, openRegion, region, shaOf, short, snapshotOf } from '../../U3/support/app';
export type { CompiledTrail } from '../../U3/support/app';

/** U4's routes (hash routing), with the earlier nodes' it links between. */
export const route = {
  ...u3,
  overview: '/#/',
  matrix: '/#/rules',
  rule: (id: string): string => `/#/rules/${encodeURIComponent(id)}`,
  commit: (sha: string): string => `/#/commits/${sha}`,
  activity: (plan: string, node: string): string => `/#/plans/${plan}/${node}/activity`,
  decisions: '/#/decisions',
  session: (file: string): string => `/#/sessions/${file}`,
};

/** The fixture U4's behaviour tests run on. */
export const AGENTS = 'agents';

/** Compiles the `agents` fixture once for a spec file. */
export function compileAgents(): CompiledTrail {
  return compileFixture(AGENTS);
}

/** The `agents` fixture's one context snapshot, by its URL segment. */
export const SESSION = '20261018-101500-f1-signed-off';

/** The regions U4 builds, by their data-region slugs (docs/ui/derived/U4/<screen>/screen.json). */
export const TRAILER_VS_HOOK = 'trailer-agent-vs-hook-agent';
export const COMMIT_HEADER = 'commit-header-and-trailers';
export const WHO_TOUCHED = 'who-touched-what';
export const LANES = 'agent-lanes';
export const DECISION_LIST = 'decision-list';
export const LATEST_DECISIONS = 'latest-human-decisions';
export const RE_VERIFY = 're-verify-with-git';
export const VERIFY_RULE = 'verify-it-yourself';
export const NOT_FOUND = 'what-was-asked-for-and-where-to-go';
export const SESSION_OPEN = 'one-snapshot-open-at-its-own-url-sessions-file';

/** The kit's human-decision rows in `scope`, each carrying its kind (pause-1, steer, pause-2, sign-off, merge). */
export function decisionRows(scope: Locator): Locator {
  return scope.locator('[class*="kit-human-decision-row__row"]');
}

/** The kind of each decision row in `scope`, in page order. */
export async function decisionKinds(scope: Locator): Promise<string[]> {
  return decisionRows(scope).evaluateAll((rows) => rows.map((row) => row.getAttribute('data-kind') ?? ''));
}

/** The agents of the lanes in `scope`, in page order, from each lane's "<agent> rungs" list. */
export async function laneAgents(scope: Locator): Promise<string[]> {
  return scope
    .locator('ol[aria-label$=" rungs"]')
    .evaluateAll((lists) => lists.map((list) => (list.getAttribute('aria-label') ?? '').replace(/ rungs$/, '')));
}

/** The top bar's search field (the kit's search: a combobox in a search landmark). */
export function searchField(page: Page): Locator {
  return page.getByRole('search').getByRole('combobox');
}

/** The matches the search shows. */
export function searchOptions(page: Page): Locator {
  return page.getByRole('search').getByRole('option');
}

/** A row of the who-touched-what table, by the short SHA its commit cell shows. */
export function touchedRow(scope: Locator, shortSha: string): Locator {
  return scope.locator('tbody tr').filter({ hasText: shortSha });
}
