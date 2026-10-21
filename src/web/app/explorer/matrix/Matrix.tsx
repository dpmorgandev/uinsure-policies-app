import { useState } from 'react';
import { DataTable, FilterBar, NotBuiltYet, PageHeader, RuleChip, ShaLink, StatusTag } from '../../../kit';
import type { DataTableColumn, FilterDefinition, Status } from '../../../kit';
import type { Trace, TraceRule } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { blobUrl, commitUrl, pullUrl } from '../../shell/repo';
import { Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { buildRules, fullShaOf, ruleStatus, rulesSummary, testsText } from '../ruleFacts';
import '../explorer.css';

interface Row {
  id: string;
  rule: TraceRule;
  status: Status;
}

const STATUS_WORDS: Record<Status, string> = { pass: 'Pass', fail: 'Fail', warn: 'Warn', pending: 'Pending', 'not-built': 'Not built' };

const unique = (values: (string | null)[]): string[] => [...new Set(values.filter((value): value is string => value !== null))];

/** HONEST-1: an absent value is a labelled gap. A rule that is not built reads "not built yet"; a built one has simply recorded none. */
const gapOf = (row: Row): string => (row.status === 'not-built' ? 'not built yet' : 'none recorded');

function commitCell(trace: Trace, row: Row, short: string | null | undefined) {
  if (!short) return <ShaLink sha={null} missingLabel={gapOf(row)} />;
  const full = fullShaOf(trace, short);
  return <ShaLink sha={short} fullSha={full} githubHref={commitUrl(full)} />;
}

function columnsOf(trace: Trace, snapshotSha: string): DataTableColumn<Row>[] {
  return [
    {
      id: 'rule',
      header: 'Rule',
      rowHeader: true,
      cell: (row) => (
        <RuleChip ruleId={row.id} status={row.status === 'not-built' ? 'nb' : 'built'} href={`#/rules/${encodeURIComponent(row.id)}`} />
      ),
    },
    { id: 'title', header: 'Title', cell: (row) => row.rule.title ?? gapOf(row) },
    { id: 'feature', header: 'Feature', cell: (row) => row.rule.feature ?? gapOf(row) },
    { id: 'status', header: 'Status', cell: (row) => <StatusTag status={row.status} /> },
    {
      id: 'node',
      header: 'Node',
      mono: true,
      cell: (row) => {
        const plan = row.rule.matrix?.plan;
        const node = row.rule.matrix?.node;
        return plan && node ? <a href={`#/plans/${plan}/${node}`}>{`${plan}/${node}`}</a> : gapOf(row);
      },
    },
    { id: 'tests', header: 'Tests, at the node', mono: true, cell: (row) => testsText(row.rule.matrix?.tests) ?? gapOf(row) },
    { id: 'red', header: 'Red', mono: true, cell: (row) => commitCell(trace, row, row.rule.matrix?.red) },
    { id: 'green', header: 'Green', mono: true, cell: (row) => commitCell(trace, row, row.rule.matrix?.green) },
    { id: 'refactor', header: 'Refactor', mono: true, cell: (row) => commitCell(trace, row, row.rule.matrix?.refactor) },
    {
      id: 'qa',
      header: 'QA step',
      mono: true,
      cell: (row) => {
        const qa = row.rule.matrix?.qaStep;
        if (!qa) return gapOf(row);
        return (
          <a href={blobUrl(snapshotSha, qa.split('#')[0] ?? qa)} rel="noreferrer">
            {qa}
          </a>
        );
      },
    },
    { id: 'signoff', header: 'Sign-off', cell: (row) => row.rule.matrix?.signoff ?? gapOf(row) },
    {
      id: 'pr',
      header: 'PR',
      mono: true,
      cell: (row) => {
        const pr = row.rule.matrix?.pr;
        return pr ? (
          <a href={pullUrl(pr.replace('#', ''))} rel="noreferrer">
            {pr}
          </a>
        ) : (
          gapOf(row)
        );
      },
    },
  ];
}

function MatrixTables({ trace, snapshotSha, snapshotShort, utc }: { trace: Trace; snapshotSha: string; snapshotShort: string; utc: string }) {
  const [filter, setFilter] = useState({ status: '', feature: '' });
  const all: Row[] = buildRules(trace).map((rule) => ({ id: rule.id, rule, status: ruleStatus(rule) }));
  const rows = all.filter(
    (row) => (filter.status === '' || row.status === filter.status) && (filter.feature === '' || row.rule.feature === filter.feature),
  );
  const filters: FilterDefinition[] = [
    {
      id: 'status',
      label: 'Status',
      value: filter.status,
      options: [...new Set(all.map((row) => row.status))].map((status) => ({ value: status, label: STATUS_WORDS[status] })),
    },
    {
      id: 'feature',
      label: 'Feature',
      value: filter.feature,
      options: unique(all.map((row) => row.rule.feature)).map((feature) => ({ value: feature, label: feature })),
    },
  ];

  return (
    <>
      <Rung region="filters-status-feature" req="MATRIX-1" ordinal="Step 1" heading="Filter the matrix">
        <PageHeader
          eyebrow="Index · requirements matrix"
          title="Requirements matrix"
          status={rulesSummary(buildRules(trace))}
          compiledAt={utc}
        />
        <p className="s-text">
          Snapshot <ShaLink sha={snapshotShort} fullSha={snapshotSha} githubHref={commitUrl(snapshotSha)} />
        </p>
        <FilterBar
          filters={filters}
          onChange={(id, value) => setFilter((current) => ({ ...current, [id]: value }))}
          onClear={() => setFilter({ status: '', feature: '' })}
          matchCount={rows.length}
          totalCount={all.length}
          noun="rules"
        />
      </Rung>
      <Rung region="matrix-table" req="MATRIX-1" ordinal="Step 2" heading="Read the table">
        {rows.length === 0 ? (
          <p className="s-text">No rule matches the filters, so there is no table to show.</p>
        ) : (
          <DataTable<Row> caption="Rules, their status and their commits" rows={rows} columns={columnsOf(trace, snapshotSha)} />
        )}
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

export function Matrix() {
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  return <MatrixTables trace={trace.trace} snapshotSha={trace.snapshot.sha} snapshotShort={trace.snapshot.short} utc={trace.snapshot.utc} />;
}
