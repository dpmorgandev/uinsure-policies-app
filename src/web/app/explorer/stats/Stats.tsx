import { AgentBadge, DataTable, PageHeader, ReceiptFigure, StatusTag } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import type { Trace, TraceNode, TraceVerdict } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { agentOf } from '../../shell/agents';
import { useShell } from '../../shell/ShellContext';
import '../u5.css';

interface NodeRow {
  id: string;
  node: TraceNode;
  position: number;
  verdicts: TraceVerdict[];
}

interface FailRow {
  id: string;
  node: string;
  verdict: TraceVerdict;
}

/** `A2.3` sorts after `A2` and before `A3`: by each numeric part in turn. */
function roundOrder(a: string, b: string): number {
  const parts = (round: string): number[] => round.replace(/^A/, '').split('.').map(Number);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    const diff = (x[i] ?? 0) - (y[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** The rounds a node's verdicts fall in, oldest first, each with its verdicts by agent. */
function roundsOf(verdicts: TraceVerdict[]): { round: string; verdicts: TraceVerdict[] }[] {
  return [...new Set(verdicts.map((v) => v.round))]
    .sort(roundOrder)
    .map((round) => ({ round, verdicts: verdicts.filter((v) => v.round === round).sort((a, b) => a.agent.localeCompare(b.agent)) }));
}

const byRoundText = (verdicts: TraceVerdict[]): string =>
  roundsOf(verdicts)
    .map(({ round, verdicts: inRound }) => `${round}: ${inRound.map((v) => `${v.agent} ${v.verdict}`).join(', ')}.`)
    .join(' ');

function stampsText(verdicts: TraceVerdict[]): string {
  const stamps = verdicts.flatMap((v) => (v.ts ? [v.ts] : [])).sort();
  const [first, last] = [stamps[0], stamps[stamps.length - 1]];
  return first === undefined || last === undefined ? 'none recorded' : first === last ? first : `${first} to ${last}`;
}

function LastVerdict({ verdicts }: { verdicts: TraceVerdict[] }) {
  const last = roundsOf(verdicts).pop();
  if (last === undefined) return <>none recorded</>;
  const failed = last.verdicts.some((v) => v.verdict !== 'PASS');
  return <StatusTag status={failed ? 'fail' : 'pass'}>{`${failed ? 'FAIL' : 'PASS'} at ${last.round}`}</StatusTag>;
}

const nodeColumns: DataTableColumn<NodeRow>[] = [
  { id: 'node', header: 'Node', rowHeader: true, cell: (row) => `#${row.position} ${row.node.id}` },
  { id: 'stamps', header: 'First to last verdict (UTC)', mono: true, cell: (row) => stampsText(row.verdicts) },
  {
    id: 'rounds',
    header: 'Verdicts by round',
    cell: (row) => (row.verdicts.length === 0 ? `No verdicts recorded for ${row.node.id}.` : byRoundText(row.verdicts)),
  },
  { id: 'attempts', header: 'Attempts', numeric: true, cell: (row) => row.node.attempt ?? 'not recorded' },
  { id: 'last', header: 'Last verdict', cell: (row) => <LastVerdict verdicts={row.verdicts} /> },
];

const failColumns: DataTableColumn<FailRow>[] = [
  { id: 'where', header: 'Node · round', rowHeader: true, cell: (row) => `${row.node} · ${row.verdict.round}` },
  { id: 'stamp', header: 'Verdict stamp (UTC)', mono: true, cell: (row) => row.verdict.ts ?? 'none recorded' },
  { id: 'agent', header: 'Agent', cell: (row) => (agentOf(row.verdict.agent) === null ? row.verdict.agent : <AgentBadge agent={agentOf(row.verdict.agent)} />) },
  { id: 'attempt', header: 'Attempt', numeric: true, cell: (row) => row.verdict.attempt ?? 'not recorded' },
  { id: 'verdict', header: 'Verdict', cell: () => <StatusTag status="fail">FAIL</StatusTag> },
];

function answerOf(rows: NodeRow[], fails: number): string {
  const counted = rows.flatMap((row) => (row.node.attempt === null ? [] : [{ id: row.node.id, attempt: row.node.attempt }]));
  const most = Math.max(...counted.map((c) => c.attempt));
  const failWord = `${fails} FAIL ${fails === 1 ? 'verdict is' : 'verdicts are'} recorded.`;
  if (counted.length === 0) return `No node records an attempt count. ${failWord}`;
  return `${counted.filter((c) => c.attempt === most).map((c) => c.id).join(', ')} took the most attempts, ${most}. ${failWord}`;
}

function StatsTables({ trace, snapshot }: { trace: Trace; snapshot: { ref: string; short: string; utc: string } }) {
  const plan = trace.plans.find((p) => p.kind === 'build');
  const nodes = trace.nodes.filter((n) => n.plan === plan?.id);
  const rows: NodeRow[] = nodes.map((node, index) => ({
    id: node.id,
    node,
    position: index + 1,
    verdicts: trace.verdicts.filter((v) => v.plan === node.plan && v.node === node.id),
  }));
  const fails: FailRow[] = rows.flatMap((row) =>
    row.verdicts
      .filter((v) => v.verdict === 'FAIL')
      .sort((a, b) => (a.ts ?? '').localeCompare(b.ts ?? ''))
      .map((verdict) => ({ id: `${row.id}-${verdict.round}-${verdict.agent}`, node: row.id, verdict })),
  );
  return (
    <section className="s-u5-region" data-region="facts-per-agent-and-node" data-req="STATS-1">
      <PageHeader
        eyebrow="Overview · build plan"
        title="Delivery stats"
        question="How many attempts did each node take, and which agent's FAIL sent it round again?"
        answer={answerOf(rows, fails.length)}
        ids={[
          { label: 'Plan', value: plan?.id ?? null },
          { label: 'Snapshot SHA', value: `${snapshot.ref} ${snapshot.short}` },
        ]}
        compiledAt={snapshot.utc}
      />
      <div className="s-u5-block" id="attempts">
        <h2 className="s-u5-head">Attempts per node</h2>
        <p className="s-u5-note">
          Attempts are each node&apos;s recorded attempt count. The two stamps are the first and last verdict recorded for the node; they are
          not the node&apos;s start and end, so no elapsed time is worked out from them.
        </p>
        <DataTable<NodeRow>
          caption="Attempts per node for the build plan, numbered by position in the plan's node list. A round with no verdict in the data is not listed."
          rows={rows}
          columns={nodeColumns}
        />
      </div>
      <div className="s-u5-block" id="fails">
        <h2 className="s-u5-head">Every FAIL verdict, and whose it was</h2>
        {fails.length === 0 ? (
          <p className="s-u5-note">No FAIL verdict is recorded for the build plan.</p>
        ) : (
          <>
            <p className="s-u5-note">
              Each FAIL in the data keeps its own row: node and round, the verdict&apos;s stamp, the agent that gave it and the attempt it was
              recorded under.
            </p>
            <DataTable<FailRow> caption="FAIL verdicts for the build plan, in plan order and then by verdict stamp." rows={fails} columns={failColumns} />
          </>
        )}
      </div>
      <div className="s-u5-block" id="gaps">
        <h2 className="s-u5-head">Not in this page&apos;s data</h2>
        <div className="s-u5-gaps">
          <div className="s-u5-gap">
            <ReceiptFigure
              unit="Commits per agent"
              notBuiltNote="this page's data holds verdicts and attempt counts, not commits; a gap, not a zero"
            />
          </div>
          <div className="s-u5-gap">
            <ReceiptFigure
              unit="Elapsed time per node"
              notBuiltNote="the data gives verdict stamps, not each node's start and end, so no duration is worked out; the stamps are in the table above"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Stats() {
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  return <StatsTables trace={trace.trace} snapshot={trace.snapshot} />;
}
