// HONEST-1 · the renew screen (src/Uinsure.Policies.Web/app/workbench/renew/RenewPolicy.tsx) doesn't claim a default it doesn't
// have (U8 A1 I5): when the read names no payment for the current term, the payment method's hint doesn't say
// "Defaults from term", and the Select shows its placeholder.
// The policy is the API's own GET 200, recorded in docs/ui/fixture/api/103-renew-5-amount-missing-400.json (an
// auto-renewing policy), with its payments emptied so the term's paymentReference matches none. The screen is
// reached at its route in the app.
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { notFound, recordedExchange, renderAppAt } from './support/app';

const read = recordedExchange('103-renew-5-amount-missing-400.json', 2);
const recorded = read.responseBody as { reference: string; autoRenew: boolean; payments: unknown[] };
const noPayment = { ...recorded, payments: [] };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("HONEST-1 · with no payment for the term, the payment method hint doesn't claim 'Defaults from term'", async () => {
  expect(recorded.autoRenew, 'setup: the recorded policy auto-renews, so the payment method field shows').toBe(true);
  vi.stubGlobal('fetch', (input: string) =>
    Promise.resolve(
      String(input).startsWith('/api/')
        ? new Response(JSON.stringify(noPayment), { status: 200, headers: { 'content-type': 'application/json' } })
        : notFound(),
    ),
  );
  renderAppAt(`workbench/policies/${recorded.reference}/renew`);

  const method = (await screen.findByLabelText('Payment method')) as HTMLSelectElement;
  await waitFor(() => expect(method.value, 'setup: the Select shows its placeholder, no method chosen').toBe(''));
  const describedBy = (method.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
  const description = describedBy.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
  expect(description, "the payment method's hint names no default the read didn't give").not.toMatch(/Defaults from term/);
  expect(document.body.textContent, 'nothing on the screen claims a default from the term').not.toMatch(/Defaults from term/);
});
