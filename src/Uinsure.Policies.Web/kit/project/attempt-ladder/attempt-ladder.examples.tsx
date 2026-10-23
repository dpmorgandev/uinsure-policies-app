import type { JSX } from 'react';
import { AgentBadge } from '../../primitives/agent-badge/AgentBadge';
import type { AgentName } from '../../primitives/agent-badge/AgentBadge';
import { ShaLink } from '../../primitives/sha-link/ShaLink';
import { TddStepTag } from '../../primitives/tdd-step-tag/TddStepTag';
import { GateRow } from '../gate-row/GateRow';
import { VerdictCard } from '../verdict-card/VerdictCard';
import { AttemptLadder } from './AttemptLadder';
import type { LadderAttempt, LadderEscalation, LadderStep } from './AttemptLadder';

// Observed: build/F2's three attempts as rule.html draws them (loop events 1·1 to 2·8, the A2 finding round, rungs
// #26 to #34, the A3 and A3.2 verdicts) and the investigation inv-001 from docs/ui/research/trail-inventory.md.
// Not in the excerpt: events 2·2 to 2·7 are summarised in one step rather than drawn, the A1 fix commit has no SHA,
// and the position of the investigation's four events among attempt 3's other events is a placeholder.

const GITHUB = 'https://github.com/dpmorgandev/uinsure-policies-api/commit/';
const line = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--space-1) var(--space-3)',
  margin: 0,
} as const;
const text = { margin: 0 } as const;
const note = {
  margin: 'var(--space-3) 0 0',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
} as const;
const frame = { maxWidth: '60rem' } as const;

function head(short: string, full: string) {
  return { sha: short, fullSha: full, githubHref: `${GITHUB}${full}` };
}

function commit(sha: string, step: 'red' | 'green', agent: AgentName, what: string): JSX.Element {
  return (
    <>
      <p style={line}>
        <ShaLink sha={sha} githubHref={`${GITHUB}${sha}`} />
        <TddStepTag step={step} />
        <AgentBadge agent={agent} />
      </p>
      <p style={text}>{what}</p>
    </>
  );
}

const att1Steps: LadderStep[] = [
  {
    marker: '1·1',
    stage: 'gate',
    content: (
      <GateRow
        gate="gate.red"
        result="expected-fail"
        exit={2}
        expected="fail"
        ok={true}
        head={head('b7d5b5a', 'b7d5b5aa17b8ab0bdf6b52870eb01a749112aea5')}
        detail="GET-1: 25 total, 21 failed. 4 pass at HEAD: the 404 /problems/get-1 rows, already answered by the F1 bare GET (pinned, not red)."
      />
    ),
  },
  {
    marker: '1·2',
    stage: 'gate',
    content: (
      <GateRow
        gate="gate.stub"
        result="failed"
        exit={2}
        expected="every GET-1 test fails"
        ok={false}
        head={head('305789d', '305789df2125abfa6ff2e8ba2b0aa9805789008c')}
        detail="25 total, 13 failed, 12 passed."
      />
    ),
  },
];

const attempt1: LadderAttempt = {
  n: 1,
  outcome: { status: 'fail', label: 'Failed at gate.stub' },
  steps: att1Steps,
  turn: 'Attempt 1 → 2 on gate.stub FAIL at 305789d; failure route round A1 · head e82562d',
};

const att2Steps: LadderStep[] = [
  {
    marker: 'A1',
    stage: 'findings',
    content: <p style={text}>Finding round A1, opened by the gate.stub FAIL at 305789d.</p>,
  },
  {
    marker: 'A1',
    stage: 'fix commit',
    content: (
      <p style={line}>
        <ShaLink sha={null} />
        <span>The Fixes-Finding: A1/I1 commit is not in the excerpt, so no rung is drawn for it.</span>
      </p>
    ),
  },
  {
    marker: '2·1',
    stage: 'gate',
    content: (
      <GateRow
        gate="gate.stub"
        result="expected-fail"
        exit={2}
        expected="every GET-1 test fails except the 4 pinned 404 rows"
        ok={true}
        head={head('aee97ab', 'aee97abb56eee893951d3fc6dd2ed8b5fb10d9fa')}
        detail="GET-1: 25 total, 21 failed; passes = the 4 RetrieveNotFoundTests 404 rows only."
      />
    ),
  },
  {
    marker: '2·2 to 2·7',
    stage: 'gate',
    content: (
      <p style={text}>
        Six more events: gate.red, three gate.green, gate.refactor and the security verdict. All held; not drawn here, the
        loop log has them.
      </p>
    ),
  },
  {
    marker: '2·8',
    stage: 'verdict',
    round: 'A2',
    content: (
      <VerdictCard
        agent="reviewer"
        round="A2"
        verdict="FAIL"
        headingLevel={4}
        head={head('8ea8f60', '8ea8f604d6be272a478d5938d0a05f3c31d6f874')}
        findings={[
          { id: 'R1', severity: 'P1', summary: 'hasClaims hard-coded false though stored, no test seeds true.' },
          { id: 'R2', severity: 'P2', summary: 'stale PolicyResponse comment' },
          { id: 'R3', severity: 'P2', summary: 'F2 converter as a second rounding path' },
          { id: 'R4', severity: 'P2', summary: 'unknown-query filter counts route/body/special params as known' },
          { id: 'R5', severity: 'P2', summary: 'unpaid-second-term row lacks status' },
          { id: 'R6', severity: 'P2', summary: 'no Services not-found test' },
        ]}
      />
    ),
  },
];

const attempt2: LadderAttempt = {
  n: 2,
  outcome: { status: 'fail', label: 'Reviewer FAIL at A2' },
  steps: att2Steps,
  turn: 'Attempt 2 → 3 on reviewer FAIL at 8ea8f60 (A2) · head 0c91d99',
};

