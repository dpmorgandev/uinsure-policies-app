import type { JSX } from 'react';
import { ShaLink } from '../../primitives/sha-link/ShaLink';
import { RuleEvidence } from './RuleEvidence';
import type { EvidenceBranch, EvidenceCommit, EvidenceOrder, EvidencePr, EvidenceQa, EvidenceSignoff } from './RuleEvidence';

// Observed: GET-1 in build/F2, as rule.html draws it. Commit rows, SHAs, TDD steps, agents, layers and what each did
// are its walkthrough rows; the QA step, sign-off and PR are its #rqa, #rsign and #rpr rungs; the pinned note is its
// "Pinned" card. The excerpt lacks rows 1 to 4, 6, 8 and the like, and says so in each gap. States that need a trail
// no source holds (a rule with no refactor, an order violation) are built from GET-1's own rows and say so.

const GITHUB = 'https://github.com/dpmorgandev/uinsure-policies-api/commit/';
const note = {
  margin: 'var(--space-3) 0 0',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
} as const;
// Each example fills the pane it is in; none sets a width of its own.
const frame = { maxWidth: '100%' } as const;

function c(
  row: number,
  sha: string,
  tdd: EvidenceCommit['tdd'],
  agent: EvidenceCommit['agent'],
  layer: string,
  label: string,
  what: string,
  extra: Partial<EvidenceCommit> = {},
): EvidenceCommit {
  return { row, sha, githubHref: `${GITHUB}${sha}`, tdd, agent, layer, label, what, ...extra };
}

const r5 = c(5, '94a7473', 'red', 'tester', 'tests', 'Write the failing test', 'retrieve answers the full policy response, derived status, the current term and 2 dp money', {
  key: true,
  gapBefore: 'Rows 1 to 4 are not in this view',
});
const r7 = c(7, '2f81a40', 'stub', 'builder', 'api', 'Stub the shape', 'stub full policy response shape', {
  gapBefore: 'Row 6 is not in this view',
});
const r9 = c(9, '8988ed8', 'stub', 'builder', 'api', 'Stub again', 'canned status and term number match no expected value', {
  gapBefore: 'Row 8 is not in this view',
});
const r12 = c(12, '770a29b', 'red', 'tester', 'tests', 'Add Domain tests', 'trait domain status and current-term tests', {
  gapBefore: 'Rows 10 and 11 are not in this view',
});
const r14 = c(14, '7b6e4d9', 'red', 'tester', 'tests', 'Add Services tests', 'trait services status and current-term tests', {
  gapBefore: 'Row 13 is not in this view',
});
const r17 = c(17, '92ede9e', 'green', 'builder', 'api', 'Make it pass', 'api real status, current term, 2dp money, unknown query filter', {
  key: true,
  note: 'Red at #5 sits above green at #17.',
  gapBefore: 'Rows 15 and 16 are not in this view',
});
const r19 = c(19, '80d3ee2', 'refactor', 'builder', 'api', 'Tidy, stay green', 'make TwoDecimalPlacesConverter comment true to the code', {
  key: true,
  note: "The requirements matrix records this as GET-1's refactor.",
  gapBefore: 'Row 18 is not in this view',
});
const r20 = c(20, '98a574d', 'refactor', 'builder', 'api', 'Tidy again', 'make TwoDecimalPlacesConverter comment true at HEAD', {
  note: "A second refactor row. The matrix's refactor column lists only 80d3ee2; both are shown.",
});
const fix = (row: number, sha: string, id: string, extra: Partial<EvidenceCommit> = {}) =>
  c(row, sha, 'red', 'tester', 'tests', `Fail first: ${id}`, `fix ${id}`, extra);
const r26 = fix(26, '357e108', 'A2/I1', { gapBefore: 'Rows 21 to 25 are not in this view' });
const r27 = fix(27, '02e49a2', 'A2/I3');
const r28 = fix(28, 'ef7d2e6', 'A2/I4');
const r29 = fix(29, '2753a64', 'A2/I5');
const r30 = fix(30, '6947971', 'A2/I6');
const r31 = c(31, '8be3aed', 'green', 'builder', 'api', 'Fix A2/I1 and I2', 'map stored HasClaims, make comments true');
const r32 = c(32, '0e107fd', 'green', 'builder', 'api', 'Fix A2/I3', 'write money exactly, padded to 2 dp without rounding');
const r33 = c(33, 'af38b4b', 'green', 'builder', 'api', 'Fix A2/I4', 'reject only query-bound unknown keys');
const r34 = fix(34, '143e5ba', 'A3/R1');

// The gap text names the rows a view skips, so a view that drops commits restates its own gaps.
const skipping = (commit: EvidenceCommit, gapBefore: string): EvidenceCommit => ({ ...commit, gapBefore });

const ALL: EvidenceCommit[] = [r5, r7, r9, r12, r14, r17, r19, r20, r26, r27, r28, r29, r30, r31, r32, r33, r34];

const requirement = {
  text: 'Returns the policy, its terms, policyholders, property, payments, refunds and claims.',
  source: 'docs/requirements.md',
};

