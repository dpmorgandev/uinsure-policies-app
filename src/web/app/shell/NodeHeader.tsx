import { Breadcrumbs, CompletenessBanner, NotBuiltYet, PageHeader, Tabs } from '../../kit';
import type { Status } from '../../kit';
import type { TraceNode } from '../data/trace';

const STATUS: Record<string, { value: Status; label: string }> = {
  done: { value: 'pass', label: 'Done' },
  in_progress: { value: 'pending', label: 'In progress' },
  pending: { value: 'pending', label: 'Pending' },
};

/** A status the table does not know is shown as the trail wrote it, as a warning, never mapped to a friendlier one. */
function statusOf(status: string | null): { value: Status; label: string } | null {
  if (status === null) return null;
  return STATUS[status] ?? { value: 'warn', label: status };
}

/** The node's header and tabs, from the node's own entry in trace.json. */
export function NodeHeader({ node, compiledAt }: { node: TraceNode; compiledAt: string }) {
  const base = `#/plans/${node.plan}/${node.id}`;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Plans', href: `#/plans/${node.plan}` },
          { label: node.plan, href: `#/plans/${node.plan}` },
          { label: node.id, href: base, mono: true },
        ]}
      />
      <PageHeader
        eyebrow={`Node · ${node.plan}/${node.id}`}
        title={node.title === null ? node.id : `${node.id} ${node.title}`}
        status={statusOf(node.status)}
        ids={[{ label: 'Attempt', value: node.attempt === null ? null : String(node.attempt) }]}
        compiledAt={compiledAt}
      />
      {node.completeness === null ? (
        <NotBuiltYet kind="region" name="trail completeness" />
      ) : (
        <CompletenessBanner value={node.completeness} />
      )}
      <Tabs
        current="activity"
        items={[
          { key: 'node', label: 'Node', href: base },
          { key: 'walkthrough', label: 'Walkthrough', href: `${base}/commits` },
          { key: 'loop', label: 'Loop', href: `${base}/loop` },
          { key: 'activity', label: 'Activity', href: `${base}/activity` },
        ]}
      />
    </>
  );
}
