// DAG-1 · Plan DAG view. Each plan's nodes as a dependency graph, coloured by status, each linking to its node page;
// the build plan, the ui plan and investigations such as inv-001. U2's acceptance: the plan page shows the DAG with
// each node's status and a text equivalent, in file order; every node link opens the node it names (g4-defects.md
// sections 1 and 3). On the `plans` fixture trail (plans/README.md): build F0a, F0b, F1, F2, F5, F3 in that file
// order, F5 branching off F0b and F3 joining F2 and F5; ui U0 and U1; inv-001 with no DAG. Parity on the design
// fixture against docs/ui/derived/U2/plan/ and overview/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  AT_A_GLANCE,
  CHIP,
  GRAPH,
  PLAN_HEADER,
  auditEverywhere,
  compilePlans,
  graphNode,
  heading,
  hrefTo,
  openHeaded,
  openOnFixture,
  planRows,
  primaryNav,
  region,
  route,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, overview, plan } from './support/parity';

const FILE_ORDER = ['F0a', 'F0b', 'F1', 'F2', 'F5', 'F3'];
const STATUS: Record<string, { word: string; status: string }> = {
  F0a: { word: 'Done', status: 'done' },
  F0b: { word: 'Done', status: 'done' },
  F1: { word: 'Done', status: 'done' },
  F2: { word: 'In progress', status: 'in-progress' },
  F5: { word: 'Pending', status: 'pending' },
  F3: { word: 'Pending', status: 'pending' },
};
const LAYER: Record<string, string> = { F0a: '1', F0b: '2', F1: '3', F5: '3', F2: '4', F3: '5' };

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compilePlans();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** Opens the build plan's page on the fixture and waits until it heads the build plan. */
async function openBuild(page: Page) {
  await openHeaded(page, fixture, route.plan('build'), 'build');
  return region(page, GRAPH);
}

test.describe('the graph', () => {
  test("DAG-1 · the build plan's graph draws each of its six nodes with its status in words", async ({ page }) => {
    const graph = await openBuild(page);
    await expect(graph.locator('li[data-layer]'), 'one graph node per plan node').toHaveCount(6);
    for (const id of FILE_ORDER) {
      await expect(graphNode(graph, id), `${id} reads ${STATUS[id]?.word}`).toContainText(STATUS[id]?.word ?? '');
    }
  });

  test('DAG-1 · each graph node is coloured by its own status: F2 in progress, F5 and F3 pending, the rest done', async ({ page }) => {
    const graph = await openBuild(page);
    for (const id of FILE_ORDER) {
      await expect(graphNode(graph, id), `${id} is drawn as ${STATUS[id]?.status}`).toHaveAttribute('data-status', STATUS[id]?.status ?? '');
    }
  });

  test('DAG-1 · the graph places each node below every node it depends on: F5 beside F1, F3 below both F2 and F5', async ({ page }) => {
    const graph = await openBuild(page);
    for (const id of FILE_ORDER) {
      await expect(graphNode(graph, id), `${id} is in layer ${LAYER[id]}`).toHaveAttribute('data-layer', LAYER[id] ?? '');
    }
  });

  test('DAG-1 · every graph node links to its own node page', async ({ page }) => {
    const graph = await openBuild(page);
    for (const id of FILE_ORDER) {
      const link = graphNode(graph, id).getByRole('link', { name: id, exact: true });
      await expect(link, `${id} is a link`).toHaveCount(1);
      await expect(link, `${id} opens build/${id}`).toHaveAttribute('href', hrefTo(route.node('build', id)));
    }
  });

  // F5 is a node only the trail has (the design fixture's graph has none), so following it proves the graph is
  // drawn from the trail, not from a canned reference.
  test("DAG-1 · following F5's graph link opens F5's node page, headed F5, not another node", async ({ page }) => {
    const graph = await openBuild(page);
    const link = graphNode(graph, 'F5').getByRole('link', { name: 'F5', exact: true });
    await expect(link, "the graph draws F5's link, from the trail").toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(hrefTo(route.node('build', 'F5')));
    await expect(heading(page)).toContainText('F5 Pipeline (evidence only)');
    await expect(heading(page)).not.toContainText('F3');
  });
});

