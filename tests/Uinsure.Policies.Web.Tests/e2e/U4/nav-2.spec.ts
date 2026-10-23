// NAV-2 · Every entity has a URL. Rules, nodes, commits, verdicts, findings and sessions are each deep-linkable, so
// David can paste a link into the conversation; a path that names nothing shows the not-found page, in the kit's
// triangle-alert (error) state, naming the path asked for, and it claims nothing was compiled only when nothing was
// (g4-defects.md section 3). On the `agents` fixture trail (agents/README.md): rule SELL-2, node build/F1, commit c4,
// the A1 reviewer verdict and findings round, and the context snapshot 20261018-101500-f1-signed-off. The cross-node
// flow follows build/F2's A2 reviewer FAIL to its fix on the design fixture (docs/ui/fixture/trace.json: finding
// A2/I1 fixed by 8be3aed). Parity on the design fixture against docs/ui/derived/U4/{not-found,sessions}/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { serveTrace } from '../U0b/support/app';
import { designFixtureDir } from '../U0b/support/trail';
import {
  NOT_FOUND,
  SESSION,
  SESSION_OPEN,
  auditEverywhere,
  compileAgents,
  openOnFixture,
  openRegion,
  region,
  route,
  shaOf,
  short,
  snapshotOf,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, notFound, sessions } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileAgents();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

const heading = (page: Page) => page.getByRole('heading', { level: 1 });
const UNKNOWN = '/#/no/such/page';

test.describe('deep links', () => {
  test('NAV-2 · reachable: a rule opens at its own URL', async ({ page }) => {
    await openOnFixture(page, fixture, route.rule('SELL-2'));
    await expect(heading(page)).toContainText('SELL-2');
  });

  test('NAV-2 · reachable: a node opens at its own URL', async ({ page }) => {
    await openOnFixture(page, fixture, route.node('build', 'F1'));
    await expect(heading(page)).toContainText('F1');
  });

  test('NAV-2 · a commit opens at its own URL, by its short SHA, its header naming its subject', async ({ page }) => {
    await openOnFixture(page, fixture, route.commit(short(shaOf(fixture, 'c4'))));
    await expect(page.getByRole('main')).toContainText('feat(SELL-1): green: the sale');
  });

  test('NAV-2 · reachable: a verdict opens at its own URL', async ({ page }) => {
    await openOnFixture(page, fixture, route.verdict('build', 'F1', 'A1', 'reviewer'));
    await expect(page.getByRole('main')).toContainText('FAIL');
  });

  test('NAV-2 · reachable: a findings round opens at its own URL', async ({ page }) => {
    await openOnFixture(page, fixture, route.findings('build', 'F1', 'A1'));
    await expect(page.getByRole('main')).toContainText('I1');
  });

  test('NAV-2 · a session opens at its own URL, showing its snapshot and next action', async ({ page }) => {
    const open = await openRegion(page, fixture, route.session(SESSION), SESSION_OPEN);
    await expect(open).toContainText('2026-10-18');
    await expect(open).toContainText('build/F1');
    await expect(open).toContainText('David merges PR #10 in the GitHub UI');
  });

  test('NAV-2 · the session page has no axe violation, light and dark, 1440 and 390', async ({ page }) => {
    await openOnFixture(page, fixture, route.session(SESSION));
    await auditEverywhere(page, route.session(SESSION), async (p) => {
      await expect(region(p, SESSION_OPEN)).toContainText('David merges PR #10 in the GitHub UI');
    });
  });
});

test.describe('not found', () => {
  test('NAV-2 · an unknown path shows the not-found page in the triangle-alert state, naming the path asked for', async ({ page }) => {
    const found = await openRegion(page, fixture, UNKNOWN, NOT_FOUND);
    await expect(found.locator('[data-context="error"]')).toHaveCount(1);
    await expect(found).toContainText('no/such/page');
    await expect(found).not.toContainText(/‹path asked for›/);
  });

  test('NAV-2 · not-found offers the overview, the matrix and the search', async ({ page }) => {
    const found = await openRegion(page, fixture, UNKNOWN, NOT_FOUND);
    await expect(found.getByRole('link', { name: 'Go to the overview' })).toHaveAttribute('href', /#\/$/);
    await expect(found.getByRole('link', { name: 'Go to the requirements matrix' })).toHaveAttribute('href', /#\/rules$/);
    await expect(found.getByRole('combobox')).toHaveCount(1);
  });

  test('NAV-2 · on a compiled snapshot, not-found never claims nothing was compiled, and names the snapshot', async ({ page }) => {
    const found = await openRegion(page, fixture, UNKNOWN, NOT_FOUND);
    await expect(found).toContainText(snapshotOf(fixture.compiled).short);
    await expect(found).not.toContainText(/nothing (was )?compiled/i);
  });

  test('NAV-2 · an unknown rule ID shows not-found, not an empty rule page', async ({ page }) => {
    const found = await openRegion(page, fixture, route.rule('NOPE-9'), NOT_FOUND);
    await expect(found).toContainText('NOPE-9');
  });

  test('NAV-2 · the not-found page has no axe violation, light and dark, 1440 and 390', async ({ page }) => {
    await openOnFixture(page, fixture, UNKNOWN);
    await auditEverywhere(page, UNKNOWN, async (p) => {
      await expect(region(p, NOT_FOUND)).toContainText('no/such/page');
    });
  });
});

test.describe('the cross-node flow', () => {
  test("NAV-2 · build/F2's A2 reviewer FAIL followed from the node to its loop, verdict, findings and fix commit", async ({ page }) => {
    /** Follows the first link on the page whose href matches, after asserting there is one. */
    const follow = async (selector: string, step: string): Promise<void> => {
      const link = page.locator(selector).first();
      await expect(link, step).toBeVisible();
      await link.click();
    };
    await serveTrace(page, designFixtureDir);
    await page.goto(route.node('build', 'F2'));
    await follow('a[href$="#/plans/build/F2/loop"]', 'the node page links its loop');
    await expect(page).toHaveURL(/#\/plans\/build\/F2\/loop$/);
    await follow('a[href$="#/plans/build/F2/verdicts/A2/reviewer"]', 'the loop links the A2 reviewer verdict');
    await expect(page).toHaveURL(/#\/plans\/build\/F2\/verdicts\/A2\/reviewer$/);
    await expect(page.getByRole('main')).toContainText('FAIL');
    await follow('a[href$="#/plans/build/F2/findings/A2"]', "the FAIL verdict links its findings round");
    await expect(page).toHaveURL(/#\/plans\/build\/F2\/findings\/A2$/);
    await follow('a[href*="#/commits/8be3aed"]', 'the finding I1 links its fix commit 8be3aed');
    await expect(page).toHaveURL(/#\/commits\/8be3aed/);
    await expect(page.getByRole('main')).toContainText('build/F2');
  });
});

test.describe('parity', () => {
  test("NAV-2 · parity: the not-found page's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, notFound);
  });

  test("NAV-2 · parity: the not-found page's region, its components", async ({ page }) => {
    await expectRegionComponents(page, notFound, NOT_FOUND);
  });

  test("NAV-2 · parity: the sessions page's open snapshot, its components", async ({ page }) => {
    await expectRegionComponents(page, sessions, SESSION_OPEN);
  });
});