const qa: EvidenceQa = {
  ref: 'docs/qa/build-F2.md#1',
  href: 'https://github.com/dpmorgandev/uinsure-policies-api/blob/main/docs/qa/build-F2.md',
  result: 'pass',
  summary: 'GET-1 · sold policy reads back in full → 200. 41 of 41 steps passed.',
  by: 'tester agent, verified by orchestrator',
};
const signoff: EvidenceSignoff = {
  by: 'David Morgan',
  date: '2026-10-19',
  verdict: 'Accepted',
  note: 'Verdict Accept F2, signed David Morgan 19/10/2026 01:05.',
};
const pr: EvidencePr = {
  number: 17,
  href: 'https://github.com/dpmorgandev/uinsure-policies-api/pull/17',
  state: 'merged',
  by: 'David, in the GitHub UI',
  note: 'Merge commit ad7b6b0, logged 2026-10-19T00:10:40Z.',
};
const held: EvidenceOrder = { state: 'held', redRow: 5, greenRow: 17 };

const retry: EvidenceBranch = {
  id: 'retry',
  afterRow: 20,
  title: 'Retry branch: attempts 1, 2, 3',
  leaves: 'Steps off the spine at the first red gate.',
  why: 'Each attempt keeps its own rungs. Markers read attempt, then event. From the loop log, in log order; not pinned to a row.',
  entries: [
    {
      marker: '1·1',
      title: 'gate.red',
      tag: { status: 'pass', label: 'Gate held' },
      meta: 'exit 2, expected fail, ok true',
      body: 'GET-1: 25 total, 21 failed. 4 pass at HEAD: the 404 /problems/get-1 rows, already answered by the F1 bare GET (pinned, not red).',
    },
    {
      marker: '1·2',
      title: 'gate.stub',
      tag: { status: 'fail', label: 'Gate failed' },
      meta: (
        <>
          exit 2, expected “every GET-1 test fails”, ok false · head{' '}
          <ShaLink
            sha="305789d"
            fullSha="305789df2125abfa6ff2e8ba2b0aa9805789008c"
            githubHref={`${GITHUB}305789df2125abfa6ff2e8ba2b0aa9805789008c`}
          />
        </>
      ),
      body: '25 total, 13 failed, 12 passed.',
    },
    { turn: 'Attempt 1 → 2 on gate.stub FAIL at 305789d; failure route round A1' },
    {
      marker: '2·8',
      title: 'reviewer verdict',
      tag: { status: 'fail', label: 'Fail' },
      meta: 'A2 · head 8ea8f60',
      body: 'R1 P1 hasClaims hard-coded false though stored, no test seeds true.',
    },
    { turn: 'Attempt 2 → 3 on reviewer FAIL at 8ea8f60 (A2)' },
  ],
  rejoinRow: 26,
  rejoinNote: 'the first A2 fix',
};

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div style={frame}>
        <RuleEvidence
          ruleId="GET-1"
          requirement={requirement}
          commits={ALL}
          order={held}
          qa={qa}
          signoff={signoff}
          pr={pr}
          branches={[retry]}
        />
      </div>
    ),
  },
  {
    state: 'nb',
    element: (
      <div style={frame}>
        <RuleEvidence ruleId="‹ruleId›" commits={[]} notBuilt back={{ href: '#', label: 'Back to the requirements matrix' }} />
        <p style={note}>Placeholder: no unbuilt rule ID is in the mockup's data.</p>
      </div>
    ),
  },
  {
    state: 'partial (no refactor)',
    element: (
      <div style={frame}>
        <RuleEvidence
          ruleId="GET-1"
          requirement={requirement}
          commits={[r5, r7, skipping(r17, 'Rows 8 to 16 are not in this view')]}
          order={held}
          qa={qa}
          signoff={signoff}
          pr={pr}
        />
        <p style={note}>
          Placeholder trail: GET-1 has refactor rows #19 and #20; they are left out here to show a missing step as a gap,
          not a failure.
        </p>
      </div>
    ),
  },
  {
    state: 'order violated (flagged)',
    element: (
      <div style={frame}>
        <RuleEvidence
          ruleId="GET-1"
          requirement={requirement}
          commits={[
            c(5, '92ede9e', 'green', 'builder', 'api', 'Make it pass', 'api real status, current term, 2dp money, unknown query filter', {
              key: true,
            }),
            c(17, '94a7473', 'red', 'tester', 'tests', 'Write the failing test', 'retrieve answers the full policy response, derived status, the current term and 2 dp money', {
              key: true,
              gapBefore: 'Rows 6 to 16 are not in this view',
            }),
            c(19, '80d3ee2', 'refactor', 'builder', 'api', 'Tidy, stay green', 'make TwoDecimalPlacesConverter comment true to the code', {
              key: true,
              gapBefore: 'Row 18 is not in this view',
            }),
          ]}
          order={{ state: 'violated', redRow: 17, greenRow: 5 }}
          qa={qa}
          signoff={signoff}
          pr={pr}
        />
        <p style={note}>
          Placeholder trail: no recorded rule has green above red. GET-1's green and red SHAs are put at swapped rows to
          show the flag.
        </p>
      </div>
    ),
  },
  {
    state: 'pinned tests',
    element: (
      <div style={frame}>
        <RuleEvidence
          ruleId="GET-1"
          requirement={requirement}
          commits={[r5, skipping(r17, 'Rows 6 to 16 are not in this view'), r19]}
          order={held}
          qa={qa}
          signoff={signoff}
          pr={pr}
          pinned="The 4 RetrieveNotFoundTests 404 rows pass at the red gate. They were delivered in F1/F1b and pinned, not red."
        />
      </div>
    ),
  },
];
