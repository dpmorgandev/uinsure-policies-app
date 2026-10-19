import type { JSX } from 'react';
import { PrimaryNav, primaryNavItems } from './PrimaryNav';

const column = { display: 'grid', gap: 'var(--space-4)' } as const;
const caption = {
  margin: '0 0 var(--space-1)',
  fontSize: 'var(--text-12)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
} as const;

// One bar per item, each with a different item current. The five labels are the catalog row's.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each active item',
    element: (
      <div style={column}>
        {primaryNavItems.map((item) => (
          <div key={item.key}>
            <p style={caption}>Current: {item.label}</p>
            <PrimaryNav current={item.key} label={`Primary, ${item.label} current`} />
          </div>
        ))}
      </div>
    ),
  },
];
