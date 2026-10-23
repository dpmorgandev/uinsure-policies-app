import type { JSX } from 'react';
import { EmptyState } from './EmptyState';

const grid = { display: 'grid', gap: 'var(--space-4)' } as const;

// Wording is from the rule and wb-cancel mockups: the not-built board, the trail and diff errors,
// the diff "not loaded" line, and the gap line "Rows 35 to 44 are not in this view".
// "‹ruleId›" is a placeholder: no unbuilt rule ID is in the mockup data.
// The no-matches wording is interface copy for the filter bar; it names no data.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each context',
    element: (
      <div style={grid}>
        <EmptyState
          context="not-built"
          title="Rule ‹ruleId› has no red, green, refactor, QA step or sign-off to show."
          why="Placeholder: the route is /rules/:ruleId, and no unbuilt rule ID is in this page's data. A missing step is drawn as a gap, never as a failure."
          to={{ label: 'Back to the requirements matrix', href: '#' }}
        />
        <EmptyState
          context="not-loaded"
          title="Not loaded. The diff lines are not part of this page's data excerpt, so none are drawn."
          why="Diffs are the largest payload, so each loads when asked."
        />
        <EmptyState
          context="error"
          title="The trail for GET-1 did not load, so no rung is drawn. Nothing on this page was guessed."
          action={{ label: 'Try again', onClick: () => undefined }}
        />
        <EmptyState
          context="no-matches"
          title="No rungs match these filters."
          why="Clear a filter to see them again."
        />
        <EmptyState context="empty" title="Rows 35 to 44 are not in this view." />
      </div>
    ),
  },
];
