import type { Trace, TraceCommit } from '../data/trace';

/** A line of a node's loop.jsonl as the compiler writes it (trace.json `events[]`). A value the log does not hold is null. */
export interface LoopEvent {
  plan: string;
  node: string;
  line: number;
  ts: string | null;
  attempt: number | null;
  event: string | null;
  kind: string | null;
  gate: string | null;
  cmd: string | null;
  exit: number | null;
  expect: string | null;
  ok: boolean | null;
  head: string | null;
  detail: string | null;
  source: string | null;
}

/** A finding a reviewer or security verdict lists, as the verdict file writes it. */
export interface VerdictFindingRecord {
  id?: string;
  rule_id?: string;
  severity?: string;
  file?: string;
  line?: number;
  what?: string;
  why?: string;
  route_to?: string;
}

/** A verdicts/<round>-<agent>.json (trace.json `verdicts[]`). `raw` is the file as stored. */
export interface LoopVerdict {
  plan: string;
  node: string;
  round: string;
  agent: string;
  verdict: string;
  head: string | null;
  base: string | null;
  attempt: number | null;
  /** The next three are absent from a trace.json compiled before the compiler held them (the design fixture). */
  diffFingerprint?: string | null;
  gateRefs?: string[];
  raw?: string;
  rulesCovered: string[];
  rulesMissing: string[];
  findings: VerdictFindingRecord[];
  file: string;
}

/** One finding of an investigator round (trace.json `findings[]`). */
export interface RoundFinding {
  plan: string;
  node: string;
  round: string | null;
  id: string | null;
  attempt: number | null;
  source: string | null;
  file: string;
  rule: string | null;
  layer: string | null;
  files: string[];
  symptom: string | null;
  cause: string | null;
  fixDirection: string | null;
  testable: boolean | null;
  suggestedTest: string | null;
  untestableReason: string | null;
  fixedBy: string[];
}

/** A commit's `Fixes-Finding` trailers, which the loader's TraceCommit does not list. */
export interface FixingCommit extends TraceCommit {
  fixesFinding?: { round: number | null; id: string }[];
}

export const shortSha = (sha: string): string => sha.slice(0, 7);

export const eventsOf = (trace: Trace, plan: string, node: string): LoopEvent[] =>
  (trace.events as LoopEvent[]).filter((e) => e.plan === plan && e.node === node).sort((a, b) => a.line - b.line);

export const verdictsOf = (trace: Trace, plan: string, node: string): LoopVerdict[] =>
  (trace.verdicts as LoopVerdict[]).filter((v) => v.plan === plan && v.node === node);

export const findingsOf = (trace: Trace, plan: string, node: string, round: string): RoundFinding[] =>
  (trace.findings as RoundFinding[]).filter((f) => f.plan === plan && f.node === node && f.round === round);

export const fixingCommitsOf = (trace: Trace, plan: string, node: string): FixingCommit[] =>
  (trace.commits as FixingCommit[]).filter((c) => c.plan === plan && c.node === node && (c.fixesFinding ?? []).length > 0);

/** A `verdict(<agent>,<PASS|FAIL>,<file>)` event, taken apart. */
export function verdictEvent(event: LoopEvent): { agent: string; verdict: string; file: string; round: string | null } | null {
  const parts = /^verdict\(([^,]+),([^,]+),(.+)\)$/.exec(event.event ?? '');
  if (parts === null) return null;
  const file = parts[3] ?? '';
  return { agent: parts[1] ?? '', verdict: parts[2] ?? '', file, round: /\/(A\d+(?:\.\d+)?)-[^/]+\.json$/.exec(file)?.[1] ?? null };
}

/** The round a `findings(<path>)` event names. */
export const findingsRound = (event: LoopEvent): string | null => /\/([^/]+)\.md\)$/.exec(event.event ?? '')?.[1] ?? null;

/** The id an `investigation.opened(<id>)` event names. */
export const investigationId = (event: LoopEvent): string | null => /^investigation\.opened\((.+)\)$/.exec(event.event ?? '')?.[1] ?? null;

/** The "attempt·line" marker the loop log's events are known by. */
export const markerOf = (event: LoopEvent): string => `${event.attempt ?? '?'}·${event.line}`;
