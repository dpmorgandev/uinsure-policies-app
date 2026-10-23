import type { JSX } from 'react';
import { Money } from './Money';

const big = { fontSize: 'var(--text-32)', fontWeight: 700, color: 'var(--color-primary)' } as const;
const note = { margin: 0, maxWidth: '24rem', color: 'var(--color-text-secondary)', fontSize: 'var(--text-14)' } as const;

// 445.11 and 0.00 are recorded in the wb-cancel mockup: the refund under CANCEL-1c and the refund after a
// claim under COULD-2. The API writes no negative amount, so none is drawn.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <span style={big}>
        <Money value="445.11" />
      </span>
    ),
  },
  {
    state: 'zero',
    element: (
      <span style={big}>
        <Money value="0.00" />
      </span>
    ),
  },
  {
    state: 'negative never shown',
    element: <p style={note}>No negative amount is drawn: the API writes none, and a refund of nothing is written 0.00.</p>,
  },
];
