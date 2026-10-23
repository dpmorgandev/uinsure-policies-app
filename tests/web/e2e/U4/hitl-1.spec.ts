// HITL-1 · Human decisions. Every point David decided: pause 1, pause 2, steers (D-findings), rulings, sign-offs,
// merges. One list across nodes, each linked to its evidence. On the `agents` fixture trail (agents/README.md):
// build/F1's five decisions, loop.jsonl lines 5 (pause1), 6 (steer D1 at pause1), 19 (pause2), 20 (signoff c9) and
// 21 (merged c9). The decisions page labels its filters in words, never raw ids (g4-defects.md section 3). Parity on
// the design fixture against docs/ui/derived/U4/{decisions,overview}/.
import { expect, test } from '@playwright/test';
import {
  DECISION_LIST,
  LATEST_DECISIONS,
  REPO,
  auditEverywhere,
  compileAgents,
  decisionKinds,
  decisionRows,
  openRegion,
  region,
  route,
  shaOf,
  short,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { decisions, expectRegionComponents, expectRegionsInOrder, overview } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileAgents();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

const LOOP = 'docs/trace/build/F1/loop.jsonl';

test.describe('the decisions page', () => {
  test("HITL-1 · it lists build/F1's five decisions in the loop's order: pause 1, steer, pause 2, sign-off, merge", async ({ page }) => {
    const list = await openRegion(page, fixture, route.decisions, DECISION_LIST);
    await expect.poll(() => decisionKinds(list)).toEqual(['pause-1', 'steer', 'pause-2', 'sign-off', 'merge']);
  });

  test('HITL-1 · each decision links to its evidence line in the loop log on GitHub', async ({ page }) => {
    const list = await openRegion(page, fixture, route.decisions, DECISION_LIST);
    const rows = decisionRows(list);
    await expect(rows).toHaveCount(5);
    for (const [at, line] of [5, 6, 19, 20, 21].entries()) {
      const link = rows.nth(at).locator(`a[href$="${LOOP}#L${line}"]`);
      await expect(link, `decision ${at + 1} links ${LOOP}#L${line}`).toHaveCount(1);
      await expect(link).toHaveAttribute('href', new RegExp(`^${REPO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/blob/`));
    }
  });

  test('HITL-1 · the steer shows its round D1, the pause it was given at, and what David said', async ({ page }) => {
    const list = await openRegion(page, fixture, route.decisions, DECISION_LIST);
    const steer = decisionRows(list).and(list.locator('[data-kind="steer"]'));
    await expect(steer).toContainText('D1');
    await expect(steer).toContainText(/pause ?1/i);
    await expect(steer).toContainText('David: change: name the start-date window in the 422 message');
  });

  test('HITL-1 · the sign-off and the merge each name the commit c9', async ({ page }) => {
    const list = await openRegion(page, fixture, route.decisions, DECISION_LIST);
    const c9 = short(shaOf(fixture, 'c9'));
    await expect(list.locator('[data-kind="sign-off"]')).toContainText(c9);
    await expect(list.locator('[data-kind="merge"]')).toContainText(c9);
  });

  test('HITL-1 · its kind filter is labelled in words, never the raw ids pause1, signoff or merged', async ({ page }) => {
    const list = await openRegion(page, fixture, route.decisions, DECISION_LIST);
    const filters = list.locator('[class*="kit-filter-bar__"]').first();
    await expect(filters, 'the list has a filter bar').toBeVisible();
    await expect(filters).toContainText('Pause 1');
    await expect(filters).toContainText('Steer');
    await expect(filters).not.toContainText(/\bpause1\b|\bpause2\b|\bsignoff\b|\bmerged\b/);
  });

  test("HITL-1 · it says rulings aren't recorded as loop events and so aren't listed, and its kind filter offers no Ruling", async ({ page }) => {
    // A3 I8: the compiler can't list what the loop never records; the page says so instead of implying it is complete.
    const list = await openRegion(page, fixture, route.decisions, DECISION_LIST);
    await expect(decisionRows(list)).toHaveCount(5);
    await expect(list).toContainText(/rulings?\b[^.]*\b(aren't|are not|isn't|is not|not) recorded as (a )?loop events?/i);
    await expect(list).toContainText(/rulings?\b[^.]*\b(aren't|are not|isn't|is not|not) listed/i);
    await expect(list.locator('option').filter({ hasText: /^\s*Ruling\s*$/ })).toHaveCount(0);
  });

  test('HITL-1 · the decisions page has no axe violation, light and dark, 1440 and 390', async ({ page }) => {
    await openRegion(page, fixture, route.decisions, DECISION_LIST);
    await auditEverywhere(page, route.decisions, async (p) => {
      await expect(decisionRows(region(p, DECISION_LIST))).toHaveCount(5);
    });
  });
});

test.describe('the overview', () => {
  test("HITL-1 · the overview's latest human decisions show build/F1's merge, each row with its evidence", async ({ page }) => {
    const latest = await openRegion(page, fixture, route.overview, LATEST_DECISIONS);
    await expect(latest.locator('[data-kind="merge"]')).toHaveCount(1);
    await expect(latest.locator(`a[href$="${LOOP}#L21"]`)).toHaveCount(1);
  });
});

test.describe('links out', () => {
  // A3 I9 (security S2, W2): every anchor that leaves the app for GitHub carries rel noreferrer (react-web SEC-1).
  for (const [label, path] of [
    ['the decisions page', route.decisions],
    ['the commit page of c9', 'c9'],
  ] as const) {
    test(`SEC-1 · every GitHub link on ${label} has a rel that includes noreferrer`, async ({ page }) => {
      const at = path === 'c9' ? route.commit(short(shaOf(fixture, 'c9'))) : path;
      await openRegion(page, fixture, at, path === 'c9' ? 'commit-header-and-trailers' : DECISION_LIST);
      const links = page.locator('a[href^="https://github.com/"]');
      await expect.poll(() => links.count(), 'the page links out to GitHub').toBeGreaterThan(0);
      const rels = await links.evaluateAll((as) => as.map((a) => ({ href: a.getAttribute('href') ?? '', rel: a.getAttribute('rel') ?? '' })));
      const missing = rels.filter(({ rel }) => !rel.split(/\s+/).includes('noreferrer')).map(({ href }) => href);
      expect(missing, 'GitHub links without rel noreferrer').toEqual([]);
    });
  }
});

test.describe('parity', () => {
  test("HITL-1 · parity: the decisions page's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, decisions);
  });

  test("HITL-1 · parity: the decisions page's decision list, its components", async ({ page }) => {
    await expectRegionComponents(page, decisions, DECISION_LIST);
  });

  test("HITL-1 · parity: the overview's latest human decisions, its components", async ({ page }) => {
    await expectRegionComponents(page, overview, LATEST_DECISIONS);
  });
});
