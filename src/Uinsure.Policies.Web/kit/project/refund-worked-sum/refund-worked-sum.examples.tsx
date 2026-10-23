import type { JSX } from 'react';
import { RefundWorkedSum } from './RefundWorkedSum';

const note = {
  margin: '0 0 var(--space-2)',
  padding: 'var(--space-1) var(--space-2)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
  border: '1.5px dashed var(--color-text-secondary)',
  borderRadius: 'var(--radius)',
} as const;

// Observed (docs/ui/mockups/r2/ordinal-spine/wb-cancel.html and docs/ui/research/api-inventory.md A10, A11, section 7):
//  - F3-MVEOSVDQJQ quote for 2027-01-27: term 1, CANCEL-1c, daysInTerm 365, daysUsed 101, unusedDays 264, refund 445.11 on
//    an amount of 615.40; the unrounded quotient is 445.1112…;
//  - QA-F3-CLAIM, quote for T + 15: term 1, COULD-2, daysUsed 16, unusedDays 349, daysInTerm 365, refund 0.00;
//  - the renewed-policy cancel: term 1 at CANCEL-1c refunding 17.36 plus term 2 at CANCEL-1a refunding 512.66, a total of
//    530.02 (CancelRenewedPolicyTests);
//  - an unpaid term is UNPAID-TERM with 0.00.
// A value the source does not show is left out and the sum says so; nothing is filled in. The one exception is CANCEL-1b,
// which has no recorded response, and is labelled as a placeholder.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'CANCEL-1a',
    element: (
      <div>
        <p style={note}>
          Recorded: term 2 of the renewed-policy cancel, CANCEL-1a, refund 512.66. Its amount and day counts are not in the
          source, so they are left blank.
        </p>
        <RefundWorkedSum terms={[{ termNumber: 2, ruleApplied: 'CANCEL-1a', refundAmount: '512.66' }]} />
      </div>
    ),
  },
  {
    state: '1b',
    element: (
      <div>
        <p style={note}>
          Placeholder: no CANCEL-1b response is recorded in the sources. The amount is the F2 QA policy's 412.34, refunded in
          full; the day counts are left blank.
        </p>
        <RefundWorkedSum terms={[{ termNumber: 1, ruleApplied: 'CANCEL-1b', amount: '412.34', refundAmount: '412.34' }]} />
      </div>
    ),
  },
  {
    state: '1c',
    element: (
      <RefundWorkedSum
        terms={[
          {
            termNumber: 1,
            ruleApplied: 'CANCEL-1c',
            amount: '615.40',
            daysUsed: 101,
            unusedDays: 264,
            daysInTerm: 365,
            refundAmount: '445.11',
          },
        ]}
        note={
          <>
            The unrounded quotient is 445.1112…; the API wrote <span style={{ fontFamily: 'var(--font-mono)' }}>445.11</span>,
            shown here as written.
          </>
        }
      />
    ),
  },
  {
    state: 'COULD-2',
    element: (
      <div>
        <p style={note}>Recorded: policy QA-F3-CLAIM, quote for T + 15. The term's amount is not in the source.</p>
        <RefundWorkedSum
          terms={[
            { termNumber: 1, ruleApplied: 'COULD-2', daysUsed: 16, unusedDays: 349, daysInTerm: 365, refundAmount: '0.00' },
          ]}
        />
      </div>
    ),
  },
  {
    state: 'UNPAID-TERM',
    element: (
      <div>
        <p style={note}>Recorded: an unpaid term refunds 0.00 under UNPAID-TERM. Nothing else about it is in the source.</p>
        <RefundWorkedSum terms={[{ termNumber: 2, ruleApplied: 'UNPAID-TERM', refundAmount: '0.00' }]} />
      </div>
    ),
  },
  {
    state: 'several terms',
    element: (
      <div>
        <p style={note}>
          Recorded: the renewed-policy cancel, term 1 at CANCEL-1c refunding 17.36 and term 2 at CANCEL-1a refunding 512.66.
          Amounts and day counts are not in the source, so they are left blank.
        </p>
        <RefundWorkedSum
          terms={[
            { termNumber: 1, ruleApplied: 'CANCEL-1c', refundAmount: '17.36' },
            { termNumber: 2, ruleApplied: 'CANCEL-1a', refundAmount: '512.66' },
          ]}
        />
      </div>
    ),
  },
  {
    state: 'total',
    element: (
      <RefundWorkedSum
        terms={[
          {
            termNumber: 1,
            ruleApplied: 'CANCEL-1c',
            amount: '615.40',
            daysUsed: 101,
            unusedDays: 264,
            daysInTerm: 365,
            refundAmount: '445.11',
          },
        ]}
        totalRefund="445.11"
      />
    ),
  },
];
