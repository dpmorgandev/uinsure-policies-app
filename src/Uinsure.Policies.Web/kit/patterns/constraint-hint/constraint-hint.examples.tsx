import type { JSX } from 'react';
import { ConstraintHint } from './ConstraintHint';

const box = { maxWidth: '26rem', display: 'grid', gap: 'var(--space-3)' } as const;
const note = {
  margin: 0,
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-14)',
} as const;

// The three constraints are the ones in the catalog row. Which field carries each one is not in the
// mockups, so the example says so rather than naming a field.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div style={box}>
        <ConstraintHint constraint="^[A-Z0-9-]{3,20}$" />
        <ConstraintHint constraint="today … today + 60" />
        <ConstraintHint constraint="≤ 2 dp" />
        <p style={note}>Placeholder: the field each constraint sits beside is not in the mockups.</p>
      </div>
    ),
  },
  {
    state: 'violated',
    element: (
      <div style={box}>
        <ConstraintHint constraint="≤ 2 dp" violated />
        <ConstraintHint constraint="≤ 2 dp" violated checkOff />
        <ConstraintHint constraint="≤ 2 dp" checkOff />
        <p style={note}>Placeholder: the value that breaks the constraint is not in the mockups.</p>
      </div>
    ),
  },
];
