// MATRIX-1 · Interactive requirements matrix. Every rule in requirements.md → plan/node → tests (pass/total) → red,
// green and refactor commits → QA step → sign-off → PR, the same columns as requirements-matrix.md, filterable by
// status and feature. On the `rules` fixture trail (its README gives every row below); parity on the design fixture
// against docs/ui/derived/U1/matrix/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  CHIP,
  auditEverywhere,
  compileRules,
  matrixRuleIds,
  openOnFixture,
  readMatrix,
  recordRequests,
  region,
  route,
  shaOf,
  short,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, matrix } from './support/parity';

const FILTERS = 'filters-status-feature';
const ALL = ['SELL-1', 'SELL-2', 'GET-1', 'CANCEL-1', 'CANCEL-2'];

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRules();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** Opens the matrix on the fixture and waits for its five rows. */
async function openMatrix(page: Page): Promise<void> {
  await openOnFixture(page, fixture, route.matrix);
  await expect.poll(() => matrixRuleIds(page), { message: "the matrix shows the fixture's five rules" }).toEqual(ALL);
}

function filters(page: Page) {
  return region(page, FILTERS).getByRole('group', { name: 'Filters' });
}

async function row(page: Page, id: string): Promise<Record<string, { text: string; links: { text: string; href: string }[] }>> {
  const { rows } = await readMatrix(page);
  const found = rows.find((r) => (r['Rule']?.text ?? '').split(' ')[0] === id);
  expect(found, `the matrix has a row for ${id}`).toBeDefined();
  return found ?? {};
}

test.describe('every rule, every column', () => {
  test('MATRIX-1 · the matrix lists every rule in requirements.md once, in its order', async ({ page }) => {
    await openOnFixture(page, fixture, route.matrix);
    await expect.poll(() => matrixRuleIds(page)).toEqual(ALL);
  });

  test("MATRIX-1 · the matrix has requirements-matrix.md's columns, with each rule's title and feature", async ({ page }) => {
    await openMatrix(page);
    const { headers } = await readMatrix(page);
    for (const column of ['Rule', 'Title', 'Feature', 'Node', 'Tests', 'Red', 'Green', 'Refactor', 'QA step', 'Sign-off', 'PR']) {
      expect(headers, `the matrix has a ${column} column`).toContain(column);
    }
  });

  test("MATRIX-1 · each row gives the rule's title and its feature, from requirements.md's headings", async ({ page }) => {
    await openMatrix(page);
    const expected: Record<string, [string, string]> = {
      'SELL-1': ['Policy reference must be unique', 'Sell'],
      'SELL-2': ['Can only be sold up to 60 days in advance', 'Sell'],
      'GET-1': ['Retrieve a policy', 'Retrieve'],
      'CANCEL-1': ['Cancel with a pro-rata refund', 'Cancel'],
      'CANCEL-2': ['No refund after a claim', 'Cancel'],
    };
    for (const [id, [title, feature]] of Object.entries(expected)) {
      const r = await row(page, id);
      expect(r['Title']?.text, `${id} title`).toBe(title);
      expect(r['Feature']?.text, `${id} feature`).toBe(feature);
    }
  });

  test("MATRIX-1 · SELL-1's row: node F1, 2 of 2 tests, red c2, green c4, refactor c5, QA step 1, David's sign-off, PR #10", async ({ page }) => {
    await openMatrix(page);
    const r = await row(page, 'SELL-1');
    expect(r['Node']?.text).toContain('F1');
    expect(r['Tests']?.text).toContain('2 of 2');
    expect(r['Red']?.text).toContain(short(shaOf(fixture, 'c2')));
    expect(r['Green']?.text).toContain(short(shaOf(fixture, 'c4')));
    expect(r['Refactor']?.text).toContain(short(shaOf(fixture, 'c5')));
    expect(r['QA step']?.text).toContain('docs/qa/build-F1.md#1');
    expect(r['Sign-off']?.text).toContain('David 2026-10-18');
    expect(r['PR']?.text).toContain('#10');
  });

  test("MATRIX-1 · SELL-2's row: node F1, 3 of 3 tests, red c2, green c4, no refactor commit, QA step 2", async ({ page }) => {
    await openMatrix(page);
    const r = await row(page, 'SELL-2');
    expect(r['Node']?.text).toContain('F1');
    expect(r['Tests']?.text).toContain('3 of 3');
    expect(r['Red']?.text).toContain(short(shaOf(fixture, 'c2')));
    expect(r['Green']?.text).toContain(short(shaOf(fixture, 'c4')));
    expect(r['Refactor']?.links, 'no refactor commit is linked').toEqual([]);
    expect(r['Refactor']?.text, 'no SHA is shown for the refactor').not.toMatch(/[0-9a-f]{7}/);
    expect(r['QA step']?.text).toContain('docs/qa/build-F1.md#2');
  });

  test("MATRIX-1 · GET-1's row: node F2, a pass count the trail doesn't hold (?/1), red c12, green c11, no QA step, sign-off pending, no PR", async ({ page }) => {
    await openMatrix(page);
    const r = await row(page, 'GET-1');
    expect(r['Node']?.text).toContain('F2');
    expect(r['Tests']?.text).toMatch(/\?\s*(\/|of)\s*1/);
    expect(r['Tests']?.text, 'an unknown pass count is not shown as a full pass').not.toMatch(/(^|\D)1\s*(of|\/)\s*1(\D|$)/);
    expect(r['Red']?.text).toContain(short(shaOf(fixture, 'c12')));
    expect(r['Green']?.text).toContain(short(shaOf(fixture, 'c11')));
    expect(r['QA step']?.text).not.toContain('docs/qa/');
    expect(r['Sign-off']?.text).not.toContain('David');
    expect(r['PR']?.text).not.toContain('#');
  });
});

