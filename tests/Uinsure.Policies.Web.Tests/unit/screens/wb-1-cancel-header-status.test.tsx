// WB-1 · the cancel screen's header Status (bug-002 N3; inv-009 I9): CancelPolicy passes no `status` to PageHeader, so
// the header's Status field reads "not returned" while the policy read the screen holds says what the status is.
// The policy is the API's own, recorded in docs/ui/fixture/api/068-… (see support/cancel.tsx).
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { openCancel, policyRead, soldPolicy, stubCancel } from './support/cancel';
import { headerStatusText } from './support/header';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("WB-1 · the cancel header's Status reads the policy status the API holds once the policy is read", async () => {
  stubCancel([policyRead()]);
  openCancel();
  await screen.findByLabelText('Cancellation date');
  await waitFor(() => expect(headerStatusText(), "the Status field holds the policy read's status").toContain(soldPolicy.status));
  expect(headerStatusText(), 'the Status is not drawn as missing').not.toContain('not returned');
});
