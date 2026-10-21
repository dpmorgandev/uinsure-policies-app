import { DataTable, FilterBar, NotBuiltYet, PageHeader, RuleChip, ShaLink, StatusTag } from '../../../kit';
import { Rung } from '../../shell/Rung';

interface Row {
  id: string;
}

// Stub: the reference's first row, canned. The loader replaces it with the trace's rules.
const ROWS: Row[] = [{ id: 'GET-1' }];

export function Matrix() {
  return (
    <>
      <Rung region="filters-status-feature" req="MATRIX-1" ordinal="Step 1" heading="Filter the matrix">
        <PageHeader eyebrow="Index · requirements matrix" title="Requirements matrix" />
        <ShaLink sha={null} missingLabel="no snapshot SHA" />
        <FilterBar filters={[]} matchCount={ROWS.length} totalCount={ROWS.length} noun="rules" />
      </Rung>
      <Rung region="matrix-table" req="MATRIX-1" ordinal="Step 2" heading="Read the table">
        <DataTable<Row>
          caption="Rules, their status and their commits"
          rows={ROWS}
          columns={[
            { id: 'rule', header: 'Rule', rowHeader: true, cell: (row) => <RuleChip ruleId={row.id} href={`#/rules/${row.id}`} /> },
            { id: 'status', header: 'Status', cell: () => <StatusTag status="not-built" /> },
            { id: 'red', header: 'Red', mono: true, cell: () => <ShaLink sha={null} /> },
          ]}
        />
      </Rung>
      <Rung
        region="test-count-scope-note-counts-are-per-node-sell-7-10-at-f1-vs-15-traited"
        req="DATA-4"
        ordinal="Step 3"
        heading="Test counts are per node"
      >
        <NotBuiltYet kind="region" name="test-count scope note" />
      </Rung>
    </>
  );
}
