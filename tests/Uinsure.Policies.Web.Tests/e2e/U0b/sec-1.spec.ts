// SEC-1 · Safe rendering. Text from the trail renders as text (or through the sanitising markdown renderer), never
// as raw HTML, under a strict Content-Security-Policy, with no third-party script at runtime. On the
// `awkward-text` fixture trail (tests/Uinsure.Policies.Web.Tests/fixtures/trails/awkward-text/README.md).
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { expectFooterStamp, fixtureNode, recordRequests, route, serveTrace, snapshotOf } from './support/app';
import { compileFixture } from './support/trail';
import type { CompiledTrail } from './support/trail';

let awkward: CompiledTrail;
test.beforeAll(() => {
  awkward = compileFixture('awkward-text');
});
test.afterAll(() => {
  awkward?.trail.cleanup();
});

const TITLE = 'Untrusted <b>fixture</b> <img src=x onerror=window.docketRan=1>';
const COMMAND = 'echo <script>window.docketRan=2</script><img src=x onerror=window.docketRan=3>';

interface Watch {
  dialogs: string[];
  offOrigin(): string[];
  ran(): Promise<unknown>;
  violations(): Promise<string[]>;
}

/** Listens for anything the trail's markup could set off: a dialog, a CSP violation, a request elsewhere. */
async function watch(page: Page): Promise<Watch> {
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });
  await page.addInitScript(() => {
    const w = window as unknown as { docketCsp: string[] };
    w.docketCsp = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      w.docketCsp.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  const seen = recordRequests(page);
  return {
    dialogs,
    offOrigin: () => seen.filter((u) => u.origin !== new URL(page.url()).origin).map(String),
    ran: () => page.evaluate(() => (window as unknown as { docketRan?: unknown }).docketRan),
    violations: () => page.evaluate(() => (window as unknown as { docketCsp: string[] }).docketCsp),
  };
}

async function expectStrictCsp(page: Page): Promise<void> {
  const csp = (await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')) ?? '';
  expect(csp).toContain("default-src 'self'");
  expect(csp).not.toContain('unsafe-eval');
  expect(csp, 'script-src is never widened past self').not.toMatch(/script-src[^;]*('unsafe-inline'|https?:|\*)/);
}

test("SEC-1 · markup in the trail's commands shows as text on the activity page, and none of it runs", async ({ page }) => {
  const snap = snapshotOf(awkward.compiled);
  const seen = await watch(page);
  await serveTrace(page, awkward.compiled.publicDir);
  await page.goto(route.activity(fixtureNode.plan, fixtureNode.node));
  await expectFooterStamp(page, snap);
  const main = page.getByRole('main');
  await expect(main).toContainText(COMMAND);
  await expect(main.locator('script, img'), 'no element is made from the markup').toHaveCount(0);
  expect(await seen.ran(), 'none of the markup ran').toBeUndefined();
  expect(await seen.violations(), 'nothing tried to run against the CSP').toEqual([]);
  expect(seen.dialogs).toEqual([]);
  expect(seen.offOrigin(), 'no request leaves the app').toEqual([]);
  await expectStrictCsp(page);
});

test("SEC-1 · markup in a plan's title shows as text on the about page, and none of it runs", async ({ page }) => {
  const snap = snapshotOf(awkward.compiled);
  const seen = await watch(page);
  await serveTrace(page, awkward.compiled.publicDir);
  await page.goto(route.about);
  await expectFooterStamp(page, snap);
  const main = page.getByRole('main');
  await expect(main).toContainText(TITLE);
  await expect(main.locator('img'), 'no image is made from the title').toHaveCount(0);
  await expect(main.locator('b', { hasText: 'fixture' }), 'no <b> is made from the title').toHaveCount(0);
  expect(await seen.ran(), 'none of the markup ran').toBeUndefined();
  expect(await seen.violations(), 'nothing tried to run against the CSP').toEqual([]);
  expect(seen.dialogs).toEqual([]);
  expect(seen.offOrigin(), 'no request leaves the app').toEqual([]);
  await expectStrictCsp(page);
});
