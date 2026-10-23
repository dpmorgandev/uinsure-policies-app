import type { JSX } from 'react';
import { DagGraph } from './DagGraph';
import type { DagNode } from '../dag-table/DagTable';

const note = {
  margin: '0 0 var(--space-2)',
  padding: 'var(--space-1) var(--space-2)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
  border: '1.5px dashed var(--color-text-secondary)',
  borderRadius: 'var(--radius)',
} as const;

// Observed (docs/ui/research/trail-inventory.md D1 and D3, docs/ui/research/api-inventory.md): F2 is "Retrieve",
// depends_on [F1b], rule GET-1, PR 17; F1 builds SELL-1, PR #10; F1b is PR #15; the matrix lists CANCEL-1a under
// build/F3 as "not built yet"; E6 (renew) is the F4 endpoint. Every dependency edge other than F2 on F1b, and every
// title other than "Retrieve", is a placeholder and is labelled as one in the example.
const settled: DagNode[] = [
  { id: 'F1', title: 'Sell (placeholder title)', status: 'done', dependsOn: [], rules: ['SELL-1'], pr: 10 },
  { id: 'F1b', title: 'Follow-up to F1 (placeholder title)', status: 'done', dependsOn: ['F1'], rules: [], pr: 15 },
  { id: 'F2', title: 'Retrieve', status: 'done', dependsOn: ['F1b'], rules: ['GET-1'], pr: 17 },
];

const running: DagNode[] = [
  { id: 'F2', title: 'Retrieve', status: 'done', dependsOn: [], rules: ['GET-1'], pr: 17 },
  { id: 'F3', title: 'Cancel (placeholder title)', status: 'done', dependsOn: ['F2'], rules: ['CANCEL-1a', 'CANCEL-1b', 'CANCEL-1c'] },
  { id: 'F4', title: 'Renew', status: 'in-progress', dependsOn: ['F3'], rules: ['RENEW-1/2'] },
];

const unbuilt: DagNode[] = [
  { id: 'F2', title: 'Retrieve', status: 'done', dependsOn: [], rules: ['GET-1'], pr: 17 },
  { id: 'F3', title: 'Cancel (placeholder title)', status: 'not-built', dependsOn: ['F2'], rules: ['CANCEL-1a'] },
  { id: 'F4', title: 'Renew', status: 'not-built', dependsOn: ['F2'], rules: ['RENEW-1/2'] },
];

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div>
        <p style={note}>
          Placeholder: the titles of F1 and F1b and F1b depending on F1 are not in the sources. F2 depending on F1b, its
          title, its rule and the PR numbers are.
        </p>
        <DagGraph nodes={settled} focalId="F2" />
      </div>
    ),
  },
  {
    state: 'live',
    element: (
      <div>
        <p style={note}>
          Placeholder: the title of F3 and the chain F2, F3, F4 are not in the sources. That F4 is the renew node and
          was in progress while F3 was merged is.
        </p>
        <DagGraph nodes={running} focalId="F4" live liveNote="F4 in progress" />
      </div>
    ),
  },
  {
    state: 'nb nodes',
    element: (
      <div>
        <p style={note}>
          Placeholder: the title of F3 and both nodes waiting on F2 are not in the sources. That CANCEL-1a sits under
          build/F3 as "not built yet" is.
        </p>
        <DagGraph nodes={unbuilt} />
      </div>
    ),
  },
];
