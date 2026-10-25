// bug-002 N4 · DAG-1 · the Plan entry of the primary nav, to the line as amended by David's steer D1 (2026-10-25,
// pause 1: "the plan page should display a tabbed plan open users can click another plan from the tabs to load it").
// D1 supersedes the inv-009 #11 I16 reading this file was first written to ("offer every plan without landing on the
// build plan"), so these red-commit tests are rewritten on D1's authority (finding D1/I2).
// The Plan entry opens a plan page (#/plans/<id>), where the navigation landmark named "Plans" holds one tab per plan
// in trace.json. Clicking each tab in turn loads that plan's own page, and only the clicked tab is aria-current=page.
// Every plan link is looked for inside that landmark only (finding D1/I3): a plan link elsewhere on the page is no tab.
// On the `plans` fixture trail (tests/Uinsure.Policies.Web.Tests/fixtures/trails/plans/README.md): build and ui (both `kind: build`, as the
// real DAGs are) and inv-001.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { compileFixture } from '../U0b/support/trail';
import type { CompiledTrail } from '../U0b/support/trail';
import { openOnFixture, region } from '../U1/support/app';
import { traceAnswered } from '../U5/support/app';

const PLAN_HEADER = 'plan-header-status-approval-requirements-rev';
const PLAN_IDS = ['build', 'ui', 'inv-001'];

/** What only that plan's own page draws, on the plans fixture. */
const OWN_CONTENT: Record<string, { region: string; text: string }> = {
  build: { region: PLAN_HEADER, text: 'docs/plans/active/build.dag.yaml' },
  ui: { region: PLAN_HEADER, text: 'docs/plans/active/ui.dag.yaml' },
  'inv-001': { region: PLAN_HEADER, text: 'F2 stub-gate escalation' },
};

let plans: CompiledTrail;
test.beforeAll(() => {
  plans = compileFixture('plans');
});
test.afterAll(() => {
  plans?.trail.cleanup();
});

/** Opens the overview on the fixture and activates the primary nav's Plan entry, as a person would. */
async function openPlanEntry(page: Page): Promise<void> {
  await openOnFixture(page, plans, '/#/');
  await traceAnswered(page);
  const nav = page.getByRole('navigation', { name: /^Primary/ });
  const entry = nav.getByRole('button', { name: /^Plans?\b/ }).or(nav.getByRole('link', { name: /^Plans?$/ })).first();
  await expect(entry, 'setup: the primary nav has a Plan entry').toBeVisible();
  await entry.click();
}

/** The navigation landmark named "Plans": the plan tabs. */
const planTabs = (page: Page): Locator => page.getByRole('navigation', { name: 'Plans', exact: true });

test('DAG-1 · the Plan nav entry opens a plan page whose "Plans" tabs are build, ui and inv-001, the open plan current', async ({ page }) => {
  await openPlanEntry(page);
  await expect(page, 'the Plan entry opens a plan page, #/plans/<id>').toHaveURL(/#\/plans\/[^/]+$/);
  const tabs = planTabs(page);
  await expect(tabs, 'the plan page draws the "Plans" tabs').toBeVisible();
  const links = tabs.getByRole('link');
  await expect(links, 'one tab per plan in trace.json').toHaveCount(PLAN_IDS.length);
  for (const id of PLAN_IDS) {
    await expect(tabs.locator(`a[href="#/plans/${id}"]`), `a tab opens #/plans/${id}`).toHaveCount(1);
  }
  const open = new URL(page.url()).hash.replace(/^#\/plans\//, '');
  await expect(tabs.locator('a[aria-current="page"]'), 'exactly one tab is current').toHaveCount(1);
  await expect(tabs.locator('a[aria-current="page"]'), 'the current tab is the plan the page shows').toHaveAttribute('href', `#/plans/${open}`);
});

test('DAG-1 · clicking each "Plans" tab in turn loads that plan, and only the clicked tab is current', async ({ page }) => {
  await openPlanEntry(page);
  const tabs = planTabs(page);
  await expect(tabs, 'the Plan entry opens a page with the "Plans" tabs').toBeVisible();
  for (const id of ['ui', 'inv-001', 'build']) {
    await tabs.locator(`a[href="#/plans/${id}"]`).click();
    await expect(page, `the ${id} tab opens #/plans/${id}`).toHaveURL(new RegExp(`#/plans/${id}$`));
    await expect(page.getByRole('heading', { level: 1 }), `the page heads plan ${id}`).toContainText(`Plan ${id}`);
    const own = OWN_CONTENT[id] ?? { region: PLAN_HEADER, text: `fixture setup: no own content for ${id}` };
    await expect(region(page, own.region), `the ${id} page draws its own content`).toContainText(own.text);
    for (const other of PLAN_IDS) {
      const tab = planTabs(page).locator(`a[href="#/plans/${other}"]`);
      if (other === id) await expect(tab, `the ${id} tab is current`).toHaveAttribute('aria-current', 'page');
      else await expect(tab, `the ${other} tab is not current on ${id}'s page`).not.toHaveAttribute('aria-current', 'page');
    }
  }
});
