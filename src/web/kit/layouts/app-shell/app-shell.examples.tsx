import { useLayoutEffect, useRef, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { catalogNav } from '../primary-nav/primary-nav.examples';
import { AppShell } from './AppShell';

const outerStyle = {
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  border: '1px dashed var(--color-text-secondary)',
} as const;
const caption = { margin: '0 0 var(--space-1)', fontSize: 'var(--text-14)', color: 'var(--color-text-secondary)' } as const;
const heading = { margin: 0, fontSize: 'var(--text-32)', lineHeight: 1.15 } as const;
const body = { margin: 'var(--space-3) 0 0', color: 'var(--color-text-secondary)' } as const;

interface Fit {
  scale: number;
  height: number | undefined;
}

// The frame is the viewport: the shell lays out at `width`, in a box that is never wider than the pane it sits in.
// When the pane is narrower than the frame, the whole frame is drawn scaled down to fit (the shell still lays out
// at `width`), so nothing scrolls sideways and the page is never pushed past the viewport.
function Frame({ width, children }: { width: number; children: ReactNode }): JSX.Element {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit>({ scale: 1, height: undefined });

  useLayoutEffect(() => {
    const box = outer.current;
    const frame = inner.current;
    if (!box || !frame || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      // A box with no measured width (not laid out yet) is drawn at full size rather than scaled to nothing.
      const scale = box.clientWidth > 0 ? Math.min(1, box.clientWidth / width) : 1;
      setFit({ scale, height: scale < 1 ? frame.offsetHeight * scale : undefined });
    };
    measure();
    const watcher = new ResizeObserver(measure);
    watcher.observe(box);
    watcher.observe(frame);
    return () => watcher.disconnect();
  }, [width]);

  const scaled = fit.scale < 1;
  return (
    <div style={{ minWidth: 0, maxWidth: '100%' }}>
      <p style={caption}>
        {width} wide{scaled ? `, drawn at ${Math.round(fit.scale * 100)}% to fit the pane` : ''}
      </p>
      <div ref={outer} style={{ ...outerStyle, height: fit.height }}>
        <div
          ref={inner}
          style={{
            width: `${width}px`,
            transform: scaled ? `scale(${fit.scale})` : undefined,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// "Docket" is from docs/ui/concept.md; the compiled-at time and the repo link are from the rule mockup, which
// holds no snapshot SHA. The links are the catalog's nav (docs/ui/screens.json primaryNav), the Plan route filled in
// with the plan the mockups read. The screen inside the frame is a placeholder: the shell is shown with no screen in it.
function Shell({ width }: { width: number }): JSX.Element {
  return (
    <Frame width={width}>
      <AppShell
        topBar={{ appName: 'Docket', defaultTheme: 'system' }}
        nav={{ current: 'matrix', items: catalogNav }}
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
