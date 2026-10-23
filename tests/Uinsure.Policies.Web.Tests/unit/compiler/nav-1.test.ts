// @vitest-environment node
// NAV-1 · Overview answers the question first. The landing screen states, from the data: rules built / total, tests
// passing, nodes done, attempts and FAILs taken, human decisions recorded, each figure linked to its source. The
// compiler holds the values each figure is counted from, and where each was read (docs/ui/derived/U1/overview/
// screen.json, "receipt figures": rules[*].status, rules[*].matrix.tests, rules[*].matrix.source, nodes[*].status and
// attempt, plans[*].source, verdicts[*].verdict, decisions[*].kind). On the `rules` fixture trail, whose README
// gives every figure: 3 of 5 rules built, 2 of 5 pass in full, 2 of 4 nodes done, 1 of 2 looped nodes took more than
// one attempt, 1 of 4 verdicts FAIL, 2 human decisions.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { DAG_FILE, decisionsOf, F1_LOOP, MATRIX_FILE, nodesOf, plansOf, REREVIEW, ruleOf, RULES, verdictsOf } from './support/rules';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(RULES);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

describe('rules built and tests passing', () => {
  test('NAV-1 · rules built: SELL-1, SELL-2 and GET-1, each with a node and a test, are built', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(['SELL-1', 'SELL-2', 'GET-1'].map((id) => [id, ruleOf(r, id)?.status ?? null])).toEqual([
      ['SELL-1', 'built'],
      ['SELL-2', 'built'],
      ['GET-1', 'built'],
    ]);
  });

  test("NAV-1 · tests passing: SELL-1 and SELL-2 carry their matrix row's counts, 2/2 and 3/3", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(ruleOf(r, 'SELL-1')?.matrix?.tests ?? null).toEqual({ pass: 2, total: 2, raw: '2/2' });
    expect(ruleOf(r, 'SELL-2')?.matrix?.tests ?? null).toEqual({ pass: 3, total: 3, raw: '3/3' });
  });

  test('NAV-1 · the rules-built and tests-passing figures link to the matrix row each count was read from', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    // rules/trail/docs/trace/requirements-matrix.md: SELL-1 is line 6, SELL-2 line 7, GET-1 line 8.
    expect(['SELL-1', 'SELL-2', 'GET-1'].map((id) => [id, ruleOf(r, id)?.matrix?.source ?? null])).toEqual([
      ['SELL-1', { file: MATRIX_FILE, line: 6 }],
      ['SELL-2', { file: MATRIX_FILE, line: 7 }],
      ['GET-1', { file: MATRIX_FILE, line: 8 }],
    ]);
  });
});

describe('nodes done and attempts taken', () => {
  test("NAV-1 · nodes done and attempts: each node's owner, status and attempt, as the plan DAG gives them", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    // Done: F0a and F1 (2 of 4). Looped (owner loop, started): F1 at attempt 2 and F2 at 1; F0a is David's, F3 at 0.
    expect(nodesOf(r).map((n) => [n.plan, n.id, n.owner ?? null, n.status ?? null, n.attempt ?? null])).toEqual([
      ['build', 'F0a', 'david', 'done', 0],
      ['build', 'F1', 'loop', 'done', 2],
      ['build', 'F2', 'loop', 'in_progress', 1],
      ['build', 'F3', 'loop', 'pending', 0],
    ]);
  });

  test('NAV-1 · the nodes-done and attempts figures link to the plan DAG they were read from', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(plansOf(r).map((p) => [p.id, p.source ?? null])).toEqual([['build', DAG_FILE]]);
  });
});

