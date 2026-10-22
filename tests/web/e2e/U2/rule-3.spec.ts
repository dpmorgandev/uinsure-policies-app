// RULE-3 · Diffs. The rule's red and green commits show their diffs (from the node packet's diff.patch or git). U2's
// acceptance: a commit shows its diff. On U1's `rules` fixture trail (rules/README.md): SELL-1's red c2 adds
// tests/web/e2e/F1/sell.spec.ts and its green c4 adds src/sell.txt ("the sale"); GET-1's green c11 adds src/get.txt
// ("the retrieve"). On the `in-flight` fixture (in-flight/README.md): the stub c3 changes src/sell.txt's one line.
// Diffs load when asked: the node's diff chunk is fetched only then. Parity on the design fixture against
// docs/ui/derived/U2/commit/ and rule/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  DIFF,
  RULE_DIFFS,
  auditEverywhere,
  compileInFlight,
  compileRules,
  diffFiles,
  diffLines,
  diffViewer,
  loadIfAsked,
  openHeaded,
  openOnFixture,
  recordRequests,
  region,
  route,
  shaOf,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { commit, expectRegionComponents, expectRegionsInOrder, expectShell, longCommit, rule } from './support/parity';

const isDiffChunk = (url: URL): boolean => /^\/trace\/[^/]+\/[^/]+\/diffs\.json$/.test(url.pathname);

test.describe('on the rules fixture', () => {
  let fixture: CompiledTrail;
  test.beforeAll(() => {
    fixture = compileRules();
  });
  test.afterAll(() => {
    fixture?.trail.cleanup();
  });

  async function openRule(page: Page, id: string): Promise<void> {
    await openHeaded(page, fixture, route.rule(id), id);
  }

  async function openCommit(page: Page, id: string): Promise<void> {
    await openOnFixture(page, fixture, route.commit(shaOf(fixture, id)));
  }

  test.describe('the rule page', () => {
    test("RULE-3 · SELL-1's page offers the diffs of its red commit, c2, and its green commit, c4", async ({ page }) => {
      await openRule(page, 'SELL-1');
      const diffs = region(page, RULE_DIFFS);
      await expect(diffViewer(diffs, shaOf(fixture, 'c2')), 'the red diff, c2').toHaveCount(1);
      await expect(diffViewer(diffs, shaOf(fixture, 'c4')), 'the green diff, c4').toHaveCount(1);
      await expect(diffs.locator('section[aria-label^="Diff for"]'), 'no other diff').toHaveCount(2);
    });

    test("RULE-3 · SELL-1's diffs load only when asked: the diff chunk is fetched on the press, not before", async ({ page }) => {
      const seen = recordRequests(page);
      await openRule(page, 'SELL-1');
      const green = diffViewer(region(page, RULE_DIFFS), shaOf(fixture, 'c4'));
      const ask = green.getByRole('button', { name: /^Load\b/ });
      await expect(ask, 'the green diff waits to be asked for').toBeVisible();
      expect(seen.filter(isDiffChunk).map((u) => u.pathname), 'no diff chunk before the press').toEqual([]);
      await ask.click();
      await expect(green).toHaveAttribute('data-status', 'loaded');
      expect(seen.filter(isDiffChunk).map((u) => u.pathname), "F1's diff chunk, on the press").toEqual(['/trace/build/F1/diffs.json']);
    });

    test("RULE-3 · SELL-1's green diff, once loaded, shows c4 adding src/sell.txt with the line 'the sale'", async ({ page }) => {
      await openRule(page, 'SELL-1');
      const green = diffViewer(region(page, RULE_DIFFS), shaOf(fixture, 'c4'));
      await loadIfAsked(green);
      expect(await diffFiles(green)).toEqual(['src/sell.txt']);
      expect(await diffLines(green)).toEqual([['add', 'the sale']]);
    });

    test("RULE-3 · SELL-1's red diff, once loaded, shows c2 adding the acceptance tests to tests/web/e2e/F1/sell.spec.ts", async ({ page }) => {
      await openRule(page, 'SELL-1');
      const red = diffViewer(region(page, RULE_DIFFS), shaOf(fixture, 'c2'));
      await loadIfAsked(red);
      expect(await diffFiles(red)).toEqual(['tests/web/e2e/F1/sell.spec.ts']);
      const lines = await diffLines(red);
      expect(lines.every(([kind]) => kind === 'add'), 'a new file: every line added').toBe(true);
      expect(lines.map(([, code]) => code).join('\n')).toContain('a sale with a new reference answers 201');
    });

    test("RULE-3 · GET-1's page shows its own green diff, c11 adding src/get.txt with the line 'the retrieve'", async ({ page }) => {
      await openRule(page, 'GET-1');
      const green = diffViewer(region(page, RULE_DIFFS), shaOf(fixture, 'c11'));
      await loadIfAsked(green);
      expect(await diffFiles(green)).toEqual(['src/get.txt']);
      expect(await diffLines(green)).toEqual([['add', 'the retrieve']]);
    });

    test("RULE-3 · each diff on SELL-1's page names its commit's TDD step and agent: c2 red by the tester, c4 green by the builder", async ({ page }) => {
      await openRule(page, 'SELL-1');
      const diffs = region(page, RULE_DIFFS);
      const red = diffViewer(diffs, shaOf(fixture, 'c2'));
      const green = diffViewer(diffs, shaOf(fixture, 'c4'));
      await expect(red.locator('[data-step]')).toHaveAttribute('data-step', 'red');
      await expect(red.locator('[data-agent]')).toHaveAttribute('data-agent', 'tester');
      await expect(green.locator('[data-step]')).toHaveAttribute('data-step', 'green');
      await expect(green.locator('[data-agent]')).toHaveAttribute('data-agent', 'builder');
    });
  });

  test.describe('the commit page', () => {
    test('RULE-3 · the commit page of c4 shows its diff: src/sell.txt, the line "the sale" added', async ({ page }) => {
      await openCommit(page, 'c4');
      const viewer = diffViewer(region(page, DIFF), shaOf(fixture, 'c4'));
      await loadIfAsked(viewer);
      expect(await diffFiles(viewer)).toEqual(['src/sell.txt']);
      expect(await diffLines(viewer)).toEqual([['add', 'the sale']]);
    });

    test("RULE-3 · the commit page of c11, an F2 commit, shows c11's own diff and not another commit's", async ({ page }) => {
      await openCommit(page, 'c11');
      const viewer = diffViewer(region(page, DIFF), shaOf(fixture, 'c11'));
      await loadIfAsked(viewer);
      expect(await diffFiles(viewer)).toEqual(['src/get.txt']);
      await expect(region(page, DIFF)).not.toContainText('src/sell.txt');
    });
  });

  test.describe('axe', () => {
    test("RULE-3 · SELL-1's page with both diffs loaded has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
      const path = route.rule('SELL-1');
      await openOnFixture(page, fixture, path);
      await auditEverywhere(page, path, async (p) => {
        const diffs = region(p, RULE_DIFFS);
        await loadIfAsked(diffViewer(diffs, shaOf(fixture, 'c2')));
        await loadIfAsked(diffViewer(diffs, shaOf(fixture, 'c4')));
      });
    });

    test("RULE-3 · c4's commit page with its diff loaded has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
      const path = route.commit(shaOf(fixture, 'c4'));
      await openOnFixture(page, fixture, path);
      await auditEverywhere(page, path, async (p) => {
        await loadIfAsked(diffViewer(region(p, DIFF), shaOf(fixture, 'c4')));
      });
    });
  });
});

