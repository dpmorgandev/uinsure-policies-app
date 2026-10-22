// U1's routes and the `rules` fixture trail (tests/web/fixtures/trails/rules/README.md), on top of U0b's helpers for
// the built app (vite preview on DOCKET_APP_PORT): serving trace data, themes, widths, axe and the footer stamp.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { axeViolations, backgroundToken, serveTrace, setTheme, snapshotOf, themes, tokenBackground, viewports } from '../../U0b/support/app';
import { compileFixture, fixturesDir } from '../../U0b/support/trail';
import type { CompiledTrail } from '../../U0b/support/trail';

export {
  PLACEHOLDER,
  REPO,
  axeViolations,
  expectFooterStamp,
  recordRequests,
  serveTrace,
  setTheme,
  snapshotOf,
  themes,
  viewports,
} from '../../U0b/support/app';
export type { Theme } from '../../U0b/support/app';
export type { CompiledTrail } from '../../U0b/support/trail';

/** U1's routes (hash routing): the overview, the matrix, a rule, a node (its completeness banner) and a commit. */
export const route = {
  overview: '/#/',
  matrix: '/#/rules',
  rule: (id: string): string => `/#/rules/${id}`,
  node: (plan: string, node: string): string => `/#/plans/${plan}/${node}`,
  commit: (sha: string): string => `/#/commits/${sha}`,
};

/** The fixture this node's behaviour tests run on. */
export const FIXTURE = 'rules';
export const fixtureDir = join(fixturesDir, FIXTURE);

/** Compiles the `rules` fixture once for a spec file. */
export function compileRules(): CompiledTrail {
  return compileFixture(FIXTURE);
}

/**
 * The `two-plans` fixture (tests/web/fixtures/trails/two-plans/README.md, U1 D2): both plans' requirements files and
 * matrices, a RENEW-1/2 row, `undefined` refactor cells, build/F1's signoff(<sha>) and merged(<sha>), and a
 * template-literal NAV-1 title.
 */
export const TWO_PLANS = 'two-plans';

/** Compiles the `two-plans` fixture once for a describe block. */
export function compileTwoPlans(): CompiledTrail {
  return compileFixture(TWO_PLANS);
}

/**
 * The `real-trailers` fixture (tests/web/fixtures/trails/real-trailers/README.md, U1 D3): commit bodies as the real
 * trail writes them, a repeated `Rule:` and `Fixes-Finding:`, `Rule: none`, and RENEW-1/2's red trailed `RENEW-1/2`
 * (c6, F4 #2) and its green trailed by its parts `RENEW-1, RENEW-2` (c7, F4 #3).
 */
export const REAL_TRAILERS = 'real-trailers';

/** Compiles the `real-trailers` fixture once for a describe block. */
export function compileRealTrailers(): CompiledTrail {
  return compileFixture(REAL_TRAILERS);
}

/** A fixture commit's full SHA, by its id in rules/commits.json. Fails, as an assertion, on an unknown id. */
export function shaOf(fixture: CompiledTrail, id: string): string {
  const sha = fixture.trail.shas[id];
  expect(sha, `the fixture made commit ${id}`).toMatch(/^[0-9a-f]{40}$/);
  return sha ?? '';
}

export const short = (sha: string): string => sha.slice(0, 7);

/** The 1-based line of `docs/requirements.md` (in the fixture's base) holding a rule's row. */
export function requirementsLine(id: string): number {
  return lineOf(join(fixtureDir, 'base', 'docs', 'requirements.md'), `| ${id} |`);
}

/** The 1-based line of the fixture's `docs/trace/requirements-matrix.md` holding a rule's row. */
export function matrixLine(id: string): number {
  return lineOf(join(fixtureDir, 'trail', 'docs', 'trace', 'requirements-matrix.md'), `| ${id} |`);
}

function lineOf(file: string, prefix: string): number {
  const index = readFileSync(file, 'utf8').split(/\r?\n/).findIndex((line) => line.startsWith(prefix));
  expect(index, `${file} has a line starting "${prefix}"`).toBeGreaterThanOrEqual(0);
  return index + 1;
}

/**
 * Opens a route on the compiled fixture. Asserts first that the compiler wrote a stamped trace.json for it (so a
 * compile failure reads as one); each test then asserts the fixture's own data on the page.
 */
export async function openOnFixture(page: Page, fixture: CompiledTrail, path: string): Promise<void> {
  snapshotOf(fixture.compiled);
  await serveTrace(page, fixture.compiled.publicDir);
  await page.goto(path);
}

/** A region of the page's main content, by its data-region slug. */
export function region(page: Page, slug: string): Locator {
  return page.getByRole('main').locator(`[data-region="${slug}"]`);
}

