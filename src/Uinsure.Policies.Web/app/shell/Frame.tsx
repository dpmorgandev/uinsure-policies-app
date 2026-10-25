import { useEffect, useState } from 'react';
import { Outlet, matchPath, useLocation, useMatch } from 'react-router';
import { AppShell, Tabs } from '../../kit';
import type { FooterProps, NavItem, ThemeChoice, TopBarProps } from '../../kit';
import { loadTrace, markInteractive } from '../data/trace';
import { workbenchRoutes } from '../workbench/routes';
import { NodeHeader } from './NodeHeader';
import { REPO } from './repo';
import { SiteSearch } from './SiteSearch';
import { ShellProvider } from './ShellContext';
import type { TraceState } from './ShellContext';
import './notice.css';

// The built sections are links. The ones the app has not built are drawn as "not built yet", never as a link.
const navFor = (): NavItem[] => [
  { key: 'overview', label: 'Overview', href: '#/', scope: 'explorer' },
  { key: 'matrix', label: 'Requirements matrix', href: '#/rules', scope: 'explorer' },
  { key: 'plan', label: 'Plan', href: '#/plans/build', scope: 'explorer' },
  { key: 'decisions', label: 'Human decisions', href: '#/decisions', scope: 'explorer' },
  { key: 'about', label: 'How to read this', href: '#/about', scope: 'explorer' },
  { key: 'workbench', label: 'Workbench', href: '#/workbench', scope: 'workbench' },
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

  // PERF-1: the first screen is interactive once the trace has answered and its page is committed. Marked once.
  useEffect(() => {
    if (trace.state === 'loading' || performance.getEntriesByName('docket:interactive', 'mark').length > 0) return;
    markInteractive(performance);
  }, [trace.state]);

  const about = useMatch('/about');
  const activity = useMatch('/plans/:planId/:nodeId/activity');
  const overview = useMatch('/');
  const { pathname } = useLocation();
  const workbench = workbenchRoutes.find((r) => matchPath({ path: `/${r.path}`, end: true }, pathname) !== null);
  const matrix = useMatch('/rules');
  const rule = useMatch('/rules/:ruleId');
  const nodePage = useMatch('/plans/:planId/:nodeId');
  const walkthrough = useMatch('/plans/:planId/:nodeId/commits');
  const loop = useMatch('/plans/:planId/:nodeId/loop');
  const verdict = useMatch('/plans/:planId/:nodeId/verdicts/:round/:agent');
  const finding = useMatch('/plans/:planId/:nodeId/findings/:round');
  const planPage = useMatch('/plans/:planId');
  const sessionList = useMatch('/sessions');
  const sessionOpen = useMatch('/sessions/:file');
  const sessions = sessionList ?? sessionOpen;
  const decisions = useMatch('/decisions');
  const harness = useMatch('/harness');
  const stats = useMatch('/stats');
  const commit = useMatch('/commits/:sha');
  const { planId, nodeId } = (activity ?? walkthrough ?? nodePage ?? loop)?.params ?? {};

  const titles: [boolean, string][] = [
    [activity !== null || walkthrough !== null || nodePage !== null || loop !== null, `Node ${planId}/${nodeId}`],
    [verdict !== null, 'Verdict'],
    [finding !== null, 'Finding'],
    [planPage !== null, 'Plan'],
    [commit !== null, `Commit ${(commit?.params.sha ?? '').slice(0, 7)}`],
    [rule !== null, 'Rule'],
    [matrix !== null, 'Requirements matrix'],
    [about !== null, 'How to read this'],
    [sessions !== null, 'Sessions'],
    [decisions !== null, 'Human decisions'],
    [harness !== null, 'Harness'],
    [stats !== null, 'Delivery stats'],
    [overview !== null, 'Overview'],
    [workbench !== undefined, workbench?.title ?? ''],
  ];
  const title = titles.find(([matched]) => matched)?.[1] ?? 'Not found';
  // Sessions and the harness are read as "about" the project; the delivery stats sit under the overview.
  const current =
    about || sessions || harness
      ? 'about'
      : decisions
        ? 'decisions'
        : overview || stats
        ? 'overview'
        : planPage || nodePage || walkthrough || activity || commit || loop || verdict || finding
          ? 'plan'
          : matrix || rule
            ? 'matrix'
            : workbench
              ? 'workbench'
              : '';

  useEffect(() => {
    document.title = `${title} · Docket`;
  }, [title]);

  const node = trace.state === 'ready' ? trace.trace.nodes.find((n) => n.plan === planId && n.id === nodeId) : undefined;
  // DAG-1: every plan trace.json holds is one tab, each opening its own page, so the ui plan and the investigations
  // are one click from the build plan.
  const plans = trace.state === 'ready' ? trace.trace.plans : [];
  const content = (
    <ShellProvider value={{ trace, theme, setTheme }}>
      {planPage !== null && plans.length > 0 ? (
        <Tabs
          label="Plans"
          current={planPage.params.planId ?? ''}
          items={plans.map((plan) => ({ key: plan.id, label: plan.id, href: `#/plans/${plan.id}` }))}
        />
      ) : null}
      {node !== undefined && trace.state === 'ready' ? (
        <NodeHeader node={node} compiledAt={trace.snapshot.utc} current={activity ? 'activity' : walkthrough ? 'walkthrough' : loop ? 'loop' : 'node'} />
      ) : null}
      <Outlet />
    </ShellProvider>
  );
  const topBar: TopBarProps = {
    appName: 'Docket',
    homeHref: '#/',
    theme,
    onThemeChange: setTheme,
    search: (
      <ShellProvider value={{ trace, theme, setTheme }}>
        <SiteSearch />
      </ShellProvider>
    ),
  };

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
    <AppShell topBar={topBar} nav={{ current, items: navFor() }} footer={footer}>
      {content}
    </AppShell>
  );
}
