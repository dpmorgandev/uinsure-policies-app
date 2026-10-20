import type { ReactNode } from 'react';
import { DataTable, RedactionToken } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import { NotBuiltRegion } from '../../shell/Rung';
import './activity.css';

interface EventRow {
  id: string;
  line: number;
  attempt: number;
  agent: string;
  tool: string;
  target: ReactNode;
}

// Canned for the stub: the first lines of build/F3, until the loader reads the node's activity chunk.
const ROWS: EventRow[] = [
  {
    id: '1',
    line: 1,
    attempt: 1,
    agent: 'main',
    tool: 'Bash',
    target: 'git rev-parse --abbrev-ref HEAD; git rev-parse --show-toplevel',
  },
  { id: '3', line: 3, attempt: 1, agent: 'main', tool: 'Write', target: <RedactionToken token="outside-repo" /> },
  { id: '6', line: 6, attempt: 1, agent: 'main', tool: 'Bash', target: 'git status --short; git log --oneline -1' },
];

const GAP = '—';

const COLUMNS: DataTableColumn<EventRow>[] = [
  { id: 'line', header: 'Line', cell: (row) => row.line, rowHeader: true, sortable: true },
  { id: 'attempt', header: 'Attempt', cell: (row) => row.attempt, numeric: true },
  { id: 'agent', header: 'Agent', cell: (row) => row.agent, mono: true },
  { id: 'tool', header: 'Tool', cell: (row) => row.tool, mono: true },
  { id: 'target', header: 'File or command', cell: (row) => row.target, mono: true, wrap: 'anywhere' },
  { id: 'commit', header: 'Commit', cell: () => GAP },
  { id: 'tdd', header: 'TDD trailer', cell: () => GAP },
];

export function Activity() {
  return (
    <>
      <NotBuiltRegion region="agent-lanes" name="agent lanes" />
      <section className="s-events" data-region="event-table-text-equivalent" data-req="AGENT-2 A11Y-1">
        <div className="s-events-head">
          <h2 className="s-events-title">Every line as text</h2>
          <p className="s-events-note">
            The lines in log order. A dash means the log holds none for that column; a redacted value shows as a labelled
            token. Clock times are left out on purpose: position here is the log line.
          </p>
        </div>
        <DataTable
          caption="Activity events for build/F3, three lines shown. Sorted by the Line column, ascending."
          columns={COLUMNS}
          rows={ROWS}
          sort={{ columnId: 'line', direction: 'ascending' }}
        />
      </section>
    </>
  );
}
