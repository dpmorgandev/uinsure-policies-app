import type { JSX } from 'react';
import { Button } from '../../primitives/button/Button';
import { ShaLink } from '../../primitives/sha-link/ShaLink';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import type { Status } from '../../primitives/status-tag/StatusTag';
import { RungSpine } from './RungSpine';
import type { Rung, RungBranch, RungGap, RungSpineItem, RungTone } from './RungSpine';

// Observed data only. Commit rungs are rows of build/F2's walkthrough as rule.html draws them; the quote and
// cancel rungs are wb-cancel.html's recorded F3 case (policy F3-MVEOSVDQJQ, QA step 10). Anything not in those
// two mockups is labelled a placeholder in the example it appears in.

const GITHUB = 'https://github.com/dpmorgandev/uinsure-policies-api/commit/';

const line = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-1) var(--space-3)',
  alignItems: 'center',
  margin: 0,
} as const;
const what = { margin: 'var(--space-1) 0 0' } as const;
const note = {
  margin: 'var(--space-1) 0 0',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
} as const;
const mono = { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-14)' } as const;
const layer = { ...mono, color: 'var(--color-text-secondary)' } as const;
const caption = { margin: 'var(--space-3) 0 0', fontSize: 'var(--text-14)', color: 'var(--color-text-secondary)' } as const;
const frame = { maxWidth: '60rem' } as const;

const STEPS: Record<'red' | 'stub' | 'green' | 'refactor', { status: Status; word: string; tone: RungTone }> = {
  red: { status: 'fail', word: 'Red', tone: 'red' },
  stub: { status: 'pending', word: 'Stub', tone: 'stub' },
  green: { status: 'pass', word: 'Green', tone: 'green' },
  refactor: { status: 'pass', word: 'Refactor', tone: 'refactor' },
};

interface CommitArgs {
  row: number;
  sha: string;
  step: keyof typeof STEPS;
  label: string;
  agent: string;
  layerName: string;
  text: string;
  note?: string;
  emphasis?: boolean;
}

function commit(args: CommitArgs): Rung {
  const step = STEPS[args.step];
  return {
    id: `r${args.row}`,
    marker: `#${args.row}`,
    label: args.label,
    agent: args.agent,
    tone: step.tone,
    emphasis: args.emphasis,
    receipt: (
      <>
        <p style={line}>
          <ShaLink sha={args.sha} githubHref={`${GITHUB}${args.sha}`} />
          <StatusTag status={step.status}>{step.word}</StatusTag>
          <span style={layer}>{args.layerName}</span>
        </p>
        <p style={what}>{args.text}</p>
        {args.note ? <p style={note}>{args.note}</p> : null}
      </>
    ),
  };
}

const r5 = commit({
  row: 5,
  sha: '94a7473',
  step: 'red',
  label: 'Write the failing test',
  agent: 'tester',
  layerName: 'tests',
  text: 'retrieve answers the full policy response, derived status, the current term and 2 dp money',
  emphasis: true,
});
const r7 = commit({
  row: 7,
  sha: '2f81a40',
  step: 'stub',
  label: 'Stub the shape',
  agent: 'builder',
  layerName: 'api',
  text: 'stub full policy response shape',
});
const r17 = commit({
  row: 17,
  sha: '92ede9e',
  step: 'green',
  label: 'Make it pass',
  agent: 'builder',
  layerName: 'api',
  text: 'api real status, current term, 2dp money, unknown query filter',
  note: 'Red at #5 sits above green at #17.',
  emphasis: true,
});
const r19 = commit({
  row: 19,
  sha: '80d3ee2',
  step: 'refactor',
  label: 'Tidy, stay green',
  agent: 'builder',
  layerName: 'api',
  text: 'make TwoDecimalPlacesConverter comment true to the code',
  note: "The requirements matrix records this as GET-1's refactor.",
});
const r26 = commit({
  row: 26,
  sha: '357e108',
  step: 'red',
  label: 'Fail first: A2/I1',
  agent: 'tester',
  layerName: 'tests',
  text: 'fix A2/I1',
});

function gap(id: string, text: string): RungGap {
  return { kind: 'gap', id, text };
}

const qa: Rung = {
  id: 'qa',
  marker: 'QA',
  label: 'Run the QA step',
  agent: 'tester agent, verified by orchestrator',
  shape: 'round',
  receipt: (
    <>
      <p style={line}>
        <span style={mono}>docs/qa/build-F2.md#1</span>
        <StatusTag status="pass" />
      </p>
      <p style={what}>GET-1 · sold policy reads back in full → 200. 41 of 41 steps passed.</p>
    </>
  ),
};
const signoff: Rung = {
  id: 'signoff',
  marker: 'OK',
  label: 'Sign off',
  agent: 'David Morgan',
  shape: 'round',
  receipt: (
    <>
      <p style={line}>
        <StatusTag status="pass">Accepted</StatusTag>
        <span style={mono}>2026-10-19</span>
      </p>
      <p style={what}>Verdict Accept F2, signed David Morgan 19/10/2026 01:05.</p>
    </>
  ),
};
const pr: Rung = {
  id: 'pr',
  marker: 'PR',
  label: 'Merge the PR',
  agent: 'David, in the GitHub UI',
  shape: 'round',
  receipt: (
    <>
      <p style={line}>
        <a href="https://github.com/dpmorgandev/uinsure-policies-api/pull/17">PR #17</a>
        <StatusTag status="pass">Merged</StatusTag>
      </p>
      <p style={what}>Merge commit ad7b6b0, logged 2026-10-19T00:10:40Z.</p>
    </>
  ),
};

