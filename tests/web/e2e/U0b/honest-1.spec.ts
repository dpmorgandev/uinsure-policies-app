// HONEST-1 · No invented data. No screen shows a number, status or name that isn't in the trail; a loading or error
// page makes no snapshot claim; no page shows a raw placeholder (‹nodeId›, ‹ruleId›, ‹planId›, ‹reference›);
// unbuilt screens show the one not-built-yet pattern. On the `complete` fixture trail; parity on the design
// fixture against docs/ui/derived/U0b/.
import { expect, test } from '@playwright/test';
import {
  PLACEHOLDER,
  builtRoutes,
  expectFooterStamp,
  expectNoSnapshotClaim,
  fixtureNode,
  route,
  serveTrace,
  snapshotOf,
} from './support/app';
import { about, activity, expectRegionsInOrder, overview } from './support/parity';
import { compileFixture } from './support/trail';
import type { CompiledTrail } from './support/trail';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileFixture('complete');
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

test.describe('no snapshot claimed when nothing was read', () => {
  test('HONEST-1 · while trace.json is loading, the overview shows pending and states no snapshot', async ({ page }) => {
    const snap = snapshotOf(fixture.compiled);
    let release: () => void = () => undefined;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    await serveTrace(page, fixture.compiled.publicDir, hold);
    await page.goto(route.overview);
    await expect(page.getByRole('main').locator('[data-status="pending"]').first(), 'a data region shows pending').toBeVisible();
    await expectNoSnapshotClaim(page);
    release();
    await expectFooterStamp(page, snap);
  });

  for (const r of builtRoutes) {
    test(`HONEST-1 · when trace.json can't be read, the ${r.name} says so, names the file, and states no snapshot`, async ({ page }) => {
      await serveTrace(page, null);
      await page.goto(r.path);
      const main = page.getByRole('main');
      await expect(main.locator('[data-status="fail"]').first(), 'a fail status says the read failed').toBeVisible();
      await expect(main).toContainText('trace.json');
      await expectNoSnapshotClaim(page);
    });
  }
});

test.describe('only what the trail holds', () => {
  test('HONEST-1 · the activity page heads the node it shows, from the trail, not another node', async ({ page }) => {
    snapshotOf(fixture.compiled);
    await serveTrace(page, fixture.compiled.publicDir);
    await page.goto(route.activity(fixtureNode.plan, fixtureNode.node));
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('F1');
    await expect(heading).toContainText('Sell');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).locator('[aria-current="page"]')).toHaveText('F1');
    await expect(page.getByRole('main')).not.toContainText('F3');
  });

  test('HONEST-1 · the activity page shows every column of each line as the trail holds it', async ({ page }) => {
    const snap = snapshotOf(fixture.compiled);
    await serveTrace(page, fixture.compiled.publicDir);
    await page.goto(route.activity(fixtureNode.plan, fixtureNode.node));
    await expectFooterStamp(page, snap);
    const table = page.getByRole('main').locator('[data-region="event-table-text-equivalent"] table');
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(5);
    // Every column the event table has, each read below: a column this list lacks is a column nobody checks.
    const names = ['Line', 'Attempt', 'Agent', 'Tool', 'File or command', 'Commit', 'TDD trailer'];
    const headers = (await table.locator('thead th').allTextContents()).map((h) => h.trim());
    expect(headers.length, `the table's columns: ${headers.join(' | ')}`).toBe(names.length);
    const column = (name: string): number => {
      const i = headers.findIndex((h) => h.startsWith(name));
      expect(i, `the table has a "${name}" column`).toBeGreaterThanOrEqual(0);
      return i;
    };
    const full = (id: string): string => fixture.trail.shas[id] ?? id;
    // complete/trail/docs/trace/build/F1/activity.jsonl lines 1-5: attempt 1, tool Bash, one git commit each (c0-c4);
    // the TDD trailer is each commit's own, from complete/commits.json (c0 and c4 carry none).
    const expected = [
      { attempt: '1', agent: 'main', tool: 'Bash', command: 'git commit -m "plan(build/F1): F1 pending → in_progress"', commit: full('c0'), tdd: 'none' },
      { attempt: '1', agent: 'tester', tool: 'Bash', command: 'git commit -m "test(SELL-1): red: the acceptance suite"', commit: full('c1'), tdd: 'red' },
      { attempt: '1', agent: 'builder', tool: 'Bash', command: 'git commit -m "feat(F1): stub the sale route"', commit: full('c2'), tdd: 'stub' },
      { attempt: '1', agent: 'builder', tool: 'Bash', command: 'git commit -m "feat(SELL-1): green: the sale"', commit: full('c3'), tdd: 'green' },
      { attempt: '1', agent: 'tester', tool: 'Bash', command: 'git commit -m "docs(F1): QA script"', commit: full('c4'), tdd: 'none' },
    ];
    for (const [i, line] of expected.entries()) {
      const cells = rows.nth(i).locator('th, td');
      const at = (name: string): string => `row ${i + 1}, ${name}`;
      await expect(cells.nth(column('Line')), at('Line')).toHaveText(String(i + 1));
      await expect(cells.nth(column('Attempt')), at('Attempt')).toHaveText(line.attempt);
      await expect(cells.nth(column('Agent')), at('Agent')).toHaveText(line.agent);
      await expect(cells.nth(column('Tool')), at('Tool')).toHaveText(line.tool);
      await expect(cells.nth(column('File or command')), at('File or command')).toHaveText(line.command);
      // The commit cell is the kit's sha-link: the short SHA as its text, the full SHA as its title.
      const sha = cells.nth(column('Commit')).getByRole('link');
      await expect(sha, at('Commit')).toHaveText(line.commit.slice(0, 7));
      await expect(sha, at('Commit')).toHaveAttribute('title', line.commit);
      await expect(cells.nth(column('TDD trailer')), at('TDD trailer')).toHaveText(line.tdd);
    }
  });

  for (const r of builtRoutes) {
    test(`HONEST-1 · the ${r.name} shows no raw placeholder and nothing from outside the fixture trail`, async ({ page }) => {
      const snap = snapshotOf(fixture.compiled);
      await serveTrace(page, fixture.compiled.publicDir);
      await page.goto(r.path);
      await expectFooterStamp(page, snap);
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(PLACEHOLDER);
      // The design fixture's snapshot (b394466, ui at 64e52cf) and its example node (F3) are not in this trail.
      for (const foreign of ['b394466', '64e52cf', 'F3']) expect(text, `"${foreign}" is not in the fixture trail`).not.toContain(foreign);
    });
  }
});

