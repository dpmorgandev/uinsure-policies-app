import { useEffect } from 'react';
import { Outlet, useMatch } from 'react-router';
import { AppShell } from '../../kit';
import { NodeHeader } from './NodeHeader';

const REPO = 'https://github.com/dpmorgandev/uinsure-policies-api';

// The built sections. A section that is not built is absent, never a link that goes nowhere.
const NAV = [
  { key: 'overview', label: 'Overview', href: '#/', scope: 'explorer' },
  { key: 'about', label: 'How to read this', href: '#/about', scope: 'explorer' },
];

/** The frame every route shares. The route decides the title, the current nav item and the node header. */
export function Frame() {
  const about = useMatch('/about');
  const activity = useMatch('/plans/:planId/:nodeId/activity');
  const { planId, nodeId } = activity?.params ?? {};

  const overview = useMatch('/');

  const title = activity ? `Node ${planId}/${nodeId}` : about ? 'How to read this' : overview ? 'Overview' : 'Not built yet';
  const current = activity ? 'plan' : about ? 'about' : overview ? 'overview' : '';

  useEffect(() => {
    document.title = `${title} · Docket`;
  }, [title]);

  return (
    <AppShell
      topBar={{ appName: 'Docket', homeHref: '#/', defaultTheme: 'system' }}
      nav={{ current, items: NAV }}
      footer={{
        // Canned for the stub: the snapshot stamp comes from trace.json's compiledAt.
        compiledAt: {
          sha: 'b394466',
          fullSha: 'b394466f9e89d823fbe13a904ab45296d782b033',
          commitHref: `${REPO}/commit/b394466f9e89d823fbe13a904ab45296d782b033`,
          time: '2026-10-19T17:45:08Z',
        },
        provenanceHref: '#/about',
        repoHref: REPO,
      }}
    >
      {planId !== undefined && nodeId !== undefined ? <NodeHeader planId={planId} nodeId={nodeId} /> : null}
      <Outlet />
    </AppShell>
  );
}
