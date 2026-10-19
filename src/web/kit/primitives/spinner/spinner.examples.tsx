import type { JSX } from 'react';
import { Button } from '../button/Button';
import { Spinner } from './Spinner';

const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' } as const;

// Labels "Quoting…" and "Cancelling…" are the busy labels recorded in the wb-cancel mockup.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'inline in a button',
    element: (
      <Button variant="secondary" busy busyLabel="Quoting…">
        Quote this date
      </Button>
    ),
  },
  {
    state: 'reduced motion',
    element: (
      <span style={{ ...row, color: 'var(--color-text-primary)' }}>
        <Spinner still />
        <span>Quoting… (static glyph, as under prefers-reduced-motion)</span>
      </span>
    ),
  },
  {
    state: 'both themes',
    element: (
      <div style={row}>
        <Button variant="secondary" busy busyLabel="Quoting…">
          Quote this date
        </Button>
        <Button variant="destructive" busy busyLabel="Cancelling…">
          Cancel on 2027-01-27
        </Button>
      </div>
    ),
  },
];
