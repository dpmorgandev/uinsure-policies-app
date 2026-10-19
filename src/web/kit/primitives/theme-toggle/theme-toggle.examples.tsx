import type { JSX } from 'react';
import { ThemeToggle } from './ThemeToggle';

const stack = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-4)' } as const;

// One toggle per choice, so each of light, dark and system is seen selected (THEME-1).
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'each',
    element: (
      <div style={stack}>
        <ThemeToggle defaultValue="light" />
        <ThemeToggle defaultValue="dark" />
        <ThemeToggle defaultValue="system" />
      </div>
    ),
  },
];
