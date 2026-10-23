// AGENT-1 · Who touched what. Per node: each commit's `Agent` trailer beside the agent the hook saw make it, with the
// match ✓/✗ (the README table). On the `agents` fixture trail (agents/README.md): c5 is trailered builder and was
// logged by main (✗); c4 is builder on both sides (✓); c0 (build/F0a, git-only) has no hook record, drawn as a gap,
// never as a match. The commit page's "trailer agent vs hook agent" region and the node page's "who touched what"
// table. Parity on the design fixture against docs/ui/derived/U4/{commit,node}/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  TRAILER_VS_HOOK,
  WHO_TOUCHED,
  auditEverywhere,
  compileAgents,
  openRegion,
  region,
  route,
  shaOf,
  short,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { commit, expectRegionComponents, node } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileAgents();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

const openCommit = (page: Page, id: string) => openRegion(page, fixture, route.commit(short(shaOf(fixture, id))), TRAILER_VS_HOOK);

test.describe('the commit page', () => {
  test('AGENT-1 · a commit the hook saw its trailer agent make shows builder beside builder, marked ✓', async ({ page }) => {
    const found = await openCommit(page, 'c4');
    await expect(found).toContainText('builder');
    await expect(found).toContainText('✓');
    await expect(found).not.toContainText('✗');
  });

  test('AGENT-1 · a commit trailered builder that the hook saw main make shows both, marked ✗', async ({ page }) => {
    const found = await openCommit(page, 'c5');
    await expect(found).toContainText('builder');
    await expect(found).toContainText('main');
    await expect(found).toContainText('✗');
    await expect(found).not.toContainText('✓');
  });

  test('AGENT-1 · a commit with no hook record says so, with neither ✓ nor ✗', async ({ page }) => {
    const found = await openCommit(page, 'c0');
    await expect(found).toContainText('main');
    await expect(found).toContainText(/not recorded/i);
    await expect(found).not.toContainText('✓');
    await expect(found).not.toContainText('✗');
  });

  test('AGENT-1 · the commit page has no axe violation, light and dark, 1440 and 390', async ({ page }) => {
    await openCommit(page, 'c5');
    await auditEverywhere(page, route.commit(short(shaOf(fixture, 'c5'))), async (p) => {
      await expect(region(p, TRAILER_VS_HOOK)).toContainText('✗');
    });
  });
});

test.describe('the node page', () => {
  test("AGENT-1 · build/F1's who-touched-what lists its nine commits, each with both agents", async ({ page }) => {
    const found = await openRegion(page, fixture, route.node('build', 'F1'), WHO_TOUCHED);
    const rows = found.locator('tbody tr');
    await expect(rows).toHaveCount(9);
    for (const id of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9']) {
      await expect(found, `the table lists ${id}`).toContainText(short(shaOf(fixture, id)));
    }
  });

  test("AGENT-1 · c5's row reads builder by trailer, main by the hook, ✗; c4's builder, builder, ✓", async ({ page }) => {
    const found = await openRegion(page, fixture, route.node('build', 'F1'), WHO_TOUCHED);
    const c5 = found.locator('tbody tr').filter({ hasText: short(shaOf(fixture, 'c5')) });
    await expect(c5).toContainText('builder');
    await expect(c5).toContainText('main');
    await expect(c5).toContainText('✗');
    const c4 = found.locator('tbody tr').filter({ hasText: short(shaOf(fixture, 'c4')) });
    await expect(c4).toContainText('✓');
    await expect(c4).not.toContainText('main');
  });
});

test.describe('parity', () => {
  test("AGENT-1 · parity: the commit page's trailer agent vs hook agent, its components", async ({ page }) => {
    await expectRegionComponents(page, commit, TRAILER_VS_HOOK);
  });

  test("AGENT-1 · parity: the node page's who touched what, its components", async ({ page }) => {
    await expectRegionComponents(page, node, WHO_TOUCHED);
  });
});
