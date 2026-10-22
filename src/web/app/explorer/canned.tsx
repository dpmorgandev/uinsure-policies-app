// U2's stub: canned content from the design fixture, standing where the node's regions will read trace.json.
// Each export is replaced by real data at the loader and screen layers, and this file goes with them.
import { DagGraph, DiffViewer } from '../../kit';
import type { DagGraphProps } from '../../kit';

// The barrel does not export DagNode (a kit gap, reported); this is the same type.
type DagNode = DagGraphProps['nodes'][number];

const nodeHref = (id: string): string => `#/plans/build/${id}`;

export const CANNED_PLAN_NODES: readonly DagNode[] = [
  { id: 'F0a', title: 'Harness', status: 'done', dependsOn: [], rules: ['DAG-1'], href: nodeHref('F0a') },
  { id: 'F0b', title: 'Walking skeleton', status: 'done', dependsOn: ['F0a'], rules: ['NODE-1'], href: nodeHref('F0b') },
  { id: 'F1', title: 'Sell (+ bare GET)', status: 'done', dependsOn: ['F0b'], rules: ['SELL-1', 'SELL-2'], href: nodeHref('F1'), pr: 10 },
  { id: 'F2', title: 'Retrieve', status: 'in-progress', dependsOn: ['F1'], rules: ['GET-1'], href: nodeHref('F2') },
  { id: 'F3', title: 'Cancel (+ quote, + claims)', status: 'pending', dependsOn: ['F2'], rules: ['CANCEL-1a'], href: nodeHref('F3') },
];

export const ruleHref = (id: string): string => `#/rules/${encodeURIComponent(id)}`;

/** The plan's graph and its text-equivalent table, the same canned nodes on the plan page and the overview. */
export function CannedPlanGraph() {
  return <DagGraph nodes={CANNED_PLAN_NODES} />;
}

export interface CannedRung {
  id: string;
  n: string;
  sha: string;
  tdd: string | null;
  agent: 'main' | 'tester' | 'builder';
  rule: string | null;
  subject: string;
}

export const CANNED_RUNGS: CannedRung[] = [
  { id: '1', n: '#1', sha: 'e5cb70b', tdd: 'trace', agent: 'main', rule: null, subject: 'F2 trail tail (merged)' },
  { id: '5', n: '#5', sha: '94a7473', tdd: 'red', agent: 'tester', rule: 'CANCEL-1c', subject: 'the cancellation quote answers the day counts' },
  { id: '17', n: '#17', sha: '92ede9e', tdd: 'green', agent: 'builder', rule: 'CANCEL-1c', subject: 'quote the refund for the cancellation date' },
];

/** One commit's diff before it is asked for. */
export function CannedDiff({ rung, sha, tdd, layer, agent }: Pick<CannedRung, 'sha' | 'tdd' | 'agent'> & { rung: string; layer: string }) {
  return (
    <DiffViewer
      status="idle"
      rung={rung}
      sha={sha}
      tdd={tdd}
      layer={layer}
      agent={agent}
      loadLabel={`Load ${tdd ?? ''} diff, ${rung} ${sha}`}
      onLoad={() => undefined}
    />
  );
}
