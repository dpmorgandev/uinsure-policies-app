// LOOP-1 · Gate timeline. Every loop.jsonl event: gate, command, exit code, expected outcome, ok, and the detail line.
// FAILs stand out. On the `retry-ladder` fixture trail (retry-ladder/README.md): build/F1's 23 log lines, of which 12
// are gate or state events; gate.stub at line 4 is the only one that came back ok false. The git-only case is the
// `rules` fixture's F0a, which has no loop.jsonl (rules/README.md). Parity on the design fixture against
// docs/ui/derived/U3/loop/.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  REPO,
  TIMELINE,
  auditEverywhere,
  compileRetry,
  compileRules,
  fact,
  gateRow,
  gateRowNames,
  openOnFixture,
  openRegion,
  region,
  route,
  shaOf,
  short,
  viewports,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, loop, loopGitOnly, loopLong } from './support/parity';

const LOOP = route.loop('build', 'F1');

/** Every gate and state event of the fixture's log, in log order, as the kit's gate-row names it. */
const EVENTS = [
  '1·2 state(in_progress): State change',
  '1·3 gate.red: Failed as expected',
  '1·4 gate.stub: Gate failed',
  '2·7 gate.finding-red: Failed as expected',
  '2·8 gate.stub: Failed as expected',
  '2·10 gate.green: Gate held',
  '3·15 state(investigating): State change',
  '3·17 state(in_progress): State change',
  '3·18 gate.finding-red: Failed as expected',
  '3·19 gate.green: Gate held',
  '3·22 gate.qa: Gate held',
  '3·23 gate.integrate: Gate held',
];

/** The FAIL: loop.jsonl line 4, as the fixture writes it. */
const FAIL = {
  name: '1·4 gate.stub: Gate failed',
  cmd: 'npm run e2e -- --grep "SELL-"; curl -X POST /policies twice with reference ABC-1',
  exit: '1',
  expect: 'every SELL test fails and the route answers its happy-path status',
  detail:
    'tests: 2 total, 2 failed. Live: the first POST answered 201, the second POST with the same reference answered 500: the stub throws on a reference it has answered. API stopped.',
};

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRetry();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

async function openTimeline(page: Page): Promise<Locator> {
  const timeline = await openRegion(page, fixture, LOOP, TIMELINE);
  // A detail only the fixture's line 4 has: the timeline is drawing the fixture, not canned content.
  await expect(timeline, "the timeline shows the fixture's events").toContainText('the stub throws on a reference it has answered');
  return timeline;
}

/** One kit CodeBlock: its <code> element, of which a block has exactly one (root > pre > code all carry kit-code-block__ classes). */
const CODE_BLOCK = '[class~="kit-code-block__code"]';

/** The nearest block around a gate row that holds a command: the row's own event, with its command beside it. */
function eventBlock(row: Locator): Locator {
  return row.locator('xpath=ancestor::*[.//*[contains(@class, "kit-code-block__")]][1]');
}

test.describe('every gate and state event, in log order', () => {
  test('LOOP-1 · the timeline lists every gate and state event of the log, in log order, each marked attempt·line', async ({ page }) => {
    const timeline = await openTimeline(page);
    await expect.poll(() => gateRowNames(timeline)).toEqual(EVENTS);
  });

  test('LOOP-1 · the timeline leaves out the events that are not gates or states: setup, attempt++, findings, pause1, verdicts, the investigation', async ({ page }) => {
    const timeline = await openTimeline(page);
    for (const event of ['setup', 'attempt++', 'findings(', 'pause1', 'verdict(', 'investigation.opened(']) {
      await expect(timeline.locator('[data-kind="gate"], [data-kind="state"]').filter({ hasText: event }), `${event} is not a timeline row`).toHaveCount(0);
    }
  });
});

test.describe("each event's command, exit code, expectation, ok, head and detail", () => {
  test('LOOP-1 · the FAIL at line 4 shows its exit code 1, its expected outcome and ok false', async ({ page }) => {
    const row = gateRow(await openTimeline(page), FAIL.name);
    await expect(fact(row, 'Exit')).toHaveText(FAIL.exit);
    await expect(fact(row, 'Expected')).toHaveText(FAIL.expect);
    await expect(fact(row, 'ok')).toHaveText('false');
  });

  test("LOOP-1 · the FAIL at line 4 shows the log's detail line verbatim", async ({ page }) => {
    const row = gateRow(await openTimeline(page), FAIL.name);
    await expect(row).toContainText(FAIL.detail);
  });

  test('LOOP-1 · the FAIL at line 4 shows the command it ran, beside its own row', async ({ page }) => {
    const row = gateRow(await openTimeline(page), FAIL.name);
    const block = eventBlock(row);
    await expect(block.locator(CODE_BLOCK).filter({ hasText: FAIL.cmd }), "line 4's command").toHaveCount(1);
    await expect(block.locator('[data-kind="gate"], [data-kind="state"]'), 'the command sits with this event alone').toHaveCount(1);
  });

  test("LOOP-1 · the FAIL at line 4 links its head SHA, c2, to the commit on GitHub", async ({ page }) => {
    const row = gateRow(await openTimeline(page), FAIL.name);
    const c2 = shaOf(fixture, 'c2');
    await expect(row.locator(`a[href="${REPO}/commit/${c2}"]`)).toContainText(short(c2));
  });

  test('LOOP-1 · gate.green at line 19 shows exit 0, its expected outcome, ok true and its detail', async ({ page }) => {
    const timeline = await openTimeline(page);
    const row = gateRow(timeline, '3·19 gate.green: Gate held');
    await expect(fact(row, 'Exit')).toHaveText('0');
    await expect(fact(row, 'Expected')).toHaveText('pass, >=1 test per rule');
    await expect(fact(row, 'ok')).toHaveText('true');
    await expect(row).toContainText('SELL-1 1/1 and SELL-2 3/3 pass');
    await expect(eventBlock(row).locator(CODE_BLOCK).filter({ hasText: 'npm run e2e -- --grep "SELL-" --repeat-each 2' })).toHaveCount(1);
  });

  test("LOOP-1 · the state change at line 17 shows the log's detail line, the investigation's hand-back", async ({ page }) => {
    const row = gateRow(await openTimeline(page), '3·17 state(in_progress): State change');
    await expect(row).toContainText('inv-001 hand-back: recommendation 1 accepted by David; route for round A2 briefed');
  });

  test("LOOP-1 · gate.integrate at line 23, whose log line holds no detail, says so and shows no other event's detail", async ({ page }) => {
    const row = gateRow(await openTimeline(page), '3·23 gate.integrate: Gate held');
    await expect(row).toContainText(/no detail/i);
    await expect(row).not.toContainText('sign-off table blank for David');
  });
});