test.describe('on the in-flight fixture', () => {
  let fixture: CompiledTrail;
  test.beforeAll(() => {
    fixture = compileInFlight();
  });
  test.afterAll(() => {
    fixture?.trail.cleanup();
  });

  test("RULE-3 · the commit page of the stub c3 shows src/sell.txt's line removed and its replacement added", async ({ page }) => {
    await openOnFixture(page, fixture, route.commit(shaOf(fixture, 'c3')));
    const viewer = diffViewer(region(page, DIFF), shaOf(fixture, 'c3'));
    await loadIfAsked(viewer);
    expect(await diffFiles(viewer)).toEqual(['src/sell.txt']);
    expect(await diffLines(viewer)).toEqual([
      ['del', 'the sale is not implemented'],
      ['add', 'the canned sale'],
    ]);
  });
});

test.describe('parity', () => {
  test("RULE-3 · parity: the commit page keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, commit);
  });

  test("RULE-3 · parity: the commit page's diff region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, commit, DIFF);
  });

  test("RULE-3 · parity: the long commit page's diff region (949a082) carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, longCommit, DIFF);
  });

  test("RULE-3 · parity: the long commit page's shell and primary nav are its reference's", async ({ page }) => {
    await expectShell(page, longCommit, false);
  });

  test("RULE-3 · parity: the rule page keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, rule);
  });

  test("RULE-3 · parity: the rule page's red and green diffs region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, rule, RULE_DIFFS);
  });
});
