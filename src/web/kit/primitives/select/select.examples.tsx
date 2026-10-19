import { useId } from 'react';
import type { JSX, ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Select } from './Select';
import type { SelectOption } from './Select';

const box = { maxWidth: '22rem' } as const;
const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: '22rem' } as const;
const message = {
  display: 'flex',
  gap: 'var(--space-2)',
  alignItems: 'flex-start',
  margin: 'var(--space-1) 0 0',
  color: 'var(--color-error)',
  fontWeight: 700,
  fontSize: 'var(--text-14)',
} as const;

/** Stands in for `field`: wires an error message to the select with aria-describedby. */
function WithMessage({ text, children }: { text: string; children: (describedBy: string) => ReactNode }) {
  const id = useId();
  return (
    <div style={box}>
      {children(id)}
      <p id={id} style={message}>
        <CircleAlert size="1.25em" aria-hidden="true" />
        <span>{text}</span>
      </p>
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
