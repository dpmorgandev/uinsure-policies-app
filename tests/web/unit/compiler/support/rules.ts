// The `rules` fixture trail (tests/web/fixtures/trails/rules/README.md) for U1's compiler tests (NAV-1, RULE-2,
// DATA-4): the trace.json fields the overview, the matrix and the rule page read, in the design fixture's shapes
// (docs/ui/fixture/trace.json; each screen's fields in docs/ui/derived/U1/<screen>/screen.json), and the fixture's
// own facts (each commit's id and date in rules/commits.json).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fixturesDir } from './trail';
import type { Run, Trail } from './trail';

export const RULES = 'rules';
/** tests/web/fixtures/trails/rereview/README.md: verdicts in re-review rounds A<n>.<m> beside A<n> (NAV-1). */
export const REREVIEW = 'rereview';
/** tests/web/fixtures/trails/requirements-shapes/README.md: both requirements files' table shapes, and a C# test source. */
export const SHAPES = 'requirements-shapes';
/**
 * tests/web/fixtures/trails/two-plans/README.md: both plans' requirements files and both matrices, a RENEW-1/2 row,
 * `undefined` refactor cells, F1's signoff(<sha>) and merged(<sha>) events, and a template-literal test title (U1 D2).
 */
export const TWO_PLANS = 'two-plans';
export const REQUIREMENTS_FILE = 'docs/requirements.md';
export const UI_REQUIREMENTS_FILE = 'docs/ui-requirements.md';
export const MATRIX_FILE = 'docs/trace/requirements-matrix.md';
export const UI_MATRIX_FILE = 'docs/trace/ui-requirements-matrix.md';
export const DAG_FILE = 'docs/plans/active/build.dag.yaml';
export const F1_LOOP = 'docs/trace/build/F1/loop.jsonl';
export const F2_README = 'docs/trace/build/F2/README.md';

/** The five reasons rules/trail/docs/trace/build/F2/README.md gives under "## Completeness", in its order. */
export const F2_REASONS = [
  'rule GET-1 has no red commit before its green commit',
  'rule GET-1 has no QA step',
  'gate.red is not ok',
  'gate.green is missing',
  'gate.integrate is missing',
];
export const F2_LABEL = `TRAIL INCOMPLETE: ${F2_REASONS.join('; ')}`;

/** A rule's requirements-matrix row, as the design fixture holds it (rules[*].matrix). Every field optional. */
export interface MatrixOut {
  plan?: string | null;
  node?: string | null;
  tests?: { pass?: number | null; total?: number | null; raw?: string | null } | null;
  red?: string | null;
  green?: string | null;
  refactor?: string | null;
  qaStep?: string | null;
  signoff?: string | null;
  pr?: string | null;
  source?: { file?: string | null; line?: number | null } | null;
}

/** One of a rule's tests, by name: the test's own name, and the test source it is declared in. */
export interface TestOut {
  name?: string | null;
  file?: string | null;
  /** True for a template-literal title with `${…}`: one source line standing for the tests it generates (D2/I6). */
  parameterised?: boolean | null;
}

export interface RuleOut {
  id?: string;
  title?: string | null;
  feature?: string | null;
  priority?: string | null;
  interpretation?: string | null;
  source?: { file?: string | null; line?: number | null } | null;
  tests?: TestOut[];
  status?: string | null;
  /** The commits the matrix row names in each column (DATA-1's rules[*].red, green, refactor). */
  red?: string[];
  green?: string[];
  refactor?: string[];
  matrix?: MatrixOut | null;
}

export interface NodeOut {
  plan?: string;
  id?: string;
  owner?: string | null;
  status?: string | null;
  attempt?: number | null;
  completeness?: string | null;
  completenessReasons?: string[];
  trail?: boolean | null;
}

export interface PlanOut {
  id?: string;
  source?: string | null;
}

export interface CommitOut {
  sha?: string;
  short?: string;
  plan?: string | null;
  node?: string | null;
  rule?: string[];
  tdd?: string | null;
  order?: number | null;
  date?: string | null;
  parents?: string[];
}

export interface VerdictOut {
  plan?: string;
  node?: string;
  round?: string | null;
  agent?: string | null;
  verdict?: string | null;
  file?: string | null;
}

export interface DecisionOut {
  kind?: string;
  plan?: string | null;
  node?: string | null;
  /** The commit the event names: signoff(<sha>), merged(<sha>) (the design fixture's decisions[*].sha). */
  sha?: string | null;
  when?: string | null;
  evidence?: { file?: string | null; line?: number | null } | null;
}

const list = <T>(r: Run, field: string): T[] => {
  const value = r.trace?.[field];
  return Array.isArray(value) ? (value as T[]) : [];
};

export const rulesOf = (r: Run): RuleOut[] => list<RuleOut>(r, 'rules');
export const nodesOf = (r: Run): NodeOut[] => list<NodeOut>(r, 'nodes');
export const plansOf = (r: Run): PlanOut[] => list<PlanOut>(r, 'plans');
export const commitsOf = (r: Run): CommitOut[] => list<CommitOut>(r, 'commits');
export const verdictsOf = (r: Run): VerdictOut[] => list<VerdictOut>(r, 'verdicts');
export const decisionsOf = (r: Run): DecisionOut[] => list<DecisionOut>(r, 'decisions');

export const ruleOf = (r: Run, id: string): RuleOut | undefined => rulesOf(r).find((rule) => rule.id === id);
export const nodeOf = (r: Run, id: string): NodeOut | undefined => nodesOf(r).find((n) => n.plan === 'build' && n.id === id);

/** A fixture commit's full SHA, by its id in rules/commits.json, or a marker no SHA equals. */
export const shaOf = (trail: Trail, id: string): string => trail.shas[id] ?? `(no commit ${id})`;
export const shortOf = (trail: Trail, id: string): string => shaOf(trail, id).slice(0, 7);

/** The compiled commit a fixture commit id names. */
export const commitOf = (r: Run, trail: Trail, id: string): CommitOut | undefined =>
  commitsOf(r).find((c) => c.sha === shaOf(trail, id));

/** The compiled commit a short SHA (as the matrix gives it) names, or undefined. */
export const commitByShort = (r: Run, short: string | null | undefined): CommitOut | undefined =>
  short ? commitsOf(r).find((c) => c.sha?.startsWith(short)) : undefined;

/** Each fixture commit's id and the date it was made at, from rules/commits.json, in order. */
export function fixtureDates(): { id: string; date: string }[] {
  const spec = JSON.parse(readFileSync(join(fixturesDir, RULES, 'commits.json'), 'utf8')) as {
    date: string;
    commits: { id: string; date?: string }[];
  };
  return spec.commits.map((c) => ({ id: c.id, date: c.date ?? spec.date }));
}
