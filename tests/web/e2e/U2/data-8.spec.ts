// DATA-8 · Tolerates a trail in flight. A node in progress compiles with what exists, shown as in progress. Malformed
// lines are reported, never silently dropped. On the `in-flight` fixture trail (in-flight/README.md): build/F1 mid-loop,
// with a loop log and an activity log but no README, walkthrough or verdicts yet; loop.jsonl line 4 and activity.jsonl
// line 3 are malformed; F1's commits so far are c1, c2 and c3; F2 is pending and waits for F1. The design fixture
// holds no node in flight (its in-flight references are cut variants), so these are behaviour tests only.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  COMPLETENESS,
  GRAPH,
  SEQUENCE,
  auditEverywhere,
  banners,
  compileInFlight,
  graphNode,
  heading,
  headerField,
  openHeaded,
  openOnFixture,
  positions,
  region,
  route,
  shaOf,
  short,
} from './support/app';
import type { CompiledTrail } from './support/app';

const LOOP = 'docs/trace/build/F1/loop.jsonl';
const ACTIVITY = 'docs/trace/build/F1/activity.jsonl';

/** "<file>:<line>" or "<file>, line <line>" or "<file> line <line>": a report that names the file and the line. */
function namesLine(file: string, line: number): RegExp {
  return new RegExp(`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(:|,? line )${line}\\b`);
}

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileInFlight();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

async function openF1(page: Page): Promise<void> {
  await openHeaded(page, fixture, route.node('build', 'F1'), 'F1');
}

test.describe('the node page', () => {
  test("DATA-8 · F1's node page says it is in progress where its completeness goes, not that it has no trail", async ({ page }) => {
    await openF1(page);
    const answer = region(page, COMPLETENESS);
    await expect(answer).toContainText(/in progress/i);
    await expect(answer).not.toContainText(/no trail/i);
  });

  test("DATA-8 · F1's node page draws its completeness as neither OK nor TRAIL INCOMPLETE, and its header as In progress", async ({ page }) => {
    await openF1(page);
    await expect(region(page, COMPLETENESS)).toContainText(/in progress/i);
    await expect(headerField(page, 'Status')).toContainText('In progress');
    const main = page.getByRole('main');
    await expect(banners(main).and(page.locator('[data-completeness="ok"]')), 'not drawn as OK').toHaveCount(0);
    await expect(banners(main).and(page.locator('[data-completeness="incomplete"]')), 'not drawn as incomplete').toHaveCount(0);
  });

  test("DATA-8 · F1's node page reports its malformed loop line, loop.jsonl line 4, by file and line", async ({ page }) => {
    await openF1(page);
    await expect(region(page, COMPLETENESS)).toContainText(namesLine(LOOP, 4));
  });

  test("DATA-8 · F1's node page reports its malformed activity line, activity.jsonl line 3, by file and line", async ({ page }) => {
    await openF1(page);
    await expect(region(page, COMPLETENESS)).toContainText(namesLine(ACTIVITY, 3));
  });

  test("DATA-8 · F1's node page still lists its rule and tasks from the plan while it is in flight", async ({ page }) => {
    await openF1(page);
    await expect(region(page, 'rules')).toContainText('SELL-1');
    await expect(region(page, 'tasks')).toContainText('Pause 1: David reads the stub');
  });

  test("DATA-8 · F2, pending with no trail, reports none of F1's malformed lines", async ({ page }) => {
    await openHeaded(page, fixture, route.node('build', 'F2'), 'F2');
    await expect(region(page, 'tasks'), "F2's page is drawn").toContainText('Acceptance tests for the retrieve');
    await expect(page.getByRole('main')).not.toContainText('loop.jsonl');
    await expect(page.getByRole('main')).not.toContainText('activity.jsonl');
  });
});

test.describe('the walkthrough and the plan', () => {
  test("DATA-8 · F1's walkthrough lists the commits made so far, c1, c2 and c3, oldest first, though none has a walkthrough row yet", async ({ page }) => {
    await openHeaded(page, fixture, route.walkthrough('build', 'F1'), 'F1');
    const sequence = region(page, SEQUENCE);
    const shas = ['c1', 'c2', 'c3'].map((id) => shaOf(fixture, id));
    await expect(sequence).toContainText(short(shas[2] ?? ''));
    const at = positions((await sequence.innerText()).replace(/\s+/g, ' '), shas);
    expect(at.every((p) => p >= 0), 'every commit so far is shown').toBe(true);
    expect(at, 'oldest first').toEqual([...at].sort((a, b) => a - b));
    await expect(sequence).toContainText('the canned sale');
  });

  test("DATA-8 · the plan page draws F1 in progress and F2, which waits for it, pending", async ({ page }) => {
    await openHeaded(page, fixture, route.plan('build'), 'build');
    const graph = region(page, GRAPH);
    await expect(graphNode(graph, 'F1')).toHaveAttribute('data-status', 'in-progress');
    await expect(graphNode(graph, 'F1')).toContainText('In progress');
    await expect(graphNode(graph, 'F2')).toContainText('Pending');
  });
});

test.describe('axe', () => {
  test("DATA-8 · F1's in-flight node page on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    const path = route.node('build', 'F1');
    await openOnFixture(page, fixture, path);
    await auditEverywhere(page, path, async (p) => {
      await expect(heading(p)).toContainText('F1');
      await expect(region(p, COMPLETENESS)).toContainText(namesLine(LOOP, 4));
    });
  });
});
