// @vitest-environment node
// LOOP-4 · Findings. Each investigator finding: symptom, cause, file:line, fix direction, suggested test, testable or
// not, and the commit that fixed it. The compiler holds each finding of each findings/<round>.md in trace.json's
// findings[] (docs/ui/derived/U3/finding/screen.json: round, attempt, source, file, id, rule, layer, cause,
// fixDirection, files, testable, untestableReason, fixedBy), with the symptom and suggested test LOOP-4 names. On the
// `retry-ladder` fixture trail (retry-ladder/README.md): round A1 (its JSON in a ```json fence) holds I1, testable,
// fixed by c4 then c5, and I2, untestable, fixed by nothing; round A2 (its JSON bare after the frontmatter) holds I1,
// fixed by c8 then c9. Each finding's text is one root_cause with its own "Symptom:", "Cause:" and "Fix direction:"
// markers: the compiler splits it there, and keeps text with no markers whole as the cause.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { replaceIn, replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { A1_FILE, A2_FILE, findingOf, findingsOf, RETRY, sha } from './support/loop';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(RETRY);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

/** A2/I1's root_cause, as findings/A2.md records it. */
const A2_ROOT_CAUSE =
  'Symptom: a reference that differs from a sold one only in case is sold again, 201. Cause: the uniqueness check compares references as written, case-sensitively. Hypothesis inv-001 holds: no test sells such a pair. Fix direction: compare the normalised reference, with the case-only pair as a red test first.';

describe('each round, each finding', () => {
  test('LOOP-4 · build/F1 has three findings, round A1 I1 and I2 then round A2 I1, each from its round file', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingsOf(r).map((f) => [f.round ?? null, f.id ?? null, f.file ?? null])).toEqual([
      ['A1', 'I1', A1_FILE],
      ['A1', 'I2', A1_FILE],
      ['A2', 'I1', A2_FILE],
    ]);
  });

  test('LOOP-4 · round A1 names its source, the gate.stub FAIL at c2, as its source_ref records it', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingOf(r, 'A1', 'I1')?.source ?? null).toBe(`gate.stub (ok:false) at ${sha(trail, 'c2')}, docs/trace/build/F1/loop.jsonl line 4`);
  });

  test('LOOP-4 · round A2 names its source, the A2 reviewer verdict, as its source_ref records it', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingOf(r, 'A2', 'I1')?.source ?? null).toBe('docs/trace/build/F1/verdicts/A2-reviewer.json R1; R2 (P2) is left to the refactor');
  });

  test('LOOP-4 · each finding is an investigator finding', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingsOf(r).map((f) => [f.round ?? null, f.id ?? null, f.kind ?? null])).toEqual([
      ['A1', 'I1', 'investigator'],
      ['A1', 'I2', 'investigator'],
      ['A2', 'I1', 'investigator'],
    ]);
  });
});

