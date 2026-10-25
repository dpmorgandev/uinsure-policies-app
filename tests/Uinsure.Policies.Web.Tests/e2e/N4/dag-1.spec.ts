// bug-002 N4 · DAG-1 · the Plan entry of the primary nav (inv-009 #11, I16; David 2026-10-23: fix the nav, not reword
// the acceptance line). Frame.tsx hard-wires the entry to #/plans/<the first plan of kind build>, so a person who
// wants the ui plan or an investigation always lands on the build plan first and only then finds the plan tabs.
// The entry must offer every plan in trace.json before, or without, landing on the build plan.
// On the `plans` fixture trail (tests/Uinsure.Policies.Web.Tests/fixtures/trails/plans/README.md): build and ui (both `kind: build`, as the
// real DAGs are) and inv-001.
import { expect, test } from '@playwright/test';
import { compileFixture } from '../U0b/support/trail';
import type { CompiledTrail } from '../U0b/support/trail';
import { openOnFixture } from '../U1/support/app';
import { traceAnswered } from '../U5/support/app';

let plans: CompiledTrail;
test.beforeAll(() => {
  plans = compileFixture('plans');
});
test.afterAll(() => {
  plans?.trail.cleanup();
});

test('DAG-1 · activating the Plan nav entry offers build, ui and inv-001 without landing on the build plan', async ({ page }) => {
  await openOnFixture(page, plans, '/#/');
  await traceAnswered(page);
  const nav = page.getByRole('navigation', { name: /^Primary/ });
  const entry = nav.getByRole('button', { name: /^Plans?\b/ }).or(nav.getByRole('link', { name: /^Plans?$/ })).first();
  await expect(entry, 'setup: the primary nav has a Plan entry').toBeVisible();
  await entry.click();
  for (const id of ['build', 'ui', 'inv-001']) {
    await expect(page.locator(`a[href="#/plans/${id}"]`).first(), `the Plan entry offers a link to #/plans/${id}`).toBeVisible();
  }
  await expect(page, 'the Plan entry has not opened the build plan on its own').not.toHaveURL(/#\/plans\/build$/);
});
