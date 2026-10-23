import { AgentBadge, Breadcrumbs, CompletenessBanner, NotBuiltYet, PageHeader, Tabs } from '../../kit';
import type { Status } from '../../kit';
import type { TraceNode } from '../data/trace';
import { agentOf } from './agents';
import { pullUrl } from './repo';

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
export function NodeHeader({ node, compiledAt, current }: { node: TraceNode; compiledAt: string; current: 'node' | 'walkthrough' | 'loop' | 'activity' }) {
  const base = `#/plans/${node.plan}/${node.id}`;
  const gitOnly = node.completeness?.includes('git-only') ?? false;
  const owner = agentOf(node.owner);
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
        ids={[
          { label: 'Attempt', value: node.attempt === null ? null : String(node.attempt) },
          {
            label: 'PR',
            value: node.pr == null ? null : `#${node.pr}`,
            href: node.pr == null ? undefined : pullUrl(String(node.pr)),
            missing: 'no PR recorded',
          },
          { label: 'Depends on', value: node.dependsOn?.join(', '), missing: node.dependsOn === undefined ? undefined : 'none, a root' },
        ]}
        compiledAt={compiledAt}
        note={owner === null ? undefined : <AgentBadge agent={owner} />}
      />
      {node.completeness === null ? (
        // A node mid-loop has a trail and no README yet: its page says it is in progress (DATA-8), so no "not built" claim here.
        node.trail === true ? null : <NotBuiltYet kind="region" name="trail completeness" />
      ) : (
        <CompletenessBanner value={node.completeness} />
      )}
      <Tabs
        current={current}
        label={gitOnly ? 'Views of a git-only node' : undefined}
        items={[
          { key: 'node', label: 'Node', href: base },
          { key: 'walkthrough', label: 'Walkthrough', href: `${base}/commits` },
          { key: 'loop', label: 'Loop', href: `${base}/loop`, empty: gitOnly },
          { key: 'activity', label: 'Activity', href: `${base}/activity`, empty: gitOnly },
        ]}
      />
    </>
  );
}
