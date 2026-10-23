import type { JSX } from 'react';
import { CompiledAtStamp } from './CompiledAtStamp';

const column = { display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' } as const;
const note = { margin: 0, fontSize: 'var(--text-14)', color: 'var(--color-text-secondary)' } as const;

// The time is the compiled-at time in the rule mockup (2026-10-19T00:07:57Z). That mockup says the snapshot
// SHA is "not in the excerpt", so the first stamp's SHA and its link are invented and labelled as such.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div style={column}>
        <CompiledAtStamp
          sha="0000000"
          commitHref="https://github.com/dpmorgandev/uinsure-policies-api/commit/0000000"
          time="2026-10-19T00:07:57Z"
        />
        <p style={note}>Placeholder: the SHA 0000000 and its link are invented; the excerpt holds no snapshot SHA.</p>
        <CompiledAtStamp
          sha={null}
          missingShaLabel="snapshot SHA: not in the excerpt"
          time="2026-10-19T00:07:57Z"
        />
        <p style={note}>As the rule mockup shows it: the time is recorded, the SHA is not.</p>
      </div>
    ),
  },
];
