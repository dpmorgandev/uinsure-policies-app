import type { JSX } from 'react';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// Every row is from the gate-counts table in the rule mockup (GET-1, build/F2). The "empty" rule ID
// "‹ruleId›" is the mockup's own placeholder for a rule with nothing built.
interface GateRow {
  id: string;
  ref: string;
  gate: string;
  scope: string;
  counts: string;
  held: boolean;
}

const GATES: GateRow[] = [
  { id: '1-1', ref: '1·1', gate: 'gate.red', scope: 'Api.Tests, Rule=GET-1', counts: '21 failed of 25', held: true },
  {
    id: '1-2',
    ref: '1·2',
    gate: 'gate.stub',
    scope: 'Api.Tests, Rule=GET-1',
    counts: '13 failed, 12 passed of 25',
    held: false,
  },
  { id: '2-1', ref: '2·1', gate: 'gate.stub', scope: 'Api.Tests, Rule=GET-1', counts: '21 failed of 25', held: true },
  { id: '2-2', ref: '2·2', gate: 'gate.red', scope: 'Domain.Tests, Rule=GET-1', counts: '22 of 22 pass', held: true },
  { id: '2-3', ref: '2·3', gate: 'gate.green', scope: 'Services.Tests, Rule=GET-1', counts: '6 of 6 pass', held: true },
  { id: '2-5', ref: '2·5', gate: 'gate.green', scope: 'whole solution', counts: '365 of 365 pass', held: true },
  { id: '33', ref: '#33', gate: 'gate.green', scope: 'whole solution', counts: '373 of 373 pass', held: true },
];

const result = (row: GateRow): JSX.Element =>
  row.held ? <StatusTag status="pass">Gate held</StatusTag> : <StatusTag status="fail">Gate failed</StatusTag>;

const COLUMNS: DataTableColumn<GateRow>[] = [
  { id: 'ref', header: 'Ref', cell: (row) => row.ref, rowHeader: true, sortable: true },
  { id: 'gate', header: 'Gate', cell: (row) => row.gate, mono: true },
  { id: 'scope', header: 'Scope', cell: (row) => row.scope },
  { id: 'counts', header: 'Counts', cell: (row) => row.counts, numeric: true },
  { id: 'result', header: 'Result', cell: result },
];

const CAPTION =
  'Gate counts for GET-1, in loop order. Sorted by the ref column, which is attempt then event; #33 is the spine rung the gate names.';

// The long-row text is the gate.stub detail from the rule mockup, shown in a 22rem frame.
interface DetailRow {
  id: string;
  ref: string;
  gate: string;
  detail: string;
}

const DETAIL_ROWS: DetailRow[] = [
  {
    id: '1-2',
    ref: '1·2',
    gate: 'gate.stub',
    detail:
      '(a) 5 pass by the canned status Active coinciding: Policy_sold_to_start_today_reads_back_Active, Status_on_the_start_date_is_Active, Status_on_the_end_date_is_Active, Status_at_23_30_UTC_on_an_end_date_in_GMT_is_Active, Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active.',
  },
  {
    id: '1-1',
    ref: '1·1',
    gate: 'gate.red',
    detail:
      'GET-1: 25 total, 21 failed. 4 pass at HEAD: the 404 /problems/get-1 rows, already answered by the F1 bare GET (pinned, not red).',
  },
];

const DETAIL_COLUMNS: DataTableColumn<DetailRow>[] = [
  { id: 'ref', header: 'Ref', cell: (row) => row.ref, rowHeader: true },
  { id: 'gate', header: 'Gate', cell: (row) => row.gate, mono: true },
  { id: 'detail', header: 'Detail', cell: (row) => row.detail, wrap: 'anywhere' },
];

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <DataTable
        caption={CAPTION}
        columns={COLUMNS}
        rows={GATES}
        sort={{ columnId: 'ref', direction: 'ascending' }}
        onSortChange={() => undefined}
      />
    ),
  },
  {
    state: 'empty',
    element: (
      <DataTable
        caption="Gate counts for rule ‹ruleId› (placeholder: no unbuilt rule ID is in the data)."
        columns={COLUMNS}
        rows={[]}
        empty={{
          context: 'not-built',
          title: 'Rule ‹ruleId› has no gate counts to show.',
          why: 'A missing step is drawn as a gap, never as a failure.',
          to: { label: 'Back to the requirements matrix', href: '#' },
        }}
      />
    ),
  },
  {
    state: 'load',
    element: <DataTable caption="Gate counts for GET-1, loading." columns={COLUMNS} rows={[]} loading />,
  },
  {
    state: 'err',
    element: (
      <DataTable
        caption="Gate counts for GET-1."
        columns={COLUMNS}
        rows={[]}
        error="The trail for GET-1 did not load, so no rung is drawn. Nothing on this page was guessed."
        onRetry={() => undefined}
      />
    ),
  },
  {
    state: 'long rows',
    element: (
      <div style={{ maxWidth: 'min(22rem, 100%)' }}>
        <DataTable
          caption="Gate detail for GET-1. Long names wrap inside their column; the table scrolls inside its own frame."
          columns={DETAIL_COLUMNS}
          rows={DETAIL_ROWS}
        />
      </div>
    ),
  },
];
