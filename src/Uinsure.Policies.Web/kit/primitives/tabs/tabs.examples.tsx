import type { JSX } from 'react';
import { Tabs } from './Tabs';
import type { TabItem } from './Tabs';

// The four views of a node are named in the catalog row, and each is a route of the node page in the catalog:
// /plans/:planId/:nodeId, with /commits, /loop and /activity under it. The node is build/F3, the node the workbench
// mockups read; the walkthrough view lives at the node's /commits route.
export const nodeViews: TabItem[] = [
  { key: 'node', label: 'Node', href: '/plans/build/F3' },
  { key: 'walkthrough', label: 'Walkthrough', href: '/plans/build/F3/commits' },
  { key: 'loop', label: 'Loop', href: '/plans/build/F3/loop' },
  { key: 'activity', label: 'Activity', href: '/plans/build/F3/activity' },
];

const VIEWS = nodeViews;

const GIT_ONLY: TabItem[] = VIEWS.map((view) =>
  view.key === 'loop' || view.key === 'activity' ? { ...view, empty: true } : view,
);

const note = { fontSize: 'var(--text-12)', color: 'var(--color-text-secondary)' } as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each tab',
    element: (
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {VIEWS.map((view) => (
          <Tabs key={view.key} items={VIEWS} current={view.key} label={`Views of this node, ${view.label} showing`} />
        ))}
      </div>
    ),
  },
  {
    state: 'git-only (some tabs empty)',
    element: (
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <Tabs items={GIT_ONLY} current="node" label="Views of a git-only node" />
        <span style={note}>
          Placeholder: which views are empty for a git-only node is not shown in the reference mockups.
        </span>
      </div>
    ),
  },
];
