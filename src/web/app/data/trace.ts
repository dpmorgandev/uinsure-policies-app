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

const SUPPORTED_MAJOR = '1';
const FULL_SHA = /^[0-9a-f]{40}$/;
const UTC_STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const reasonOf = (caught: unknown): string => (caught instanceof Error ? caught.message : String(caught));

/** GETs a static file beside the app and parses it as JSON; a failure is a reason, never a throw. */
async function readJson(fetchFile: Fetch, path: string): Promise<{ ok: true; body: unknown } | { ok: false; reason: string }> {
  try {
    const response = await fetchFile(path);
    if (!response.ok) return { ok: false, reason: `${path} could not be read (HTTP ${response.status})` };
    return { ok: true, body: (await response.json()) as unknown };
  } catch (caught) {
    return { ok: false, reason: `${path} could not be read: ${reasonOf(caught)}` };
  }
}

/** DATA-3: the stamp must hold a ref, the full SHA and a UTC time; anything else is refused. */
function readStamp(value: unknown): Snapshot | string {
  if (!isRecord(value)) return 'trace.json has no compiledAt stamp';
  const { ref, sha, utc } = value;
  if (typeof ref !== 'string' || ref === '') return 'trace.json compiledAt has no ref';
  if (typeof sha !== 'string' || !FULL_SHA.test(sha)) return 'trace.json compiledAt.sha is missing or not a full SHA';
  if (typeof utc !== 'string' || !UTC_STAMP.test(utc)) return 'trace.json compiledAt.utc is missing or not a UTC time';
  return { ref, sha, short: sha.slice(0, 7), utc };
}

export async function loadTrace(fetchFile: Fetch = fetch): Promise<TraceLoad> {
  const read = await readJson(fetchFile, 'trace.json');
  if (!read.ok) return { state: 'error', reason: read.reason };
  const body = read.body;
  if (!isRecord(body)) return { state: 'error', reason: 'trace.json is not a trace object' };
  const version = body['schemaVersion'];
  if (typeof version !== 'string') return { state: 'error', reason: 'trace.json has no schemaVersion' };
  if (version.split('.')[0] !== SUPPORTED_MAJOR) {
    return { state: 'error', reason: `trace.json schemaVersion ${version} is not supported (major ${SUPPORTED_MAJOR} only)` };
  }
  const snapshot = readStamp(body['compiledAt']);
  if (typeof snapshot === 'string') return { state: 'error', reason: snapshot };
  return { state: 'ready', trace: body as unknown as Trace, snapshot };
}

export async function loadActivity(trace: Trace, plan: string, node: string, fetchFile: Fetch = fetch): Promise<ChunkLoad<ActivityRecord>> {
  const found = trace.nodes.find((n) => n.plan === plan && n.id === node);
  if (!found) return { state: 'error', reason: `trace.json holds no node ${plan}/${node}` };
  const chunk = found.chunks.activity;
  if (chunk === null) return { state: 'none' };
  // DATA-1: only the chunk the compiler writes for this node is ever requested.
  if (chunk !== `trace/${plan}/${node}/activity.json`) {
    return { state: 'error', reason: `${chunk} is not the activity chunk of ${plan}/${node}` };
  }
  const read = await readJson(fetchFile, chunk);
  if (!read.ok) return { state: 'error', reason: read.reason };
  if (!Array.isArray(read.body)) return { state: 'error', reason: `${chunk} is not a JSON array` };
  return { state: 'ready', records: read.body as ActivityRecord[] };
}