test.describe('the not-built-yet pattern', () => {
  test("HONEST-1 · reachable: every unbuilt screen's route shows the not-built-yet pattern, with no raw placeholder", async ({ page }) => {
    await serveTrace(page, fixture.compiled.publicDir);
    const c1 = fixture.trail.shas['c1'] ?? 'c1';
    // docs/ui/screens.json: every route but the three this node builds (/, /about, …/activity).
    const unbuilt = [
      '/#/rules',
      '/#/rules/SELL-1',
      '/#/plans/build',
      '/#/plans/build/F1',
      '/#/plans/build/F1/commits',
      '/#/plans/build/F1/loop',
      '/#/plans/build/F1/verdicts/A1/reviewer',
      '/#/plans/build/F1/findings/A1',
      `/#/commits/${c1}`,
      '/#/decisions',
      '/#/harness',
      '/#/sessions',
      '/#/stats',
      '/#/workbench',
      '/#/workbench/sell',
      '/#/workbench/policies/ABC-1',
      '/#/workbench/policies/ABC-1/cancel',
      '/#/workbench/policies/ABC-1/claims/new',
      '/#/workbench/policies/ABC-1/renew',
      '/#/workbench/requests',
      '/#/no-such-page',
    ];
    for (const path of unbuilt) {
      await page.goto(path);
      await expect(page.getByRole('main'), path).toContainText('not built yet');
      expect(await page.locator('body').innerText(), path).not.toMatch(PLACEHOLDER);
    }
  });

  test('HONEST-1 · reachable: each unbuilt nav entry says not built yet and is not a link', async ({ page }) => {
    await serveTrace(page, fixture.compiled.publicDir);
    await page.goto(route.overview);
    const nav = page.getByRole('navigation', { name: /^Primary/ });
    for (const label of ['Requirements matrix', 'Plan', 'Human decisions', 'Workbench']) {
      await expect(nav.locator('[data-kind="nav entry"]', { hasText: label }), label).toContainText('not built yet');
      await expect(nav.getByRole('link', { name: label }), `${label} is not a link`).toHaveCount(0);
    }
  });
});

test.describe('parity', () => {
  for (const s of [overview, about, activity]) {
    test(`HONEST-1 · parity: the ${s.label} keeps its reference's regions in order, the unbuilt ones as not built yet`, async ({ page }) => {
      await expectRegionsInOrder(page, s);
    });
  }
});
