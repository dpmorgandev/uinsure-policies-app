import type { JSX } from 'react';
import { Timestamp } from './Timestamp';

const column = { display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' } as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div style={column}>
        <Timestamp value="2026-10-19T00:07:57Z" />
        <Timestamp value="19/10/2026 01:05" defaultShowUtc />
        <Timestamp value="2026-10-19" />
      </div>
    ),
  },
  {
    state: 'missing',
    element: <Timestamp value={null} />,
  },
];
