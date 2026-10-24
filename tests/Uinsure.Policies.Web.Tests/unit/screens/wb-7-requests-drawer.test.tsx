// WB-7 · the requests drawer (src/Uinsure.Policies.Web/app/workbench/RequestsDrawer.tsx) shows the exchange the page
// just sent, as it went (bug-002 N2; inv-009 I12, I13):
// - after a send, the latest request and response are shown with no further click: main's drawer starts closed on
//   every mount and nothing opens it, so the request as sent is always behind "Show requests" (I12);
// - a JSON request or response body is indented for reading, one key a line; a body that isn't JSON is shown as
//   received; the log keeps the exact wire text (I13: api.ts sends compact JSON, and the drawer printed it on one
//   line).
// The exchanges are the API's own, recorded in docs/ui/fixture/api/070-could-2-claim-dated-today-201.json (exchange 1,
// the POST claim answered 201), sent through the page's own logging fetch (browserDeps) to a stub fetch.
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestsDrawer } from '../../../../src/Uinsure.Policies.Web/app/workbench/RequestsDrawer';
import { browserDeps, useRequestLog } from '../../../../src/Uinsure.Policies.Web/app/workbench/browser';
import type { LoggedExchange } from '../../../../src/Uinsure.Policies.Web/app/data/api';
import { recordedExchange } from './support/app';

const claim = recordedExchange('070-could-2-claim-dated-today-201.json', 1);
const NOT_JSON = '<html><body><h1>502 Bad Gateway</h1>{ not: json }</body></html>';

let log: readonly LoggedExchange[] = [];
function Probe() {
  log = useRequestLog();
  return null;
}

/** The stub network: the recorded claim answer for a claims POST, a proxy's HTML page for anything else. */
function stubNetwork(): void {
  vi.stubGlobal('fetch', async (input: string) =>
    String(input).endsWith('/claims')
      ? new Response(JSON.stringify(claim.responseBody), { status: claim.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
      : new Response(NOT_JSON, { status: 502, headers: { 'content-type': 'text/html' } }),
  );
}

/** Sends the recorded claim through the page's logging fetch, its body compact as the client sends it. */
async function sendClaim(path: string): Promise<string> {
  const body = JSON.stringify(claim.requestBody);
  await act(async () => {
    await browserDeps().fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  });
  return body;
}

/** The drawer's request-and-response text for the item whose request line names this path. */
function exchangeText(path: string): string {
  const drawer = screen.getByRole('complementary', { name: 'The requests as sent' });
  const item = within(drawer)
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes(path.replace(/^\/api/, '')));
  expect(item, `the drawer lists ${path}`).toBeDefined();
  return (item as HTMLElement).querySelector('pre')?.textContent ?? '';
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('WB-7 · after the page sends, the requests drawer shows the latest request and response with no click', async () => {
  stubNetwork();
  render(<RequestsDrawer />);
  await sendClaim('/api/policies/N2U-OPEN/claims');
  const drawer = screen.getByRole('complementary', { name: 'The requests as sent' });
  await waitFor(() => expect(within(drawer).getByRole('button', { name: 'Hide requests' }), 'the drawer is open').toBeDefined());
  const latest = within(drawer).getByRole('region', { name: /^Request #\d+, request and response$/ });
  expect(latest.closest('[hidden]'), "the latest exchange's request and response are not hidden").toBeNull();
  expect(latest.textContent).toContain((claim.responseBody as { reference: string }).reference);
});

test('WB-7 · the drawer indents JSON request and response bodies, shows a non-JSON body as received, and the log keeps the exact wire text', async () => {
  stubNetwork();
  const user = userEvent.setup();
  render(
    <>
      <Probe />
      <RequestsDrawer />
    </>,
  );
  const wire = await sendClaim('/api/policies/N2U-JSON/claims');
  await act(async () => {
    await browserDeps().fetch('/api/policies/N2U-HTML');
  });
  const drawer = screen.getByRole('complementary', { name: 'The requests as sent' });
  const show = within(drawer).queryByRole('button', { name: 'Show requests' });
  if (show !== null) await user.click(show);

  const json = exchangeText('/api/policies/N2U-JSON/claims');
  expect(json, 'the request body is not printed on one line').not.toContain(wire);
  for (const key of Object.keys(claim.requestBody as Record<string, unknown>)) {
    expect(json, `the request's ${key} starts its own indented line`).toMatch(new RegExp(`^[ \\t]+"?${key}"?\\s*:`, 'm'));
  }
  expect(json, 'the response body is not printed on one line').not.toContain(JSON.stringify(claim.responseBody));
  for (const key of Object.keys(claim.responseBody as Record<string, unknown>)) {
    expect(json, `the response's ${key} starts its own indented line`).toMatch(new RegExp(`^[ \\t]+"?${key}"?\\s*:`, 'm'));
  }

  expect(exchangeText('/api/policies/N2U-HTML'), 'a body that is not JSON is shown exactly as received').toContain(NOT_JSON);

  const sent = log.find((e) => e.path === '/api/policies/N2U-JSON/claims');
  expect(sent?.requestBody, 'the log keeps the request exactly as sent').toBe(wire);
  expect(sent?.responseBody, 'the log keeps the response exactly as received').toBe(JSON.stringify(claim.responseBody));
  expect(log.find((e) => e.path === '/api/policies/N2U-HTML')?.responseBody).toBe(NOT_JSON);
});
