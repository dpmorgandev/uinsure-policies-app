// AGENT-2 · Agent swimlanes. activity.jsonl as per-agent lanes over time: tool, file, command. On the `agents` fixture
// trail (agents/README.md): build/F1's 11 log lines in four lanes, in first-seen order main, tester, builder,
// reviewer; the reviewer's one line is a Read of src/sell.txt; the builder's lane holds the Edit of src/sell.txt and
// its commits. Parity on the design fixture against docs/ui/derived/U4/activity/.
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
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

// build/F3 (agents/README.md): web-tester 2 lines, web-builder 1, then one design-auditor line and one with no agent.
const F3 = route.activity('build', 'F3');
const ticksOf = async (lanes: Locator, agent: string): Promise<number> => lanes.locator(`ol[aria-label="${agent} rungs"] > li`).count();

test("AGENT-2 · build/F3's ui-plan agents get lanes, in first-seen order: web-tester 2 lines, web-builder 1", async ({ page }) => {
  // A3 I2: the kit draws the ui plan's agents, and the app's list follows it.
  const lanes = await openRegion(page, fixture, F3, LANES);
  await expect.poll(() => laneAgents(lanes)).toEqual(['web-tester', 'web-builder']);
  await expect.poll(async () => [await ticksOf(lanes, 'web-tester'), await ticksOf(lanes, 'web-builder')]).toEqual([2, 1]);
});

test("AGENT-2 · build/F3's lines no lane draws are named: 2 lines, design-auditor and no agent, and the ticks plus those equal the filter's total", async ({ page }) => {
  // A3 I3: a line whose agent is outside the kit's list, or absent, is accounted for, never silently dropped.
  const lanes = await openRegion(page, fixture, F3, LANES);
  await expect(lanes.locator('fieldset')).toContainText(/Showing\s*5\s*of\s*5\s*lines/);
  // The filter bar lists design-auditor among its options, so the notice is read from the region without it.
  const notice = async (): Promise<string> =>
    lanes.evaluate((el) => {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('fieldset').forEach((f) => f.remove());
      return (copy.textContent ?? '').replace(/\s+/g, ' ');
    });
  await expect.poll(notice).toMatch(/\b2 lines\b/);
  await expect.poll(notice).toContain('design-auditor');
  await expect.poll(notice).toMatch(/no agent(?! activity)/i);
  const ticks = await lanes.locator('ol[aria-label$=" rungs"] > li').count();
  expect(ticks + 2, 'the lane ticks plus the 2 noted lines equal the filter bar total').toBe(5);
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
