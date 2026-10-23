import type { JSX } from 'react';
import { Receipt, X } from 'lucide-react';
import { Button } from './Button';

const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' } as const;

// Labels are the ones in the wb-cancel mockup: "Quote this date", "Go back", "Cancel on 2027-01-27",
// "Cancel on a quoted date", and the busy labels "Quoting…" and "Cancelling…".
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'primary',
    element: (
      <Button variant="primary" icon={<Receipt size="1em" aria-hidden="true" />}>
        Quote this date
      </Button>
    ),
  },
  {
    state: 'secondary',
    element: <Button variant="secondary">Go back</Button>,
  },
  {
    state: 'destructive',
    element: (
      <Button variant="destructive" icon={<X size="1em" aria-hidden="true" />}>
        Cancel on 2027-01-27
      </Button>
    ),
  },
  {
    state: 'disabled',
    element: (
      <div style={row}>
        <Button variant="primary" disabled>
          Quote this date
        </Button>
        <Button variant="secondary" disabled>
          Go back
        </Button>
        <Button variant="destructive" disabled>
          Cancel on a quoted date
        </Button>
      </div>
    ),
  },
  {
    state: 'busy (each variant)',
    element: (
      <div style={row}>
        <Button variant="primary" busy busyLabel="Quoting…">
          Quote this date
        </Button>
        <Button variant="secondary" busy busyLabel="Quoting…">
          Quote this date
        </Button>
        <Button variant="destructive" busy busyLabel="Cancelling…">
          Cancel on 2027-01-27
        </Button>
      </div>
    ),
  },
  {
    state: 'focus',
    element: (
      <div style={row}>
        <Button variant="primary" data-show-focus>
          Quote this date
        </Button>
        <Button variant="secondary" data-show-focus>
          Go back
        </Button>
        <Button variant="destructive" data-show-focus>
          Cancel on 2027-01-27
        </Button>
      </div>
    ),
  },
];
