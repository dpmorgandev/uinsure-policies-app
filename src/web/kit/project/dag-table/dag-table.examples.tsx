import type { JSX } from 'react';
import { DagTable } from './DagTable';
import type { DagNode } from './DagTable';

const note = {
  margin: '0 0 var(--space-2)',
  padding: 'var(--space-1) var(--space-2)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
  border: '1.5px dashed var(--color-text-secondary)',
  borderRadius: 'var(--radius)',
} as const;

// Observed (docs/ui/research/trail-inventory.md, D1 and D3): F2 is "Retrieve", depends_on [F1b], rules [GET-1],
// PR 17; F1 builds SELL-1 and merged as PR #10; F1b merged as PR #15. Not observed, so labelled: F1's and F1b's
// titles, and F1b depending on F1.
const nodes: DagNode[] = [
  { id: 'F1', title: 'Sell (placeholder title)', status: 'done', dependsOn: [], rules: ['SELL-1'], pr: 10 },
  { id: 'F1b', title: 'Follow-up to F1 (placeholder title)', status: 'done', dependsOn: ['F1'], rules: [], pr: 15 },
  { id: 'F2', title: 'Retrieve', status: 'done', dependsOn: ['F1b'], rules: ['GET-1'], pr: 17 },
];

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div>
        <p style={note}>
          Placeholder: the titles of F1 and F1b, and F1b depending on F1, are not in the sources. F2 depending on F1b,
          its title, its rule and the PR numbers are.
        </p>
        <DagTable nodes={nodes} />
      </div>
    ),
  },
];
