import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { DataTable, RedactionToken, ShaLink } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import { loadActivity } from '../../data/trace';
import type { ActivityRecord, ChunkLoad, Trace } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { REPO } from '../../shell/repo';
import { NotBuiltRegion } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import './activity.css';

interface EventRow {
  id: string;
  record: ActivityRecord;
  commit: { sha: string; tdd: string | null } | null;
}

const GAP = '—';
const REDACTIONS = ['user', 'outside-repo', 'root'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The commit an activity line made, and the `TDD` trailer that commit carries (none when it has no trailer). */
function commitOf(trace: Trace, record: ActivityRecord): EventRow['commit'] {
  const sha = isRecord(record.commit) ? record.commit['sha'] : undefined;
  if (typeof sha !== 'string') return null;
  const found = trace.commits.find((c) => isRecord(c) && c['sha'] === sha);
  const tdd = isRecord(found) ? found['tdd'] : undefined;
  return { sha, tdd: typeof tdd === 'string' ? tdd : null };
}

/** What the line touched: its command, else its file; a redacted path shows as the labelled token. */
function target(record: ActivityRecord): ReactNode {
  if (record.raw !== undefined) return record.raw;
  if (record.command) return record.command;
  const redaction = REDACTIONS.find((token) => record.file === `<${token}>`);
  if (redaction !== undefined) return <RedactionToken token={redaction} />;
  return record.file ?? GAP;
}

const COLUMNS: DataTableColumn<EventRow>[] = [
  { id: 'line', header: 'Line', cell: (row) => row.record.line, rowHeader: true, sortable: true },
  { id: 'attempt', header: 'Attempt', cell: (row) => row.record.attempt ?? GAP, numeric: true },
  { id: 'agent', header: 'Agent', cell: (row) => row.record.agent ?? GAP, mono: true },
  { id: 'tool', header: 'Tool', cell: (row) => row.record.tool ?? GAP, mono: true },
  { id: 'target', header: 'File or command', cell: (row) => target(row.record), mono: true, wrap: 'anywhere' },
  {
    id: 'commit',
    header: 'Commit',
    cell: (row) =>
      row.commit === null ? (
        GAP
      ) : (
        <ShaLink sha={row.commit.sha.slice(0, 7)} fullSha={row.commit.sha} githubHref={`${REPO}/commit/${row.commit.sha}`} />
      ),
  },
  { id: 'tdd', header: 'TDD trailer', cell: (row) => (row.commit === null ? GAP : (row.commit.tdd ?? 'none')), mono: true },
];

/** The node's activity chunk as a table: read when the node is shown, and again when another is. */
function EventTable({ trace, plan, node }: { trace: Trace; plan: string; node: string }) {
  const key = `${plan}/${node}`;
  const [loaded, setLoaded] = useState<{ key: string; result: ChunkLoad<ActivityRecord> } | null>(null);

  useEffect(() => {
    let current = true;
    void loadActivity(trace, plan, node).then((result) => {
      if (current) setLoaded({ key, result });
    });
    return () => {
      current = false;
    };
  }, [trace, plan, node, key]);

  const result = loaded?.key === key ? loaded.result : null;
  const rows: EventRow[] =
    result?.state === 'ready'
      ? result.records.map((record) => ({ id: String(record.line), record, commit: commitOf(trace, record) }))
      : [];
  return (
    <DataTable
      caption={`Activity events for ${key}, ${rows.length} ${rows.length === 1 ? 'line' : 'lines'}. Sorted by the Line column, ascending.`}
      columns={COLUMNS}
      rows={rows}
      sort={{ columnId: 'line', direction: 'ascending' }}
      loading={result === null}
      error={result?.state === 'error' ? result.reason : null}
      empty={{ title: 'The trail holds no activity log for this node.' }}
    />
  );
}

export function Activity() {
  const { trace } = useShell();
  const { planId, nodeId } = useParams();
  return (
    <>
      {trace.state === 'ready' ? null : <DataNotice trace={trace} />}
      <NotBuiltRegion region="agent-lanes" name="agent lanes" />
      <section className="s-events" data-region="event-table-text-equivalent" data-req="AGENT-2 A11Y-1">
        <div className="s-events-head">
          <h2 className="s-events-title">Every line as text</h2>
          <p className="s-events-note">
            The lines in log order. A dash means the log holds none for that column; a redacted value shows as a labelled
            token. Clock times are left out on purpose: position here is the log line.
          </p>
        </div>
        {trace.state === 'ready' && planId !== undefined && nodeId !== undefined ? (
          <EventTable trace={trace.trace} plan={planId} node={nodeId} />
        ) : null}
      </section>
    </>
  );
}
