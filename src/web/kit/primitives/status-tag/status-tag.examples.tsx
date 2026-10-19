import type { JSX } from 'react';
import { StatusTag } from './StatusTag';
import type { Status } from './StatusTag';

const ALL: Status[] = ['pass', 'fail', 'warn', 'pending', 'not-built'];

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' } as const;

function themed(theme: 'light' | 'dark'): JSX.Element {
  return (
    <div
      data-theme={theme}
      style={{
        ...row,
        padding: 'var(--space-3)',
        background: 'var(--color-background)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
      }}
    >
      {ALL.map((status) => (
        <StatusTag key={status} status={status} />
      ))}
    </div>
  );
}

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'all five values',
    element: (
      <div style={row}>
        {ALL.map((status) => (
          <StatusTag key={status} status={status} />
        ))}
        <StatusTag status="pass">Pass 59 of 59</StatusTag>
      </div>
    ),
  },
  {
    state: 'both themes',
    element: (
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {themed('light')}
        {themed('dark')}
      </div>
    ),
  },
];
