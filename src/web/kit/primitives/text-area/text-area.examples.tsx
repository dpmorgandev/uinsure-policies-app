import { useId } from 'react';
import type { JSX, ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { TextArea } from './TextArea';

const box = { maxWidth: '32rem' } as const;
const message = {
  display: 'flex',
  gap: 'var(--space-2)',
  alignItems: 'flex-start',
  margin: 'var(--space-1) 0 0',
  color: 'var(--color-error)',
  fontWeight: 700,
  fontSize: 'var(--text-14)',
} as const;

/** Stands in for `field`: wires an error message to the box with aria-describedby. */
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
