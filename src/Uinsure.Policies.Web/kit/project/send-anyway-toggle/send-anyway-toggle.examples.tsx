import type { JSX } from 'react';
import { SendAnywayToggle } from './SendAnywayToggle';

const note = {
  margin: '0 0 var(--space-2)',
  padding: 'var(--space-1) var(--space-2)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
  border: '1.5px dashed var(--color-text-secondary)',
  borderRadius: 'var(--radius)',
} as const;

// Observed (docs/ui/research/api-inventory.md section 4, recorded in docs/qa/build-F3.md:162): a claim whose date is in
// the future and outside every term answers 422 /problems/could-2a, "2 rules failed.", violations [COULD-2a, COULD-2b].
// The titles "Claim date in the future" and "Claim date outside cover" are the problem catalogue's. Placeholder: the
// violations' own detail strings are not in the sources, and the client does not exist yet, so the client check wording
// is invented.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'off',
    element: <SendAnywayToggle />,
  },
  {
    state: 'on',
    element: <SendAnywayToggle defaultChecked />,
  },
  {
    state: 'on with a response',
    element: (
      <div>
        <p style={note}>
          Placeholder: the client check wording, and the catalogue titles standing in for each violation's own detail, are not
          in the sources. The 422, the two rules and their order are recorded.
        </p>
        <SendAnywayToggle
          defaultChecked
          response={{
            status: 422,
            violations: [
              { ruleId: 'COULD-2a', detail: 'Claim date in the future', clientCheck: 'Claim date is not after today' },
              { ruleId: 'COULD-2b', detail: 'Claim date outside cover', clientCheck: null },
            ],
          }}
        />
      </div>
    ),
  },
];