test.describe('the text equivalent', () => {
  test('DAG-1 · the text equivalent lists the nodes in file order: F0a, F0b, F1, F2, F5, F3', async ({ page }) => {
    const graph = await openBuild(page);
    await expect.poll(async () => (await planRows(graph)).map((row) => row.id)).toEqual(FILE_ORDER);
  });

  test('DAG-1 · the text equivalent says what each node depends on: F3 on F2 and F5, F0a on nothing', async ({ page }) => {
    const graph = await openBuild(page);
    await expect.poll(async () => (await planRows(graph)).length).toBe(6);
    const rows = Object.fromEntries((await planRows(graph)).map((row) => [row.id, row]));
    expect(rows['F3']?.dependsOn, 'F3 waits for F2 and F5').toEqual(['F2', 'F5']);
    expect(rows['F5']?.dependsOn, 'F5 waits for F0b').toEqual(['F0b']);
    expect(rows['F1']?.dependsOn, 'F1 waits for F0b').toEqual(['F0b']);
    expect(rows['F0a']?.dependsOn, 'F0a waits for nothing').toEqual([]);
    expect(rows['F0a']?.dependsText, 'F0a says it is a root').toMatch(/none/i);
  });

  test('DAG-1 · the text equivalent gives each node its status in words', async ({ page }) => {
    const graph = await openBuild(page);
    await expect.poll(async () => (await planRows(graph)).map((row) => [row.id, row.status])).toEqual(
      FILE_ORDER.map((id) => [id, STATUS[id]?.word]),
    );
  });

  test("DAG-1 · the text equivalent lists each node's rules, each chip opening its own rule", async ({ page }) => {
    const graph = await openBuild(page);
    await expect.poll(async () => (await planRows(graph)).length).toBe(6);
    const rows = Object.fromEntries((await planRows(graph)).map((row) => [row.id, row]));
    expect(rows['F1']?.rules.map((r) => r.text)).toEqual(['SELL-1', 'SELL-2']);
    expect(rows['F2']?.rules.map((r) => r.text)).toEqual(['GET-1']);
    expect(rows['F3']?.rules.map((r) => r.text)).toEqual(['CANCEL-1']);
    expect(rows['F5']?.rules, 'F5 has no rules').toEqual([]);
    for (const row of Object.values(rows)) {
      for (const chip of row.rules) expect(chip.href, `${chip.text} opens its rule`).toMatch(new RegExp(`#/rules/${chip.text}$`));
    }
  });

  test("DAG-1 · every node in the text equivalent links to its own node page", async ({ page }) => {
    const graph = await openBuild(page);
    await expect.poll(async () => (await planRows(graph)).length).toBe(6);
    for (const row of await planRows(graph)) {
      expect(row.links, `${row.id}'s row links its node`).toEqual([{ text: row.id, href: expect.stringMatching(hrefTo(route.node('build', row.id))) }]);
    }
  });
});

test.describe('the plan header', () => {
  test("DAG-1 · the plan header gives the build plan's status, who approved it and when, its requirements rev and its file", async ({ page }) => {
    await openBuild(page);
    const header = region(page, PLAN_HEADER);
    await expect(header).toContainText(/approved/i);
    await expect(header).toContainText('David Morgan');
    await expect(header).toContainText('2026-10-15');
    await expect(header).toContainText('1a2b3c4');
    await expect(header).toContainText('docs/plans/active/build.dag.yaml');
  });
});

test.describe('every plan', () => {
  test("DAG-1 · the ui plan's page draws the ui plan's own nodes, U0 done and U1 pending, and none of the build plan's", async ({ page }) => {
    await openHeaded(page, fixture, route.plan('ui'), 'ui');
    const graph = region(page, GRAPH);
    await expect(graph.locator('li[data-layer]')).toHaveCount(2);
    await expect(graphNode(graph, 'U0')).toContainText('Done');
    await expect(graphNode(graph, 'U1')).toContainText('Pending');
    await expect(graphNode(graph, 'U1').getByRole('link', { name: 'U1', exact: true })).toHaveAttribute('href', hrefTo(route.node('ui', 'U1')));
    await expect(graphNode(graph, 'F2'), "no build node on the ui plan's page").toHaveCount(0);
  });

  test('DAG-1 · the investigation inv-001 has its own plan page, headed by its id and title', async ({ page }) => {
    await openOnFixture(page, fixture, route.plan('inv-001'));
    await expect(heading(page)).toContainText('inv-001');
    await expect(page.getByRole('main')).toContainText('F2 stub-gate escalation');
  });

  test("DAG-1 · reachable: the primary nav's Plan entry opens the build plan and is marked current there", async ({ page }) => {
    await openOnFixture(page, fixture, route.overview);
    const entry = primaryNav(page).getByRole('link', { name: 'Plan', exact: true });
    await expect(entry).toHaveAttribute('href', hrefTo(route.plan('build')));
    await entry.click();
    await expect(heading(page)).toContainText('build');
    await expect(primaryNav(page).getByRole('link', { name: 'Plan', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('DAG-1 · the overview draws the build plan at a glance, each node with its status, and opens the full plan', async ({ page }) => {
    await openOnFixture(page, fixture, route.overview);
    const glance = region(page, AT_A_GLANCE);
    await expect(graphNode(glance, 'F2'), "F2's status").toContainText('In progress');
    await expect(graphNode(glance, 'F3'), "F3's status").toContainText('Pending');
    await expect(glance.locator('li[data-layer]'), 'the build plan only').toHaveCount(6);
    await expect(glance.locator(`a[href$="#/plans/build"]`).first(), 'a link to the full plan').toBeVisible();
    await expect(glance.locator(CHIP).filter({ hasText: 'GET-1' }).first()).toHaveAttribute('href', /#\/rules\/GET-1$/);
  });
});

test.describe('axe', () => {
  test('DAG-1 · the build plan page on the fixture has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
    await openOnFixture(page, fixture, route.plan('build'));
    await auditEverywhere(page, route.plan('build'), async (p) => {
      await expect(graphNode(region(p, GRAPH), 'F5')).toContainText('Pending');
    });
  });
});

test.describe('parity', () => {
  test("DAG-1 · parity: the plan page keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, plan);
  });

  test("DAG-1 · parity: the plan header region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, plan, PLAN_HEADER);
  });

  test("DAG-1 · parity: the node graph region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, plan, GRAPH);
  });

  test("DAG-1 · parity: the plan page's shell, primary nav and title are its reference's", async ({ page }) => {
    await expectShell(page, plan, true);
  });

  test('DAG-1 · parity: the plan page takes every colour from a token', async ({ page }) => {
    await expectTokensOnly(page, plan);
  });

  test("DAG-1 · parity: the overview's build plan at a glance carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, overview, AT_A_GLANCE);
  });
});