/** The rule page's regions (docs/ui/derived/U1/rule/screen.json). */
export const RULE_TEXT = 'rule-text-and-agreed-interpretation';
export const SIGNATURE = 'signature-red-before-green-evidence-custody-chain-tdd-ticks-chronology-per-style';
export const TESTS = 'tests-count-and-scope';
export const QA = 'qa-step-and-sign-off';
export const RULE_LINKS = 'links-out-commit-shas-pr-numbers-and-file-line-references-to-github-at-that-sha';

/** Opens a rule page on the fixture and waits until its heading names the rule. */
export async function openRule(page: Page, fixture: CompiledTrail, id: string): Promise<void> {
  await openOnFixture(page, fixture, route.rule(id));
  await expect(page.getByRole('heading', { level: 1 }), `the page heads rule ${id}`).toContainText(id);
}

/**
 * The commit rungs of the rule page's spine (the kit's rung-spine: a commit's rung is marked with its walkthrough row,
 * "#2"; the rule, QA, sign-off and PR rungs are not), in page order, each as the id of the fixture commit whose short
 * SHA it shows.
 */
export async function rungCommits(page: Page, fixture: CompiledTrail): Promise<string[]> {
  const texts = await region(page, SIGNATURE)
    .locator('li[data-kind="rung"]')
    .evaluateAll((rungs) =>
      rungs
        .filter((rung) => /#\d+/.test(rung.querySelector('[data-marker]')?.textContent ?? ''))
        .map((rung) => rung.textContent ?? ''),
    );
  const commits = Object.entries(fixture.trail.shas);
  return texts.flatMap((text) => {
    const hit = commits.find(([, sha]) => text.includes(short(sha)));
    return hit ? [hit[0]] : [];
  });
}

/** The commit rung of the rule page's spine that shows a commit: the rung marked with a walkthrough row. */
export function rungOf(page: Page, sha: string): Locator {
  return region(page, SIGNATURE)
    .locator('li[data-kind="rung"]')
    .filter({ has: page.locator('[data-marker]', { hasText: /#\d+/ }) })
    .filter({ hasText: short(sha) });
}

/** The kit's rule chip, wherever it is drawn. */
export const CHIP = 'a[class*="kit-rule-chip__chip"]';

/** The kit's completeness banner. */
export function banners(scope: Page | Locator): Locator {
  return scope.locator('section[aria-label="Trail completeness"]');
}

/** A commit link out to GitHub for this SHA: the full SHA or its short form, as GitHub accepts both. */
export function commitHref(repo: string, sha: string): RegExp {
  return new RegExp(`^${repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/commit/${short(sha)}[0-9a-f]{0,33}$`);
}

/**
 * Opens `path` fresh in each theme at 1440 and 390, waits for `ready`, and gathers axe's violations for each.
 * `ready` asserts the fixture's own data is on the page, since an audit of canned content proves nothing.
 */
export async function auditEverywhere(page: Page, path: string, ready: (page: Page) => Promise<void>): Promise<void> {
  for (const theme of themes) {
    for (const width of [1440, 390] as const) {
      await setTheme(page, theme);
      await page.setViewportSize(viewports[width]);
      await page.goto('about:blank');
      await page.goto(path);
      await ready(page);
      expect(await backgroundToken(page), `the ${theme} theme's tokens are in force at ${width}`).toBe(tokenBackground[theme]);
      expect.soft(await axeViolations(page), `axe, ${theme} at ${width}`).toEqual([]);
    }
  }
}

/** One cell of the matrix table: its text, whitespace collapsed, and every link's href in it. */
export interface Cell {
  text: string;
  links: { text: string; href: string }[];
}

/** The matrix table as rows keyed by column header (the header's text up to its first comma: "Tests, at the node" is "Tests"). */
export async function readMatrix(page: Page): Promise<{ headers: string[]; rows: Record<string, Cell>[] }> {
  const table = region(page, 'matrix-table').locator('table').first();
  // No table on the page reads as no rows, so a caller's assertion fails rather than waiting on a missing element.
  if ((await table.count()) === 0) return { headers: [], rows: [] };
  return table.evaluate((table) => {
      const clean = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim();
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => clean(th.textContent).split(',')[0] ?? '');
      const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) => {
        const row: Record<string, { text: string; links: { text: string; href: string }[] }> = {};
        Array.from(tr.querySelectorAll('th, td')).forEach((cell, i) => {
          row[headers[i] ?? `#${i}`] = {
            text: clean(cell.textContent),
            links: Array.from(cell.querySelectorAll('a')).map((a) => ({ text: clean(a.textContent), href: a.getAttribute('href') ?? '' })),
          };
        });
        return row;
      });
      return { headers, rows };
    });
}

/** The rule IDs of the matrix rows on show, in order: each row's Rule cell starts with its ID. */
export async function matrixRuleIds(page: Page): Promise<string[]> {
  const { rows } = await readMatrix(page);
  return rows.map((row) => (row['Rule']?.text ?? '').split(' ')[0] ?? '');
}
