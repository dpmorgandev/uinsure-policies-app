import { useLocation } from 'react-router';
import { EmptyState, PageHeader } from '../../kit';
import { DataNotice } from './DataNotice';
import { Region } from './Rung';
import { useShell } from './ShellContext';
import { SiteSearch } from './SiteSearch';

/** The route no screen answers: the path asked for is the location's. */
export function NotFoundPath() {
  return <NotFound asked={useLocation().pathname} />;
}

/** NAV-2: a path that names nothing. It names the path asked for and the snapshot, and claims nothing was compiled only when nothing was. */
export function NotFound({ asked }: { asked: string }) {
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  return (
    <Region region="what-was-asked-for-and-where-to-go" req="NAV-2" label="Not found">
      <PageHeader
        eyebrow="Not found"
        title={`Nothing at ${asked}`}
        answer="Not in this snapshot. No rule, node, SHA or round matches the path asked for, so no rung, verdict or sign-off is shown."
        status={{ value: 'not-built', label: 'Not found' }}
        ids={[
          { label: 'Path asked for', value: asked },
          { label: 'Snapshot SHA', value: `${trace.snapshot.ref} ${trace.snapshot.short}` },
        ]}
        compiledAt={trace.snapshot.utc}
      />
      <EmptyState
        context="error"
        title={`${asked} is not a rule, node, SHA or round in this snapshot.`}
        why={
          <>
            Nothing was guessed and no nearest match is offered. <a href="#/rules">Go to the requirements matrix</a> or search for it below.
          </>
        }
        to={{ label: 'Go to the overview', href: '#/' }}
      />
      <SiteSearch />
    </Region>
  );
}
