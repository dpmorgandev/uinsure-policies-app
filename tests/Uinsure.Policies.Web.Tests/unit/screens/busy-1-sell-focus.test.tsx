// BUSY-1 · on a 201 the sell screen's outcome reaches the user where they are (bug-002 N3; inv-009 I10): the answer is
// drawn in the header above the form while the Send button is at its foot, and focus never moves to it, since only the
// error outcomes pass a focusKey (David 2026-10-23: focus, not a redirect). The sale is the API's own (support/sell.ts).
import { cleanup, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { sale, sellThroughTheScreen, sold } from './support/sell';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('BUSY-1 · on a recorded 201, focus moves from Sell this policy to the answer stating the 201 and the stored reference', async () => {
  const send = await sellThroughTheScreen();
  await waitFor(() => expect(document.activeElement, 'focus has left the Send button').not.toBe(send));
  const focused = document.activeElement as HTMLElement;
  expect(focused, 'focus is on an element of the page, not the body').not.toBe(document.body);
  expect(focused.textContent ?? '', 'the focused answer states the 201').toContain(String(sale.status));
  expect(focused.textContent ?? '', 'the focused answer names the stored reference').toContain(sold.reference);
});
