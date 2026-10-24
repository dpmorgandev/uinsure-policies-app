// WB-1 · the sell screen's header Status (bug-002 N3; inv-009 I9): SellPolicy passes no `status` to PageHeader, so the
// kit draws its default gap, "not in this screen's data", before and after every send, while the 201 holds
// Policy.status. The sale is the API's own (support/sell.ts).
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { renderAppAt } from './support/app';
import { headerStatusText } from './support/header';
import { sellThroughTheScreen, sold, stubTheSale } from './support/sell';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("WB-1 · before any answer the sell header's Status says nothing has been sold yet, never \"not in this screen's data\"", async () => {
  stubTheSale();
  renderAppAt('workbench/sell');
  await screen.findByRole('button', { name: 'Sell this policy' });
  const status = headerStatusText();
  expect(status, 'setup: the sell header draws its Status field').not.toBeNull();
  expect(status, "the Status gap is not the kit's default label").not.toContain("not in this screen's data");
  expect(status, 'the Status says no sale has been made yet').toMatch(/nothing (has been )?sold yet/i);
});

test("WB-1 · after a recorded 201 the sell header's Status reads the status the API returned", async () => {
  await sellThroughTheScreen();
  await waitFor(() => expect(headerStatusText(), "the Status field holds the 201's Policy.status").toContain(sold.status));
  expect(headerStatusText()).not.toContain("not in this screen's data");
});
