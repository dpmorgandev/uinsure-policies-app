// U2's routes (the plan, the node page's rules and tasks, the walkthrough, the commit's and the rule's diffs) and its
// fixture trails, on top of U1's helpers for the built app (vite preview on DOCKET_APP_PORT): serving a compiled
// fixture, its regions, its commits, axe in both themes and widths.
//   plans/      three plans (build, ui, inv-001), a branching DAG in file order, tasks and acceptance per node
//   in-flight/  a node mid-loop: no README or walkthrough yet, one malformed loop line and one malformed activity line
//   rules/      U1's rendered trail: F1's walkthrough (nine commits with TDD and Agent trailers), SELL-1's and
//               GET-1's red and green commits, whose diffs come from git
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { compileFixture } from '../../U0b/support/trail';
import type { CompiledTrail } from '../../U0b/support/trail';
import { openOnFixture } from '../../U1/support/app';

export {
  CHIP,
  REPO,
  auditEverywhere,
  banners,
  commitHref,
  compileRules,
  openOnFixture,
  recordRequests,
  region,
  shaOf,
  short,
} from '../../U1/support/app';
export type { CompiledTrail } from '../../U1/support/app';

/** U2's routes (hash routing), and the node views it heads. */
export const route = {
  overview: '/#/',
  plan: (plan: string): string => `/#/plans/${plan}`,
  node: (plan: string, node: string): string => `/#/plans/${plan}/${node}`,
  walkthrough: (plan: string, node: string): string => `/#/plans/${plan}/${node}/commits`,
  activity: (plan: string, node: string): string => `/#/plans/${plan}/${node}/activity`,
  commit: (sha: string): string => `/#/commits/${sha}`,
  rule: (id: string): string => `/#/rules/${id}`,
};

