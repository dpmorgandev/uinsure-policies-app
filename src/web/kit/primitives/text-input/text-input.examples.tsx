import { useId } from 'react';
import type { JSX, ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { TextInput } from './TextInput';

const box = { maxWidth: '22rem' } as const;
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

// Values: the policy references F3-MVEOSVDQJQ and QA-F3-SHAPE appear in the wb-cancel mockup.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'empty',
    element: (
      <div style={box}>
        <TextInput aria-label="Policy reference" />
      </div>
    ),
  },
  {
    state: 'filled',
    element: (
      <div style={box}>
        <TextInput aria-label="Policy reference" defaultValue="F3-MVEOSVDQJQ" mono />
      </div>
    ),
  },
  {
    state: 'invalid',
    element: (
      <WithMessage text="Placeholder message: the trail holds no case of an invalid reference.">
        {(describedBy) => (
          <TextInput aria-label="Policy reference" defaultValue="QA-F3-SHAPE" mono invalid aria-describedby={describedBy} />
        )}
      </WithMessage>
    ),
  },
  {
    state: 'disabled',
    element: (
      <div style={box}>
        <TextInput aria-label="Policy reference" defaultValue="F3-MVEOSVDQJQ" mono disabled />
      </div>
    ),
  },
  {
    state: 'focus',
    element: (
      <div style={box}>
        <TextInput aria-label="Policy reference" defaultValue="F3-MVEOSVDQJQ" mono data-show-focus />
      </div>
    ),
  },
];
