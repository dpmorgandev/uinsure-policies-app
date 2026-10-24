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

// ── A3/I1: indenting changes whitespace only; every token is shown as it went ─────────────────────────────────────
// The API writes every money amount with at least two places (803.40, 500.00, 0.00). A body sent through JSON.parse
// and JSON.stringify comes back as 803.4, 500 and 0, which is not the exchange. The expected text here is the wire
// text itself, hand-written, never a value rebuilt from parsed JSON (the recordings in docs/ui/fixture/api/ are
// stored parsed and have lost these tokens).

/** The raw request text, compact, with a money token a JS number would rewrite. */
const RAW_REQUEST = '{"reference":"N2U-TOK","amount":803.40,"paymentMethod":"Card"}';
/** The raw response text, compact, as the API writes it: amounts with two places, nested objects and arrays. */
const RAW_RESPONSE =
  '{"reference":"N2U-TOK","amount":803.40,"terms":[{"termNumber":1,"amount":803.40}],' +
  '"payments":[{"type":"Card","amount":500.00}],"refunds":[{"amount":0.00}],"hasClaims":false,"cancellation":null}';

/** The text with every whitespace character outside a JSON string removed: indenting may change nothing else. */
function withoutLayout(text: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i] as string;
    if (inString) {
      out += c;
      if (c === '\\') {
        out += text[i + 1] ?? '';
        i += 1;
      } else if (c === '"') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (!/\s/.test(c)) out += c;
  }
  return out;
}

/** How many times `token` stands whole in `text`: no digit or point before it, no digit after. */
function wholeTokens(text: string, token: string): number {
  const pattern = new RegExp(`(?<![\\d.])${token.replace('.', '\\.')}(?!\\d)`, 'g');
  return [...text.matchAll(pattern)].length;
}

test('WB-7 · the drawer shows every number token of the request and response as it went (803.40, 500.00, 0.00), changing whitespace only', async () => {
  vi.stubGlobal('fetch', async () => new Response(RAW_RESPONSE, { status: 201, headers: { 'content-type': 'application/json; charset=utf-8' } }));
  const user = userEvent.setup();
  render(
    <>
      <Probe />
      <RequestsDrawer />
    </>,
  );
  await act(async () => {
    await browserDeps().fetch('/api/policies/N2U-TOK/claims', { method: 'POST', headers: { 'content-type': 'application/json' }, body: RAW_REQUEST });
  });
  const drawer = screen.getByRole('complementary', { name: 'The requests as sent' });
  const show = within(drawer).queryByRole('button', { name: 'Show requests' });
  if (show !== null) await user.click(show);

  const sent = log.find((e) => e.path === '/api/policies/N2U-TOK/claims');
  expect(sent?.requestBody, 'setup: the log holds the request text as sent').toBe(RAW_REQUEST);
  expect(sent?.responseBody, 'setup: the log holds the response text as received').toBe(RAW_RESPONSE);

  const shown = exchangeText('/api/policies/N2U-TOK/claims');
  expect(wholeTokens(shown, '803.40'), 'every 803.40 (one in the request, two in the response) is shown whole').toBe(3);
  expect(wholeTokens(shown, '500.00'), 'the payment 500.00 is shown whole').toBe(1);
  expect(wholeTokens(shown, '0.00'), 'the refund 0.00 is shown whole').toBe(1);
  expect(shown, 'no amount is shortened to 803.4').not.toMatch(/(?<![\d.])803\.4(?=[,}\]\s]|$)/m);
  expect(shown, 'no amount is shortened to 500').not.toMatch(/(?<![\d.])500(?=[,}\]\s]|$)/m);
  expect(withoutLayout(shown), 'the request is the wire text with whitespace added, nothing else').toContain(RAW_REQUEST);
  expect(withoutLayout(shown), 'the response is the wire text with whitespace added, nothing else').toContain(RAW_RESPONSE);
  expect(shown, 'the request is still indented, one key a line').toMatch(/^[ \t]+"paymentMethod"\s*:/m);
  expect(shown, 'the response is still indented, one key a line').toMatch(/^[ \t]+"payments"\s*:/m);
});
