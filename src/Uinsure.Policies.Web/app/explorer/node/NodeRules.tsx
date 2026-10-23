import { DataTable, RuleChip, StatusTag } from '../../../kit';
import type { DataTableColumn, Status } from '../../../kit';
import type { Trace, TraceNode, TraceTask, TraceVerdict } from '../../data/trace';
import { Rung } from '../../shell/Rung';
import { chipStatus, ruleHref } from '../../shell/ruleLinks';
import '../explorer.css';

interface Round {
  id: string;
  covered: string;
  verdict: TraceVerdict;
}

function verdictTag(verdict: string): { status: Status; label: string } {
  if (verdict === 'PASS') return { status: 'pass', label: 'PASS' };
  if (verdict === 'FAIL') return { status: 'fail', label: 'FAIL' };
  return { status: 'warn', label: verdict };
}

const COLUMNS: DataTableColumn<Round>[] = [
  { id: 'round', header: 'Round', cell: (row) => row.id, rowHeader: true },
  { id: 'covered', header: 'Covered', cell: (row) => row.covered, numeric: true },
  {
    id: 'verdict',
    header: 'Verdict',
    cell: (row) => {
      const tag = verdictTag(row.verdict.verdict);
      return <StatusTag status={tag.status}>{tag.label}</StatusTag>;
    },
  },
];

/** The reviewer's rounds on the node, each counting how many of the node's rules its rulesCovered list names. */
function roundsOf(trace: Trace, node: TraceNode): Round[] {
  return trace.verdicts
    .filter((verdict) => verdict.plan === node.plan && verdict.node === node.id && verdict.agent === 'reviewer')
    .map((verdict) => ({
      id: verdict.round,
      covered: `${node.rules.filter((rule) => verdict.rulesCovered?.includes(rule)).length} of ${node.rules.length}`,
      verdict,
    }));
}

const NO_RULES: DataTableColumn<{ id: string }>[] = [{ id: 'rule', header: 'Rule', cell: () => null }];

export function NodeRules({ trace, node }: { trace: Trace; node: TraceNode }) {
  const acceptance = node.acceptance ?? [];
  return (
    <Rung region="rules" req="NODE-1" ordinal="Step 2" heading="Rules this node covers">
      {node.rules.length === 0 ? (
        <DataTable
          caption={`Rules of ${node.id}. Its rules list is empty.`}
          columns={NO_RULES}
          rows={[]}
          empty={{ context: 'not-built', title: 'This node lists no rules.', why: 'A missing step is drawn as a gap, never as a failure.' }}
        />
      ) : (
        <>
          <p className="s-text">
            {node.rules.length} {node.rules.length === 1 ? 'rule' : 'rules'}, counted from the node's rules list. Each chip opens its rule page.
          </p>
          <div className="s-chips">
            {node.rules.map((id) => (
              <RuleChip key={id} ruleId={id} status={chipStatus(trace, id)} href={ruleHref(id)} />
            ))}
          </div>
          <DataTable
            caption={`Reviewer coverage of ${node.id}'s rules, one row per review round, counted from each reviewer verdict's rulesCovered list.`}
            columns={COLUMNS}
            rows={roundsOf(trace, node)}
            empty={{ context: 'not-built', title: 'No reviewer verdict is recorded for this node.', why: 'A missing step is drawn as a gap, never as a failure.' }}
          />
        </>
      )}
      <h3 className="s-subheading">Acceptance, as planned</h3>
      {acceptance.length === 0 ? (
        <p className="s-text">The plan file lists no acceptance lines for this node.</p>
      ) : (
        <ol className="s-bullets">
          {acceptance.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      )}
    </Rung>
  );
}

const STATUS: Record<string, { status: Status; label: string }> = {
  done: { status: 'pass', label: 'Done' },
  pending: { status: 'pending', label: 'Pending' },
  in_progress: { status: 'pending', label: 'In progress' },
};

/** A task status the table does not know is shown as the plan wrote it, as a warning. */
function taskTag(task: TraceTask): { status: Status; label: string } | null {
  if (task.status === null) return null;
  return STATUS[task.status] ?? { status: 'warn', label: task.status };
}

const GAP = '—';

export function NodeTasks({ node, source }: { node: TraceNode; source: string | null | undefined }) {
  const tasks = node.tasks ?? [];
  const columns: DataTableColumn<TraceTask>[] = [
    {
      id: 'task',
      header: 'Task',
      // The trailing space keeps the title and the status word apart where the row is read as plain text.
      cell: (task) => (
        <>
          {task.title ?? GAP}{' '}
        </>
      ),
      rowHeader: true,
      wrap: 'anywhere',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (task) => {
        const tag = taskTag(task);
        return tag === null ? GAP : <><StatusTag status={tag.status}>{tag.label}</StatusTag>{' '}</>;
      },
    },
    { id: 'owner', header: 'Owner', cell: (task) => task.role ?? GAP },
    { id: 'attempt', header: 'Attempt', cell: () => node.attempt ?? GAP, numeric: true },
    { id: 'recorded', header: 'Recorded in', cell: () => source ?? GAP, mono: true, wrap: 'anywhere' },
  ];
  return (
    <Rung region="tasks" req="NODE-1" ordinal="Step 3" heading="Tasks and their status">
      <DataTable
        caption={
          tasks.length === 0
            ? `Tasks of ${node.id} with their status. No task rows are in this page's data.`
            : `Tasks of ${node.id} with their status, in the plan file's order.`
        }
        columns={columns}
        rows={tasks}
        empty={{ context: 'not-built', title: "No task rows are in this page's data.", why: 'A missing step is drawn as a gap, never as a failure.' }}
      />
    </Rung>
  );
}
