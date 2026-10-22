// AGENT-2 · Agent swimlanes. activity.jsonl as per-agent lanes over time: tool, file, command. On the `agents` fixture
// trail (agents/README.md): build/F1's 11 log lines in four lanes, in first-seen order main, tester, builder,
// reviewer; the reviewer's one line is a Read of src/sell.txt; the builder's lane holds the Edit of src/sell.txt and
// its commits. Parity on the design fixture against docs/ui/derived/U4/activity/.
import { expect, test } from '@playwright/test';
import { LANES, auditEverywhere, compileAgents, laneAgents, openRegion, region, route } from './support/app';
import type { CompiledTrail } from './support/app';
import { activity, expectRegionComponents, expectRegionsInOrder } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileAgents();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

const F1 = route.activity('build', 'F1');

test("AGENT-2 · build/F1's activity draws one lane per agent, in first-seen order: main, tester, builder, reviewer", async ({ page }) => {
  const lanes = await openRegion(page, fixture, F1, LANES);
  await expect.poll(() => laneAgents(lanes)).toEqual(['main', 'tester', 'builder', 'reviewer']);
});

test("AGENT-2 · each lane holds its agent's lines: main 3, tester 3, builder 4, reviewer 1", async ({ page }) => {
  const lanes = await openRegion(page, fixture, F1, LANES);
  const ticks = async (agent: string): Promise<number> => lanes.locator(`ol[aria-label="${agent} rungs"] > li`).count();
  await expect.poll(async () => [await ticks('main'), await ticks('tester'), await ticks('builder'), await ticks('reviewer')]).toEqual([3, 3, 4, 1]);
});

test("AGENT-2 · the reviewer's lane names its tool and file: Read, src/sell.txt", async ({ page }) => {
  const lanes = await openRegion(page, fixture, F1, LANES);
  const reviewer = lanes.locator('ol[aria-label="reviewer rungs"]');
  await expect(reviewer).toContainText('Read');
  await expect(reviewer).toContainText('src/sell.txt');
});

test('AGENT-2 · the activity page has no axe violation, light and dark, 1440 and 390', async ({ page }) => {
  await openRegion(page, fixture, F1, LANES);
  await auditEverywhere(page, F1, async (p) => {
    await expect.poll(() => laneAgents(region(p, LANES))).toEqual(['main', 'tester', 'builder', 'reviewer']);
  });
});

test("AGENT-2 · parity: the activity page's regions in order", async ({ page }) => {
  await expectRegionsInOrder(page, activity);
});

test("AGENT-2 · parity: the activity page's agent lanes, its components", async ({ page }) => {
  await expectRegionComponents(page, activity, LANES);
});
