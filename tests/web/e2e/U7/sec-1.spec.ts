// SEC-1 · Safe rendering, U7's carries from U0b's security review (S1, S2): the page's referrer policy is no-referrer,
// so no link out of the app (a commit SHA to GitHub, the footer's repository link) sends a referrer, and the
// Content-Security-Policy also sets base-uri 'self', form-action 'none' and object-src 'none'. Per-link rel=noreferrer
// on kit components is carried past the demo (the U7 acceptance line, amended at f4a2af1). On the `rules` fixture trail
// (tests/web/fixtures/trails/rules/README.md).
import { expect, test } from '@playwright/test';
import type { Response } from '@playwright/test';
import { compileFixture } from '../U0b/support/trail';
import type { CompiledTrail } from '../U0b/support/trail';
import { openOnFixture } from '../U1/support/app';
import { route } from '../U2/support/app';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileFixture('rules');
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/**
 * The policy a Referrer-Policy header sets: a comma-separated list whose last token wins, so the last non-empty one
 * is taken; an empty or absent header sets none.
 */
function headerPolicy(value: string | undefined): string | null {
  const tokens = (value ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  return tokens.at(-1) ?? null;
}

test('SEC-1 · the served page declares a no-referrer referrer policy, as a meta tag or a Referrer-Policy header', async ({ page }) => {
  const documentResponse: Promise<Response> = page.waitForResponse((r) => r.request().resourceType() === 'document');
  await openOnFixture(page, fixture, route.overview);
  const header = headerPolicy((await (await documentResponse).allHeaders())['referrer-policy']);
  const metas = await page
    .locator('meta[name="referrer" i]')
    .evaluateAll((tags) => tags.map((m) => (m.getAttribute('content') ?? '').trim().toLowerCase()));
  const meta = metas.at(-1) ?? null;
  expect(
    [`header: ${header ?? 'none'}`, `meta: ${meta ?? 'none'}`],
    'a <meta name="referrer" content="no-referrer"> in the document, or a Referrer-Policy: no-referrer header on it',
  ).toEqual(expect.arrayContaining([expect.stringMatching(/^(header|meta): no-referrer$/)]));
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
