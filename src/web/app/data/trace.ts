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
  /** The plan's own status as its file writes it ("approved"); null for an investigation. */
  status?: string | null;
  approvedBy?: string | null;
  approvedOn?: string | null;
  requirementsRev?: string | null;
  /** The plan file the node list was read from, when the plan has one. */
  source?: string | null;
  nodes: string[];
}

export interface TraceChunks {
  activity: string | null;
  diffs: string | null;
}

/** One of a node's tasks, as its plan file lists it. */
export interface TraceTask {
  id: string;
  title: string | null;
  status: string | null;
  role: string | null;
  step: string | null;
}

/** One commit of a node's walkthrough. `n` is its row, null when the walkthrough has none for it (a node in flight). */
export interface TraceRung {
  n: number | null;
  sha: string;
  tdd: string | null;
  agent: string | null;
  subject: string | null;
}

export interface TraceNode {
  plan: string;
  id: string;
  title: string | null;
  owner?: string | null;
  status: string | null;
  attempt: number | null;
  /** The pull request number, when the plan file records one. */
  pr?: number | null;
  dependsOn?: string[];
  acceptance?: string[];
  tasks?: TraceTask[];
  walkthrough?: TraceRung[];
  /** Whether the node has any trail (a README, a loop or an activity log). */
  trail?: boolean;
  completeness: string | null;
  completenessReasons: string[];
  rules: string[];
  readme: string | null;
  chunks: TraceChunks;
}

/** A file and the 1-based line a value was read from. */
export interface SourceLine {
  file: string;
  line: number;
}

/** A rule's test count. `pass` is null when the trail holds none (the matrix reads `?/3`). */
export interface TestCount {
  pass: number | null;
  total: number | null;
  raw: string;
}

/** One row of docs/trace/requirements-matrix.md. A commit is the short SHA the matrix gives. */
export interface MatrixRow {
  plan: string | null;
  node: string | null;
  tests: TestCount | null;
  red: string | null;
  green: string | null;
  refactor: string | null;
  qaStep: string | null;
  signoff: string | null;
  pr: string | null;
  source?: SourceLine | null;
}

export interface RuleTest {
  name: string;
  file: string;
  /** A template-literal title: one source line standing for several generated tests, its interpolations shown as {expression}. */
  parameterised?: boolean;
}

export interface TraceRule {
  id: string;
  title: string | null;
  priority: string | null;
  feature: string | null;
  /** The agreed interpretation as written in requirements.md, Markdown kept. */
  interpretation: string | null;
  source: SourceLine | null;
  status: string;
  matrix: MatrixRow | null;
  tests?: RuleTest[];
}

export interface TraceCommit {
  sha: string;
  short: string;
  subject: string;
  plan: string | null;
  node: string | null;
  agent: string | null;
  rule: string[];
  tdd: string | null;
  /** The commit's row in its node's walkthrough. */
  order: number | null;
  /** The commit date, an ISO instant. */
  date?: string | null;
  parents?: string[];
}

export interface TraceVerdict {
  plan: string;
  node: string;
  round: string;
  agent: string;
  verdict: string;
  /** The verdict file's envelope stamp and attempt; null when the file holds none (STATS-1). */
  ts?: string | null;
  attempt?: number | null;
  rulesCovered?: string[];
  rulesMissing?: string[];
  file?: string | null;
}

/** One context snapshot (CTX-1). A field its front matter does not hold is null. */
export interface TraceSession {
  file: string;
  ts: string;
  slug: string | null;
  plan: string | null;
  node: string | null;
  status: string | null;
  nextAction: string | null;
}

/** docs/trace/harness.json, as render-trace writes it (AGENT-3, DATA-7). */
export interface Harness {
  provenance: string | null;
  agents: { file: string; name: string; description: string | null; model: string | null; tools: string | null }[];
  skills: { file: string; name: string; description: string | null }[];
  hooks: { file: string; purpose: string | null; gates: string[] }[];
}

export interface TraceDecision {
  kind: string;
  plan: string;
  node: string | null;
  sha?: string | null;
  evidence?: SourceLine | null;
}

export interface Trace {
  schemaVersion: string;
  compiledAt: CompiledAt;
  problems: TraceProblem[];
  rules: TraceRule[];
  plans: TracePlan[];
  nodes: TraceNode[];
  commits: TraceCommit[];
  events: unknown[];
  verdicts: TraceVerdict[];
  findings: unknown[];
  decisions: TraceDecision[];
  sessions: TraceSession[];
  harness: Harness | null;
}

export interface ActivityRecord {
  line: number;
  attempt?: number | null;
  ts?: string | null;
  agent?: string | null;
  tool?: string | null;
  file?: string | null;
  command?: string | null;
  commit?: unknown;
  raw?: string;
}

/** One commit's patch as `git show` writes it, from a node's diffs chunk. */
export interface DiffRecord {
  sha: string;
  patch: string;
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

async function loadChunk<T>(trace: Trace, plan: string, node: string, kind: 'activity' | 'diffs', fetchFile: Fetch): Promise<ChunkLoad<T>> {
  const found = trace.nodes.find((n) => n.plan === plan && n.id === node);
  if (!found) return { state: 'error', reason: `trace.json holds no node ${plan}/${node}` };
  const chunk = found.chunks[kind];
  if (chunk === null) return { state: 'none' };
  // DATA-1: only the chunk the compiler writes for this node is ever requested.
  if (chunk !== `trace/${plan}/${node}/${kind}.json`) {
    return { state: 'error', reason: `${chunk} is not the ${kind} chunk of ${plan}/${node}` };
  }
  const read = await readJson(fetchFile, chunk);
  if (!read.ok) return { state: 'error', reason: read.reason };
  if (!Array.isArray(read.body)) return { state: 'error', reason: `${chunk} is not a JSON array` };
  return { state: 'ready', records: read.body as T[] };
}

export function loadActivity(trace: Trace, plan: string, node: string, fetchFile: Fetch = fetch): Promise<ChunkLoad<ActivityRecord>> {
  return loadChunk<ActivityRecord>(trace, plan, node, 'activity', fetchFile);
}

/** RULE-3: a node's diffs chunk, fetched only when a diff is asked for. */
export function loadDiffs(trace: Trace, plan: string, node: string, fetchFile: Fetch = fetch): Promise<ChunkLoad<DiffRecord>> {
  return loadChunk<DiffRecord>(trace, plan, node, 'diffs', fetchFile);
}
