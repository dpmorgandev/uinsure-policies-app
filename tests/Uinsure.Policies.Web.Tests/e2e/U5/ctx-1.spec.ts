// CTX-1 · Sessions. The docs/context/ snapshot chain as a timeline across days, showing how work resumed between
// sessions. U5's acceptance: the sessions page lists each dated snapshot oldest first, with its slug, plan · node,
// status and next action; an undated snapshot is not guessed into it. On the `complete` trail with U5's overlay
// (tests/Uinsure.Policies.Web.Tests/fixtures/overlays/u5/README.md): f1-started and f1-pause-one on 2026-10-18, day-two-resumed (no plan,
// no node) on 2026-10-19; no-front-matter has no date. Parity on the design fixture against docs/ui/derived/U5/sessions/.
import { expect, test } from '@playwright/test';
import { TIMELINE, allRowTexts, auditEverywhere, compileU5, heading, openOnFixture, primaryNav, region, route } from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, sessions } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileU5();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

async function openTimeline(page: import('@playwright/test').Page) {
  await openOnFixture(page, fixture, route.sessions);
  const timeline = region(page, TIMELINE);
  await expect(timeline, 'the snapshot timeline is drawn').toBeVisible();
  return timeline;
}

test("CTX-1 · the timeline lists the trail's three dated snapshots, oldest first, by slug", async ({ page }) => {
  const timeline = await openTimeline(page);
  await expect.poll(async () => {
    const rows = await allRowTexts(timeline);
    return ['f1-started', 'f1-pause-one', 'day-two-resumed'].map((slug) => rows.findIndex((r) => r.includes(slug)));
  }).toEqual([0, 1, 2]);
});

test("CTX-1 · each session shows its plan · node, status and next action from its snapshot", async ({ page }) => {
  const timeline = await openTimeline(page);
  const paused = timeline.locator('table tbody tr').filter({ hasText: 'f1-pause-one' });
  await expect(paused, 'the pause-one row').toHaveCount(1);
  await expect(paused).toContainText('build');
  await expect(paused).toContainText('F1');
  await expect(paused).toContainText(/blocked/i);
  await expect(paused).toContainText('David opens the stub routes at pause 1');
});

test('CTX-1 · the timeline spans two days: the resumed session is saved on 2026-10-19, the first on 2026-10-18', async ({ page }) => {
  const timeline = await openTimeline(page);
  await expect(timeline.locator('table tbody tr').filter({ hasText: 'f1-started' }).locator('time').first()).toHaveAttribute(
    'datetime',
    /^2026-10-18T09:00:00/,
  );
  await expect(timeline.locator('table tbody tr').filter({ hasText: 'day-two-resumed' }).locator('time').first()).toHaveAttribute(
    'datetime',
    /^2026-10-19T08:10:00/,
  );
});

test("CTX-1 · a session with no plan or node shows the kit's empty value, never a default plan", async ({ page }) => {
  const timeline = await openTimeline(page);
  const resumed = timeline.locator('table tbody tr').filter({ hasText: 'day-two-resumed' });
  await expect(resumed).toContainText("Resume F1 from pause 1 after David's ruling");
  await expect(resumed).not.toContainText('build');
});

test('CTX-1 · the snapshot with no front matter is not guessed into the timeline', async ({ page }) => {
  const timeline = await openTimeline(page);
  await expect.poll(async () => (await allRowTexts(timeline)).length).toBe(3);
  await expect(timeline).not.toContainText('no-front-matter');
});

test('CTX-1 · reachable: the sessions route answers with its own heading', async ({ page }) => {
  await openOnFixture(page, fixture, route.sessions);
  await expect(heading(page)).toBeVisible();
  await expect(primaryNav(page)).toBeVisible();
});

test('CTX-1 · the sessions page has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
  await openOnFixture(page, fixture, route.sessions);
  await auditEverywhere(page, route.sessions, async (p) => {
    await expect(region(p, TIMELINE).locator('table tbody tr').first()).toBeVisible();
  });
});

test("CTX-1 · parity: the sessions page keeps its reference's regions in order", async ({ page }) => {
  await expectRegionsInOrder(page, sessions);
});

test("CTX-1 · parity: the snapshot timeline region carries its reference's components", async ({ page }) => {
  await expectRegionComponents(page, sessions, TIMELINE);
});

test("CTX-1 · parity: the sessions page's shell, primary nav and title are its reference's", async ({ page }) => {
  await expectShell(page, sessions, true);
});

test('CTX-1 · parity: the sessions page uses tokens only, no literal colour', async ({ page }) => {
  await expectTokensOnly(page, sessions);
});
