import type { JSX } from 'react';
import { VerdictCard } from './VerdictCard';

// Verdicts are the ones rule.html draws for build/F2 (reviewer FAIL at A2, reviewer PASS at A3, security PASS at
// A3.2), and the lost F0b A1 receipt is from docs/ui/research/trail-inventory.md section 4. The mockup records no
// route and no rules covered or missing for any verdict, so the cards say "not recorded" and "not in the excerpt"
// rather than show a value. The A3 verdict's head SHA is not in the excerpt either.

const GITHUB = 'https://github.com/dpmorgandev/uinsure-policies-api/commit/';
// Each card fills the pane it is in; no example sets a width of its own.
const frame = { maxWidth: '100%' } as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'PASS',
    element: (
      <div style={frame}>
        <VerdictCard
          agent="reviewer"
          round="A3"
          verdict="PASS"
          summary="A2 R1-R6 resolved; inv-001 approach followed."
          findings={[
            {
              id: 'R1',
              severity: 'P2',
              summary: 'Postman decimal.MinValue SELL-7 check is a prefix match that passes with or without .00.',
            },
          ]}
        />
      </div>
    ),
  },
  {
    state: 'FAIL',
    element: (
      <div style={frame}>
        <VerdictCard
          agent="reviewer"
          round="A2"
          verdict="FAIL"
          head={{
            sha: '8ea8f60',
            fullSha: '8ea8f604d6be272a478d5938d0a05f3c31d6f874',
            githubHref: `${GITHUB}8ea8f604d6be272a478d5938d0a05f3c31d6f874`,
          }}
          findings={[
            { id: 'R1', severity: 'P1', summary: 'hasClaims hard-coded false though stored, no test seeds true.' },
            { id: 'R2', severity: 'P2', summary: 'stale PolicyResponse comment' },
            { id: 'R3', severity: 'P2', summary: 'F2 converter as a second rounding path' },
            {
              id: 'R4',
              severity: 'P2',
              summary: 'unknown-query filter counts route/body/special params as known',
            },
            { id: 'R5', severity: 'P2', summary: 'unpaid-second-term row lacks status' },
            { id: 'R6', severity: 'P2', summary: 'no Services not-found test' },
          ]}
        />
      </div>
    ),
  },
  {
    state: 'no findings',
    element: (
      <div style={frame}>
        <VerdictCard
          agent="security"
          round="A3.2"
          verdict="PASS"
          summary="Re-review at d131efb; no findings."
          findings={[]}
        />
      </div>
    ),
  },
  {
    state: 'lost (F0b A1, reconciled)',
    element: (
      <div style={frame}>
        <VerdictCard agent="reviewer" round="A1" node="F0b" lost={{ file: 'A1-reviewer.json', reconciled: true }} />
      </div>
    ),
  },
  {
    // From the F0b loop's own verdict event (docs/ui/fixture/trace.json): reviewer FAIL at head 6a615c8, detail
    // "P0 R1 app fails at start-up (no appsettings; Database:Provider null) - confirmed by orchestrator; P2 R2-R9".
    // The event gives no text for R2-R9, so only R1 is listed and the summary says where the rest are.
    state: 'a P0 finding',
    element: (
      <div style={frame}>
        <VerdictCard
          agent="reviewer"
          round="A1"
          node="F0b"
          verdict="FAIL"
          head={{
            sha: '6a615c8',
            fullSha: '6a615c8cd9c342a18030802209cc596e3c3b829f',
            githubHref: `${GITHUB}6a615c8cd9c342a18030802209cc596e3c3b829f`,
          }}
          summary="Also P2 R2-R9; the verdict event records no text for them."
          findings={[
            {
              id: 'R1',
              severity: 'P0',
              summary: 'App fails at start-up (no appsettings; Database:Provider null) - confirmed by orchestrator.',
            },
          ]}
        />
      </div>
    ),
  },
];
