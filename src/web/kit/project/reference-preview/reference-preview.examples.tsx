import type { JSX } from 'react';
import { ReferencePreview } from './ReferencePreview';

const note = {
  margin: '0 0 var(--space-2)',
  padding: 'var(--space-1) var(--space-2)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
  border: '1.5px dashed var(--color-text-secondary)',
  borderRadius: 'var(--radius)',
} as const;

// Observed: SELL-1 trims and upper-cases a reference, then it must match ^[A-Z0-9-]{3,20}$ or the API answers 400
// (docs/ui/research/api-inventory.md section 3); F3-MVEOSVDQJQ is a recorded reference. What a person typed is not
// recorded anywhere, so the typed text below is a placeholder, labelled as one.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div>
        <p style={note}>
          Placeholder: the typed text, with a leading space and lower case, is invented. F3-MVEOSVDQJQ, the reference it
          becomes, is recorded.
        </p>
        <ReferencePreview value=" f3-mveosvdqjq" />
      </div>
    ),
  },
  {
    state: 'invalid pattern',
    element: (
      <div>
        <p style={note}>
          Placeholder: the typed text, with an underscore, is invented to fall outside the SELL-1 pattern. The pattern is
          recorded.
        </p>
        <ReferencePreview value="f3_mveosvdqjq" />
      </div>
    ),
  },
];
