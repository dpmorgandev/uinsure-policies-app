import type { JSX } from 'react';
import { RequestLog } from './RequestLog';
import type { RequestLogEntry } from './RequestLog';

const note = {
  margin: 'var(--space-2) 0 0',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-14)',
} as const;

// Methods, paths and statuses are the three requests in the wb-cancel mockup, newest first: #3 is the
// CANCEL-3 rejection (QA step 16), #2 the cancel (step 10), #1 the quote (step 10). They come from different
// recorded policies, so their order here is a placeholder. The mockup records no durations; the numbers
// below are placeholders and the third request is left unmeasured. Request #4 is a placeholder too: the mockup
// records no unanswered request, so it is a read of the cancelled policy with no status yet, to show the pending row.
const entries: RequestLogEntry[] = [
  { n: 4, method: 'GET', path: '/policies/F3-MVEOSVDQJQ', status: null },
  { n: 3, method: 'GET', path: '/policies/F3-MVEOTAONJW/cancellation-quote?cancellationDate=2026-10-18', status: 422, durationMs: 41 },
  { n: 2, method: 'POST', path: '/policies/F3-MVEOSVDQJQ/cancellation', status: 201, durationMs: 87 },
  { n: 1, method: 'GET', path: '/policies/F3-MVEOSVDQJQ/cancellation-quote?cancellationDate=2027-01-27', status: 200 },
];

const caption = (
  <p style={note}>
    Placeholder: the order, request #4 (no answer yet, shown as pending), and the 41 ms and 87 ms durations are not in
    the mockups.
  </p>
);

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div>
        <RequestLog entries={entries} />
        {caption}
      </div>
    ),
  },
  {
    state: 'empty',
    element: (
      <div>
        <RequestLog entries={[]} />
      </div>
    ),
  },
  {
    state: 'filtered',
    element: (
      <div>
        <RequestLog entries={entries} defaultFilter="POST" />
        {caption}
      </div>
    ),
  },
];
