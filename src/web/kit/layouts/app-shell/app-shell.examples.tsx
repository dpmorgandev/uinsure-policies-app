import type { JSX, ReactNode } from 'react';
import { AppShell } from './AppShell';

const scroller = { maxWidth: '100%', overflowX: 'auto', border: '1px dashed var(--color-text-secondary)' } as const;
const caption = { margin: '0 0 var(--space-1)', fontSize: 'var(--text-14)', color: 'var(--color-text-secondary)' } as const;
const heading = { margin: 0, fontSize: 'var(--text-32)', lineHeight: 1.15 } as const;
const body = { margin: 'var(--space-3) 0 0', color: 'var(--color-text-secondary)' } as const;

// The frame is the viewport: the shell lays out by the width of the box it is in.
function Frame({ width, children }: { width: number; children: ReactNode }): JSX.Element {
  return (
    <div>
      <p style={caption}>{width} wide</p>
      <div style={scroller}>
        <div style={{ width: `${width}px` }}>{children}</div>
      </div>
    </div>
  );
}

// "Docket" is from docs/ui/concept.md; the compiled-at time and the repo link are from the rule mockup, which
// holds no snapshot SHA. The screen inside the frame is a placeholder: the shell is shown with no screen in it.
function Shell({ width }: { width: number }): JSX.Element {
  return (
    <Frame width={width}>
      <AppShell
        topBar={{ appName: 'Docket', defaultTheme: 'system' }}
        nav={{ current: 'requirements' }}
        footer={{
          compiledAt: {
            sha: null,
            missingShaLabel: 'snapshot SHA: not in the excerpt',
            time: '2026-10-19T00:07:57Z',
          },
          provenanceHref: '/about',
          repoHref: 'https://github.com/dpmorgandev/uinsure-policies-api',
        }}
      >
        <h1 style={heading}>Page title (placeholder)</h1>
        <p style={body}>Placeholder: a screen goes here. The shell shows only its frame.</p>
      </AppShell>
    </Frame>
  );
}

export const examples: { state: string; element: JSX.Element }[] = [
  { state: '1440', element: <Shell width={1440} /> },
  { state: '1280', element: <Shell width={1280} /> },
  { state: '390', element: <Shell width={390} /> },
];