test.describe('filters', () => {
  test('MATRIX-1 · the Status filter set to Not built shows CANCEL-1 and CANCEL-2 only', async ({ page }) => {
    await openMatrix(page);
    await filters(page).getByLabel('Status').selectOption({ label: 'Not built' });
    await expect.poll(() => matrixRuleIds(page)).toEqual(['CANCEL-1', 'CANCEL-2']);
  });

  test('MATRIX-1 · the Status filter set to Pass shows SELL-1 and SELL-2 only', async ({ page }) => {
    await openMatrix(page);
    await filters(page).getByLabel('Status').selectOption({ label: 'Pass' });
    await expect.poll(() => matrixRuleIds(page)).toEqual(['SELL-1', 'SELL-2']);
  });

  test("MATRIX-1 · the Feature filter offers the fixture's features: Sell, Retrieve and Cancel", async ({ page }) => {
    await openMatrix(page);
    const options = await filters(page).getByLabel('Feature').locator('option').allTextContents();
    expect(options.map((o) => o.trim())).toEqual(['Any', 'Sell', 'Retrieve', 'Cancel']);
  });

  test('MATRIX-1 · the Feature filter set to Sell shows SELL-1 and SELL-2 only, and says 2 of 5', async ({ page }) => {
    await openMatrix(page);
    await filters(page).getByLabel('Feature').selectOption({ label: 'Sell' });
    await expect.poll(() => matrixRuleIds(page)).toEqual(['SELL-1', 'SELL-2']);
    await expect(filters(page).getByRole('status')).toContainText(/Showing 2 of 5 rules/);
  });

  test('MATRIX-1 · Status and Feature together keep only the rules that match both', async ({ page }) => {
    await openMatrix(page);
    await filters(page).getByLabel('Feature').selectOption({ label: 'Cancel' });
    await filters(page).getByLabel('Status').selectOption({ label: 'Not built' });
    await expect.poll(() => matrixRuleIds(page)).toEqual(['CANCEL-1', 'CANCEL-2']);
    await filters(page).getByLabel('Feature').selectOption({ label: 'Sell' });
    await expect(filters(page).getByRole('status')).toContainText(/Showing 0 of 5 rules/);
    await expect(region(page, 'matrix-table').locator('tbody tr')).toHaveCount(0);
  });

  test('MATRIX-1 · Clear filters shows all five rules again', async ({ page }) => {
    await openMatrix(page);
    await filters(page).getByLabel('Feature').selectOption({ label: 'Retrieve' });
    await expect.poll(() => matrixRuleIds(page)).toEqual(['GET-1']);
    await filters(page).getByRole('button', { name: 'Clear filters' }).click();
    await expect.poll(() => matrixRuleIds(page)).toEqual(ALL);
    await expect(filters(page).getByRole('status')).toContainText(/Showing 5 of 5 rules/);
  });

  test('MATRIX-1 · filtering reads the rows already loaded and sends no request', async ({ page }) => {
    await openMatrix(page);
    const seen = recordRequests(page);
    await filters(page).getByLabel('Status').selectOption({ label: 'Not built' });
    await filters(page).getByLabel('Feature').selectOption({ label: 'Cancel' });
    await expect.poll(() => matrixRuleIds(page)).toEqual(['CANCEL-1', 'CANCEL-2']);
    expect(seen.map((u) => u.pathname)).toEqual([]);
  });
});

test.describe('rule chips', () => {
  test('MATRIX-1 · every rule chip in the matrix opens its own rule', async ({ page }) => {
    await openMatrix(page);
    const chips = region(page, 'matrix-table').locator(`tbody ${CHIP}`);
    await expect(chips).toHaveCount(ALL.length);
    for (const [i, id] of ALL.entries()) {
      await expect(chips.nth(i)).toContainText(id);
      await expect(chips.nth(i), `${id}'s chip opens ${id}`).toHaveAttribute('href', new RegExp(`#/rules/${id}$`));
    }
    await chips.nth(1).click();
    await expect(page).toHaveURL(/#\/rules\/SELL-2$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('SELL-2');
  });

  test('MATRIX-1 · reachable: the Requirements matrix nav entry is a link that opens the matrix', async ({ page }) => {
    await openOnFixture(page, fixture, route.overview);
    const nav = page.getByRole('navigation', { name: /^Primary/ });
    const entry = nav.getByRole('link', { name: 'Requirements matrix' });
    await expect(entry, 'the Requirements matrix nav entry is a link').toHaveCount(1);
    await entry.click();
    await expect(page).toHaveURL(/#\/rules$/);
    await expect(region(page, 'matrix-table')).toBeVisible();
  });
});

test.describe('axe', () => {
  test('MATRIX-1 · the matrix on the fixture has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
    await openOnFixture(page, fixture, route.matrix);
    await auditEverywhere(page, route.matrix, async (p) => {
      await expect.poll(() => matrixRuleIds(p)).toEqual(ALL);
    });
  });
});

test.describe('parity', () => {
  test("MATRIX-1 · parity: the matrix keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, matrix);
  });

  test("MATRIX-1 · parity: the matrix's filters region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, matrix, FILTERS);
  });

  test("MATRIX-1 · parity: the matrix table region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, matrix, 'matrix-table');
  });

  test("MATRIX-1 · parity: the matrix's shell, primary nav, current item and title are its reference's", async ({ page }) => {
    await expectShell(page, matrix);
  });

  test('MATRIX-1 · parity: the matrix takes every colour from a token, light and dark', async ({ page }) => {
    await expectTokensOnly(page, matrix);
  });
});
