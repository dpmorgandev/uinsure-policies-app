// WB-5 · the renew screen (src/web/app/workbench/renew/RenewPolicy.tsx) sends the renewal amount exactly as typed
// when it isn't a clean number, so the API's own 400 answers it (U8 A1 I2, with the orchestrator's delegated
// ruling). It never sends an invented `null` (what JSON.stringify writes for NaN) or `0` (what Number('') is) for
// an amount nobody typed (HONEST-1's "no default").
// The policy read and the renewal's answer are the API's own, recorded in
// docs/ui/fixture/api/103-renew-5-amount-missing-400.json: 2 is the GET 200 of an auto-renewing policy, 1 the
// renewal's 400. The screen is reached at its route in the app. The stub fetch serves them by method and path, and keeps each request body as the exact text sent.
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { notFound, recordedExchange, renderAppAt } from './support/app';

const RECORDING = '103-renew-5-amount-missing-400.json';
const read = recordedExchange(RECORDING, 2);
const refused = recordedExchange(RECORDING, 1);
const policy = read.responseBody as { reference: string; amount: number };

interface Sent {
  method: string;
  url: string;
  body: string | null;
}

function serve(): Sent[] {
  const sent: Sent[] = [];
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    if (!String(input).startsWith('/api/')) return Promise.resolve(notFound());
    sent.push({ method, url: String(input), body: typeof init?.body === 'string' ? init.body : null });
    const answer = method === 'POST' ? refused : read;
    return Promise.resolve(
      new Response(JSON.stringify(answer.responseBody), {
        status: answer.status,
        headers: { 'content-type': answer.responseHeaders['content-type'] ?? 'application/json' },
      }),
    );
  });
  return sent;
}

/**
 * The amount as it went over the wire: the text after `"amount":` up to the next `,` or `}`, a JSON string read
 * back to its text. `null` and `0` come back as the text `null` and `0`, so neither equals what was typed.
 */
function amountAsSent(body: string | null): string | null {
  if (body === null) return null;
  const found = /"amount"\s*:\s*("(?:[^"\\]|\\.)*"|[^,}]*)/.exec(body);
  if (found === null) return null;
  const raw = (found[1] ?? '').trim();
  return raw.startsWith('"') ? (JSON.parse(raw) as string) : raw;
}

async function renewWithAmountTyped(typed: string): Promise<Sent> {
  const sent = serve();
  renderAppAt(`workbench/policies/${policy.reference}/renew`);
  const user = userEvent.setup();
  const amount = (await screen.findByLabelText('Renewal amount')) as HTMLInputElement;
  await waitFor(() => expect(amount.value, 'setup: the policy read has filled the amount').toBe(policy.amount.toFixed(2)));
  await user.clear(amount);
  if (typed !== '') await user.type(amount, typed);
  expect(amount.value, 'setup: the field holds what was typed').toBe(typed);
  await user.click(screen.getByRole('button', { name: 'Renew policy' }));
  let renewal: Sent | undefined;
  await waitFor(() => {
    renewal = sent.find((s) => s.method === 'POST' && s.url.endsWith('/renewals'));
    expect(renewal, 'the renewal is sent, so the API answers the amount').toBeDefined();
  });
  return renewal as Sent;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("WB-5 · an amount typed as 'abc' is sent as typed, never as null", async () => {
  const renewal = await renewWithAmountTyped('abc');
  expect(amountAsSent(renewal.body), `the renewal body ${renewal.body} carries the amount as typed`).toBe('abc');
});

test('WB-5 · a cleared amount is sent as the empty text typed, never as null or 0', async () => {
  const renewal = await renewWithAmountTyped('');
  expect(amountAsSent(renewal.body), `the renewal body ${renewal.body} carries the empty amount as typed`).toBe('');
});

// U8 review A2 R1, carried to U10: what goes as a number is decided by a decimal pattern, not Number(), which reads
// '0x10' as 16 and '1e2' as 100. Each is typed text the API must answer, so it goes as typed.
test("WB-5 · an amount typed as '0x10' is sent as typed, never as the number 16", async () => {
  const renewal = await renewWithAmountTyped('0x10');
  expect(amountAsSent(renewal.body), `the renewal body ${renewal.body} carries the amount as typed`).toBe('0x10');
});

test("WB-5 · an amount typed as '1e2' is sent as typed, never as the number 100", async () => {
  const renewal = await renewWithAmountTyped('1e2');
  expect(amountAsSent(renewal.body), `the renewal body ${renewal.body} carries the amount as typed`).toBe('1e2');
});

test("WB-5 · a decimal amount typed as '527.18' is sent as the number 527.18", async () => {
  const renewal = await renewWithAmountTyped('527.18');
  const sent = JSON.parse(renewal.body ?? '{}') as { amount?: unknown };
  expect(sent.amount, `the renewal body ${renewal.body} carries the amount as a JSON number`).toBe(527.18);
});
