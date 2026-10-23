// DAG-1 · Plan DAG view: "Shows build (F0a–F7), ui, and investigations such as inv-001". U10's plan switcher (David
// 2026-10-23, U9 Pause 2: "how do i swap to see the ui plan in docket?"): the Plan entry of the primary nav offers
// every plan in trace.json, each opening #/plans/<id>. Until U10 it always opened the plan of kind build, and both
// real DAGs say `kind: build`, so nothing in the nav reached the ui plan.
// On the `plans` fixture trail (tests/web/fixtures/trails/plans/README.md): build, ui (both `kind: build`) and the
// investigation inv-001. The Plan entry is activated as a person would (a link or a button named Plan).
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { compileFixture } from '../U0b/support/trail';
import type { CompiledTrail } from '../U0b/support/trail';
import { openOnFixture, region } from '../U1/support/app';
import { traceAnswered } from '../U5/support/app';

const PLAN_HEADER = 'plan-header-status-approval-requirements-rev';

let plans: CompiledTrail;
test.beforeAll(() => {
  plans = compileFixture('plans');
});
test.afterAll(() => {
  plans?.trail.cleanup();
});

/** Opens the overview on the fixture and activates the primary nav's Plan entry. */
async function openPlanEntry(page: Page): Promise<void> {
  await openOnFixture(page, plans, '/#/');
  await traceAnswered(page);
  const nav = page.getByRole('navigation', { name: /^Primary/ });
  await nav.getByRole('button', { name: /^Plans?\b/ }).or(nav.getByRole('link', { name: /^Plans?$/ })).first().click();
}

test('DAG-1 · the Plan nav entry offers every plan in trace.json: build, ui and inv-001, each a link to #/plans/<id>', async ({ page }) => {
  await openPlanEntry(page);
  for (const id of ['build', 'ui', 'inv-001']) {
    await expect(page.locator(`a[href="#/plans/${id}"]`).first(), `a link to #/plans/${id}`).toBeVisible();
  }
});

test("DAG-1 · the ui plan's link from the Plan nav entry reaches #/plans/ui, the ui plan's own page", async ({ page }) => {
  await openPlanEntry(page);
  const ui = page.locator('a[href="#/plans/ui"]').first();
  await expect(ui, 'the Plan entry offers the ui plan').toBeVisible();
  await ui.click();
  await expect(page).toHaveURL(/#\/plans\/ui$/);
  await expect(region(page, PLAN_HEADER), "the plan page heads the ui plan's DAG file").toContainText('docs/plans/active/ui.dag.yaml');
});
