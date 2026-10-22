// @vitest-environment node
// DAG-1 · Plan DAG view. Each plan's nodes as a dependency graph, coloured by status, each linking to its node page;
// it shows `build`, `ui` and investigations such as `inv-001`. The compiler holds each plan's header and each node's
// status and edges as the plan file writes them (docs/ui/derived/U2/plan/screen.json: plans[*].status, approvedBy,
// approvedOn, source, nodes; nodes[*].id, title, status, dependsOn). On the `plans` fixture trail (plans/README.md):
// build F0a, F0b, F1, F2, F5, F3 in that file order, F5 branching off F0b and F3 joining F2 and F5; the header
// approved by David Morgan on 2026-10-15 at requirements rev 1a2b3c4; ui U0 and U1; inv-001.plan.md with no DAG.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { field, nodesIn, PLANS, planOf, plansOf } from './support/plans';
import type { PlanFull } from './support/plans';

const BUILD = 'docs/plans/active/build.dag.yaml';
const INV = 'docs/plans/active/inv-001.plan.md';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(PLANS);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

describe('the graph', () => {
  test("DAG-1 · the build plan's nodes in file order, each with its status and the nodes it depends on: F5 off F0b, F3 on F2 and F5", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(nodesIn(r, 'build').map((n) => [n.id, n.status ?? null, field(n, 'dependsOn')])).toEqual([
      ['F0a', 'done', []],
      ['F0b', 'done', ['F0a']],
      ['F1', 'done', ['F0b']],
      ['F2', 'in_progress', ['F1']],
      ['F5', 'pending', ['F0b']],
      ['F3', 'pending', ['F2', 'F5']],
    ]);
  });

  test("DAG-1 · the ui plan's graph is its own: U0 and U1, U1 depending on U0, none of the build plan's nodes", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(nodesIn(r, 'ui').map((n) => [n.id, n.status ?? null, field(n, 'dependsOn')])).toEqual([
      ['U0', 'done', []],
      ['U1', 'pending', ['U0']],
    ]);
  });
});

describe('the plan header', () => {
  test("DAG-1 · the build plan's header as its file writes it: approved, by David Morgan, on 2026-10-15, at requirements rev 1a2b3c4", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const build = planOf(r, 'build');
    const keys: (keyof PlanFull)[] = ['status', 'approvedBy', 'approvedOn', 'requirementsRev', 'source'];
    expect(keys.map((key) => [key, field(build, key)])).toEqual([
      ['status', 'approved'],
      ['approvedBy', 'David Morgan'],
      ['approvedOn', '2026-10-15'],
      ['requirementsRev', '1a2b3c4'],
      ['source', BUILD],
    ]);
  });

  test("DAG-1 · the ui plan's header is its own file's: approved on 2026-10-20 at requirements rev 5e6f7a8", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const ui = planOf(r, 'ui');
    expect([field(ui, 'status'), field(ui, 'approvedBy'), field(ui, 'approvedOn'), field(ui, 'requirementsRev')]).toEqual([
      'approved',
      'David Morgan',
      '2026-10-20',
      '5e6f7a8',
    ]);
  });
});

describe('investigations', () => {
  test('DAG-1 · the investigation inv-001.plan.md is a plan of its own: kind inv, its title, its file, and no nodes', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const inv = planOf(r, 'inv-001');
    expect(inv, 'plans[] holds inv-001').toBeDefined();
    expect([field(inv, 'kind'), field(inv, 'title'), field(inv, 'source'), field(inv, 'nodes')]).toEqual([
      'inv',
      'F2 stub-gate escalation',
      INV,
      [],
    ]);
  });

  test('DAG-1 · every plan is shown: build, ui and the investigation inv-001, each once', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(plansOf(r).map((p) => p.id).sort()).toEqual(['build', 'inv-001', 'ui']);
  });

  test("DAG-1 · an investigation's front matter holds no approval, so its status, approver, date and rev are null, never a default", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const inv = planOf(r, 'inv-001');
    expect(inv, 'plans[] holds inv-001').toBeDefined();
    expect([field(inv, 'status'), field(inv, 'approvedBy'), field(inv, 'approvedOn'), field(inv, 'requirementsRev')]).toEqual([null, null, null, null]);
  });

  test('DAG-1 · reading the investigation files no problem: its front matter is a plan, not an unknown shape', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(planOf(r, 'inv-001'), 'plans[] holds inv-001').toBeDefined();
    expect((r.trace?.problems ?? []).filter((p) => p.file === INV)).toEqual([]);
  });
});
