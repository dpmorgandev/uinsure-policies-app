import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { AgentLanes, DataTable, FilterBar, RedactionToken, ShaLink } from '../../../kit';
import type { AgentName, DataTableColumn, FilterDefinition, Lane, LaneEvent, SelectOption } from '../../../kit';
import { loadActivity } from '../../data/trace';
import type { ActivityRecord, ChunkLoad, Trace } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { REPO } from '../../shell/repo';
import { agentOf } from '../../shell/agents';
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

/** The node's activity chunk: read when the node is shown, and again when another is. Null while it loads. */
function useActivityChunk(trace: Trace, plan: string, node: string): ChunkLoad<ActivityRecord> | null {
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

  return loaded?.key === key ? loaded.result : null;
}

/** AGENT-2: one lane per agent in first-seen order; each tick is one log line, placed by its line number. */
function lanesOf(trace: Trace, records: ActivityRecord[]): Lane[] {
  const lanes = new Map<AgentName, LaneEvent[]>();
  for (const record of records) {
    const agent = agentOf(record.agent);
    if (agent === null) continue;
    const commit = commitOf(trace, record);
    const touched = record.command ?? record.file ?? '';
    const label = [record.tool, touched].filter((part) => part !== null && part !== undefined && part !== '').join(' ');
    const event: LaneEvent = { n: record.line, label: label === '' ? `line ${record.line}` : label, tool: record.tool ?? null, file: touched === '' ? null : touched, tdd: commit?.tdd ?? null, sha: commit?.sha.slice(0, 7) ?? null };
    lanes.set(agent, [...(lanes.get(agent) ?? []), event]);
  }
  return [...lanes].map(([agent, events]) => ({ agent, events }));
}

function EventTable({ trace, plan, node, result }: { trace: Trace; plan: string; node: string; result: ChunkLoad<ActivityRecord> | null }) {
  const key = `${plan}/${node}`;
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
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  if (planId === undefined || nodeId === undefined) return null;
  return <ActivityBody trace={trace.trace} plan={planId} node={nodeId} />;
}

type Filters = Record<'agent' | 'tool' | 'attempt' | 'redaction', string>;
const NO_FILTERS: Filters = { agent: '', tool: '', attempt: '', redaction: '' };

const redactionOf = (record: ActivityRecord): string => REDACTIONS.find((token) => record.file === `<${token}>`) ?? '';

const distinct = (values: (string | null | undefined)[]): SelectOption[] =>
  [...new Set(values.filter((value): value is string => value !== null && value !== undefined && value !== ''))]
    .sort()
    .map((value) => ({ value, label: value }));

const passes = (record: ActivityRecord, filters: Filters): boolean =>
  (filters.agent === '' || record.agent === filters.agent) &&
  (filters.tool === '' || record.tool === filters.tool) &&
  (filters.attempt === '' || String(record.attempt ?? '') === filters.attempt) &&
  (filters.redaction === '' || redactionOf(record) === filters.redaction);

function ActivityBody({ trace, plan, node }: { trace: Trace; plan: string; node: string }) {
  const result = useActivityChunk(trace, plan, node);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const gitOnly = trace.nodes.find((n) => n.plan === plan && n.id === node)?.completeness?.includes('git-only') ?? false;
  const records = result?.state === 'ready' ? result.records : [];
  const shown = records.filter((record) => passes(record, filters));
  const definitions: FilterDefinition[] = [
    { id: 'agent', label: 'Agent', options: distinct(records.map((r) => r.agent)), value: filters.agent },
    { id: 'tool', label: 'Tool', options: distinct(records.map((r) => r.tool)), value: filters.tool },
    { id: 'attempt', label: 'Attempt', options: distinct(records.map((r) => (r.attempt === null || r.attempt === undefined ? null : String(r.attempt)))), value: filters.attempt },
    { id: 'redaction', label: 'Redaction', options: distinct(records.map(redactionOf)), value: filters.redaction },
  ];
  return (
    <>
      <section className="s-lanes" data-region="agent-lanes" data-req="AGENT-2" aria-label="Agent lanes">
        {result === null ? (
          <p className="s-events-note">Loading the activity log.</p>
        ) : (
          <>
            <FilterBar
              filters={definitions}
              onChange={(id, value) => setFilters((current) => ({ ...current, [id]: value }))}
              onClear={() => setFilters(NO_FILTERS)}
              matchCount={shown.length}
              totalCount={records.length}
              noun="lines"
            />
            <AgentLanes lanes={lanesOf(trace, shown)} gitOnly={gitOnly} />
          </>
        )}
      </section>
      <section className="s-events" data-region="event-table-text-equivalent" data-req="AGENT-2 A11Y-1">
        <div className="s-events-head">
          <h2 className="s-events-title">Every line as text</h2>
          <p className="s-events-note">
            The lines in log order. A dash means the log holds none for that column; a redacted value shows as a labelled
            token. Clock times are left out on purpose: position here is the log line.
          </p>
        </div>
        <EventTable trace={trace} plan={plan} node={node} result={result} />
      </section>
    </>
  );
}
