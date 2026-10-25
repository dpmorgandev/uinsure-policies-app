// HONEST-1 · moving from one policy's cancel route straight to another's starts the cancel screen afresh (bug-002 N4;
// pre-existing on main, found in bug-002/N3 QA step 12). The route table renders one <CancelPolicy /> for
// workbench/policies/:reference/cancel, so a change of :reference keeps the element and every useState in it: the
// first policy's quote, its cancel's answer and any stale mark are drawn under the second policy's reference.
// The first policy, its quote and its cancel are the API's own, recorded in docs/ui/fixture/api/068-… (support/cancel.tsx);
// the second is the same recorded policy under another reference, read as Active.
import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { notFound } from './support/app';
import { cancelled, openCancel, quoteAndCancel, quoted, quotedDate, soldPolicy } from './support/cancel';
import { headerStatusText } from './support/header';

const OTHER = 'N4U-OTHER';

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

/** The first policy reads as sold, then Cancelled after its cancel; the second always reads Active. */
function stubTwoPolicies(): void {
  let firstReads = 0;
  const first = `/api/policies/${soldPolicy.reference}`;
  vi.stubGlobal('fetch', async (input: string) => {
    const path = String(input);
    if (path === first) {
      firstReads += 1;
      return json(firstReads === 1 ? soldPolicy : { ...soldPolicy, status: 'Cancelled' }, 200);
    }
    if (path.startsWith(`${first}/cancellation-quote`)) return json(quoted.responseBody, quoted.status);
    if (path === `${first}/cancellation`) return json(cancelled.responseBody, cancelled.status);
    if (path === `/api/policies/${OTHER}`) return json({ ...soldPolicy, reference: OTHER, status: 'Active' }, 200);
    return notFound();
  });
}

const mainText = (): string => screen.getByRole('main').textContent?.replace(/\s+/g, ' ') ?? '';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("HONEST-1 · going from one policy's cancel route straight to another's carries no quote, cancel, answer or stale mark across", async () => {
  stubTwoPolicies();
  openCancel();
  await quoteAndCancel();
  expect(mainText(), "setup: the first policy's cancel is drawn").toMatch(new RegExp(`Cancelled on ${quotedDate}`));

  await act(async () => {
    window.location.hash = `#/workbench/policies/${OTHER}/cancel`;
  });
  await waitFor(() => expect(headerStatusText(), "setup: the header holds the second policy's status").toContain('Active'));

  expect(mainText(), "no answer of the first policy's cancel is carried").not.toMatch(/Cancelled on/);
  expect(mainText(), 'no quote of the first policy is carried').not.toMatch(/Quote returned/);
  expect(screen.queryAllByRole('button', { name: /^Cancel on / }), "no cancel on the first policy's quoted date is offered").toEqual([]);
  expect((screen.getByLabelText('Cancellation date') as HTMLInputElement).value, "the first policy's date is not carried").toBe('');
  expect(mainText(), 'no stale mark is carried').not.toMatch(/read before the cancel/i);
});
