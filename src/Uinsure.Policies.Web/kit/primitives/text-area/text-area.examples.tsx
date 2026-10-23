import { useId } from 'react';
import type { JSX, ReactNode } from 'react';
import { InlineError } from '../../patterns/inline-error/InlineError';
import { TextArea } from './TextArea';

const box = { maxWidth: '32rem' } as const;

/** Stands in for `field`: the one error message (inline-error) sits above the box and is wired by aria-describedby. */
function WithMessage({ text, children }: { text: string; children: (describedBy: string) => ReactNode }) {
  const id = useId();
  return (
    <div style={box}>
      <InlineError id={id} messages={[text]} />
      {children(id)}
    </div>
  );
}

// The 500 maximum is the catalog row's (claim description). No claim text is recorded in the reference
// mockups, so every sentence below is a placeholder and says so.
const placeholderText = 'Placeholder claim description. ';
const filled = 'Placeholder claim description.';
const full = placeholderText.repeat(17).slice(0, 500);

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'empty',
    element: (
      <div style={box}>
        <TextArea aria-label="Claim description" maxLength={500} />
      </div>
    ),
  },
  {
    state: 'filled',
    element: (
      <div style={box}>
        <TextArea aria-label="Claim description" maxLength={500} defaultValue={filled} />
      </div>
    ),
  },
  {
    state: 'at limit',
    element: (
      <div style={box}>
        <TextArea aria-label="Claim description" maxLength={500} defaultValue={full} />
      </div>
    ),
  },
  {
    state: 'invalid',
    element: (
      <WithMessage text="Placeholder message: no recorded rule for an invalid claim description.">
        {(describedBy) => (
          <TextArea aria-label="Claim description" maxLength={500} defaultValue={filled} invalid aria-describedby={describedBy} />
        )}
      </WithMessage>
    ),
  },
];
