// NODE-1 · Node page. Completeness banner first (DATA-4), then rules, tasks with their status, attempts, PR and merge.
// U2's acceptance: the node page shows the node header, its tasks and tabs from the route, and every node page heads
// the node shown, not F3 (g4-defects.md sections 1 and 3). On the `plans` fixture trail (plans/README.md): F1 Sell
// (done, PR #10, depends on F0b, rules SELL-1 and SELL-2, two acceptance lines) and F2 Retrieve (in progress, rule
// GET-1, four tasks: two done, two pending). Attempts and the merge are LOOP-2's region, which U3 builds. Parity on the
// design fixture against docs/ui/derived/U2/node/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  CHIP,
  REPO,
  RULES,
  TASKS,
  auditEverywhere,
  compilePlans,
  heading,
  headerField,
  hrefTo,
  nodeTabs,
  openHeaded,
  openOnFixture,
  region,
  route,
  rowTexts,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, gitOnlyNode, node } from './support/parity';

const F1_ACCEPTANCE = [
  'POST /policies sells a policy under a reference no other policy has',
  'A start date more than 60 days ahead answers 422',
];
const F2_TASKS: [string, 'Done' | 'Pending'][] = [
  ['Acceptance tests for the retrieve', 'Done'],
  ['Stub the retrieve route', 'Done'],
  ['Pause 1: David reads the stub', 'Pending'],
  ['Read a policy back by its reference', 'Pending'],
];

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compilePlans();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

async function openNode(page: Page, id: string): Promise<void> {
  await openHeaded(page, fixture, route.node('build', id), id);
}

test.describe('rules', () => {
  test("NODE-1 · F1's node page lists its rules, SELL-1 and SELL-2, each chip opening its own rule", async ({ page }) => {
    await openNode(page, 'F1');
    const chips = region(page, RULES).locator(CHIP);
    await expect(chips).toHaveText([/^SELL-1/, /^SELL-2/]);
    await expect(chips.filter({ hasText: 'SELL-1' })).toHaveAttribute('href', /#\/rules\/SELL-1$/);
    await expect(chips.filter({ hasText: 'SELL-2' })).toHaveAttribute('href', /#\/rules\/SELL-2$/);
  });

  test("NODE-1 · F2's node page lists its own rule, GET-1, and none of F1's", async ({ page }) => {
    await openNode(page, 'F2');
    const chips = region(page, RULES).locator(CHIP);
    await expect(chips).toHaveText([/^GET-1/]);
    await expect(chips.filter({ hasText: 'SELL-1' })).toHaveCount(0);
  });

  test("NODE-1 · F1's node page gives its acceptance lines as planned, in the plan file's order", async ({ page }) => {
    await openNode(page, 'F1');
    const rules = region(page, RULES);
    for (const line of F1_ACCEPTANCE) await expect(rules, line).toContainText(line);
    const text = (await rules.innerText()).replace(/\s+/g, ' ');
    const at = F1_ACCEPTANCE.map((line) => text.indexOf(line));
    expect(at, 'in the order the plan gives them').toEqual([...at].sort((a, b) => a - b));
  });
});

test.describe('tasks', () => {
  test("NODE-1 · F2's node page lists its four tasks in the plan file's order", async ({ page }) => {
    await openNode(page, 'F2');
    await expect
      .poll(async () => {
        const rows = await rowTexts(region(page, TASKS));
        return F2_TASKS.map(([title]) => rows.findIndex((row) => row.includes(title)));
      })
      .toEqual([0, 1, 2, 3]);
  });

  test("NODE-1 · each of F2's tasks shows its status in words: two done, two pending", async ({ page }) => {
    await openNode(page, 'F2');
    await expect.poll(async () => (await rowTexts(region(page, TASKS))).length).toBe(4);
    const rows = await rowTexts(region(page, TASKS));
    for (const [title, status] of F2_TASKS) {
      const row = rows.find((r) => r.includes(title)) ?? '';
      const other = status === 'Done' ? 'Pending' : 'Done';
      expect(row, `${title} reads ${status}`).toMatch(new RegExp(`\\b${status}\\b`, 'i'));
      expect(row, `${title} does not read ${other}`).not.toMatch(new RegExp(`\\b${other}\\b`, 'i'));
    }
  });

  test("NODE-1 · F1's node page lists its own three tasks, and none of F2's", async ({ page }) => {
    await openNode(page, 'F1');
    await expect.poll(async () => (await rowTexts(region(page, TASKS))).length).toBe(3);
    const rows = await rowTexts(region(page, TASKS));
    expect(rows.some((row) => row.includes('Stub the sale route')), "F1's stub task").toBe(true);
    expect(rows.some((row) => row.includes('Stub the retrieve route')), "F2's stub task is not F1's").toBe(false);
  });
});

test.describe('the header, from the route', () => {
  test("NODE-1 · F1's header links its PR, #10, to the pull request on GitHub", async ({ page }) => {
    await openNode(page, 'F1');
    const pr = headerField(page, 'PR').locator(`a[href="${REPO}/pull/10"]`);
    await expect(pr).toHaveCount(1);
    await expect(pr).toContainText('#10');
  });

  test("NODE-1 · F1's header names the node it depends on, F0b; F3's names both of its, F2 and F5", async ({ page }) => {
    await openNode(page, 'F1');
    await expect(headerField(page, 'Depends on')).toContainText('F0b');
    await openNode(page, 'F3');
    await expect(headerField(page, 'Depends on')).toContainText('F2');
    await expect(headerField(page, 'Depends on')).toContainText('F5');
  });

  test("NODE-1 · each tab of F2's node page opens F2's own view, headed F2, with that tab current", async ({ page }) => {
    await openNode(page, 'F2');
    for (const [tab, path] of [
      ['Walkthrough', route.walkthrough('build', 'F2')],
      ['Activity', route.activity('build', 'F2')],
      ['Node', route.node('build', 'F2')],
    ] as const) {
      await nodeTabs(page).getByRole('link', { name: tab, exact: true }).click();
      await expect(page, `the ${tab} tab opens F2's ${tab.toLowerCase()}`).toHaveURL(hrefTo(path));
      await expect(heading(page), `the ${tab} view heads F2`).toContainText('F2 Retrieve');
      await expect(nodeTabs(page).locator('[aria-current="page"]'), `${tab} is the current tab`).toHaveText(tab);
    }
  });
});

test.describe('axe', () => {
  test("NODE-1 · F2's node page on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    await openOnFixture(page, fixture, route.node('build', 'F2'));
    await auditEverywhere(page, route.node('build', 'F2'), async (p) => {
      await expect(region(p, TASKS)).toContainText('Pause 1: David reads the stub');
    });
  });
});

test.describe('parity', () => {
  test("NODE-1 · parity: the node page keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, node);
  });

  test("NODE-1 · parity: the node page's rules region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, node, RULES);
  });

  test("NODE-1 · parity: the node page's tasks region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, node, TASKS);
  });

  test("NODE-1 · parity: the node page's shell, header, banner, tabs and title are its reference's", async ({ page }) => {
    await expectShell(page, node, true);
  });

  test("NODE-1 · parity: the git-only node page (F0a) keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, gitOnlyNode);
  });

  test("NODE-1 · parity: the git-only node page's rules region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, gitOnlyNode, RULES);
  });

  test('NODE-1 · parity: the node page takes every colour from a token', async ({ page }) => {
    await expectTokensOnly(page, node);
  });
});
