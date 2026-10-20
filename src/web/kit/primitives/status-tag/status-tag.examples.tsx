import type { JSX } from 'react';
import { StatusTag } from './StatusTag';
import type { Status } from './StatusTag';

const ALL: Status[] = ['pass', 'fail', 'warn', 'pending', 'not-built'];

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' } as const;

// "Both themes": the kitchen sink already draws every example once under data-theme="light" and once under
// data-theme="dark", side by side. This example therefore sets no theme of its own (a pane inside a pane would nest one
// theme in the other). It lists each of the five values beside its name, so each tag can be checked in whichever theme
// the pane it sits in has.
const listStyle = { display: 'grid', gap: 'var(--space-2)', margin: 0, padding: 0, listStyle: 'none' } as const;
const itemStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--space-1) var(--space-3)',
} as const;
const nameStyle = {
  minWidth: '6rem',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
} as const;

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
      <ul style={listStyle} aria-label="The five status values">
        {ALL.map((status) => (
          <li key={status} style={itemStyle}>
            <span style={nameStyle}>{status}</span>
            <StatusTag status={status} />
          </li>
        ))}
      </ul>
    ),
  },
];
