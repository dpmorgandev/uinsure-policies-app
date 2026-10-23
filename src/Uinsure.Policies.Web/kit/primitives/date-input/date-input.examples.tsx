import { useId } from 'react';
import type { JSX, ReactNode } from 'react';
import { InlineError } from '../../patterns/inline-error/InlineError';
import { DateInput } from './DateInput';

const box = { maxWidth: '22rem' } as const;

/** Stands in for `field`: the one error message (inline-error) sits above the input and is wired by aria-describedby. */
function WithMessage({ text, children }: { text: string; children: (describedBy: string) => ReactNode }) {
  const id = useId();
  return (
    <div style={box}>
      <InlineError id={id} messages={[text]} />
      {children(id)}
    </div>
  );
}

// All three dates and both messages are recorded in the wb-cancel mockup: 2027-01-27 (rung 1), 18/11/2026
// (400, QA step 48) and 2026-10-18 (422 CANCEL-3, QA step 16, "Today is 2026-10-19").
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'empty',
    element: (
      <div style={box}>
        <DateInput aria-label="Cancellation date" />
      </div>
    ),
  },
  {
    state: 'filled',
    element: (
      <div style={box}>
        <DateInput aria-label="Cancellation date" defaultValue="2027-01-27" />
      </div>
    ),
  },
  {
    state: 'invalid format',
    element: (
      <WithMessage text="The cancellation date must be a date in the form yyyy-MM-dd.">
        {(describedBy) => <DateInput aria-label="Cancellation date" defaultValue="18/11/2026" invalid aria-describedby={describedBy} />}
      </WithMessage>
    ),
  },
  {
    state: 'invalid by rule',
    element: (
      <WithMessage text="Cancellation date in the past. Today is 2026-10-19.">
        {(describedBy) => <DateInput aria-label="Cancellation date" defaultValue="2026-10-18" invalid aria-describedby={describedBy} />}
      </WithMessage>
    ),
  },
];
