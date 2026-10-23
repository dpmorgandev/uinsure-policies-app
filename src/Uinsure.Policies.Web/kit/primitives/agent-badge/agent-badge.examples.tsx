import type { JSX } from 'react';
import { AgentBadge } from './AgentBadge';
import type { AgentName } from './AgentBadge';

const AGENTS: AgentName[] = [
  'main',
  'tester',
  'builder',
  'reviewer',
  'security',
  'investigator',
  'git',
  'web-tester',
  'web-builder',
  'kit-builder',
  'ui-designer',
  'creative-director',
  'david',
];

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' } as const;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each agent',
    element: (
      <div style={row}>
        {AGENTS.map((agent) => (
          <AgentBadge key={agent} agent={agent} />
        ))}
      </div>
    ),
  },
  {
    state: '`—` (hook saw none)',
    element: <AgentBadge agent={null} />,
  },
];
