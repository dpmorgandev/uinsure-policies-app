// RESP-1 · Works on a laptop and a phone. Designed for 1440 and 1280 wide; usable at 390 with no horizontal page
// scroll (wide tables scroll inside their own container). On the `complete` fixture trail, and on `awkward-text`
// for a 400-character unbroken line (tests/web/fixtures/trails/awkward-text/README.md).
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
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

/** The page frame as laid out: the window, the document, the footer and main, in page coordinates (CSS px). */
async function frameBoxes(page: Page): Promise<{ window: number; document: number; footerTop: number; footerBottom: number; mainBottom: number }> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  return page.evaluate(() => {
    const f = document.querySelector('footer')?.getBoundingClientRect();
    const m = document.querySelector('main')?.getBoundingClientRect();
    return {
      window: window.innerHeight,
      document: document.documentElement.scrollHeight,
      footerTop: (f?.top ?? Number.NaN) + window.scrollY,
      footerBottom: (f?.bottom ?? Number.NaN) + window.scrollY,
      mainBottom: (m?.bottom ?? Number.NaN) + window.scrollY,
    };
  });
}

// Finding D1/I1: the shell's min-height: 100% resolves against html, body and #root, which have no height, so on a
// route shorter than the window the footer floats under the content with bare canvas below it. Not-built routes
// fall to the catch-all and render only the kit's short "not built yet" box, so they are the short pages.
test('RESP-1 · on a short page the footer sits at the bottom of the window', async ({ page }) => {
  await serveTrace(page, fixture.compiled.publicDir);
  const short = [
    { name: 'an unknown route', path: '/#/no-such-page' },
    { name: "the node's matrix (not built yet)", path: `/#/plans/${fixtureNode.plan}/${fixtureNode.node}/matrix` },
  ];
  for (const width of [1440, 1280] as const) {
    await page.setViewportSize(viewports[width]);
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      for (const r of short) {
        const at = `${r.name} at ${width}x${viewports[width].height}, ${theme}`;
        await page.goto('about:blank');
        await page.goto(r.path);
        await expect(page.getByRole('main'), `${at}: the not-built box`).toContainText('not built yet');
        await expect(page.getByRole('contentinfo'), `${at}: the footer`).toBeVisible();
        const box = await frameBoxes(page);
        expect.soft(box.document, `${at}: the document is no taller than the window`).toBeLessThanOrEqual(box.window);
        expect
          .soft(Math.abs(box.footerBottom - box.window), `${at}: px between the footer's bottom (${box.footerBottom}) and the window's (${box.window})`)
          .toBeLessThanOrEqual(1);
      }
      // The other side: on the overview, however tall, the footer still follows the content and ends the page.
      const at = `the overview at ${width}x${viewports[width].height}, ${theme}`;
      await page.goto('about:blank');
      await page.goto(route.overview);
      await expect(page.getByRole('contentinfo'), `${at}: the footer`).toBeVisible();
      const box = await frameBoxes(page);
      expect.soft(box.footerTop, `${at}: the footer comes after the main content`).toBeGreaterThanOrEqual(box.mainBottom - 1);
      expect.soft(Math.abs(box.document - box.footerBottom), `${at}: px of page below the footer`).toBeLessThanOrEqual(1);
    }
  }
});
