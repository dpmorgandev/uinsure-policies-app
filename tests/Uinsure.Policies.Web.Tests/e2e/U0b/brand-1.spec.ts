// BRAND-1 · No Uinsure branding. No Uinsure logo, wordmark or anything that reads as their product; the UI is
// David's, named Docket. On the `complete` fixture trail, which names no Uinsure anywhere, so any mention would
// come from the app itself; parity on the design fixture against docs/ui/derived/U0b/.
import { expect, test } from '@playwright/test';
import { builtRoutes, expectFooterStamp, fixtureNode, route, serveTrace, snapshotOf } from './support/app';
import { about, activity, expectShell, overview } from './support/parity';
import { compileFixture } from './support/trail';
import type { CompiledTrail } from './support/trail';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileFixture('complete');
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

test('BRAND-1 · each U0b page is titled after its own screen, then Docket', async ({ page }) => {
  snapshotOf(fixture.compiled);
  await serveTrace(page, fixture.compiled.publicDir);
  await page.goto(route.overview);
  await expect(page).toHaveTitle('Overview · Docket');
  await page.goto(route.about);
  await expect(page).toHaveTitle('How to read this · Docket');
  await page.goto(route.activity(fixtureNode.plan, fixtureNode.node));
  await expect(page).toHaveTitle('Node build/F1 · Docket');
});

test('BRAND-1 · no U0b page names or pictures Uinsure; the app names itself Docket', async ({ page }) => {
  const snap = snapshotOf(fixture.compiled);
  await serveTrace(page, fixture.compiled.publicDir);
  for (const r of builtRoutes) {
    await page.goto(r.path);
    await expectFooterStamp(page, snap);
    await expect(page.getByRole('banner').getByRole('link', { name: 'Docket' }), r.name).toBeVisible();
    expect(await page.locator('body').innerText(), r.name).not.toMatch(/uinsure/i);
    expect(await page.title(), r.name).not.toMatch(/uinsure/i);
    const pictures = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img, svg, [role="img"]')).map((el) =>
        ['alt', 'aria-label', 'title', 'src'].map((name) => el.getAttribute(name) ?? '').join(' '),
      ),
    );
    // Text and pictures only: the repository's own address (a link's href) is David's, and may say it.
    expect(pictures.filter((p) => /uinsure/i.test(p)), `${r.name}: no picture names Uinsure`).toEqual([]);
  }
});

test.describe('parity', () => {
  test("BRAND-1 · parity: the overview has its reference's title, shell and navigation", async ({ page }) => {
    await expectShell(page, overview, true);
  });

  test("BRAND-1 · parity: the about page has its reference's title, shell and navigation", async ({ page }) => {
    await expectShell(page, about, true);
  });

  test("BRAND-1 · parity: the activity page has its reference's title, shell, navigation and current tab", async ({ page }) => {
    await expectShell(page, activity, true);
  });
});
