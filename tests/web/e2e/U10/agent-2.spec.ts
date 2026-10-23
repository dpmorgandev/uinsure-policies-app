// AGENT-2 · Agent swimlanes, U4's review carry to U10 (A2 R2; the acceptance cites AGENT-1, but the notice sits in the
// agent-lanes region, whose data-req is AGENT-2): the notice that accounts for the lines the lanes don't draw is a kit
// state or component, not screen markup. U4 drew it as the activity screen's own <p class="s-events-note">.
// On the `agents` fixture trail (tests/web/fixtures/trails/agents/README.md): build/F3's lines 4 (design-auditor) and 5
// (no agent field) are not drawn as lanes, and the page accounts for both.
import { expect, test } from '@playwright/test';
import { compileAgents } from '../U4/support/app';
import type { CompiledTrail } from '../U0b/support/trail';
import { openOnFixture, region } from '../U1/support/app';
import { traceAnswered } from '../U5/support/app';

const LANES = 'agent-lanes';

let agents: CompiledTrail;
test.beforeAll(() => {
  agents = compileAgents();
});
test.afterAll(() => {
  agents?.trail.cleanup();
});

test("AGENT-2 · the notice of build/F3's two lines not drawn as lanes is drawn by a kit component, not the screen's own markup", async ({ page }) => {
  await openOnFixture(page, agents, '/#/plans/build/F3/activity');
  await traceAnswered(page);
  const lanes = region(page, LANES);
  const notice = lanes.getByText(/2 lines are not drawn as lanes/);
  await expect(notice, 'setup: the page accounts for the two undrawn lines').toBeVisible();
  // The nearest ancestor-or-self carrying a kit root (a data-comp root or a kit-<component>__ class), inside the region.
  const drawnBy = await notice.evaluate((el) => {
    const regionEl = el.closest('[data-region]');
    for (let at: Element | null = el; at !== null && at !== regionEl; at = at.parentElement) {
      if (at.hasAttribute('data-comp') || Array.from(at.classList).some((c) => c.startsWith('kit-'))) return at.getAttribute('data-comp') ?? at.className;
    }
    return null;
  });
  expect(drawnBy, 'a kit component draws the notice').not.toBeNull();
  await expect(lanes.locator('.s-events-note'), 'no screen-owned notice markup in the lanes region').toHaveCount(0);
});