test.describe('FAILs stand out', () => {
  test('LOOP-1 · the ok-false gate at line 4 is drawn as failed, with a fail status', async ({ page }) => {
    const row = gateRow(await openTimeline(page), FAIL.name);
    await expect(row).toHaveAttribute('data-result', 'failed');
    await expect(row.locator('[data-status="fail"]')).toHaveText('Gate failed');
  });

  test('LOOP-1 · line 4 is the only row in the timeline drawn as failed', async ({ page }) => {
    const timeline = await openTimeline(page);
    await expect(timeline.locator('[data-result="failed"]')).toHaveCount(1);
    await expect(timeline.locator('[data-status="fail"]')).toHaveCount(1);
  });

  test('LOOP-1 · a gate that failed as it expected to (gate.red at line 3: exit 2, ok true) is not drawn as a FAIL', async ({ page }) => {
    const row = gateRow(await openTimeline(page), '1·3 gate.red: Failed as expected');
    await expect(row).toHaveAttribute('data-result', 'expected-fail');
    await expect(row.locator('[data-status="fail"]')).toHaveCount(0);
    await expect(fact(row, 'Exit')).toHaveText('2');
    await expect(fact(row, 'ok')).toHaveText('true');
  });

  test('LOOP-1 · the attempt ladder links to the FAIL, and following it brings line 4 into view on the loop page', async ({ page }) => {
    await page.setViewportSize(viewports[390]);
    const timeline = await openTimeline(page);
    const target = gateRow(timeline, FAIL.name);
    await expect(target, 'the FAIL starts below the fold').not.toBeInViewport();
    await region(page, 'attempt-ladder').getByRole('link', { name: /FAIL.*line 4/ }).click();
    await expect(target).toBeInViewport();
    expect(new URL(page.url()).hash, 'the page is still the loop').toContain('/plans/build/F1/loop');
  });
});

test.describe('a node with no loop log', () => {
  let rules: CompiledTrail;
  test.beforeAll(() => {
    rules = compileRules();
  });
  test.afterAll(() => {
    rules?.trail.cleanup();
  });

  test('LOOP-1 · the loop of F0a, which has no loop.jsonl, lists no event and says it has no loop log', async ({ page }) => {
    await openOnFixture(page, rules, route.loop('build', 'F0a'));
    // The fixture's own README wording (the real F0a's also names bug/* branches): the page reads the fixture.
    await expect(page.getByRole('main')).toContainText('the activity hook records only on feature/* branches, so F0a has no activity, loop or verdict receipts.');
    const timeline = region(page, TIMELINE);
    await expect(timeline).toContainText('F0a');
    await expect(timeline).toContainText('loop.jsonl');
    await expect(timeline.locator('[data-kind="gate"], [data-kind="state"]')).toHaveCount(0);
  });
});

test.describe('reachable', () => {
  test("LOOP-1 · reachable: the node page's Loop tab opens the node's loop, with its gate timeline", async ({ page }) => {
    await openOnFixture(page, fixture, route.node('build', 'F1'));
    await page.getByRole('navigation', { name: /^Views of this node/ }).getByRole('link', { name: 'Loop', exact: true }).click();
    await expect(page).toHaveURL(/#\/plans\/build\/F1\/loop$/);
    await expect(region(page, TIMELINE)).toBeVisible();
  });
});

test.describe('axe', () => {
  test("LOOP-1 · F1's loop page on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    await openTimeline(page);
    await auditEverywhere(page, LOOP, async (p) => {
      // Line 4's name alone is shared with the design fixture's F3 (also 1·4 gate.stub, failed), so canned content
      // could match it: wait for the detail only the fixture's line 4 holds before axe runs on each load.
      await expect(gateRow(region(p, TIMELINE), FAIL.name), "the timeline draws the fixture's line 4").toContainText(
        'the stub throws on a reference it has answered',
      );
    });
  });
});

test.describe('parity', () => {
  test("LOOP-1 · parity: the loop page keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, loop);
  });

  test("LOOP-1 · parity: the gate timeline region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, loop, TIMELINE);
  });

  test("LOOP-1 · parity: the longest loop (build/F1) keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, loopLong);
  });

  test("LOOP-1 · parity: the longest loop's gate timeline carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, loopLong, TIMELINE);
  });

  test("LOOP-1 · parity: the git-only loop (build/F0a) keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, loopGitOnly);
  });

  test("LOOP-1 · parity: the loop page's shell, primary nav, Loop tab and title are its reference's", async ({ page }) => {
    await expectShell(page, loop, true);
  });

  test('LOOP-1 · parity: the loop page takes every colour from a token, light and dark', async ({ page }) => {
    await expectTokensOnly(page, loop);
  });
});
