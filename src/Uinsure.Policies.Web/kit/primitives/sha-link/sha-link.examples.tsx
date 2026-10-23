import type { JSX } from 'react';
import { ShaLink } from './ShaLink';

const REPO = 'https://github.com/dpmorgandev/uinsure-policies-api/commit/';

const column = { display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' } as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div style={column}>
        <ShaLink
          sha="af38b4b"
          fullSha="af38b4b6f0ca2910a007c52cc8f622b88fa64fb1"
          href="#r33"
          githubHref={`${REPO}af38b4b6f0ca2910a007c52cc8f622b88fa64fb1`}
        />
        <ShaLink sha="94a7473" githubHref={`${REPO}94a7473`} />
      </div>
    ),
  },
  {
    state: 'rewritten SHA (dis)',
    element: (
      <ShaLink
        sha="143e5ba"
        fullSha="143e5ba6bed3b2a893d6f09f272d12bc9acae535"
        githubHref={`${REPO}143e5ba6bed3b2a893d6f09f272d12bc9acae535`}
        disagreement={{ sha: 'd131efb', source: 'the verdict detail' }}
      />
    ),
  },
  {
    state: 'missing',
    element: <ShaLink sha={null} />,
  },
];
