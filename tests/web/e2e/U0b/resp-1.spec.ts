// RESP-1 · Works on a laptop and a phone. Designed for 1440 and 1280 wide; usable at 390 with no horizontal page
// scroll (wide tables scroll inside their own container). On the `complete` fixture trail, and on `awkward-text`
// for a 400-character unbroken line (tests/web/fixtures/trails/awkward-text/README.md).
import { expect, test } from '@playwright/test';
import { builtRoutes, expectFooterStamp, fixtureNode, route, serveTrace, sidewaysScroll, snapshotOf, viewports } from './support/app';
import { compileFixture } from './support/trail';
import type { CompiledTrail } from './support/trail';

let fixture: CompiledTrail;
let awkward: CompiledTrail;
test.beforeAll(() => {
  fixture = compileFixture('complete');
  awkward = compileFixture('awkward-text');
});
test.afterAll(() => {
  fixture?.trail.cleanup();
  awkward?.trail.cleanup();
});

for (const r of builtRoutes) {
  test(`RESP-1 · at 390 wide the ${r.name} doesn't scroll sideways`, async ({ page }) => {
    const snap = snapshotOf(fixture.compiled);
    await serveTrace(page, fixture.compiled.publicDir);
    await page.setViewportSize(viewports[390]);
    await page.goto(r.path);
    await expectFooterStamp(page, snap);
    expect(await sidewaysScroll(page), 'sideways scroll in px').toBe(0);
  });
}

test('RESP-1 · at 1440 and 1280 wide no U0b page scrolls sideways', async ({ page }) => {
  const snap = snapshotOf(fixture.compiled);
  await serveTrace(page, fixture.compiled.publicDir);
  for (const width of [1440, 1280] as const) {
    await page.setViewportSize(viewports[width]);
    for (const r of builtRoutes) {
      await page.goto('about:blank');
      await page.goto(r.path);
      await expectFooterStamp(page, snap);
      expect.soft(await sidewaysScroll(page), `${r.name} at ${width}: sideways scroll in px`).toBe(0);
    }
  }
});

test("RESP-1 · at 390 wide a 400-character unbroken command is shown whole, and the page doesn't scroll sideways", async ({ page }) => {
  const snap = snapshotOf(awkward.compiled);
  await serveTrace(page, awkward.compiled.publicDir);
  await page.setViewportSize(viewports[390]);
  await page.goto(route.activity(fixtureNode.plan, fixtureNode.node));
  await expectFooterStamp(page, snap);
  // awkward-text/README.md, activity line 3.
  const command = `cat docs/${'an-unbroken-path-segment-with-no-spaces-'.repeat(10)}end.md`;
  await expect(page.getByRole('main')).toContainText(command);
  expect(await sidewaysScroll(page), 'sideways scroll in px').toBe(0);
});
