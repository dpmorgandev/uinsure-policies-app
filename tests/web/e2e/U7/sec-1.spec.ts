// SEC-1 · Safe rendering, U7's carries from U0b's security review (S1, S2): every link out of the app (a commit SHA
// to GitHub, the footer's repository link) carries rel="noreferrer", and the Content-Security-Policy also sets
// base-uri 'self', form-action 'none' and object-src 'none'. On the `rules` fixture trail
// (tests/web/fixtures/trails/rules/README.md), whose commits link out to GitHub from the walkthrough, the commit page
// and the rule page.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { compileFixture } from '../U0b/support/trail';
import type { CompiledTrail } from '../U0b/support/trail';
import { openOnFixture, shaOf } from '../U1/support/app';
import { route } from '../U2/support/app';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileFixture('rules');
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

interface OutLink {
  href: string;
  rel: string;
}

/** Every link on the page that leaves the app (an absolute http(s) URL), with its rel as written. */
async function linksOut(page: Page): Promise<OutLink[]> {
  return page
    .locator('a[href^="http:"], a[href^="https:"]')
    .evaluateAll((links) => links.map((a) => ({ href: a.getAttribute('href') ?? '', rel: a.getAttribute('rel') ?? '' })));
}

const noreferrer = (link: OutLink): boolean => link.rel.split(/\s+/).includes('noreferrer');

/** Opens a route, waits for its footer's repository link and its own links out, then lists the ones without noreferrer. */
async function expectEveryLinkOutNoreferrer(page: Page, path: string, atLeast: number): Promise<void> {
  await openOnFixture(page, fixture, path);
  await expect(page.getByRole('contentinfo').locator('a[href^="https:"]').first(), 'the footer links out to the repository').toBeVisible();
  await expect.poll(async () => (await linksOut(page)).length, `at least ${atLeast} links out on ${path}`).toBeGreaterThanOrEqual(atLeast);
  const links = await linksOut(page);
  expect(
    links.filter((l) => !noreferrer(l)).map((l) => `${l.href} rel="${l.rel}"`),
    `every link out on ${path} carries rel="noreferrer"`,
  ).toEqual([]);
}

test("SEC-1 · the footer's repository and snapshot links carry rel=noreferrer, on the overview", async ({ page }) => {
  await expectEveryLinkOutNoreferrer(page, route.overview, 2);
});

test("SEC-1 · the commit page's links out to GitHub carry rel=noreferrer", async ({ page }) => {
  await expectEveryLinkOutNoreferrer(page, route.commit(shaOf(fixture, 'c4')), 3);
});

test("SEC-1 · the walkthrough's commit SHA links carry rel=noreferrer", async ({ page }) => {
  await expectEveryLinkOutNoreferrer(page, route.walkthrough('build', 'F1'), 3);
});

test("SEC-1 · the rule page's commit, PR and QA links carry rel=noreferrer", async ({ page }) => {
  await expectEveryLinkOutNoreferrer(page, route.rule('SELL-1'), 3);
});

test("SEC-1 · the Content-Security-Policy also sets base-uri 'self', form-action 'none' and object-src 'none'", async ({ page }) => {
  await openOnFixture(page, fixture, route.overview);
  const csp = (await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')) ?? '';
  const directives = csp
    .split(';')
    .map((d) => d.trim().replace(/\s+/g, ' '))
    .filter((d) => d.length > 0);
  expect(directives, "default-src 'self' is kept").toContain("default-src 'self'");
  expect(directives, "base-uri 'self'").toContain("base-uri 'self'");
  expect(directives, "form-action 'none'").toContain("form-action 'none'");
  expect(directives, "object-src 'none'").toContain("object-src 'none'");
});
