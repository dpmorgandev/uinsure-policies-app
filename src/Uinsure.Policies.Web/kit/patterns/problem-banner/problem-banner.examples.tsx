import type { JSX } from 'react';
import { ProblemBanner } from './ProblemBanner';

const stack = { display: 'grid', gap: 'var(--space-3)', maxWidth: '36rem' } as const;
const note = {
  margin: 0,
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-14)',
} as const;

// Recorded in the wb-cancel mockup: 409 CANCEL-4 (QA step 18) with its two extensions, and 422 CANCEL-7
// (QA step 21) with latestEndDate and violations. GET-1's 404 type /problems/get-1 is from rule.html.
// The 404 title and the 429 and 500 cases are placeholders: no recorded response holds them.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each status',
    element: (
      <div style={stack}>
        <ProblemBanner
          status={404}
          title="Placeholder title: policy not found"
          ruleId="GET-1"
          extensions={[{ name: 'type', value: '/problems/get-1' }]}
        />
        <ProblemBanner
          status={409}
          title="Policy already cancelled"
          detail="The policy was already cancelled on 2026-11-18."
          ruleId="CANCEL-4"
          extensions={[
            { name: 'cancellationDate', value: '2026-11-18' },
            { name: 'instance', value: '/policies/F3-MVEOTAWL4W/cancellation' },
          ]}
        />
        <ProblemBanner
          status={422}
          title="Cancellation date after the end of cover"
          ruleId="CANCEL-7"
          extensions={[
            { name: 'latestEndDate', value: '2027-11-09' },
            { name: 'violations', value: '[CANCEL-7]' },
          ]}
        />
        <ProblemBanner status={429} title="Placeholder title: too many requests" />
        <ProblemBanner status={500} title="Placeholder title: the server failed" />
        <p style={note}>
          Placeholder: the 404 title, and the 429 and 500 cases, are not in the mockups. The 409 and 422 are recorded
          (CANCEL-4, QA step 18; CANCEL-7, QA step 21).
        </p>
      </div>
    ),
  },
  {
    state: 'unreachable',
    element: (
      <div style={stack}>
        <ProblemBanner
          unreachable
          title="The API did not answer"
          detail="No request was completed. Nothing was changed by this screen."
          onRetry={() => undefined}
        />
        <p style={note}>Placeholder wording: the trail holds no unreachable case.</p>
      </div>
    ),
  },
];
