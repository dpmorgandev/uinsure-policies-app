import { useId } from 'react';
import type { JSX, ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { MoneyInput } from './MoneyInput';

const box = { maxWidth: '16rem' } as const;
const message = {
  display: 'flex',
  gap: 'var(--space-2)',
  alignItems: 'flex-start',
  margin: 'var(--space-1) 0 0',
  color: 'var(--color-error)',
  fontWeight: 700,
  fontSize: 'var(--text-14)',
} as const;

/** Stands in for `field`: wires an error message to the input with aria-describedby. */
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

// Amounts: 615.40 (the policy amount in the wb-cancel mockup), 445.1112 (its unrounded quotient, "445.1112…")
// and 0.00 (a recorded zero refund). The two messages are placeholders: the mockups hold no field message
// for an amount, so the wording is labelled as such.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'empty',
    element: (
      <div style={box}>
        <MoneyInput aria-label="Amount" />
      </div>
    ),
  },
  {
    state: 'filled',
    element: (
      <div style={box}>
        <MoneyInput aria-label="Amount" defaultValue="615.40" />
      </div>
    ),
  },
  {
    state: 'over 2 dp',
    element: (
      <WithMessage text="Placeholder message: an amount has at most 2 decimal places.">
        {(describedBy) => <MoneyInput aria-label="Amount" defaultValue="445.1112" invalid aria-describedby={describedBy} />}
      </WithMessage>
    ),
  },
  {
    state: 'invalid by rule',
    element: (
      <WithMessage text="Placeholder message (SELL-7): the amount must be greater than 0.">
        {(describedBy) => <MoneyInput aria-label="Amount" defaultValue="0.00" invalid aria-describedby={describedBy} />}
      </WithMessage>
    ),
  },
];