describe("a finding's fields", () => {
  test('LOOP-4 · A1/I1 keeps its rule SELL-2, its layer api and the two files it names', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const i1 = findingOf(r, 'A1', 'I1');
    expect([i1?.rule ?? null, i1?.layer ?? null, i1?.files ?? null]).toEqual(['SELL-2', 'api', ['src/sell.txt', 'tests/web/e2e/F1/sell.spec.ts']]);
  });

  test("LOOP-4 · A1/I1's symptom, cause and fix direction are its root_cause split at their markers, verbatim", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const i1 = findingOf(r, 'A1', 'I1');
    expect([i1?.symptom ?? null, i1?.cause ?? null, i1?.fixDirection ?? null]).toEqual([
      'a second POST /policies with a reference already answered returns 500, a status the contract never gives.',
      'the stub keeps the references it has answered and throws on a repeat instead of answering, so the duplicate path never reaches a response.',
      'have the stub answer a repeat with the canned 409 the contract gives for a duplicate reference, and keep its first answer 201.',
    ]);
  });

  test('LOOP-4 · A2/I1 keeps every sentence between its markers: the cause runs on to the hypothesis, up to Fix direction', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const i1 = findingOf(r, 'A2', 'I1');
    expect([i1?.symptom ?? null, i1?.cause ?? null, i1?.fixDirection ?? null]).toEqual([
      'a reference that differs from a sold one only in case is sold again, 201.',
      'the uniqueness check compares references as written, case-sensitively. Hypothesis inv-001 holds: no test sells such a pair.',
      'compare the normalised reference, with the case-only pair as a red test first.',
    ]);
  });

  test('LOOP-4 · A1/I1 is testable, with its suggested test and no untestable reason', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const i1 = findingOf(r, 'A1', 'I1');
    expect(i1, 'A1/I1 compiled').toBeDefined();
    expect([i1?.testable, i1?.suggestedTest, i1?.untestableReason]).toEqual([
      true,
      'Given a reference the stub has answered once, When it is sold again, Then the answer is 409, not 500.',
      null,
    ]);
  });

  test('LOOP-4 · A1/I2 is untestable, with its recorded reason and no suggested test', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const i2 = findingOf(r, 'A1', 'I2');
    expect(i2, 'A1/I2 compiled').toBeDefined();
    expect([i2?.testable, i2?.suggestedTest, i2?.untestableReason]).toEqual([
      false,
      null,
      'A test that is meant to fail at the stub step fails the same way for either cause, so no test can show which one it was.',
    ]);
  });

  test("LOOP-4 · A1/I2's fix direction, which says none in the code, is kept as written", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingOf(r, 'A1', 'I2')?.fixDirection ?? null).toBe("none in the code; the gate's live leg caught it, and it stays.");
  });
});

describe('the commit that fixed it', () => {
  test('LOOP-4 · A1/I1 is fixed by c4 then c5, the commits trailed Fixes-Finding: A1/I1, as full SHAs in commit order', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingOf(r, 'A1', 'I1')?.fixedBy ?? null).toEqual([sha(trail, 'c4'), sha(trail, 'c5')]);
  });

  test("LOOP-4 · A2/I1 is fixed by c8 then c9, never by A1/I1's c4 and c5, though both findings are I1", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingOf(r, 'A2', 'I1')?.fixedBy ?? null).toEqual([sha(trail, 'c8'), sha(trail, 'c9')]);
  });

  test('LOOP-4 · A1/I2, which no commit names in Fixes-Finding, has no fix commit: an empty list', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingOf(r, 'A1', 'I2')?.fixedBy ?? null).toEqual([]);
  });
});

describe('text with no markers, and a round that cannot be read', () => {
  test('LOOP-4 · a root_cause with no markers is kept whole as the cause; its symptom and fix direction are null', () => {
    const plain = 'References are compared as written, so a case-only pair is sold twice.';
    const unmarked = replayTrail(RETRY, (root) => replaceIn(root, A2_FILE, A2_ROOT_CAUSE, plain));
    try {
      const u = run(unmarked.root);
      expect(u.error, thrown(u)).toBeUndefined();
      const i1 = findingOf(u, 'A2', 'I1');
      expect(i1, 'A2/I1 compiled').toBeDefined();
      expect([i1?.symptom, i1?.cause, i1?.fixDirection]).toEqual([null, plain, null]);
    } finally {
      unmarked.cleanup();
    }
  }, SLOW);

  test("LOOP-4 · a round file whose JSON can't be read is named in problems, and the other round's findings still compile", () => {
    const broken = replayTrail(RETRY, (root) => replaceIn(root, A2_FILE, '{"schema_version":1,', '{schema_version:1,'));
    try {
      const b = run(broken.root);
      expect(b.error, thrown(b)).toBeUndefined();
      expect(findingsOf(b).map((f) => [f.round ?? null, f.id ?? null])).toEqual([
        ['A1', 'I1'],
        ['A1', 'I2'],
      ]);
      expect((b.trace?.problems ?? []).filter((p) => p.file === A2_FILE).length, `${A2_FILE} is named in problems`).toBeGreaterThan(0);
    } finally {
      broken.cleanup();
    }
  }, SLOW);
});
