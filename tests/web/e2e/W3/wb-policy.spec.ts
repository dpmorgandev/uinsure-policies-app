// Parity for the wb-policy regions W3 builds, against W3's reference (docs/ui/derived/W3/wb-policy/), in each state
// W1's flows reach: the actions region under WB-5 (round A3, I2) and requests-that-touched-this-policy under WB-7
// (round A3, I3). W1's own parity leaves both to this suite once they are in transit (W1/support/parity.ts). The
// expected values are written out, and each test first checks they are still the reference's.
import { expect, test } from '@playwright/test';
import { regionNamed } from '../W1/support/reference';
import { openAgainstReference, policyStates } from './support/states';

/** docs/ui/derived/W3/wb-policy/{populated,api-error,api-unreachable}.html: the nine regions, in order. */
const NINE = [
  'status-and-current-term',
  'terms-timeline-terms-payments-claims-cancellation-dates-the-api-returned-only',
  'policyholders-and-property',
  'payments-and-refunds',
  'claims',
  'cancellation-summary-from-get-per-term-breakdown-from-the-logged-cancel-response',
  'record-level-problem-banner-404-409',
  'actions-quote-and-cancel-record-a-claim-renew',
  'requests-that-touched-this-policy',
];
const ACTIONS = 'actions-quote-and-cancel-record-a-claim-renew';

for (const s of Object.values(policyStates)) {
  test(`WB-5 · parity: wb-policy ${s.state} has exactly its reference's nine regions, in order, and none of its own`, async ({ page }) => {
    const { reference, read } = await openAgainstReference(page, s);
    expect(reference.regions.map((r) => r.slug), 'the W3 reference still has these nine regions').toEqual(NINE);
    await expect.poll(async () => (await read()).regions.map((r) => r.slug)).toEqual(NINE);
  });

  test(`WB-5 · parity: wb-policy ${s.state}'s actions region carries the reference's data-req, WB-4 WB-5`, async ({ page }) => {
    const { reference, read } = await openAgainstReference(page, s);
    expect(regionNamed(reference, ACTIONS)?.req, 'the W3 reference tags the actions region WB-4 WB-5').toEqual(['WB-4', 'WB-5']);
    await expect.poll(async () => regionNamed(await read(), ACTIONS)?.req ?? null).toEqual(['WB-4', 'WB-5']);
  });
}
