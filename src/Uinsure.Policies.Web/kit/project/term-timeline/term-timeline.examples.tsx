import type { JSX } from 'react';
import { TermTimeline } from './TermTimeline';
import type { TimelineTerm } from './TermTimeline';

const note = {
  margin: '0 0 var(--space-2)',
  padding: 'var(--space-1) var(--space-2)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
  border: '1.5px dashed var(--color-text-secondary)',
  borderRadius: 'var(--radius)',
} as const;

// Observed (docs/ui/research/api-inventory.md A1, A2, A5, A7, A8, A10, A11 and the F2 and F3 QA records):
//  - a BuyToLet policy whose term 1 runs 2026-11-18 to 2027-11-17 at 412.34, linked to one Card payment (F2 QA step 1;
//    the payment's reference is not recorded there, so none is given);
//  - policy F3-MVEOSVDQJQ: term 1 at 615.40, paid by DirectDebit, payment PAY-7f24722e…, cancelled for 2027-01-27 under
//    CANCEL-1c with a total refund of 445.11 (daysUsed 101, daysInTerm 365);
//  - claim CLM-F3-MVEOT2HAYB-1, claimDate 2026-10-19, "Escape of water from the boiler" (F3 QA).
// Placeholder, and labelled as such in each example that uses it: term dates the sources do not print, and the second
// term's amount.
const recorded: TimelineTerm = {
  termNumber: 1,
  startDate: '2026-11-18',
  endDate: '2027-11-17',
  amount: '412.34',
  payment: { type: 'Card', amount: '412.34' },
};

// RENEW-4: a renewal starts the day after the latest end and runs a year less a day.
const renewed: TimelineTerm = {
  termNumber: 2,
  startDate: '2027-11-18',
  endDate: '2028-11-17',
  amount: '500.00',
  payment: { type: 'Card', amount: '500.00' },
};

const cancelledTerm: TimelineTerm = {
  termNumber: 1,
  startDate: '2026-10-19',
  endDate: '2027-10-18',
  amount: '615.40',
  payment: { type: 'DirectDebit', reference: 'PAY-7f24722e…', amount: '615.40' },
};

const claimedTerm: TimelineTerm = {
  termNumber: 1,
  startDate: '2026-10-19',
  endDate: '2027-10-18',
  amount: '500.00',
  payment: { type: 'Card', amount: '500.00' },
};

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'one term',
    element: (
      <div>
        <p style={note}>Recorded: the F2 QA policy, one term, one Card payment. No payment reference is in the source.</p>
        <TermTimeline terms={[recorded]} />
      </div>
    ),
  },
  {
    state: 'several',
    element: (
      <div>
        <p style={note}>
          Placeholder: term 2's amount (500.00) and its Card payment are not in the sources. Its dates follow RENEW-4 from the
          recorded term 1.
        </p>
        <TermTimeline terms={[recorded, renewed]} />
      </div>
    ),
  },
  {
    state: 'unpaid term',
    element: (
      <div>
        <p style={note}>
          Placeholder: term 2's amount (500.00) is not in the sources. That a renewal can be unpaid (paymentReference null) is
          (RENEW-3b).
        </p>
        <TermTimeline terms={[recorded, { ...renewed, payment: null }]} />
      </div>
    ),
  },
  {
    state: 'cancelled (gap after the date)',
    element: (
      <div>
        <p style={note}>
          Placeholder: term 1's dates are worked back from daysUsed 101 and daysInTerm 365 in the recorded quote; the sources do
          not print them. The amount, payment, cancellation date, rule and refund are recorded.
        </p>
        <TermTimeline
          policyReference="F3-MVEOSVDQJQ"
          terms={[cancelledTerm]}
          cancellation={{ cancellationDate: '2027-01-27', ruleApplied: 'CANCEL-1c', totalRefund: '445.11' }}
        />
      </div>
    ),
  },
  {
    state: 'with claims',
    element: (
      <div>
        <p style={note}>
          Placeholder: the term's dates (taken to begin on the claim date) and its amount (500.00) are not in the sources. The
          claim is recorded.
        </p>
        <TermTimeline
          policyReference="F3-MVEOT2HAYB"
          terms={[claimedTerm]}
          claims={[
            {
              reference: 'CLM-F3-MVEOT2HAYB-1',
              claimDate: '2026-10-19',
              description: 'Escape of water from the boiler',
            },
          ]}
        />
      </div>
    ),
  },
];
