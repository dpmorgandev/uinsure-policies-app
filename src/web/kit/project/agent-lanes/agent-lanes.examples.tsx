import type { JSX } from 'react';
import { AgentLanes } from './AgentLanes';
import type { Lane, LaneEvent } from './AgentLanes';

// The events are the 17 red, stub, green and refactor rows of build/F2's walkthrough for GET-1, as rule.html's
// text-equivalent table lists them: row number, SHA, TDD step, agent and what it did, plus row 2 (a commit with no
// TDD trailer). Position is the row number. Nothing else is drawn.

const tester: LaneEvent[] = [
  { n: 5, tdd: 'red', sha: '94a7473', label: 'retrieve answers the full policy response, derived status, the current term and 2 dp money' },
  { n: 12, tdd: 'red', sha: '770a29b', label: 'trait domain status and current-term tests' },
  { n: 14, tdd: 'red', sha: '7b6e4d9', label: 'trait services status and current-term tests' },
  { n: 26, tdd: 'red', sha: '357e108', label: 'fix A2/I1' },
  { n: 27, tdd: 'red', sha: '02e49a2', label: 'fix A2/I3' },
  { n: 28, tdd: 'red', sha: 'ef7d2e6', label: 'fix A2/I4' },
  { n: 29, tdd: 'red', sha: '2753a64', label: 'fix A2/I5' },
  { n: 30, tdd: 'red', sha: '6947971', label: 'fix A2/I6' },
  { n: 34, tdd: 'red', sha: '143e5ba', label: 'fix A3/R1' },
];

const builder: LaneEvent[] = [
  { n: 7, tdd: 'stub', sha: '2f81a40', label: 'stub full policy response shape' },
  { n: 9, tdd: 'stub', sha: '8988ed8', label: 'canned status and term number match no expected value' },
  { n: 17, tdd: 'green', sha: '92ede9e', label: 'api real status, current term, 2dp money, unknown query filter' },
  { n: 19, tdd: 'refactor', sha: '80d3ee2', label: 'make TwoDecimalPlacesConverter comment true to the code' },
  { n: 20, tdd: 'refactor', sha: '98a574d', label: 'make TwoDecimalPlacesConverter comment true at HEAD' },
  { n: 31, tdd: 'green', sha: '8be3aed', label: 'map stored HasClaims, make comments true' },
  { n: 32, tdd: 'green', sha: '0e107fd', label: 'write money exactly, padded to 2 dp without rounding' },
  { n: 33, tdd: 'green', sha: 'af38b4b', label: 'reject only query-bound unknown keys' },
];

// Row 2 of the same walkthrough: a commit by main whose message carries no TDD trailer (the walkthrough lists its TDD
// column as null), so it is drawn as the neutral tick beside the lanes whose commits do carry one.
const main: LaneEvent[] = [{ n: 2, tdd: null, sha: 'd2a46f5', label: 'f1b-done-merged' }];

const both: Lane[] = [
  { agent: 'main', events: main },
  { agent: 'tester', events: tester },
  { agent: 'builder', events: builder },
];

const note = {
  margin: 'var(--space-2) 0 0',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
} as const;

// No example sets a width: each one fills the pane it is in, and the lanes and the table scroll inside their own frames.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div>
        <AgentLanes lanes={both} tableOpen />
      </div>
    ),
  },
  {
    state: 'one agent',
    element: (
      <div>
        <AgentLanes lanes={[{ agent: 'tester', events: tester }]} />
        <p style={note}>Only the tester's rows from the same walkthrough, to show a single lane.</p>
      </div>
    ),
  },
  {
    state: 'empty',
    element: (
      <div>
        <AgentLanes lanes={[]} />
        <p style={note}>Placeholder: the mockups hold no node with an empty activity record.</p>
      </div>
    ),
  },
  {
    state: 'git-only',
    element: (
      <div>
        <AgentLanes lanes={[]} gitOnly />
        <p style={note}>F0a is git-only: no loop, activity or verdicts, by design (trail-inventory.md section 4).</p>
      </div>
    ),
  },
];
