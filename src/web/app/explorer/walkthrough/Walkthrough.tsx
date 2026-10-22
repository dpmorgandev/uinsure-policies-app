import { AgentBadge, DataTable, RuleChip, ShaLink, TddStepTag } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import { DataNotice } from '../../shell/DataNotice';
import { commitUrl } from '../../shell/repo';
import { Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { CANNED_RUNGS, ruleHref } from '../canned';
import type { CannedRung } from '../canned';
import '../explorer.css';

const COLUMNS: DataTableColumn<CannedRung>[] = [
  { id: 'n', header: '#', cell: (row) => row.n, rowHeader: true },
  { id: 'commit', header: 'Commit', cell: (row) => <ShaLink sha={row.sha} githubHref={commitUrl(row.sha)} /> },
  { id: 'tdd', header: 'TDD step', cell: (row) => <TddStepTag step={row.tdd} /> },
  { id: 'agent', header: 'Agent', cell: (row) => <AgentBadge agent={row.agent} /> },
  { id: 'rule', header: 'Rule', cell: (row) => (row.rule === null ? '—' : <RuleChip ruleId={row.rule} status="built" href={ruleHref(row.rule)} />) },
  { id: 'subject', header: 'Subject', cell: (row) => row.subject, wrap: 'anywhere' },
];

// The header, banner and tabs come from the frame; this is the commit sequence under them.
export function Walkthrough() {
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  return (
    <Rung region="commit-sequence" req="TDD-1" ordinal="Step 1" heading="Follow the commits">
      <DataTable caption="Commits of the node in walkthrough order. The # is the walkthrough's row number, not a date." columns={COLUMNS} rows={CANNED_RUNGS} />
    </Rung>
  );
}
