// NAV-3 · Links out. Commit SHAs link to the commit on GitHub, PR numbers to the PR, file:line references to the file
// at that SHA. On the `rules` fixture trail, on the rule page, the matrix and the commit page; the snapshot SHA is the
// fixture repo's HEAD. Parity on the design fixture against docs/ui/derived/U1/rule/ and commit/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  CHIP,
  REPO,
  RULE_LINKS,
  SIGNATURE,
  auditEverywhere,
  commitHref,
  compileRules,
  compileTwoPlans,
  matrixLine,
  matrixRuleIds,
  openOnFixture,
  openRule,
  readMatrix,
  region,
  requirementsLine,
  route,
  rungOf,
  shaOf,
  short,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { commit, expectRegionComponents, expectRegionsInOrder, expectShell, rule } from './support/parity';

const COMMIT_LINKS = 'links-out';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRules();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** Opens the commit page of a fixture commit and waits until it names the commit. */
async function openCommit(page: Page, id: string): Promise<void> {
  const sha = shaOf(fixture, id);
  await openOnFixture(page, fixture, route.commit(sha));
  await expect(region(page, COMMIT_LINKS), `the page is commit ${id}'s`).toContainText(short(sha));
}

test.describe('the rule page', () => {
  test("NAV-3 · the rule page links SELL-1's red, green and refactor commits to them on GitHub", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const links = region(page, RULE_LINKS);
    for (const id of ['c2', 'c4', 'c5']) {
      const sha = shaOf(fixture, id);
      const link = links.locator('a', { hasText: short(sha) });
      await expect(link, `${id} is linked`).toHaveCount(1);
      await expect(link, `${id} opens on GitHub`).toHaveAttribute('href', commitHref(REPO, sha));
    }
  });

  test("NAV-3 · every commit rung on SELL-1's page links its SHA to that commit on GitHub", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    await expect(region(page, SIGNATURE)).toBeVisible();
    for (const id of ['c2', 'c3', 'c4', 'c5']) {
      const sha = shaOf(fixture, id);
      const link = rungOf(page, sha).first().locator(`a[href^="${REPO}/commit/"]`, { hasText: short(sha) });
      await expect(link, `${id}'s rung links it`).toHaveCount(1);
      await expect(link).toHaveAttribute('href', commitHref(REPO, sha));
    }
  });

  test('NAV-3 · the rule page links PR #10 to the pull request on GitHub', async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const pr = region(page, RULE_LINKS).locator(`a[href="${REPO}/pull/10"]`);
    await expect(pr).toHaveCount(1);
    await expect(pr).toContainText('#10');
  });

  test('NAV-3 · the rule page links the rule text to docs/requirements.md at the snapshot SHA, at its line', async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const line = requirementsLine('SELL-1');
    const link = region(page, RULE_LINKS).locator(`a[href="${REPO}/blob/${fixture.trail.head}/docs/requirements.md#L${line}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toContainText('docs/requirements.md');
    await expect(link).toContainText(String(line));
  });

  test("NAV-3 · the rule page links SELL-1's matrix row to docs/trace/requirements-matrix.md at the snapshot SHA, at its line", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const line = matrixLine('SELL-1');
    const link = region(page, RULE_LINKS).locator(`a[href="${REPO}/blob/${fixture.trail.head}/docs/trace/requirements-matrix.md#L${line}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toContainText(String(line));
  });

  test("NAV-3 · the rule page links SELL-1's QA step to docs/qa/build-F1.md on GitHub", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const link = region(page, RULE_LINKS).locator('a', { hasText: 'docs/qa/build-F1.md' });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', new RegExp(`^${REPO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/blob/[^/]+/docs/qa/build-F1\\.md`));
  });
});

test.describe('the matrix', () => {
  test("NAV-3 · the matrix links each rule's red and green SHAs to those commits on GitHub", async ({ page }) => {
    await openOnFixture(page, fixture, route.matrix);
    await expect.poll(() => matrixRuleIds(page)).toEqual(['SELL-1', 'SELL-2', 'GET-1', 'CANCEL-1', 'CANCEL-2']);
    const { rows } = await readMatrix(page);
    const cases: [string, string, string][] = [
      ['SELL-1', 'Red', 'c2'],
      ['SELL-1', 'Green', 'c4'],
      ['SELL-1', 'Refactor', 'c5'],
      ['GET-1', 'Red', 'c12'],
      ['GET-1', 'Green', 'c11'],
    ];
    for (const [id, column, commitId] of cases) {
      const sha = shaOf(fixture, commitId);
      const cell = rows.find((r) => (r['Rule']?.text ?? '').startsWith(id))?.[column];
      const link = cell?.links.find((l) => l.text.includes(short(sha)));
      expect(link?.href, `${id} ${column} links ${commitId} on GitHub`).toMatch(commitHref(REPO, sha));
    }
  });

  test('NAV-3 · the matrix links PR #10 to the pull request on GitHub', async ({ page }) => {
    await openOnFixture(page, fixture, route.matrix);
    await expect.poll(() => matrixRuleIds(page)).toContain('SELL-1');
    const { rows } = await readMatrix(page);
    for (const id of ['SELL-1', 'SELL-2']) {
      const pr = rows.find((r) => (r['Rule']?.text ?? '').startsWith(id))?.['PR'];
      expect(pr?.links, `${id}'s PR`).toEqual([{ text: '#10', href: `${REPO}/pull/10` }]);
    }
  });
});

