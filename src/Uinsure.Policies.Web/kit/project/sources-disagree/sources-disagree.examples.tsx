import type { JSX } from 'react';
import { SourcesDisagree } from './SourcesDisagree';

// rule.html, "Where the sources differ", row "PR #17": the README (compiled 2026-10-19T00:07:57Z) says
// "merge pending"; the loop log records the merge at 2026-10-19T00:10:40Z, "PR #17 merged by David in the
// GitHub UI". The event-derived value (the loop) comes first.

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div style={{ maxWidth: '40rem' }}>
        <SourcesDisagree
          fact="PR #17"
          derived={{
            source: 'loop log, merged(…) event',
            when: '2026-10-19T00:10:40Z',
            says: 'Merged: “PR #17 merged by David in the GitHub UI”.',
          }}
          other={{
            source: 'README, generated header',
            when: 'compiled 2026-10-19T00:07:57Z',
            says: '“merge pending”.',
          }}
        />
      </div>
    ),
  },
];
