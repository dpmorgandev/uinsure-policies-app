import { DagGraph } from '../../../kit';
import type { DagGraphProps } from '../../../kit';
import type { Trace, TraceNode, TracePlan } from '../../data/trace';

// The barrel does not export DagNode (a kit gap, reported); this is the same type.
type DagNode = DagGraphProps['nodes'][number];

/** A node the plan marks done or pending is drawn as such; any other status means work has begun (in_progress, paused_acceptance). */
function statusOf(status: string | null): DagNode['status'] {
  if (status === 'done') return 'done';
  return status === null || status === 'pending' ? 'pending' : 'in-progress';
}

function dagNodeOf(node: TraceNode): DagNode {
  return {
    id: node.id,
    title: node.title ?? 'no title recorded',
    status: statusOf(node.status),
    dependsOn: node.dependsOn ?? [],
    rules: node.rules,
    href: `#/plans/${node.plan}/${node.id}`,
    pr: node.pr,
  };
}

/** DAG-1: the plan's nodes in the order its file lists them, as the kit's graph and its text-equivalent table. */
export function PlanGraph({ trace, plan }: { trace: Trace; plan: TracePlan }) {
  const nodes = plan.nodes.flatMap((id) => trace.nodes.filter((node) => node.plan === plan.id && node.id === id)).map(dagNodeOf);
  if (nodes.length === 0) return <p className="s-text">Plan {plan.id} lists no nodes, so there is no graph to draw.</p>;
  return <DagGraph nodes={nodes} />;
}
