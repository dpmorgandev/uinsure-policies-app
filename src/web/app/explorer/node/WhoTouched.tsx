import { AgentBadge, DataTable, ShaLink } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import type { Trace, TraceCommit } from '../../data/trace';
import { agentCheck, agentOf } from '../../shell/agents';
import { commitUrl } from '../../shell/repo';
import { Rung } from '../../shell/Rung';

type Row = TraceCommit & { id: string };

const MARK = { match: '✓', mismatch: '✗', unrecorded: 'not recorded' } as const;

const badge = (name: string | null | undefined) => {
  const known = agentOf(name);
  return known === null ? (name ?? 'none') : <AgentBadge agent={known} />;
};

const columns: DataTableColumn<Row>[] = [
  { id: 'commit', header: 'Commit', mono: true, rowHeader: true, cell: (c) => <ShaLink sha={c.short} fullSha={c.sha} githubHref={commitUrl(c.sha)} /> },
  { id: 'trailer', header: 'Agent trailer', cell: (c) => badge(c.agent) },
  { id: 'hook', header: 'Agent the hook saw', cell: (c) => (c.hookAgent ? badge(c.hookAgent) : 'not recorded') },
  { id: 'match', header: 'Match', cell: (c) => MARK[agentCheck(c)] },
];

/** AGENT-1: every commit of the node, in walkthrough order, with both agents and whether they agree. */
export function WhoTouched({ trace, plan, node }: { trace: Trace; plan: string; node: string }) {
  const rows: Row[] = trace.commits
    .filter((c) => c.plan === plan && c.node === node)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .map((c) => ({ ...c, id: c.sha }));
  return (
    <Rung region="who-touched-what" req="AGENT-1" ordinal="Step 5" heading="Who touched what">
      <DataTable
        caption="Commits of this node, with the agent in the trailer and the agent the hook saw"
        columns={columns}
        rows={rows}
        empty={{ title: 'No commit names this node in its trailers.' }}
      />
    </Rung>
  );
}
