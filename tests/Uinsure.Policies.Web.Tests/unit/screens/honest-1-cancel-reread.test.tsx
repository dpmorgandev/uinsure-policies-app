// HONEST-1 · after a 201 cancel the cancel screen reads the policy again (WB-4), and keeps the old read when that re-read
// fails (CancelPolicy.tsx: `if (again.kind === 'ok') setPolicy(...)`): the header goes on showing the status from before
// the cancel as if it were current (bug-002 N3; inv-009 I24, U7 review A1 R2). The header must mark it as read before
// the cancel, whether the re-read is refused (a 503) or never reaches the API.
// The policy, the quote and the cancel are the API's own, recorded in docs/ui/fixture/api/068-… (support/cancel.tsx).
import { cleanup, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { openCancel, policyRead, policyReadRefused, quoteAndCancel, soldPolicy, stubCancel } from './support/cancel';
import { headerField } from './support/header';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The live header's text, whitespace folded. */
const headerText = (): string => document.querySelector('header[data-mode="live"]')?.textContent?.replace(/\s+/g, ' ') ?? '';

/**
 * Every live header field (each dd, whatever its dt) that shows the status the first read gave without the mark. The kit's
 * Status field is not the only one that can carry it: the screen's own 'Policy status' id does too (bug-002 N3 A1 I1).
 */
const unmarkedStatusFields = (): string[] =>
  [...document.querySelectorAll('header[data-mode="live"] dl > div')]
    .map((field) => ({
      label: field.querySelector('dt')?.textContent?.trim() ?? '',
      value: field.querySelector('dd')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    }))
    .filter(({ value }) => value.includes(soldPolicy.status) && !/read before the cancel/i.test(value))
    .map(({ label, value }) => `${label}: ${value}`);

test('HONEST-1 · when the re-read after a 201 cancel is refused, the header marks the policy status as read before the cancel', async () => {
  stubCancel([policyRead(), policyReadRefused()]);
  openCancel();
  await quoteAndCancel();
  await waitFor(() => expect(headerText(), 'the header says the status shown was read before the cancel').toMatch(/read before the cancel/i));
  expect(headerField('Status')?.textContent ?? '', 'the Status field is the one marked').toMatch(/read before the cancel/i);
  expect(headerField('Status')?.textContent ?? '', 'the marked status is the one the first read gave').toContain(soldPolicy.status);
  expect(unmarkedStatusFields(), 'no header field shows the status from before the cancel without the mark').toEqual([]);
});

test('HONEST-1 · when the re-read after a 201 cancel never reaches the API, the header marks the policy status as read before the cancel', async () => {
  stubCancel([policyRead(), 'reject']);
  openCancel();
  await quoteAndCancel();
  await waitFor(() => expect(headerText(), 'the header says the status shown was read before the cancel').toMatch(/read before the cancel/i));
  expect(headerField('Status')?.textContent ?? '', 'the Status field is the one marked').toMatch(/read before the cancel/i);
  expect(headerField('Status')?.textContent ?? '', 'the marked status is the one the first read gave').toContain(soldPolicy.status);
  expect(unmarkedStatusFields(), 'no header field shows the status from before the cancel without the mark').toEqual([]);
});
