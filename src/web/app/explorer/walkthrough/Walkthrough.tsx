import { useParams } from 'react-router';
import { AgentBadge, DataTable, NotBuiltYet, RuleChip, ShaLink, TddStepTag } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import type { Trace, TraceRung } from '../../data/trace';
import { agentOf } from '../../shell/agents';
import { DataNotice } from '../../shell/DataNotice';
import { commitUrl } from '../../shell/repo';
import { Rung } from '../../shell/Rung';
import { chipStatus, ruleHref } from '../../shell/ruleLinks';
import { useShell } from '../../shell/ShellContext';
import '../explorer.css';

interface Row {
  id: string;
  n: number;
  rung: TraceRung;
  rules: string[];
}

const columnsFor = (trace: Trace): DataTableColumn<Row>[] => [
  { id: 'n', header: '#', cell: (row) => `#${row.n}`, rowHeader: true },
  { id: 'commit', header: 'Commit', cell: (row) => <ShaLink sha={row.rung.sha.slice(0, 7)} fullSha={row.rung.sha} githubHref={commitUrl(row.rung.sha)} /> },
  { id: 'tdd', header: 'TDD step', cell: (row) => <TddStepTag step={row.rung.tdd} /> },
  { id: 'agent', header: 'Agent', cell: (row) => <AgentBadge agent={agentOf(row.rung.agent)} /> },
  {
    id: 'rule',
    header: 'Rule',
    cell: (row) =>
      row.rules.length === 0 ? (
        '—'
      ) : (
        <span className="s-chips">
          {row.rules.map((id) => (
            <RuleChip key={id} ruleId={id} status={chipStatus(trace, id)} href={ruleHref(id)} />
          ))}
        </span>
      ),
  },
  { id: 'subject', header: 'Subject', cell: (row) => row.rung.subject ?? '—', wrap: 'anywhere' },
];

// The header, banner and tabs come from the frame; this is the commit sequence under them.
export function Walkthrough() {
  const { planId = '', nodeId = '' } = useParams();
  const { trace: loaded } = useShell();
  if (loaded.state !== 'ready') return <DataNotice trace={loaded} />;
  const { trace } = loaded;
  const node = trace.nodes.find((candidate) => candidate.plan === planId && candidate.id === nodeId);
  if (node === undefined) return <NotBuiltYet kind="node" name={`${planId}/${nodeId}`} back={{ href: '#/', label: 'Back to the overview' }} />;

  // TDD-1: a rung is a commit with a walkthrough row; the others (a node in flight has none yet) are named under the table.
  const rungs = node.walkthrough ?? [];
  const rows: Row[] = rungs
    .flatMap((rung) => (rung.n === null ? [] : [{ id: rung.sha, n: rung.n, rung, rules: trace.commits.find((c) => c.sha.startsWith(rung.sha))?.rule ?? [] }]))
    .sort((a, b) => a.n - b.n);
  const unnumbered = rungs.filter((rung) => rung.n === null);
  const gitOnly = node.completeness?.includes('git-only') ?? false;

  return (
    <Rung region="commit-sequence" req="TDD-1" ordinal="Step 1" heading="Follow the commits">
      {rows.length === 0 && gitOnly ? (
        <p className="s-text">The node predates the trail, so no walkthrough was rendered. That is not the same as nothing being committed.</p>
      ) : null}
      <DataTable
        caption={
          rows.length === 0
            ? `Commits of ${node.id}. The trail holds no walkthrough row for any of them.`
            : `Commits of ${node.plan}/${node.id} in walkthrough order, #${rows[0]?.n} to #${rows[rows.length - 1]?.n}. The # is the walkthrough's row number, not a date.`
        }
        columns={columnsFor(trace)}
        rows={rows}
        sort={{ columnId: 'n', direction: 'ascending' }}
        empty={{ context: 'not-built', title: 'No commit has a walkthrough row yet.', why: 'A missing step is drawn as a gap, never as a failure.' }}
      />
      {unnumbered.length === 0 ? null : (
        <div className="s-group">
          <p className="s-text">
            {unnumbered.length === 1 ? 'One commit on this node has' : `${unnumbered.length} commits on this node have`} no walkthrough number, so{' '}
            {unnumbered.length === 1 ? 'it is not a rung' : 'they are not rungs'} in the sequence. Oldest first:
          </p>
          <ul className="s-bullets">
            {unnumbered.map((rung) => (
              <li key={rung.sha}>
                <ShaLink sha={rung.sha.slice(0, 7)} fullSha={rung.sha} githubHref={commitUrl(rung.sha)} /> {rung.subject ?? ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Rung>
  );
}
