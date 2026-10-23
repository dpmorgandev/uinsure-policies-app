import type { JSX } from 'react';
import { InlineError } from './InlineError';

const box = { maxWidth: '22rem' } as const;
const note = {
  margin: 'var(--space-2) 0 0',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-14)',
} as const;

// Messages are the ones recorded in the wb-cancel mockup (QA step 48 and step 22). No recorded response
// holds two messages on one field, so the second example joins two recorded messages as a placeholder.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'one',
    element: (
      <div style={box}>
        <InlineError id="inline-error-one" messages={['The cancellation date must be a date in the form yyyy-MM-dd.']} />
      </div>
    ),
  },
  {
    state: 'several on one field',
    element: (
      <div style={box}>
        <InlineError
          id="inline-error-several"
          messages={[
            'The cancellation date must be a date in the form yyyy-MM-dd.',
            'The cancellationDate field is required.',
          ]}
        />
        <p style={note}>Placeholder: two recorded messages joined; the trail holds no field with two.</p>
      </div>
    ),
  },
];
