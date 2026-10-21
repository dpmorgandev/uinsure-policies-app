import { useEffect, useState } from 'react';
import { Outlet, useMatch } from 'react-router';
import { AppShell } from '../../kit';
import type { FooterProps, NavItem, ThemeChoice, TopBarProps } from '../../kit';
import { loadTrace } from '../data/trace';
import { NodeHeader } from './NodeHeader';
import { REPO } from './repo';
import { ShellProvider } from './ShellContext';
import type { TraceState } from './ShellContext';
import './notice.css';

// The built sections are links. The ones the app has not built are drawn as "not built yet", never as a link.
const NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', href: '#/', scope: 'explorer' },
  { key: 'matrix', label: 'Requirements matrix', notBuilt: true, scope: 'explorer' },
  { key: 'plan', label: 'Plan', notBuilt: true, scope: 'explorer' },
  { key: 'decisions', label: 'Human decisions', notBuilt: true, scope: 'explorer' },
  { key: 'about', label: 'How to read this', href: '#/about', scope: 'explorer' },
  { key: 'workbench', label: 'Workbench', notBuilt: true, scope: 'workbench' },
];

const DARK = '(prefers-color-scheme: dark)';

/** THEME-1: data-theme on <html>, from the toggle, or from the system setting while the choice is System. */
function useAppliedTheme(choice: ThemeChoice): void {
  useEffect(() => {
    const system = window.matchMedia(DARK);
    const apply = (): void => {
      document.documentElement.dataset['theme'] = choice === 'system' ? (system.matches ? 'dark' : 'light') : choice;
    };
    apply();
    if (choice !== 'system') return undefined;
    system.addEventListener('change', apply);
    return () => system.removeEventListener('change', apply);
  }, [choice]);
}

/** DATA-1: trace.json is read once, here; every screen gets what came back. */
function useTraceFile(): TraceState {
  const [trace, setTrace] = useState<TraceState>({ state: 'loading' });
  useEffect(() => {
    let current = true;
    void loadTrace().then((loaded) => {
      if (current) setTrace(loaded);
    });
    return () => {
      current = false;
    };
  }, []);
  return trace;
}

/** The frame every route shares. The route decides the title, the current nav item and the node header. */
export function Frame() {
  const trace = useTraceFile();
  const [theme, setTheme] = useState<ThemeChoice>('system');
  useAppliedTheme(theme);

  const about = useMatch('/about');
  const activity = useMatch('/plans/:planId/:nodeId/activity');
  const overview = useMatch('/');
  const { planId, nodeId } = activity?.params ?? {};

  const title = activity ? `Node ${planId}/${nodeId}` : about ? 'How to read this' : overview ? 'Overview' : 'Not built yet';
  const current = about ? 'about' : overview ? 'overview' : '';

  useEffect(() => {
    document.title = `${title} · Docket`;
  }, [title]);

  const node = trace.state === 'ready' ? trace.trace.nodes.find((n) => n.plan === planId && n.id === nodeId) : undefined;
  const content = (
    <ShellProvider value={{ trace, theme, setTheme }}>
      {node !== undefined && trace.state === 'ready' ? <NodeHeader node={node} compiledAt={trace.snapshot.utc} /> : null}
      <Outlet />
    </ShellProvider>
  );
  const topBar: TopBarProps = { appName: 'Docket', homeHref: '#/', theme, onThemeChange: setTheme };

  // HONEST-1: until a snapshot is read the footer says so; it never shows a stamp.
  const footer: FooterProps =
    trace.state === 'ready'
      ? {
          compiledAt: {
            sha: trace.snapshot.short,
            fullSha: trace.snapshot.sha,
            commitHref: `${REPO}/commit/${trace.snapshot.sha}`,
            time: trace.snapshot.utc,
          },
          provenanceHref: '#/about',
          repoHref: REPO,
        }
      : { noSnapshot: true, provenanceHref: '#/about', repoHref: REPO };
  return (
    <AppShell topBar={topBar} nav={{ current, items: NAV }} footer={footer}>
      {content}
    </AppShell>
  );
}
