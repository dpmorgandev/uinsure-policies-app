import type { JSX } from 'react';
import { NotBuiltYet } from './NotBuiltYet';

// rule.html draws the rule state with the placeholder ‹ruleId›: "no unbuilt rule ID is in this page's data", and
// the route /rules/:ruleId and the link back to the requirements matrix are its own. No unbuilt node, region or
// nav entry is named in any mockup either, so those names are placeholders in the same form.

const note = {
  margin: 'var(--space-2) 0 0',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
} as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'rule',
    element: (
      <div style={{ maxWidth: '36rem' }}>
        <NotBuiltYet kind="rule" name="‹ruleId›" back={{ href: '#', label: 'Back to the requirements matrix' }} />
        <p style={note}>Placeholder: no unbuilt rule ID is in the mockup's data.</p>
      </div>
    ),
  },
  {
    state: 'node',
    element: (
      <div style={{ maxWidth: '36rem' }}>
        <NotBuiltYet kind="node" name="‹nodeId›" />
        <p style={note}>Placeholder: no unbuilt node is named in the mockups.</p>
      </div>
    ),
  },
  {
    state: 'region',
    element: (
      <div style={{ maxWidth: '36rem' }}>
        <NotBuiltYet kind="region" name="‹region›" />
        <p style={note}>Placeholder: no unbuilt region is named in the mockups.</p>
      </div>
    ),
  },
  {
    state: 'nav entry',
    element: (
      <div>
        <NotBuiltYet kind="nav entry" name="‹nav entry›" />
        <p style={note}>Placeholder: no unbuilt nav entry is named in the mockups. It is plain text, never a link.</p>
      </div>
    ),
  },
];