const att3Steps: LadderStep[] = [
  {
    marker: 'A2',
    stage: 'findings',
    content: <p style={text}>Finding round A2: five failing tests, then the fixes.</p>,
  },
  { marker: '#26', stage: 'red test', content: commit('357e108', 'red', 'tester', 'fix A2/I1') },
  { marker: '#27', stage: 'red test', content: commit('02e49a2', 'red', 'tester', 'fix A2/I3') },
  { marker: '#28', stage: 'red test', content: commit('ef7d2e6', 'red', 'tester', 'fix A2/I4') },
  { marker: '#29', stage: 'red test', content: commit('2753a64', 'red', 'tester', 'fix A2/I5') },
  { marker: '#30', stage: 'red test', content: commit('6947971', 'red', 'tester', 'fix A2/I6') },
  {
    marker: '#31',
    stage: 'fix commit',
    content: commit('8be3aed', 'green', 'builder', 'Fix A2/I1 and I2: map stored HasClaims, make comments true'),
  },
  {
    marker: '#32',
    stage: 'fix commit',
    content: commit('0e107fd', 'green', 'builder', 'Fix A2/I3: write money exactly, padded to 2 dp without rounding'),
  },
  {
    marker: '#33',
    stage: 'fix commit',
    content: commit('af38b4b', 'green', 'builder', 'Fix A2/I4: reject only query-bound unknown keys'),
  },
  {
    marker: '#33',
    stage: 'gate',
    content: (
      <GateRow
        gate="gate.green"
        result="held"
        exit={0}
        detail="The 5 A2 reds pass; 373/373. Fixes: 8be3aed A2/I1+I2, 0e107fd A2/I3, af38b4b A2/I4."
      />
    ),
  },
  {
    marker: '#33',
    stage: 'verdict',
    round: 'A3',
    content: (
      <VerdictCard
        agent="security"
        round="A3"
        verdict="PASS"
        headingLevel={4}
        summary="A2 P2 (query keys) resolved."
        findings={[]}
      />
    ),
  },
  {
    marker: '#33',
    stage: 'verdict',
    round: 'A3',
    content: (
      <VerdictCard
        agent="reviewer"
        round="A3"
        verdict="PASS"
        headingLevel={4}
        summary="A2 R1-R6 resolved; inv-001 approach followed."
        findings={[
          {
            id: 'R1',
            severity: 'P2',
            summary: 'Postman decimal.MinValue SELL-7 check is a prefix match that passes with or without .00.',
          },
        ]}
      />
    ),
  },
  { marker: '#34', stage: 'red test', content: commit('143e5ba', 'red', 'tester', 'fix A3/R1') },
  {
    marker: '#34',
    stage: 'verdict',
    round: 'A3.2',
    content: (
      <VerdictCard
        agent="security"
        round="A3.2"
        verdict="PASS"
        headingLevel={4}
        summary="Re-review at d131efb; no findings."
        findings={[]}
      />
    ),
  },
  {
    marker: '#34',
    stage: 'verdict',
    round: 'A3.2',
    content: (
      <VerdictCard
        agent="reviewer"
        round="A3.2"
        verdict="PASS"
        headingLevel={4}
        summary="Re-review at d131efb; A3 R1 closed; no findings (nit: a missing space in RetrieveHasClaimsTests.cs:76)."
        findings={[]}
      />
    ),
  },
];

const attempt3: LadderAttempt = {
  n: 3,
  outcome: { status: 'pass', label: 'Reviewer PASS at A3 and A3.2' },
  rounds: ['A3', 'A3.2'],
  steps: att3Steps,
};

const inv001: LadderEscalation = {
  id: 'inv-001',
  beforeAttempt: 3,
  leaves: 'Steps off the spine when attempt 3 opens, after the reviewer FAIL at attempt 2.',
  why: 'Placeholder numbering: the trail inventory lists these four events in this order, but not their position among the other events of attempt 3, so 3·1 to 3·4 are counted from this list only.',
  note: 'recorded in the loop log as investigation.opened(inv-001)',
  entries: [
    { marker: '3·1', title: 'investigation.opened(inv-001)' },
    { marker: '3·2', title: 'state(investigating)' },
    { marker: '3·3', title: 'findings(…A2.md)', body: 'Finding round A2.' },
    { marker: '3·4', title: 'state(in_progress)' },
  ],
};

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'one attempt',
    element: (
      <div style={frame}>
        <AttemptLadder label="Attempt 1 of build/F2" attempts={[attempt1]} />
        <p style={note}>Attempt 1 of build/F2 alone. The log shows it turning over into attempt 2 on the gate.stub FAIL.</p>
      </div>
    ),
  },
  {
    state: 'several',
    element: (
      <div style={frame}>
        <AttemptLadder label="Attempts 1, 2 and 3 of build/F2" attempts={[attempt1, attempt2, attempt3]} mode="aggregated" />
        <p style={note}>Aggregated: every attempt keeps its own rung, and its steps open from the control under it.</p>
      </div>
    ),
  },
  {
    state: 'same-attempt re-review (A3, A3.2)',
    element: (
      <div style={frame}>
        <AttemptLadder label="Attempt 3 of build/F2" attempts={[attempt3]} />
      </div>
    ),
  },
  {
    state: 'escalation (inv-001)',
    element: (
      <div style={frame}>
        <AttemptLadder
          label="Attempts 2 and 3 of build/F2, with investigation inv-001"
          attempts={[attempt2, attempt3]}
          escalation={inv001}
          mode="aggregated"
        />
      </div>
    ),
  },
];