describe('FAILs taken', () => {
  test("NAV-1 · FAILs taken: F1's four verdicts, one FAIL, each with its round, agent and verdict file", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const shown = verdictsOf(r)
      .map((v) => [v.plan, v.node, v.round ?? null, v.agent ?? null, v.verdict ?? null, v.file ?? null])
      .sort((a, b) => String(a[5]).localeCompare(String(b[5])));
    expect(shown).toEqual([
      ['build', 'F1', 'A1', 'reviewer', 'FAIL', 'docs/trace/build/F1/verdicts/A1-reviewer.json'],
      ['build', 'F1', 'A1', 'security', 'PASS', 'docs/trace/build/F1/verdicts/A1-security.json'],
      ['build', 'F1', 'A2', 'reviewer', 'PASS', 'docs/trace/build/F1/verdicts/A2-reviewer.json'],
      ['build', 'F1', 'A2', 'security', 'PASS', 'docs/trace/build/F1/verdicts/A2-security.json'],
    ]);
  });
});

// U1 D1 finding I1: the orchestrator names a same-attempt re-review A<n>.<m>-<agent>.json. On the `rereview` fixture
// trail (its README): eight verdict files in rounds A1, A1.2, A2 and A2.2, one FAIL, and it is the A1.2 reviewer's.
describe('FAILs taken, with re-review rounds', () => {
  const VERDICTS = 'docs/trace/build/F1/verdicts/';
  let again: Trail;
  let rr: Run;
  beforeAll(() => {
    again = replayTrail(REREVIEW);
    rr = run(again.root);
  }, SLOW);
  afterAll(() => again?.cleanup());

  test('NAV-1 · FAILs taken: a re-review round A<n>.<m> is a verdict, its round kept verbatim', () => {
    expect(rr.error, thrown(rr)).toBeUndefined();
    const shown = verdictsOf(rr)
      .map((v) => [v.plan, v.node, v.round ?? null, v.agent ?? null, v.verdict ?? null, v.file ?? null])
      .sort((a, b) => String(a[5]).localeCompare(String(b[5])));
    expect(shown).toEqual([
      ['build', 'F1', 'A1', 'reviewer', 'PASS', `${VERDICTS}A1-reviewer.json`],
      ['build', 'F1', 'A1', 'security', 'PASS', `${VERDICTS}A1-security.json`],
      ['build', 'F1', 'A1.2', 'reviewer', 'FAIL', `${VERDICTS}A1.2-reviewer.json`],
      ['build', 'F1', 'A1.2', 'security', 'PASS', `${VERDICTS}A1.2-security.json`],
      ['build', 'F1', 'A2', 'reviewer', 'PASS', `${VERDICTS}A2-reviewer.json`],
      ['build', 'F1', 'A2', 'security', 'PASS', `${VERDICTS}A2-security.json`],
      ['build', 'F1', 'A2.2', 'reviewer', 'PASS', `${VERDICTS}A2.2-reviewer.json`],
      ['build', 'F1', 'A2.2', 'security', 'PASS', `${VERDICTS}A2.2-security.json`],
    ]);
  });

  test('NAV-1 · FAILs taken: no re-review verdict file A<n>.<m>-<agent>.json is filed in problems[]', () => {
    expect(rr.error, thrown(rr)).toBeUndefined();
    expect(rr.trace, 'trace.json was written').not.toBeNull();
    const filed = (rr.trace?.problems ?? []).filter((p) => (p.file ?? '').startsWith(VERDICTS));
    expect(filed).toEqual([]);
  });
});

describe('human decisions recorded', () => {
  test("NAV-1 · human decisions: F1's pause 1 and its sign-off, each at its loop.jsonl line; F2 has none", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    // rules/trail/docs/trace/build/F1/loop.jsonl: pause1 is line 5, signoff(c9) line 18. Gates, verdicts, attempt++
    // and pr(10) are not human decisions; F2's loop records none.
    const shown = decisionsOf(r).map((d) => [d.kind, d.plan ?? null, d.node ?? null, d.when ?? null, d.evidence ?? null]);
    expect(shown).toEqual([
      ['pause1', 'build', 'F1', '2026-10-16T13:20:00Z', { file: F1_LOOP, line: 5 }],
      ['signoff', 'build', 'F1', '2026-10-18T10:00:00Z', { file: F1_LOOP, line: 18 }],
    ]);
  });
});
