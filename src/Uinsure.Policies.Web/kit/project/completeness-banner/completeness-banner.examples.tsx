import type { JSX } from 'react';
import { CompletenessBanner } from './CompletenessBanner';

// The three values are the vocabulary in docs/ui/research/trail-inventory.md section 3. No README showed
// TRAIL INCOMPLETE at ad7b6b0 ("a fixture must supply the final-state case"), so its reasons are a placeholder
// built from the only instance on record: F1's loop event trace.rendered(incomplete) at attempt 2.

const note = {
  margin: 'var(--space-2) 0 0',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
} as const;

const frame = { display: 'grid', gap: 'var(--space-3)', maxWidth: '48rem' } as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each value',
    element: (
      <div style={frame}>
        <CompletenessBanner value="OK" />
        <CompletenessBanner value="OK (git-only, F0a)" />
        <div>
          <CompletenessBanner value="TRAIL INCOMPLETE: BLOCKED. (1) QA rows use [SELL-n] in the Rule column; …" />
          <p style={note}>
            Placeholder reasons: the text is F1's trace.rendered(incomplete) event at attempt 2, a past state, cut where
            the trail cuts it.
          </p>
        </div>
      </div>
    ),
  },
  {
    state: 'live',
    element: (
      <div style={frame}>
        <CompletenessBanner live value="TRAIL INCOMPLETE: BLOCKED. (1) QA rows use [SELL-n] in the Rule column; …" />
        <p style={note}>
          A live region: a change to this value is announced at once, as an alert when the trail is incomplete and as a
          status otherwise. Same placeholder reasons as above.
        </p>
      </div>
    ),
  },
];