function head(short: string, full: string): JSX.Element {
  return <ShaLink sha={short} fullSha={full} githubHref={`${GITHUB}${full}`} />;
}

const retryBranch: RungBranch = {
  kind: 'branch',
  id: 'retry',
  title: 'Retry branch: attempts 1, 2, 3',
  leaves: 'Steps off the spine at the first red gate.',
  why: 'Each attempt keeps its own rungs. Markers read attempt, then event (1·2 is the second event of attempt 1). From the loop log, in log order.',
  entries: [
    {
      marker: '1·1',
      title: 'gate.red',
      tag: { status: 'pass', label: 'Gate held' },
      meta: (
        <>
          exit 2, expected fail, ok true · head {head('b7d5b5a', 'b7d5b5aa17b8ab0bdf6b52870eb01a749112aea5')}
        </>
      ),
      body: 'GET-1: 25 total, 21 failed. 4 pass at HEAD: the 404 /problems/get-1 rows, already answered by the F1 bare GET (pinned, not red).',
    },
    {
      marker: '1·2',
      title: 'gate.stub',
      tag: { status: 'fail', label: 'Gate failed' },
      meta: (
        <>
          exit 2, expected “every GET-1 test fails”, ok false · head{' '}
          {head('305789d', '305789df2125abfa6ff2e8ba2b0aa9805789008c')}
        </>
      ),
      body: '25 total, 13 failed, 12 passed.',
    },
    {
      turn: (
        <>
          Attempt 1 → 2 on gate.stub FAIL at 305789d; failure route round A1 · head{' '}
          {head('e82562d', 'e82562da7d7e49d0674269c6939002df8f77eaf5')}
        </>
      ),
    },
    {
      marker: 'A1',
      dashed: true,
      title: 'no SHA',
      body: 'The Fixes-Finding: A1/I1 commit is not in the excerpt, so no rung is drawn for it.',
    },
    {
      marker: '2·1',
      title: 'gate.stub',
      tag: { status: 'pass', label: 'Gate held' },
      meta: (
        <>
          exit 2, expected “every GET-1 test fails except the 4 pinned 404 rows”, ok true · head{' '}
          {head('aee97ab', 'aee97abb56eee893951d3fc6dd2ed8b5fb10d9fa')}
        </>
      ),
      body: 'GET-1: 25 total, 21 failed; passes = the 4 RetrieveNotFoundTests 404 rows only.',
    },
    {
      marker: '2·2 to 2·7',
      dashed: true,
      title: 'six more events',
      body: 'gate.red, three gate.green, gate.refactor and the security verdict, all held. Left out of this example; the loop log has them.',
    },
    {
      marker: '2·8',
      title: 'reviewer verdict',
      tag: { status: 'fail', label: 'Fail' },
      meta: <>A2 · head {head('8ea8f60', '8ea8f604d6be272a478d5938d0a05f3c31d6f874')}</>,
      body: 'R1 P1 hasClaims hard-coded false though stored, no test seeds true.',
    },
    {
      turn: (
        <>
          Attempt 2 → 3 on reviewer FAIL at 8ea8f60 (A2) · head{' '}
          {head('0c91d99', '0c91d99339552b451b10aa4f8c851a3524f295b7')}
        </>
      ),
    },
  ],
  rejoin: { toId: 'r26', text: '#26', note: 'the first A2 fix' },
};

const investigationBranch: RungBranch = {
  kind: 'branch',
  id: 'inv-001',
  title: 'Investigation inv-001',
  leaves: 'Steps off the spine when attempt 3 opens, after the reviewer FAIL at attempt 2.',
  why: 'Placeholder numbering: the trail inventory lists these four events in this order, but not their position among the other events of attempt 3, so 3·1 to 3·4 are counted from this list only.',
  investigation: { id: 'inv-001', note: 'recorded in the loop log as investigation.opened(inv-001)' },
  entries: [
    { marker: '3·1', title: 'investigation.opened(inv-001)' },
    { marker: '3·2', title: 'state(investigating)' },
    { marker: '3·3', title: 'findings(…A2.md)', body: 'Finding round A2.' },
    { marker: '3·4', title: 'state(in_progress)' },
  ],
  rejoin: { toId: 'r26', text: '#26', note: 'the first A2 fix' },
};

