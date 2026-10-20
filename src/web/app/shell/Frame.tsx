import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet, useMatch } from 'react-router';
import { AppShell, PrimaryNav, TopBar } from '../../kit';
import type { NavItem, ThemeChoice, TopBarProps } from '../../kit';
import { loadTrace } from '../data/trace';
import { NodeHeader } from './NodeHeader';
import { REPO } from './repo';
import { ShellProvider } from './ShellContext';
import type { TraceState } from './ShellContext';
import './frame.css';

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

/** The page without a footer, for the time before a snapshot is known: top bar, navigation, main. */
function UnreadFrame({ topBar, current, children }: { topBar: TopBarProps; current: string; children: ReactNode }) {
  const mainId = useId();
  return (
    <div className="s-bare">
      <TopBar {...topBar} />
      <PrimaryNav current={current} items={NAV} />
      <main id={mainId} className="s-bare-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
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

  if (trace.state !== 'ready') {
    return (
      <UnreadFrame topBar={topBar} current={current}>
        {content}
      </UnreadFrame>
    );
  }
  const { sha, short, utc } = trace.snapshot;
  return (
    <AppShell
      topBar={topBar}
      nav={{ current, items: NAV }}
      footer={{
        compiledAt: { sha: short, fullSha: sha, commitHref: `${REPO}/commit/${sha}`, time: utc },
        provenanceHref: '#/about',
        repoHref: REPO,
      }}
    >
      {content}
    </AppShell>
  );
}
