import type { JSX } from 'react';
import { RedactionToken } from './RedactionToken';
import type { Redaction } from './RedactionToken';

const TOKENS: Redaction[] = ['user', 'outside-repo', 'root'];

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each token',
    element: (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
        {TOKENS.map((token) => (
          <RedactionToken key={token} token={token} />
        ))}
      </div>
    ),
  },
];
