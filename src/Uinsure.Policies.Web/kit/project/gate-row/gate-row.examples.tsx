import type { JSX } from 'react';
import { GateRow } from './GateRow';

// Events and counts are the loop events rule.html draws for build/F2's GET-1: attempt 1 gate.red (1·1) and
// gate.stub (1·2), attempt 2 gate.green (2·3). The excerpt holds no command text, so no example shows a command.
// A waived gate and the state event's position are not in the excerpt; the examples say so.

const GITHUB = 'https://github.com/dpmorgandev/uinsure-policies-api/commit/';
const frame = { maxWidth: '44rem' } as const;
const note = {
  margin: 'var(--space-2) 0 0',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
} as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'ok',
    element: (
      <div style={frame}>
        <GateRow
          gate="gate.green"
          marker="2·3"
          result="held"
          exit={0}
          ok={true}
          head={{
            sha: '311ccb6',
            fullSha: '311ccb69c8898da35aa08143a5aea82fd42af063',
            githubHref: `${GITHUB}311ccb69c8898da35aa08143a5aea82fd42af063`,
          }}
          detail="Services GET-1 6/6 pass."
        />
      </div>
    ),
  },
  {
    state: 'not ok',
    element: (
      <div style={frame}>
        <GateRow
          gate="gate.stub"
          marker="1·2"
          result="failed"
          exit={2}
          expected="every GET-1 test fails"
          ok={false}
          head={{
            sha: '305789d',
            fullSha: '305789df2125abfa6ff2e8ba2b0aa9805789008c',
            githubHref: `${GITHUB}305789df2125abfa6ff2e8ba2b0aa9805789008c`,
          }}
          detail="25 total, 13 failed, 12 passed."
        />
      </div>
    ),
  },
  {
    state: 'expected-fail',
    element: (
      <div style={frame}>
        <GateRow
          gate="gate.red"
          marker="1·1"
          result="expected-fail"
          exit={2}
          expected="fail"
          ok={true}
          head={{
            sha: 'b7d5b5a',
            fullSha: 'b7d5b5aa17b8ab0bdf6b52870eb01a749112aea5',
            githubHref: `${GITHUB}b7d5b5aa17b8ab0bdf6b52870eb01a749112aea5`,
          }}
          detail="GET-1: 25 total, 21 failed. 4 pass at HEAD: the 404 /problems/get-1 rows, already answered by the F1 bare GET (pinned, not red)."
        />
      </div>
    ),
  },
  {
    state: 'waived',
    element: (
      <div style={frame}>
        <GateRow gate="gate.scaffold.waived" result="waived" />
        <p style={note}>
          Placeholder: gate.scaffold.waived is in the loop vocabulary, but the excerpt holds no waived gate, so no exit,
          reason or SHA is shown.
        </p>
      </div>
    ),
  },
  {
    state: 'state event',
    element: (
      <div style={frame}>
        <GateRow gate="state(investigating)" kind="state" detail="Attempt 3, from the loop log." />
        <p style={note}>The event's position among attempt 3's other events is not in the excerpt, so it has no marker.</p>
      </div>
    ),
  },
];
