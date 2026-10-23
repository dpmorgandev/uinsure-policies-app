import type { JSX } from 'react';
import { QuoteCancelCompare } from './QuoteCancelCompare';
import type { CompareRow } from './QuoteCancelCompare';

const note = {
  margin: '0 0 var(--space-2)',
  padding: 'var(--space-1) var(--space-2)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
  border: '1.5px dashed var(--color-text-secondary)',
  borderRadius: 'var(--radius)',
} as const;

// Observed (docs/ui/mockups/r2/ordinal-spine/wb-cancel.html, recorded F3 QA step 10, policy F3-MVEOSVDQJQ): the quote for
// 2027-01-27 and the cancel for the same date returned the same date, rule, terms and total, 445.11; the quote carries
// quotedOn 2026-10-19 and no refund reference; the cancellation carries the refund reference REF-c1b44418….
const agreeing: CompareRow[] = [
  { field: 'cancellationDate', quote: '2027-01-27', cancellation: '2027-01-27' },
  { field: 'ruleApplied', quote: 'CANCEL-1c', cancellation: 'CANCEL-1c' },
  { field: 'totalRefund', quote: '445.11', cancellation: '445.11' },
  { field: 'terms', quote: '{1, CANCEL-1c, 365, 101, 264, 445.11}', cancellation: '{1, CANCEL-1c, 365, 101, 264, 445.11}' },
  {
    field: 'refunds',
    quote: 'DirectDebit 445.11 · PAY-7f24722e…',
    cancellation: 'DirectDebit 445.11 · PAY-7f24722e…',
  },
  { field: 'quotedOn', quote: '2026-10-19', only: 'quote' },
  { field: 'refund reference', cancellation: 'REF-c1b44418…', only: 'cancellation', absentNote: 'none on a quote' },
];

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'agree',
    element: <QuoteCancelCompare rows={agreeing} />,
  },
  {
    state: 'differ',
    element: (
      <div>
        <p style={note}>
          Placeholder: no differing pair is recorded in the sources. Here the cancellation's total refund (445.10) and the
          refund inside its terms line are invented to show the layout. Every other value is the recorded case.
        </p>
        <QuoteCancelCompare
          rows={agreeing.map((row) =>
            row.field === 'totalRefund'
              ? { ...row, cancellation: '445.10' }
              : row.field === 'terms'
                ? { ...row, cancellation: '{1, CANCEL-1c, 365, 101, 264, 445.10}' }
                : row,
          )}
        />
      </div>
    ),
  },
];
