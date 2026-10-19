import type { JSX } from 'react';
import { Tabs } from './Tabs';
import type { TabItem } from './Tabs';

// The four views of a node are named in the catalog row. The hrefs are placeholders: the routes are not
// fixed by the reference mockups.
const VIEWS: TabItem[] = [
  { key: 'node', label: 'Node', href: '#node' },
  { key: 'walkthrough', label: 'Walkthrough', href: '#walkthrough' },
  { key: 'loop', label: 'Loop', href: '#loop' },
  { key: 'activity', label: 'Activity', href: '#activity' },
];

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
