// U2's compiler tests (DAG-1, TDD-1, RULE-3, DATA-8): the trace.json fields the plan page, the walkthrough and the
// commit and rule pages' diffs read, in the design fixture's shapes (docs/ui/fixture/trace.json and its chunks
// docs/ui/fixture/trace/<plan>/<node>/diffs.json; each screen's fields in docs/ui/derived/U2/<screen>/screen.json):
//   plans[*]                { id, kind, title, status, approvedBy, approvedOn, requirementsRev, source, nodes }
//   nodes[*]                { plan, id, title, status, dependsOn, walkthrough[], chunks { activity, diffs } }
//   nodes[*].walkthrough[*] { n, sha, tdd, agent, subject }: the node's commits in order, n its walkthrough row
//   diffs chunk             [{ sha, patch }]: each of the node's commits and its git patch, loaded when asked
//   events[*]               { plan, node, line, raw }: a loop line as written, kept when it is not a JSON object
// Every field is optional here: a test asserts it exists.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Run, Trail } from './trail';

/** tests/web/fixtures/trails/plans/README.md: build, ui and inv-001; a branching DAG in file order. */
export const PLANS = 'plans';
/** tests/web/fixtures/trails/in-flight/README.md: build/F1 mid-loop, one malformed loop line and one malformed activity line. */
export const IN_FLIGHT = 'in-flight';

export interface PlanFull {
  id?: string;
  kind?: string | null;
  title?: string | null;
  status?: string | null;
  approvedBy?: string | null;
  approvedOn?: string | null;
  requirementsRev?: string | null;
  source?: string | null;
  nodes?: string[];
}

/** One row of a node's walkthrough: the commit, its place, and what its trailers say. */
export interface WalkEntry {
  n?: number | null;
  sha?: string | null;
  tdd?: string | null;
  agent?: string | null;
  subject?: string | null;
}

export interface NodeFull {
  plan?: string;
  id?: string;
  title?: string | null;
  status?: string | null;
  dependsOn?: string[];
  walkthrough?: WalkEntry[];
  chunks?: { activity?: string | null; diffs?: string | null } | null;
}

/** One commit's diff in a node's diffs chunk, as the design fixture holds it. */
export interface DiffEntry {
  sha?: string;
  patch?: string;
}

export interface EventOut {
  plan?: string;
  node?: string;
  line?: number;
  raw?: string;
}

const list = <T>(r: Run, field: string): T[] => {
  const value = r.trace?.[field];
  return Array.isArray(value) ? (value as T[]) : [];
};

export const plansOf = (r: Run): PlanFull[] => list<PlanFull>(r, 'plans');
export const planOf = (r: Run, id: string): PlanFull | undefined => plansOf(r).find((p) => p.id === id);
export const nodesIn = (r: Run, plan: string): NodeFull[] => list<NodeFull>(r, 'nodes').filter((n) => n.plan === plan);
export const nodeIn = (r: Run, plan: string, id: string): NodeFull | undefined => nodesIn(r, plan).find((n) => n.id === id);
export const eventsOf = (r: Run): EventOut[] => list<EventOut>(r, 'events');

/** A field as the compile wrote it, or 'missing' when the object lacks it: null is a value the trail lacks, not absence. */
export function field<T extends object>(item: T | undefined, key: keyof T): unknown {
  return item !== undefined && key in item ? item[key] : 'missing';
}

/** A node's walkthrough entries, or [] when the node or its walkthrough is missing. */
export const walkthroughOf = (r: Run, plan: string, node: string): WalkEntry[] => nodeIn(r, plan, node)?.walkthrough ?? [];

/**
 * The fixture commit id an entry's SHA names: the commit whose full SHA it is, or begins with at 7 characters or more
 * (the design fixture gives the walkthrough's short form). '?' when it names no fixture commit.
 */
export function idOf(trail: Trail, sha: string | null | undefined): string {
  if (typeof sha !== 'string' || sha.length < 7) return '?';
  return Object.entries(trail.shas).find(([, full]) => full.startsWith(sha))?.[0] ?? '?';
}

/** The walkthrough entry for a fixture commit, by its id. */
export const entryOf = (r: Run, trail: Trail, plan: string, node: string, id: string): WalkEntry | undefined =>
  walkthroughOf(r, plan, node).find((entry) => idOf(trail, entry.sha) === id);

/** The diffs chunk trace.json names for a node, as written beside it, or null when it names or writes none. */
export function diffsOf(r: Run, plan: string, node: string): DiffEntry[] | null {
  const chunk = nodeIn(r, plan, node)?.chunks?.diffs ?? null;
  if (chunk === null || !existsSync(join(r.publicDir, chunk))) return null;
  const entries = JSON.parse(readFileSync(join(r.publicDir, chunk), 'utf8')) as unknown;
  return Array.isArray(entries) ? (entries as DiffEntry[]) : null;
}

/** A fixture commit's patch in its node's diffs chunk, by the commit's full SHA, or null when the chunk holds none. */
export function patchOf(r: Run, trail: Trail, plan: string, node: string, id: string): string | null {
  const full = trail.shas[id];
  const entry = (diffsOf(r, plan, node) ?? []).find((d) => d.sha === full);
  return typeof entry?.patch === 'string' ? entry.patch : null;
}

/** The files a git patch changes, by its `diff --git a/<path> b/<path>` headers, in order. */
export function filesOf(patch: string | null): string[] {
  return (patch ?? '')
    .split(/\r?\n/)
    .map((line) => /^diff --git a\/(.+) b\/\1$/.exec(line)?.[1])
    .filter((path): path is string => path !== undefined);
}

/** A git patch's changed lines, each with its + or - mark, in order; file headers (+++ and ---) are not changes. */
export function changesOf(patch: string | null): string[] {
  return (patch ?? '')
    .split(/\r?\n/)
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---) /.test(line));
}
