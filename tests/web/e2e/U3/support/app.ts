// U3's routes and the `retry-ladder` fixture trail (tests/web/fixtures/trails/retry-ladder/README.md), on top of U1's
// and U0b's helpers for the built app (vite preview on DOCKET_APP_PORT): serving trace data, themes, widths, axe and
// the rule and commit links. U3 builds the loop, verdict and finding screens, the node page's attempts region, the
// plan page's investigation body and the about page's provenance labels (docs/ui/derived/U3/derived.json).
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { compileFixture } from '../../U0b/support/trail';
import type { CompiledTrail } from '../../U0b/support/trail';
import { openOnFixture, region } from '../../U1/support/app';

export { openOnFixture, region };
export { REPO, auditEverywhere, commitHref, compileRules, shaOf, short, snapshotOf } from '../../U1/support/app';
export type { CompiledTrail } from '../../U1/support/app';
export { setTheme, viewports } from '../../U0b/support/app';

/** U3's routes (hash routing). */
export const route = {
  about: '/#/about',
  plan: (plan: string): string => `/#/plans/${plan}`,
  node: (plan: string, node: string): string => `/#/plans/${plan}/${node}`,
  loop: (plan: string, node: string): string => `/#/plans/${plan}/${node}/loop`,
  verdict: (plan: string, node: string, round: string, agent: string): string => `/#/plans/${plan}/${node}/verdicts/${round}/${agent}`,
  findings: (plan: string, node: string, round: string): string => `/#/plans/${plan}/${node}/findings/${round}`,
};

/** The fixture U3's behaviour tests run on: build/F1 over three attempts, with inv-001 before the third. */
export const RETRY = 'retry-ladder';

/** Compiles the `retry-ladder` fixture once for a spec file. */
export function compileRetry(): CompiledTrail {
  return compileFixture(RETRY);
}

/** The regions U3 builds, by their data-region slugs (docs/ui/derived/U3/<screen>/screen.json). */
export const LADDER = 'attempt-ladder';
export const TIMELINE = 'gate-timeline';
export const SUMMARY = 'verdict-summary';
export const VERDICT_FINDINGS = 'findings';
export const RAW_JSON = 'raw-json';
export const FINDINGS = 'findings';
export const FIXED_BY = 'fixed-by';
export const ATTEMPTS = 'attempts';
export const INVESTIGATION = 'investigation-body-inv-plans-only';
export const PROVENANCE = 'provenance-labels';

/** The file on GitHub at a SHA, at a line: where a verdict finding's file:line links. */
export function blobHref(repo: string, sha: string, path: string, line: number): string {
  return `${repo}/blob/${sha}/${path}#L${line}`;
}

/**
 * A gate or state event drawn by the kit's gate-row, by its accessible name: "<attempt>·<line> <event>: <result>",
 * the result one of "Gate held", "Gate failed", "Failed as expected", "Waived" or, for a state event, "State change".
 */
export function gateRow(scope: Locator, name: string): Locator {
  return scope.getByRole('group', { name, exact: true });
}

/** Every gate and state event drawn in `scope`, as its row's accessible name, in page order. */
export async function gateRowNames(scope: Locator): Promise<string[]> {
  return scope
    .locator('[data-kind="gate"][aria-label], [data-kind="state"][aria-label]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('aria-label') ?? ''));
}

/** A term's value in a description list: the <dd> after the <dt> whose whole text is `term`. */
export function fact(scope: Locator, term: string): Locator {
  return scope
    .locator('dt')
    .filter({ hasText: new RegExp(`^\\s*${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) })
    .first()
    .locator('xpath=following-sibling::dd[1]');
}

/** One item of a rung spine (the kit's attempt ladder): an attempt's rung, or a branch stepping off the spine. */
export interface SpineItem {
  kind: string;
  /** A rung's label ("Attempt 2"), or a branch's heading ("Investigation inv-001"). */
  label: string;
  /** The status the rung's tag line gives (pass, fail, warn, pending, not-built); null for a branch. */
  status: string | null;
  /** The words of the rung's tag ("Failed at gate.stub"); '' for a branch. */
  tag: string;
}

/** The rungs and branches of the ladder in `scope`, in page order. */
export async function spineItems(scope: Locator): Promise<SpineItem[]> {
  return scope.locator('li[data-kind="rung"], li[data-kind="branch"]').evaluateAll((items) =>
    items.map((li) => {
      const clean = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();
      const kind = li.getAttribute('data-kind') ?? '';
      if (kind === 'branch') {
        return { kind, label: clean(li.querySelector('h2, h3, h4, h5, h6')?.textContent), status: null, tag: '' };
      }
      const label = document.getElementById(li.getAttribute('aria-labelledby') ?? '');
      const tag = label?.parentElement?.querySelector('[data-status]') ?? null;
      return { kind, label: clean(label?.textContent), status: tag?.getAttribute('data-status') ?? null, tag: clean(tag?.textContent) };
    }),
  );
}

/** An attempt's rung in the ladder in `scope`, by its label: "Attempt 2". */
export function rung(scope: Locator, label: string): Locator {
  return scope.locator('li[data-kind="rung"]').filter({ has: scope.page().getByText(label, { exact: true }) });
}

/**
 * The steps of attempt `n` (the kit's "Steps of attempt <n>" list), opening its "Show the steps of attempt <n>"
 * control first where the ladder keeps them behind one.
 */
export async function stepsOf(scope: Locator, n: number): Promise<Locator> {
  const show = scope.getByRole('button', { name: `Show the steps of attempt ${n}` });
  if ((await show.count()) > 0 && (await show.getAttribute('aria-expanded')) === 'false') await show.click();
  return scope.getByRole('list', { name: `Steps of attempt ${n}`, exact: true });
}

/** The stage of each step in a steps list, in order: gate, findings, red test, fix commit, verdict, … */
export async function stagesOf(steps: Locator): Promise<string[]> {
  await expect(steps, 'the attempt lists its steps').toBeVisible();
  return steps.locator('xpath=./li').evaluateAll((items) => items.map((li) => li.getAttribute('data-stage') ?? ''));
}

/** The steps of a steps list at one stage. */
export function stepsAt(steps: Locator, stage: string): Locator {
  return steps.locator(`xpath=./li[@data-stage="${stage}"]`);
}

/** A finding card (the kit's finding-card), by the finding's id as its heading gives it. */
export function findingCard(scope: Locator, id: string): Locator {
  return scope.locator('article[data-testable]').filter({ has: scope.page().getByRole('heading', { name: new RegExp(`^${id}\\b`) }) });
}

/** Opens a route on the compiled fixture and waits until the page's main content has drawn a region. */
export async function openRegion(page: Page, fixture: CompiledTrail, path: string, slug: string): Promise<Locator> {
  await openOnFixture(page, fixture, path);
  const found = region(page, slug);
  await expect(found, `the page draws its ${slug} region`).toBeVisible();
  return found;
}
