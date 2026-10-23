import type { JSX } from 'react';
import { TddStepTag } from './TddStepTag';
import type { TddStep } from './TddStepTag';

const VALUES: TddStep[] = ['scaffold', 'red', 'stub', 'green', 'refactor', 'plan', 'trace'];

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' } as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each value',
    element: (
      <div style={row}>
        {VALUES.map((step) => (
          <TddStepTag key={step} step={step} />
        ))}
      </div>
    ),
  },
  {
    state: 'empty',
    element: <TddStepTag step={null} />,
  },
];
