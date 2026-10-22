import { DataTable, RuleChip, StatusTag } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import { Rung } from '../../shell/Rung';
import { ruleHref } from '../canned';

interface Round {
  id: string;
  covered: string;
}

// The stub's canned coverage; the loader layer replaces it with the verdicts' rulesCovered lists.
const CANNED_RULES = ['CANCEL-1a', 'CANCEL-1b'];
const CANNED_ROUNDS: Round[] = [{ id: 'A2', covered: '2 of 2' }];
const COLUMNS: DataTableColumn<Round>[] = [
  { id: 'round', header: 'Round', cell: (row) => row.id, rowHeader: true },
  { id: 'covered', header: 'Covered', cell: (row) => row.covered, numeric: true },
  { id: 'verdict', header: 'Verdict', cell: () => <StatusTag status="pass">PASS</StatusTag> },
];

export function NodeRules() {
  return (
    <Rung region="rules" req="NODE-1" ordinal="Step 2" heading="Rules this node covers">
      <div className="s-chips">
        {CANNED_RULES.map((id) => (
          <RuleChip key={id} ruleId={id} status="built" href={ruleHref(id)} />
        ))}
      </div>
      <DataTable caption="Reviewer coverage of the node's rules, one row per review round." columns={COLUMNS} rows={CANNED_ROUNDS} />
    </Rung>
  );
}

const TASK_COLUMNS: DataTableColumn<{ id: string }>[] = ['Task', 'Status', 'Owner', 'Attempt', 'Recorded in'].map((header) => ({
  id: header,
  header,
  cell: () => null,
}));

export function NodeTasks() {
  return (
    <Rung region="tasks" req="NODE-1" ordinal="Step 3" heading="Tasks and their status">
      <DataTable
        caption="Tasks of the node with their status."
        columns={TASK_COLUMNS}
        rows={[]}
        empty={{ context: 'not-built', title: "No task rows are in this page's data.", why: 'A missing step is drawn as a gap, never as a failure.' }}
      />
    </Rung>
  );
}
