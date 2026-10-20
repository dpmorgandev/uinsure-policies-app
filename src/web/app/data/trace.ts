export type Fetch = (input: string) => Promise<Response>;

export interface CompiledAt {
  ref: string;
  sha: string;
  utc: string;
}

export interface Snapshot {
  ref: string;
  sha: string;
  short: string;
  utc: string;
}

export interface TraceProblem {
  file: string | null;
  line: number | null;
  reason: string;
}

export interface TracePlan {
  id: string;
  kind: string | null;
  title: string | null;
  nodes: string[];
}

export interface TraceChunks {
  activity: string | null;
  diffs: string | null;
}

export interface TraceNode {
  plan: string;
  id: string;
  title: string | null;
  status: string | null;
  attempt: number | null;
  completeness: string | null;
  completenessReasons: string[];
  rules: string[];
  readme: string | null;
  chunks: TraceChunks;
}

export interface Trace {
  schemaVersion: string;
  compiledAt: CompiledAt;
  problems: TraceProblem[];
  rules: unknown[];
  plans: TracePlan[];
  nodes: TraceNode[];
  commits: unknown[];
  events: unknown[];
  verdicts: unknown[];
  findings: unknown[];
  decisions: unknown[];
  sessions: unknown[];
  harness: unknown;
}

export interface ActivityRecord {
  line: number;
  ts?: string | null;
  agent?: string | null;
  tool?: string | null;
  file?: string | null;
  command?: string | null;
  commit?: unknown;
  raw?: string;
}

export type TraceLoad = { state: 'ready'; trace: Trace; snapshot: Snapshot } | { state: 'error'; reason: string };

export type ChunkLoad<T> = { state: 'ready'; records: T[] } | { state: 'none' } | { state: 'error'; reason: string };

export async function loadTrace(fetchFile: Fetch = fetch): Promise<TraceLoad> {
  throw new Error('not implemented');
}

export async function loadActivity(trace: Trace, plan: string, node: string, fetchFile: Fetch = fetch): Promise<ChunkLoad<ActivityRecord>> {
  throw new Error('not implemented');
}
