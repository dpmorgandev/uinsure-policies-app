import { useId } from 'react';
import type { JSX, ReactNode } from 'react';
import { InlineError } from '../../patterns/inline-error/InlineError';
import { Select } from './Select';
import type { SelectOption } from './Select';

const box = { maxWidth: '22rem' } as const;
const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: '22rem' } as const;

/** Stands in for `field`: the one error message (inline-error) sits above the select and is wired by aria-describedby. */
function WithMessage({ text, children }: { text: string; children: (describedBy: string) => ReactNode }) {
  const id = useId();
  return (
    <div style={box}>
      <InlineError id={id} messages={[text]} />
      {children(id)}
    </div>
  );
}

// Payment methods: DirectDebit is the value in the wb-cancel mockup; Card and Cheque are the other two
// methods in docs/requirements.md ("Card, Direct Debit, Cheque"). The invalid message is a placeholder.
const paymentMethods: SelectOption[] = [
  { value: 'Card', label: 'Card' },
  { value: 'DirectDebit', label: 'Direct Debit' },
  { value: 'Cheque', label: 'Cheque' },
];

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each value',
    element: (
      <div style={stack}>
        {paymentMethods.map((method) => (
          <Select key={method.value} aria-label="Payment method" options={paymentMethods} defaultValue={method.value} />
        ))}
      </div>
    ),
  },
  {
    state: 'invalid',
    element: (
      <WithMessage text="Placeholder message: choose a payment method.">
        {(describedBy) => (
          <Select
            aria-label="Payment method"
            options={paymentMethods}
            placeholder="Choose a payment method"
            invalid
            aria-describedby={describedBy}
          />
        )}
      </WithMessage>
    ),
  },
];
