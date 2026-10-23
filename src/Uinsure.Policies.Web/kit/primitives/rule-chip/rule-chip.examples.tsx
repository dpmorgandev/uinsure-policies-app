import type { JSX } from 'react';
import { RuleChip } from './RuleChip';

const note = { fontSize: 'var(--text-12)', color: 'var(--color-text-secondary)' } as const;
const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' } as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'built',
    element: (
      <div style={row}>
        <RuleChip ruleId="GET-1" status="built" />
        <RuleChip ruleId="CANCEL-1c" status="built" />
      </div>
    ),
  },
  {
    state: 'nb',
    element: (
      <div style={row}>
        <RuleChip ruleId="PLACEHOLDER-1" status="nb" />
        <span style={note}>Placeholder ID: no unbuilt rule is named in the reference mockups.</span>
      </div>
    ),
  },
  {
    state: 'unknown ID',
    element: (
      <div style={row}>
        <RuleChip ruleId="NOT-A-RULE" status="unknown" />
        <span style={note}>Placeholder ID: no unknown rule ID is named in the reference mockups.</span>
      </div>
    ),
  },
];
