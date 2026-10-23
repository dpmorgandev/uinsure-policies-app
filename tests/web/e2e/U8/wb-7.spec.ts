// U8 · W3's carries under WB-7 (D1; W3 review A2 R5, A4 R2, R4, R5). On recorded answers (docs/ui/fixture/api/),
// served through page.route, and on requests the test holds in flight: each is about what the page draws from its
// own request log, not about the API.
//
// - The policy view's requests region matches the policy reference on a path-segment boundary: ABC never lists
//   ABC-2's requests (HONEST-1).
// - A request still in flight is drawn as pending, never as status 0, in the request log's table and in the policy
//   view's requests region (HONEST-1).
// - The request log's one-exchange region draws the kit HttpExchange's curl part, "Repeat it", as the wb-requests
//   reference does (docs/ui/derived/U8/wb-requests/populated.html).
import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { live } from '../W1/support/api';
import { exchangeAt } from '../W1/support/recorded';
import { hold, region, route } from '../W1/support/workbench';
import type { Policy } from '../W1/support/workbench';
import { requestsStates } from '../W3/support/states';

const READ_BACK = exchangeAt('045-get-1-sold-policy-reads-back-in-full-200.json', 1);
const REQUESTS = 'requests-that-touched-this-policy';
const requestsRoute = '/#/workbench/requests';

/** GET /api/policies/<reference> answered 200 with the recorded read-back, under this reference. */
async function readAnswers(page: Page, reference: string): Promise<void> {
  const body: Policy = { ...(READ_BACK.responseBody as Policy), reference };
  await page.route(
    (url) => url.pathname === `/api/policies/${reference}`,
    (handled) =>
      handled.request().method() === 'GET'
        ? handled.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) })
        : handled.fallback(),
  );
}

/** The paths in a kit RequestLog's rows (its third column), as drawn. */
async function loggedPaths(scope: Locator): Promise<string[]> {
  return scope.locator('tbody tr').evaluateAll((rows) => rows.map((row) => (row.querySelectorAll('td')[1]?.textContent ?? '').trim()));
}

/** The status cell (fourth column) of the RequestLog row for this path. */
const statusOf = (scope: Locator, path: string): Locator =>
  scope.locator('tbody tr').filter({ has: scope.page().locator('td', { hasText: new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) }).locator('td').nth(2);

test("WB-7 · the policy view's requests region for ABC never lists the requests of ABC-2, a policy whose reference it prefixes", async ({ page }) => {
  await readAnswers(page, 'U8ABC-2');
  await readAnswers(page, 'U8ABC');
  const longer = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/policies/U8ABC-2');
  await page.goto(route.policy('U8ABC-2'));
  await longer;
  await expect(page.getByRole('main'), 'setup: U8ABC-2 has been read').toContainText('The API returned no claims for U8ABC-2.', live);
  await page.goto(route.policy('U8ABC'));
  await expect(page.getByRole('main'), 'setup: U8ABC has been read').toContainText('The API returned no claims for U8ABC.', live);
  const requests = region(page, REQUESTS);
  await expect.poll(() => loggedPaths(requests), { message: "the region lists U8ABC's own read, and not U8ABC-2's" }).toEqual(['/policies/U8ABC']);
});

test('WB-7 · the request log table shows a request still waiting for its answer as pending, never as status 0', async ({ page }) => {
  const reference = (READ_BACK.responseBody as Policy).reference;
  const read = await hold(page, 'GET', `/api/policies/${reference}`);
  await page.goto(route.policy(reference));
  await expect.poll(() => read.count(), { message: 'setup: the page asks for the policy', ...live }).toBeGreaterThan(0);
  await page.goto(requestsRoute);
  const log = region(page, 'request-log');
  const status = statusOf(log, `/policies/${reference}`);
  await expect(status, 'setup: the log lists the read in flight').toHaveCount(1, live);
  await expect(status, 'the read in flight is drawn as pending').toHaveText(/pending/i);
  await expect(status, 'and never as status 0').not.toHaveText(/^\s*0\s*$/);
});

test("WB-7 · the policy view's requests region shows its read still waiting for an answer as pending, never as status 0", async ({ page }) => {
  const reference = (READ_BACK.responseBody as Policy).reference;
  const read = await hold(page, 'GET', `/api/policies/${reference}`);
  await page.goto(route.policy(reference));
  await expect.poll(() => read.count(), { message: 'setup: the page asks for the policy', ...live }).toBeGreaterThan(0);
  const status = statusOf(region(page, REQUESTS), `/policies/${reference}`);
  await expect(status, 'setup: the region lists the read in flight').toHaveCount(1, live);
  await expect(status, 'the read in flight is drawn as pending').toHaveText(/pending/i);
  await expect(status, 'and never as status 0').not.toHaveText(/^\s*0\s*$/);
});

test("WB-7 · the request log's one-exchange region draws the kit HttpExchange curl part, Repeat it, for the exchange it shows", async ({ page }) => {
  // One recorded policy read in the log (W3's populated state): the one exchange shown is that GET.
  await requestsStates.populated.open(page);
  const one = region(page, 'one-exchange-request-response-status-line-curl');
  await expect(one, 'setup: an exchange is shown').toContainText(READ_BACK.path, live);
  await expect(one.locator('[class*="kit-http-exchange__partTitle"]').filter({ hasText: /^Repeat it$/ }), 'the curl part, headed Repeat it').toHaveCount(1);
  const curl = one.getByRole('group', { name: /^curl for request #\d+$/ });
  await expect(curl, 'the curl code block, named for its request').toHaveCount(1);
  await expect(curl.locator('code')).toHaveText(new RegExp(`^curl -X GET '[^']*${READ_BACK.path}'$`));
  await expect(curl.getByRole('button', { name: 'Copy curl' })).toHaveCount(1);
});