function spine(label: string, items: RungSpineItem[], heading?: 2 | 3 | 4): JSX.Element {
  return <RungSpine label={label} items={items} headingLevel={heading} />;
}

const WB = 'GET /policies/F3-MVEOSVDQJQ/cancellation-quote?cancellationDate=2027-01-27';

const quoteRung: Rung = {
  id: 'quote',
  marker: '1',
  label: 'Quote the date',
  hint: 'Read-only. A quote never saves.',
  tag: { status: 'pass', label: 'Quote returned' },
  shape: 'round',
  receipt: (
    <p style={what}>
      <span style={mono}>{WB}</span> answered <span style={mono}>200</span>, <span style={mono}>quotedOn</span>{' '}
      <span style={mono}>2026-10-19</span>.
    </p>
  ),
};

const agreeRung: Rung = {
  id: 'agree',
  marker: '3',
  label: 'Check they agree',
  hint: 'Quote and cancellation, field by field.',
  tag: { status: 'pending', label: 'Waiting for rung 2' },
  state: 'waiting',
  shape: 'round',
  receipt: <p style={note}>Waits for rung 2: there is no cancellation to set against the quote yet.</p>,
};

const carriedDate = {
  label: 'Cancellation date',
  value: '2027-01-27',
  note: 'carried from rung 1. To change it, quote again.',
} as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'one rung',
    element: <div style={frame}>{spine('Commits, one rung', [r5])}</div>,
  },
  {
    state: 'many',
    element: (
      <div style={frame}>
        {spine('Commits, then QA step, sign-off and PR', [
          gap('g1-4', 'Rows 1 to 4 are not in this view'),
          r5,
          gap('g6', 'Row 6 is not in this view'),
          r7,
          gap('g8-16', 'Rows 8 to 16 are not in this view'),
          r17,
          gap('g18', 'Row 18 is not in this view'),
          r19,
          gap('g20-44', 'Rows 20 to 44 are not in this view'),
          qa,
          signoff,
          pr,
        ])}
      </div>
    ),
  },
  {
    state: 'a branch that rejoins',
    element: (
      <div style={frame}>
        {spine('Commit #5, the retry branch, then rung #26', [
          r5,
          gap('g6-25', 'Rows 6 to 25 are not in this view'),
          retryBranch,
          { kind: 'band', id: 'a3', text: 'Attempt 3 · finding round A2: five failing tests, then the fixes' },
          r26,
        ])}
        <p style={caption}>
          The branch is drawn beside the rungs it follows and is not pinned to a row: the loop log's head SHAs are not in
          the walkthrough.
        </p>
      </div>
    ),
  },
  {
    state: 'a marked branch (investigation)',
    element: (
      <div style={frame}>
        {spine('Reviewer FAIL, investigation inv-001, then rung #26', [
          {
            id: 'a2',
            marker: 'A2',
            label: 'Review at attempt 2',
            agent: 'reviewer',
            shape: 'round',
            tone: 'red',
            receipt: (
              <>
                <p style={line}>
                  <ShaLink sha="8ea8f60" githubHref={`${GITHUB}8ea8f604d6be272a478d5938d0a05f3c31d6f874`} />
                  <StatusTag status="fail">Fail</StatusTag>
                </p>
                <p style={what}>R1 P1 hasClaims hard-coded false though stored, no test seeds true.</p>
              </>
            ),
          },
          investigationBranch,
          r26,
        ])}
      </div>
    ),
  },
  {
    state: 'a carried value (the quoted date)',
    element: (
      <div style={frame}>
        {spine(
          'Quote and cancel, two rungs',
          [
            quoteRung,
            {
              id: 'cancel',
              marker: '2',
              label: 'Cancel on that date',
              hint: 'The date is carried down from rung 1, not typed again.',
              tag: { status: 'pending', label: 'Ready, not sent' },
              state: 'current',
              shape: 'round',
              carried: carriedDate,
              receipt: (
                <p style={note}>
                  <span style={mono}>POST /policies/F3-MVEOSVDQJQ/cancellation</span> with{' '}
                  <span style={mono}>cancellationDate</span> <span style={mono}>2027-01-27</span>.
                </p>
              ),
            },
          ],
          3,
        )}
      </div>
    ),
  },
  {
    state: 'a rung in progress (BUSY-1)',
    element: (
      <div style={frame}>
        {spine(
          'Quote and cancel, three rungs, the cancel running',
          [
            quoteRung,
            {
              id: 'cancel',
              marker: '2',
              label: 'Cancel on that date',
              state: 'busy',
              shape: 'round',
              busy: true,
              busyLabel: 'Sending the cancel for 2027-01-27',
              carried: carriedDate,
              receipt: (
                <Button variant="destructive" busy busyLabel="Cancelling…">
                  Cancel on 2027-01-27
                </Button>
              ),
            },
            agreeRung,
          ],
          3,
        )}
      </div>
    ),
  },
];