/** The in-app href a link to a page carries: the route without its leading slash, matched at the end. */
export function hrefTo(path: string): RegExp {
  return new RegExp(`${path.replace(/^\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

/** The fixture with three plans: tests/Uinsure.Policies.Web.Tests/fixtures/trails/plans/README.md. */
export function compilePlans(): CompiledTrail {
  return compileFixture('plans');
}

/** The fixture with a node mid-loop: tests/Uinsure.Policies.Web.Tests/fixtures/trails/in-flight/README.md. */
export function compileInFlight(): CompiledTrail {
  return compileFixture('in-flight');
}

/** The plan page's regions (docs/ui/derived/U2/plan/screen.json). */
export const PLAN_HEADER = 'plan-header-status-approval-requirements-rev';
export const GRAPH = 'node-graph-and-its-table';
/** The overview's region that draws the build plan (docs/ui/derived/U2/overview/screen.json). */
export const AT_A_GLANCE = 'build-plan-at-a-glance';
/** The node page's regions (docs/ui/derived/U2/node/screen.json). */
export const COMPLETENESS = 'completeness-banner';
export const RULES = 'rules';
export const TASKS = 'tasks';
/** The walkthrough's one region (docs/ui/derived/U2/walkthrough/screen.json). */
export const SEQUENCE = 'commit-sequence';
/** The commit page's diff, and the rule page's red and green diffs. */
export const DIFF = 'diff-lazy';
export const RULE_DIFFS = 'red-and-green-diffs-lazy';

/** The page's level-one heading. */
export function heading(page: Page): Locator {
  return page.getByRole('heading', { level: 1 });
}

/** Opens a route on a compiled fixture and waits until the page's heading names `id`. */
export async function openHeaded(page: Page, fixture: CompiledTrail, path: string, id: string): Promise<void> {
  await openOnFixture(page, fixture, path);
  await expect(heading(page), `the page heads ${id}`).toContainText(id);
}

/** One node of the plan graph (the kit's dag-graph): the list item whose id reads exactly `id`. */
export function graphNode(scope: Locator, id: string): Locator {
  return scope.locator('li[data-layer]').filter({ has: scope.page().getByText(id, { exact: true }) });
}

/** One row of a plan's text equivalent (the kit's dag-table), as the page shows it. */
export interface PlanRow {
  id: string;
  /** Every node id the row says it depends on. */
  dependsOn: string[];
  /** The depends-on cell's text, whitespace collapsed. */
  dependsText: string;
  status: string;
  rules: { text: string; href: string }[];
  /** Every link in the row's node cell. */
  links: { text: string; href: string }[];
}

/** The text-equivalent table of the plan graph in `scope`, row by row, in page order. */
export async function planRows(scope: Locator): Promise<PlanRow[]> {
  const table = scope.locator('table').first();
  if ((await table.count()) === 0) return [];
  return table.locator('tbody tr').evaluateAll((rows) => {
    const clean = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim();
    return rows.map((tr) => {
      const head = tr.querySelector('th');
      const cells = Array.from(tr.querySelectorAll('td'));
      const idEl = head?.querySelector('a, span');
      return {
        id: clean(idEl?.textContent ?? ''),
        dependsOn: Array.from(cells[0]?.querySelectorAll('li') ?? []).map((li) => clean(li.textContent)),
        dependsText: clean(cells[0]?.textContent ?? ''),
        status: clean(cells[1]?.textContent ?? ''),
        rules: Array.from(cells[2]?.querySelectorAll('a') ?? []).map((a) => ({ text: clean(a.textContent), href: a.getAttribute('href') ?? '' })),
        links: Array.from(head?.querySelectorAll('a') ?? []).map((a) => ({ text: clean(a.textContent), href: a.getAttribute('href') ?? '' })),
      };
    });
  });
}

/** The rows of the first table in `scope`, each as its text, whitespace collapsed. */
export async function rowTexts(scope: Locator): Promise<string[]> {
  const table = scope.locator('table').first();
  if ((await table.count()) === 0) return [];
  return table.locator('tbody tr').evaluateAll((rows) => rows.map((tr) => (tr.textContent ?? '').replace(/\s+/g, ' ').trim()));
}

/** One field of the page header (the kit's page-header `<dt>` and its `<dd>`), by its label. */
export function headerField(page: Page, label: string): Locator {
  return page
    .getByRole('main')
    .locator('dl > div')
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) });
}

/** The node's view tabs ("Views of this node", the kit's tabs). */
export function nodeTabs(page: Page): Locator {
  return page.getByRole('navigation', { name: /^Views of/ });
}

/** The primary nav. */
export function primaryNav(page: Page): Locator {
  return page.getByRole('navigation', { name: /^Primary/ });
}

/** Where each SHA's short form first appears in `text`, in the order given; -1 where it does not. */
export function positions(text: string, shas: readonly string[]): number[] {
  return shas.map((sha) => text.indexOf(sha.slice(0, 7)));
}

/** One diff viewer (the kit's diff-viewer, labelled "Diff for #<row> <sha>") in `scope`: this commit's. */
export function diffViewer(scope: Locator, sha: string): Locator {
  return scope.locator(`section[aria-label^="Diff for"][aria-label*="${sha.slice(0, 7)}"]`);
}

/** The lines a loaded diff viewer shows, as [kind, code] in order: kind is add, del or ctx. */
export async function diffLines(viewer: Locator): Promise<[string, string][]> {
  return viewer
    .locator('tr[data-kind]')
    .evaluateAll((rows) => rows.map((tr) => [tr.getAttribute('data-kind') ?? '', (tr.querySelector('code')?.textContent ?? '').trim()] as [string, string]));
}

/** The file paths a loaded diff viewer names, in order. */
export async function diffFiles(viewer: Locator): Promise<string[]> {
  return viewer.locator('caption').evaluateAll((captions) => captions.map((c) => (c.textContent ?? '').trim()));
}

/** Asks a diff viewer for its diff when it waits to be asked; a viewer that loads on its own is left alone. */
export async function loadIfAsked(viewer: Locator): Promise<void> {
  await expect(viewer, 'the diff viewer is drawn').toBeVisible();
  const ask = viewer.getByRole('button', { name: /^Load\b/ });
  if ((await ask.count()) > 0 && (await ask.isEnabled())) await ask.click();
  await expect(viewer, 'the diff has loaded').toHaveAttribute('data-status', 'loaded');
}
