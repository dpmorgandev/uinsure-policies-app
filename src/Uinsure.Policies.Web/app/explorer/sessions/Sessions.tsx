import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { DataTable, MarkdownText, PageHeader, Timestamp } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import { entityUrl } from '../../data/trace';
import type { TraceSession } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { NotFound } from '../../shell/NotFound';
import { useShell } from '../../shell/ShellContext';
import '../u5.css';

interface Row extends TraceSession {
  id: string;
  /** The snapshot's position in the chain, from 1. */
  position: number;
}

const columns: DataTableColumn<Row>[] = [
  { id: 'ref', header: 'Ref', rowHeader: true, cell: (row) => `#${row.position}` },
  {
    id: 'slug',
    header: 'Snapshot',
    mono: true,
    cell: (row) => <a href={entityUrl({ kind: 'session', file: row.file })}>{row.slug ?? row.file}</a>,
  },
  { id: 'saved', header: 'Saved', cell: (row) => <Timestamp value={row.ts} /> },
  {
    id: 'node',
    header: 'Plan · node',
    mono: true,
    cell: (row) => [row.plan, row.node].filter((part): part is string => part !== null).join(' · ') || 'no plan or node recorded',
  },
  { id: 'status', header: 'Status', mono: true, cell: (row) => row.status ?? 'not recorded' },
  { id: 'next', header: 'Next action', wrap: 'anywhere', cell: (row) => row.nextAction ?? 'not recorded' },
];

/** The chain grouped by the UTC date of each snapshot, in chain order. */
function daysOf(rows: Row[]): { date: string; rows: Row[] }[] {
  const days: { date: string; rows: Row[] }[] = [];
  for (const row of rows) {
    const date = row.ts.slice(0, 10);
    const day = days.find((d) => d.date === date);
    if (day) day.rows.push(row);
    else days.push({ date, rows: [row] });
  }
  return days;
}

/** The URL segment of a snapshot: its file name without the folder or the extension. */
const slugOf = (file: string): string => file.replace(/^.*\//, '').replace(/\.md$/, '');

export function Sessions() {
  const { trace } = useShell();
  const { file } = useParams();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  const rows: Row[] = trace.trace.sessions.map((session, index) => ({ ...session, id: session.file, position: index + 1 }));
  const latest = rows[rows.length - 1];
  // /sessions/:file opens that snapshot; /sessions opens the latest.
  const open = file === undefined ? latest : rows.find((row) => slugOf(row.file) === file);
  if (file !== undefined && open === undefined) return <NotFound asked={`/sessions/${file}`} />;
  return (
    <>
      <section className="s-u5-region" data-region="snapshot-timeline" data-req="CTX-1">
        <PageHeader
          eyebrow="About · context snapshot chain"
          title="Sessions"
          question="Where did work stand at each hand-off, and what was said to come next?"
          answer={
            latest === undefined
              ? 'No dated context snapshot is in this snapshot of the trail.'
              : latest.nextAction === null
                ? `The last hand-off, #${latest.position} ${latest.slug ?? latest.file}, records no next action.`
                : `At the last hand-off, #${latest.position} ${latest.slug ?? latest.file}, the next action was: ${latest.nextAction}`
          }
          ids={[
            { label: 'Latest snapshot', value: latest?.slug ?? latest?.file ?? null },
            { label: 'Snapshot ref', value: `${trace.snapshot.ref} ${trace.snapshot.short}` },
          ]}
          compiledAt={trace.snapshot.utc}
        />
        <h2 className="s-u5-head">Snapshot timeline, in the order the chain holds them</h2>
        <p className="s-u5-note">
          Position is the rung number, in time order. Days are the UTC date of each snapshot&apos;s time. A snapshot that records no plan or
          node shows that as a gap. A snapshot with no dated front matter is not in the timeline; it is listed in the compile&apos;s problems.
        </p>
        {daysOf(rows).map((day) => (
          <div className="s-u5-block" key={day.date}>
            <h3 className="s-u5-head">
              <Timestamp value={day.date} /> (UTC date), #{day.rows[0]?.position} to #{day.rows[day.rows.length - 1]?.position}
            </h3>
            <DataTable<Row>
              caption={`Context snapshots saved on ${day.date} (UTC), in chain order.`}
              rows={day.rows}
              columns={columns}
            />
          </div>
        ))}
      </section>
      {open === undefined ? null : <OpenSnapshot row={open} />}
    </>
  );
}

const fields = (row: Row): { id: string; field: string; value: ReactNode }[] => [
  { id: 'file', field: 'File', value: row.file },
  { id: 'saved', field: 'Saved', value: <Timestamp value={row.ts} /> },
  { id: 'slug', field: 'Slug', value: row.slug ?? 'not recorded' },
  { id: 'node', field: 'Plan and node', value: row.plan && row.node ? `${row.plan}/${row.node}` : 'not recorded' },
  { id: 'status', field: 'Status', value: row.status ?? 'not recorded' },
  { id: 'next', field: 'Next action', value: row.nextAction === null ? 'not recorded' : <MarkdownText source={row.nextAction} /> },
];

const openColumns: DataTableColumn<ReturnType<typeof fields>[number]>[] = [
  { id: 'field', header: 'Field', rowHeader: true, cell: (item) => item.field },
  { id: 'value', header: 'Value', mono: true, wrap: 'anywhere', cell: (item) => item.value },
];

/** NAV-2: one snapshot's header fields, open at its own URL. */
function OpenSnapshot({ row }: { row: Row }) {
  return (
    <section className="s-u5-region" data-region="one-snapshot-open-at-its-own-url-sessions-file" data-req="NAV-2">
      <h2 className="s-u5-head">{`One snapshot, open: #${row.position} ${row.slug ?? row.file}`}</h2>
      <DataTable
        caption={`Header fields of snapshot #${row.position}, as its front matter records them.`}
        rows={fields(row)}
        columns={openColumns}
      />
    </section>
  );
}
