import type { JSX } from 'react';
import { PrimaryNav } from './PrimaryNav';
import type { BuiltNavItem, NavItem } from './PrimaryNav';

const column = { display: 'grid', gap: 'var(--space-4)' } as const;
const caption = {
  margin: '0 0 var(--space-1)',
  fontSize: 'var(--text-12)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
} as const;

// The entries are docs/ui/screens.json `primaryNav`, in its order: id is the key, name the label, route the href and
// scope the scope. The Plan route is `/plans/:planId`; the plan the mockups read is "build", so the link here is
// /plans/build. The component holds no routes of its own: a screen passes these in.
export const catalogNav: BuiltNavItem[] = [
  { key: 'overview', label: 'Overview', href: '/', scope: 'explorer' },
  { key: 'matrix', label: 'Requirements matrix', href: '/rules', scope: 'explorer' },
  { key: 'plan', label: 'Plan', href: '/plans/build', scope: 'explorer' },
  { key: 'decisions', label: 'Human decisions', href: '/decisions', scope: 'explorer' },
  { key: 'about', label: 'How to read this', href: '/about', scope: 'explorer' },
  { key: 'wb-home', label: 'Workbench', href: '/workbench', scope: 'workbench' },
];

// The same nav as the derived reference docs/ui/derived/U0b shows it: Overview and "How to read this" are built;
// Requirements matrix, Plan, Human decisions and Workbench are not, so they say "not built yet" and are not links.
const unbuiltKeys = ['matrix', 'plan', 'decisions', 'wb-home'];
export const partlyBuiltNav: NavItem[] = catalogNav.map((item): NavItem =>
  unbuiltKeys.includes(item.key)
    ? { key: item.key, label: item.label, scope: item.scope, notBuilt: true }
    : item,
);

// One bar per item, each with a different item current: the five explorer entries, then the workbench.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each active item',
    element: (
      <div style={column}>
        {catalogNav.map((item) => (
          <div key={item.key}>
            <p style={caption}>Current: {item.label}</p>
            <PrimaryNav current={item.key} items={catalogNav} label={`Primary, ${item.label} current`} />
          </div>
        ))}
        <div>
          <p style={caption}>Entries not built yet: Requirements matrix, Plan, Human decisions, Workbench</p>
          <PrimaryNav current="about" items={partlyBuiltNav} label="Primary, some entries not built yet" />
        </div>
      </div>
    ),
  },
];