// U1 D2/I5, on the `two-plans` fixture (its README): docs/trace/requirements-matrix.md's refactor cell reads
// `undefined` for CANCEL-5 (and RENEW-1/2), as the real matrix has it for 7 build rules; SELL-1's holds c3's SHA.
test.describe('a matrix commit cell that is not a SHA', () => {
  let two: CompiledTrail;
  test.beforeAll(() => {
    two = compileTwoPlans();
  });
  test.afterAll(() => {
    two?.trail.cleanup();
  });

  test("NAV-3 · the matrix links no commit from CANCEL-5's 'undefined' refactor cell, and still links SELL-1's refactor c3", async ({ page }) => {
    await openOnFixture(page, two, route.matrix);
    await expect.poll(() => matrixRuleIds(page)).toContain('CANCEL-5');
    const { rows } = await readMatrix(page);
    const refactor = (id: string) => rows.find((r) => (r['Rule']?.text ?? '').split(' ')[0] === id)?.['Refactor'];
    const c3 = shaOf(two, 'c3');
    expect(refactor('SELL-1')?.links.map((l) => l.href), "SELL-1's refactor is c3 on GitHub").toEqual([expect.stringMatching(commitHref(REPO, c3))]);
    expect(refactor('CANCEL-5')?.links, "CANCEL-5's refactor cell links nothing").toEqual([]);
    await expect(page.locator('a[href*="/commit/undefined"]'), 'no link to a commit named undefined').toHaveCount(0);
  });

  test("NAV-3 · CANCEL-5's rule page links its red and green commits and no commit named 'undefined'", async ({ page }) => {
    await openRule(page, two, 'CANCEL-5');
    const links = region(page, RULE_LINKS);
    for (const id of ['c7', 'c8']) {
      const sha = shaOf(two, id);
      await expect(links.getByRole('link', { name: short(sha) }).first(), `${id} on GitHub`).toHaveAttribute('href', commitHref(REPO, sha));
    }
    await expect(page.locator('a[href*="/commit/undefined"]'), 'no link to a commit named undefined').toHaveCount(0);
    await expect(links.getByRole('link', { name: 'undefined' }), 'no SHA link reads undefined').toHaveCount(0);
  });
});

test.describe('the commit page', () => {
  test('NAV-3 · the commit page links the commit and its parent to GitHub', async ({ page }) => {
    await openCommit(page, 'c4');
    const links = region(page, COMMIT_LINKS);
    const self = links.locator(`a[href^="${REPO}/commit/"]`, { hasText: short(shaOf(fixture, 'c4')) });
    const parent = links.locator(`a[href^="${REPO}/commit/"]`, { hasText: short(shaOf(fixture, 'c3')) });
    await expect(self).toHaveAttribute('href', commitHref(REPO, shaOf(fixture, 'c4')));
    await expect(parent).toHaveAttribute('href', commitHref(REPO, shaOf(fixture, 'c3')));
  });

  test("NAV-3 · the commit page links its node, build/F1, and each rule in its Rule trailer to their pages", async ({ page }) => {
    await openCommit(page, 'c4');
    const links = region(page, COMMIT_LINKS);
    await expect(links.locator('a', { hasText: 'build/F1' })).toHaveAttribute('href', /#\/plans\/build\/F1$/);
    const chips = links.locator(CHIP);
    await expect(chips).toHaveCount(2);
    await expect(chips.filter({ hasText: 'SELL-1' })).toHaveAttribute('href', /#\/rules\/SELL-1$/);
    await expect(chips.filter({ hasText: 'SELL-2' })).toHaveAttribute('href', /#\/rules\/SELL-2$/);
  });

  test('NAV-3 · reachable: a commit route answers with the commit page and its links-out region', async ({ page }) => {
    await openOnFixture(page, fixture, route.commit(shaOf(fixture, 'c4')));
    await expect(region(page, COMMIT_LINKS)).toBeVisible();
  });
});

test.describe('axe', () => {
  test('NAV-3 · the commit page on the fixture has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
    const path = route.commit(shaOf(fixture, 'c4'));
    await openOnFixture(page, fixture, path);
    await auditEverywhere(page, path, async (p) => {
      await expect(region(p, COMMIT_LINKS)).toContainText(short(shaOf(fixture, 'c4')));
    });
  });
});

test.describe('parity', () => {
  test("NAV-3 · parity: the rule page's links-out region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, rule, RULE_LINKS);
  });

  test("NAV-3 · parity: the commit page keeps its reference's regions in order, all but links out not built yet", async ({ page }) => {
    await expectRegionsInOrder(page, commit);
  });

  test("NAV-3 · parity: the commit page's links-out region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, commit, COMMIT_LINKS);
  });

  test("NAV-3 · parity: the commit page's shell, primary nav and title are its reference's", async ({ page }) => {
    await expectShell(page, commit);
  });
});
