// The cancel screen (src/Uinsure.Policies.Web/app/workbench/cancel/CancelPolicy.tsx) in jsdom, on the API's own answers
// recorded in docs/ui/fixture/api/068-could-1-quote-then-cancel-for-the-same-date-agree-201.json: exchange 0 the sale
// (its 201 body is the policy, read back as the GET 200 the screen asks for), 1 the quote, 2 the 201 cancel.
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { notFound, recordedExchange, renderAppAt } from './app';

const RECORDING = '068-could-1-quote-then-cancel-for-the-same-date-agree-201.json';
export const soldPolicy = recordedExchange(RECORDING, 0).responseBody as { reference: string; status: string };
export const quoted = recordedExchange(RECORDING, 1);
export const cancelled = recordedExchange(RECORDING, 2);
export const quotedDate = (quoted.responseBody as { cancellationDate: string }).cancellationDate;

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

/**
 * The stub network. The policy read answers `reads[n]` for its nth call (the last one repeats): a Response, or 'reject'
 * for a fetch that never reaches the API.
 */
export function stubCancel(reads: (Response | 'reject')[]): void {
  let n = 0;
  const base = `/api/policies/${soldPolicy.reference}`;
  vi.stubGlobal('fetch', async (input: string) => {
    const path = String(input);
    if (path === base) {
      const answer = reads[Math.min(n, reads.length - 1)];
      n += 1;
      if (answer === 'reject' || answer === undefined) throw new TypeError('Failed to fetch');
      return answer.clone();
    }
    if (path.startsWith(`${base}/cancellation-quote`)) return json(quoted.responseBody, quoted.status);
    if (path === `${base}/cancellation`) return json(cancelled.responseBody, cancelled.status);
    return notFound();
  });
}

/** The policy read the API gives for the sold policy: 200 and the policy. */
export const policyRead = (): Response => json(soldPolicy, 200);

/** A policy read the API refuses: a 503 problem. */
export const policyReadRefused = (): Response =>
  new Response(JSON.stringify({ status: 503, title: 'Service Unavailable' }), { status: 503, headers: { 'content-type': 'application/problem+json' } });

/** Opens the cancel screen for the sold policy. */
export function openCancel(): void {
  renderAppAt(`workbench/policies/${soldPolicy.reference}/cancel`);
}

/** Quotes the recorded date, cancels on it and confirms; resolves once the 201 is drawn. */
export async function quoteAndCancel(): Promise<void> {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Cancellation date'), quotedDate);
  await user.click(screen.getByRole('button', { name: 'Quote this date' }));
  await user.click(await screen.findByRole('button', { name: `Cancel on ${quotedDate}` }));
  await user.click(await screen.findByRole('button', { name: `Cancel policy on ${quotedDate}` }));
  await screen.findByText(new RegExp(`Cancelled on ${quotedDate}\\. The API answered ${cancelled.status}`));
}
