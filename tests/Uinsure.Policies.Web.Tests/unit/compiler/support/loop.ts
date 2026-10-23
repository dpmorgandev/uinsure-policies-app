// The `retry-ladder` fixture trail (tests/Uinsure.Policies.Web.Tests/fixtures/trails/retry-ladder/README.md) for U3's compiler tests (LOOP-1,
// LOOP-2, LOOP-3, LOOP-4, DATA-2): the trace.json fields the loop, verdict and finding screens read, in the design
// fixture's shapes (docs/ui/fixture/trace.json events[], verdicts[], findings[] and plans[]; each screen's fields in
// docs/ui/derived/U3/<screen>/screen.json), and the fields LOOP-3 and LOOP-4 name that the design fixture lacks: a
// verdict's diff fingerprint and raw JSON, a finding's symptom and suggested test, and an investigation's question
// and hypothesis.
import { readIn } from './trail';
import type { Run, Trail } from './trail';

export const RETRY = 'retry-ladder';
export const F1_DIR = 'docs/trace/build/F1';
export const LOOP_FILE = `${F1_DIR}/loop.jsonl`;
export const A1_FILE = `${F1_DIR}/findings/A1.md`;
export const A2_FILE = `${F1_DIR}/findings/A2.md`;
export const INV_PLAN = 'docs/plans/active/inv-001.plan.md';
export const verdictFile = (round: string, agent: string): string => `${F1_DIR}/verdicts/${round}-${agent}.json`;

/** The provenance labels of docs/trace/README.md. */
export type Provenance = 'generated' | 'recorded' | 'written';

/** One loop.jsonl line, as trace.json's events[] holds it. Every field optional: a test asserts it exists. */
export interface EventOut {
  plan?: string;
  node?: string;
  line?: number;
  ts?: string | null;
  attempt?: number | null;
  event?: string | null;
  kind?: string | null;
  gate?: string | null;
  cmd?: string | null;
  exit?: number | null;
  expect?: string | null;
  ok?: boolean | null;
  head?: string | null;
  detail?: string | null;
  source?: string | null;
  raw?: string;
  provenance?: Provenance | string | null;
}

/** A finding inside a reviewer or security verdict, as the verdict file records it. */
export interface VerdictFindingOut {
  id?: string;
  rule_id?: string;
  severity?: string;
  file?: string;
  line?: number;
  what?: string;
  why?: string;
  route_to?: string;
}

/** One verdicts/<round>-<agent>.json, as trace.json's verdicts[] holds it. */
export interface VerdictOut {
  plan?: string;
  node?: string;
  round?: string | null;
  agent?: string | null;
  attempt?: number | null;
  ts?: string | null;
  verdict?: string | null;
  head?: string | null;
  base?: string | null;
  diffFingerprint?: string | null;
  gateRefs?: string[];
  rulesCovered?: string[];
  rulesMissing?: string[];
  findings?: VerdictFindingOut[];
  file?: string | null;
  /** The verdict file's text, as recorded. */
  raw?: string | null;
  provenance?: Provenance | string | null;
}

/** One investigator finding of a findings/<round>.md, as trace.json's findings[] holds it. */
export interface FindingOut {
  plan?: string;
  node?: string;
  round?: string | null;
  id?: string;
  kind?: string | null;
  attempt?: number | null;
  /** The round's source_ref: the gate or verdict that raised it. */
  source?: string | null;
  /** The findings file the round was read from. */
  file?: string | null;
  rule?: string | null;
  layer?: string | null;
  files?: string[];
  symptom?: string | null;
  cause?: string | null;
  fixDirection?: string | null;
  testable?: boolean | null;
  suggestedTest?: string | null;
  untestableReason?: string | null;
  /** The full SHAs of the commits whose Fixes-Finding names this round and finding, in commit order. */
  fixedBy?: string[];
  provenance?: Provenance | string | null;
}

/** A plan, with an investigation plan's own fields (an inv-*.plan.md has no DAG). */
export interface PlanOut {
  id?: string;
  kind?: string | null;
  title?: string | null;
  source?: string | null;
  nodes?: string[];
  frontmatter?: Record<string, unknown> | null;
  question?: string | null;
  hypothesis?: string | null;
}

const list = <T>(r: Run, field: string): T[] => {
  const value = r.trace?.[field];
  return Array.isArray(value) ? (value as T[]) : [];
};

/** A node's loop events, in the order trace.json holds them. */
export const eventsOf = (r: Run, node = 'F1', plan = 'build'): EventOut[] =>
  list<EventOut>(r, 'events').filter((e) => e.plan === plan && e.node === node);
export const eventAt = (r: Run, line: number): EventOut | undefined => eventsOf(r).find((e) => e.line === line);

export const verdictsOf = (r: Run, node = 'F1'): VerdictOut[] => list<VerdictOut>(r, 'verdicts').filter((v) => v.plan === 'build' && v.node === node);
export const verdictOf = (r: Run, round: string, agent: string): VerdictOut | undefined =>
  verdictsOf(r).find((v) => v.round === round && v.agent === agent);

export const findingsOf = (r: Run, node = 'F1'): FindingOut[] => list<FindingOut>(r, 'findings').filter((f) => f.plan === 'build' && f.node === node);
export const findingOf = (r: Run, round: string, id: string): FindingOut | undefined =>
  findingsOf(r).find((f) => f.round === round && f.id === id);

export const planOf = (r: Run, id: string): PlanOut | undefined => list<PlanOut>(r, 'plans').find((p) => p.id === id);

/** A fixture commit's full SHA, by its id in retry-ladder/commits.json, or a marker no SHA equals. */
export const sha = (trail: Trail, id: string): string => trail.shas[id] ?? `(no commit ${id})`;
export const short7 = (trail: Trail, id: string): string => sha(trail, id).slice(0, 7);

/** A file's non-blank lines as the replayed repo holds them (its {{cN}} placeholders filled), each by its 1-based line. */
export function linesOf(root: string, rel: string): Map<number, string> {
  const lines = new Map<number, string>();
  readIn(root, rel)
    .split(/\r?\n/)
    .forEach((text, at) => {
      if (text.trim() !== '') lines.set(at + 1, text);
    });
  return lines;
}
