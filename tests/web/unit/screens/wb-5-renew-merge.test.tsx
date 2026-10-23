// WB-5 · the renew screen (src/web/app/workbench/renew/RenewPolicy.tsx) never merges the term's amount into an amount
// the person is typing (W3 A4 I6, U8 A1 I2, carried to U10). The two texts joined as '527.18544.10' when the policy
// read landed after the person had gone to the field but before their first keystroke: the default was written into
// the field they were on, and what they typed was added to it. Here the person is on the field before the read
// answers, the read lands, then they type: the field holds exactly what they typed.
// The policy read is the API's own, recorded in docs/ui/fixture/api/103-renew-5-amount-missing-400.json (exchange 2,
// the GET 200 of an auto-renewing policy). The stub fetch holds it until the test lets it go.
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { notFound, recordedExchange, renderAppAt } from './support/app';

const read = recordedExchange('103-renew-5-amount-missing-400.json', 2);
const policy = read.responseBody as { reference: string; amount: number; currentTermNumber: number };

/** Serves the policy read once `release` is called; anything that isn't the API is the frame's trace.json read. */
function holdTheRead(): () => void {
  let release: () => void = () => undefined;
  const released = new Promise<void>((done) => {
    release = done;
  });
  vi.stubGlobal('fetch', async (input: string) => {
    if (!String(input).startsWith('/api/')) return notFound();
    await released;
    return new Response(JSON.stringify(read.responseBody), {
      status: read.status,
      headers: { 'content-type': read.responseHeaders['content-type'] ?? 'application/json' },
    });
  });
  return release;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("WB-5 · a person on the amount field when the policy read lands keeps exactly what they type, never the term's amount joined to it", async () => {
  const release = holdTheRead();
  renderAppAt(`workbench/policies/${policy.reference}/renew`);
  const user = userEvent.setup();
  const amount = (await screen.findByLabelText('Renewal amount')) as HTMLInputElement;
  await user.click(amount);
  release();
  await screen.findByText(new RegExp(`Term ${policy.currentTermNumber} is ${policy.amount.toFixed(2).replace('.', '\\.')}`));
  await user.keyboard('527.18');
  await waitFor(() => expect(amount.value, 'the field holds what the person typed, and only that').toBe('527.18'));
});
