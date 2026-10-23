import { useId } from 'react';
import type { JSX, ReactNode } from 'react';
import { InlineError } from '../../patterns/inline-error/InlineError';
import { RadioGroup } from './RadioGroup';
import type { RadioOption } from './RadioGroup';

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' } as const;

/** Stands in for `field`: the one error message (inline-error) sits above the options and is wired by aria-describedby. */
function WithMessage({ text, children }: { text: string; children: (describedBy: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <InlineError id={id} messages={[text]} />
      {children(id)}
    </div>
  );
}

// Payment methods: DirectDebit is the value in the wb-cancel mockup; Card and Cheque are the other two
// methods in docs/requirements.md. The invalid message is a placeholder.
const paymentMethods: RadioOption[] = [
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
          <RadioGroup key={method.value} legend="Payment method" options={paymentMethods} defaultValue={method.value} />
        ))}
      </div>
    ),
  },
  {
    state: 'invalid',
    element: (
      <WithMessage text="Placeholder message: choose a payment method.">
        {(describedBy) => <RadioGroup legend="Payment method" options={paymentMethods} invalid aria-describedby={describedBy} />}
      </WithMessage>
    ),
  },
];
