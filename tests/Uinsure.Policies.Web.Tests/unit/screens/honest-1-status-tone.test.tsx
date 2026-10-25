// HONEST-1 · Sell and Cancel draw the header Status in the tone its value earns (bug-002 N4; bug-002/N3 review A1 R3,
// P2). SellPolicy.tsx draws every sold status as `value: 'pass'`, and CancelPolicy.tsx every read status as
// `stale ? 'warn' : 'pass'`, so a Pending sale and a Cancelled policy carry a pass tick the API never gave. The policy
// view already maps each status to a tone (PolicyView.tsx: Pending pending, Active pass, Expired warn, Cancelled
// fail); the workbench screens must share that one mapping.
// The sale is the API's own, recorded in docs/ui/fixture/api/003-… (support/sell.ts): Pending. The cancel is
// 068-… (support/cancel.tsx), its re-read answering the same policy as Cancelled.
import { cleanup, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { openCancel, policyRead, quoteAndCancel, soldPolicy, stubCancel } from './support/cancel';
import { headerField, headerStatusText } from './support/header';
import { sellThroughTheScreen, sold } from './support/sell';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The tone (kit StatusTag data-status) the live header's Status field is drawn in. */
const headerTone = (): string | null => headerField('Status')?.querySelector('[data-status]')?.getAttribute('data-status') ?? null;

test("HONEST-1 · after a recorded 201 sale of a Pending policy the sell header's Status is drawn pending, never a pass", async () => {
  expect(sold.status, 'fixture setup: the recorded sale is Pending').toBe('Pending');
  await sellThroughTheScreen();
  await waitFor(() => expect(headerStatusText(), 'setup: the Status field holds the 201 status').toContain('Pending'));
  expect(headerTone(), 'a Pending policy is not drawn as a pass tick').not.toBe('pass');
  expect(headerTone(), "Pending is drawn in the policy view's tone for it").toBe('pending');
});

test("HONEST-1 · after a 201 cancel whose re-read says Cancelled the cancel header's Status is drawn as fail, never a pass", async () => {
  const cancelledRead = new Response(JSON.stringify({ ...soldPolicy, status: 'Cancelled' }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
  stubCancel([policyRead(), cancelledRead]);
  openCancel();
  await quoteAndCancel();
  await waitFor(() => expect(headerStatusText(), 'setup: the Status field holds the re-read status').toContain('Cancelled'));
  expect(headerTone(), 'a Cancelled policy is not drawn as a pass tick').not.toBe('pass');
  expect(headerTone(), "Cancelled is drawn in the policy view's tone for it").toBe('fail');
});
