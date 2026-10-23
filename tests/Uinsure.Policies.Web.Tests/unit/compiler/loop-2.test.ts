// @vitest-environment node
// LOOP-2 · Retry ladder. Each attempt as a chain: FAIL → findings → red test → the Fixes-Finding commit → re-run
// verdicts. The compiler holds what places each link on its attempt (docs/ui/derived/U3/loop/screen.json, "attempt
// ladder": events[*].attempt and detail; docs/ui/derived/U3/plan/screen.json, "investigation body"): each event's,
// verdict's and finding round's attempt as recorded, the attempt++ turn-overs, and the investigation that steps off the
// spine, read from its own plan file. On the `retry-ladder` fixture trail (retry-ladder/README.md): attempt 1 is log
// lines 1 to 4, attempt 2 lines 5 to 12 (round A1, verdicts A2), attempt 3 lines 13 to 23 (inv-001, round A2,
// verdicts A3). The red test and the fix of a round are told apart by their commits' TDD trailers (RULE-2's
// commits[*].tdd); which finding they fix is LOOP-4's fixedBy.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { eventAt, eventsOf, findingsOf, INV_PLAN, planOf, RETRY, short7, verdictsOf } from './support/loop';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(RETRY);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, at) => from + at);

describe('each link on its attempt', () => {
  test('LOOP-2 · each event carries the attempt its line records: lines 1-4 attempt 1, 5-12 attempt 2, 13-23 attempt 3', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const expected = [
      ...range(1, 4).map((line) => [line, 1]),
      ...range(5, 12).map((line) => [line, 2]),
      ...range(13, 23).map((line) => [line, 3]),
    ];
    expect(eventsOf(r).map((e) => [e.line, e.attempt ?? null])).toEqual(expected);
  });

  test('LOOP-2 · the attempt++ at line 5 opens attempt 2 on the gate.stub FAIL, its detail with c2 as the line writes it', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const turn = eventAt(r, 5);
    expect([turn?.event ?? null, turn?.attempt ?? null, turn?.detail ?? null]).toEqual([
      'attempt++',
      2,
      `1 → 2 on gate.stub FAIL at ${short7(trail, 'c2')} (sale route 500); failure route round A1`,
    ]);
  });

  test('LOOP-2 · the attempt++ at line 13 opens attempt 3 on the A2 reviewer FAIL at c6', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const turn = eventAt(r, 13);
    expect([turn?.event ?? null, turn?.attempt ?? null, turn?.detail ?? null]).toEqual([
      'attempt++',
      3,
      `2 → 3 on reviewer FAIL at ${short7(trail, 'c6')} (A2)`,
    ]);
  });

  test("LOOP-2 · each verdict carries its file's attempt: A2's security and reviewer attempt 2, A3's attempt 3", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const byRound = verdictsOf(r)
      .map((v) => [v.round ?? null, v.agent ?? null, v.attempt ?? null])
      .sort((a, b) => `${a[0]}-${a[1]}`.localeCompare(`${b[0]}-${b[1]}`));
    expect(byRound).toEqual([
      ['A2', 'reviewer', 2],
      ['A2', 'security', 2],
      ['A3', 'reviewer', 3],
      ['A3', 'security', 3],
    ]);
  });

  test("LOOP-2 · each finding carries its round's attempt: round A1's two attempt 2, round A2's attempt 3", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingsOf(r).map((f) => [f.round ?? null, f.id ?? null, f.attempt ?? null])).toEqual([
      ['A1', 'I1', 2],
      ['A1', 'I2', 2],
      ['A2', 'I1', 3],
    ]);
  });
});

describe('the investigation off the spine', () => {
  test("LOOP-2 · inv-001's plan file is a plan of kind inv, with no nodes, read from its own path", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const inv = planOf(r, 'inv-001');
    expect([inv?.id ?? null, inv?.kind ?? null, inv?.title ?? null, inv?.source ?? null, inv?.nodes ?? null]).toEqual([
      'inv-001',
      'inv',
      'F1 attempt-3 escalation',
      INV_PLAN,
      [],
    ]);
  });

  test("LOOP-2 · inv-001 keeps its frontmatter as written, naming its parent build/F1, where it rejoins the spine", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(planOf(r, 'inv-001')?.frontmatter ?? null).toEqual({
      plan_id: 'inv-001',
      kind: 'investigation',
      title: 'F1 attempt-3 escalation',
      created: '2026-10-18',
      dag: null,
      parent: 'build/F1',
    });
  });

  test("LOOP-2 · inv-001's question is its plan file's Question section, verbatim", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(planOf(r, 'inv-001')?.question ?? null).toBe(
      'Why does the reviewer FAIL build/F1 at attempt 2 when every gate held, and is the cause in the code or in the tests?',
    );
  });

  test("LOOP-2 · inv-001's hypothesis is its plan file's Hypothesis section, both of its lines", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const hypothesis = planOf(r, 'inv-001')?.hypothesis ?? null;
    expect(hypothesis).not.toBeNull();
    expect(hypothesis).toContain('The sale compares references as written, and no test sells a reference that differs from a sold one only in case.');
    expect(hypothesis).toContain('Disproved if a test already sells such a pair, or the comparison normalises case.');
    expect(hypothesis, 'the next section is not part of it').not.toContain('##');
  });

  test('LOOP-2 · the build plan, read from its DAG, stays as it was beside inv-001: kind build, node F1', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(planOf(r, 'inv-001'), 'inv-001 is a plan').toBeDefined();
    const build = planOf(r, 'build');
    expect([build?.kind ?? null, build?.nodes ?? null]).toEqual(['build', ['F1']]);
  });
});
