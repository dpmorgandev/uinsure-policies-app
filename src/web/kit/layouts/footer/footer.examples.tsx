import type { JSX } from 'react';
import { Footer } from './Footer';

const column = { display: 'grid', gap: 'var(--space-2)' } as const;
const note = { margin: 0, fontSize: 'var(--text-14)', color: 'var(--color-text-secondary)' } as const;

// The repository link and the compiled-at time are in the rule mockup; /about is the route in screens.json.
// The rule mockup says the snapshot SHA is "not in the excerpt", so no real SHA is shown.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div style={column}>
        <Footer
          compiledAt={{
            sha: null,
            missingShaLabel: 'snapshot SHA: not in the excerpt',
            time: '2026-10-19T00:07:57Z',
          }}
          provenanceHref="/about"
          repoHref="https://github.com/dpmorgandev/uinsure-policies-api"
        />
        <p style={note}>The snapshot SHA is shown as missing because the mockup excerpt does not hold one.</p>
      </div>
    ),
  },
  {
    state: 'no snapshot',
    element: (
      <div style={column}>
        <Footer
          noSnapshot
          provenanceHref="/about"
          repoHref="https://github.com/dpmorgandev/uinsure-policies-api"
        />
        <p style={note}>Shown while trace.json is loading or unreadable: no SHA, no time, no commit link.</p>
      </div>
    ),
  },
];
