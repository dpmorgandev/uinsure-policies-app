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
import type { FindingOut } from './support/loop';

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

// Text as the real rounds write it (A3/I1, A3/I2). Of the root_cause values under docs/trace/**/findings, only about a
// quarter open with "Symptom:". The rest open with a sentence before the first marker (U3's own round A2: "Layer: ...
// recorded as 'api' because ..."), and some write a marker with a parenthesised qualifier ("Cause (kit):",
// "Symptom (security S1, P2, verdict PASS):"). The signed-off reference decides the preamble: "Where a sentence comes
// before the "Symptom:" marker, it opens the Symptom field" (docs/ui/derived/U3/finding/long-content.html). No recorded
// word is dropped: a repeated marker's text joins its field, in order, and a qualified marker splits as its marker does,
// its qualifier kept in the field.

/** A marker's name ("Symptom", "Cause", "Fix direction") where a colon, or a qualifier and a colon, follows it. */
const MARKER_NAME = /\b(?:Symptom|Cause|Fix direction)(?=\s*(?:\([^)]*\))?\s*:)/g;

/** The recorded words of a text, without the marker names and the colons and brackets around them. */
function wordsOf(text: string | null | undefined): string[] {
  return (text ?? '').replace(MARKER_NAME, ' ').split(/[\s:()]+/).filter(Boolean);
}

/** Compiles retry-ladder with A2/I1's root_cause recorded as `rootCause`, and gives that finding back. */
function compiledWith(rootCause: string): FindingOut | undefined {
  const value = JSON.stringify(rootCause).slice(1, -1);
  const changed = replayTrail(RETRY, (root) => replaceIn(root, A2_FILE, A2_ROOT_CAUSE, value));
  try {
    const c = run(changed.root);
    expect(c.error, thrown(c)).toBeUndefined();
    const i1 = findingOf(c, 'A2', 'I1');
    expect(i1, 'A2/I1 compiled').toBeDefined();
    return i1;
  } finally {
    changed.cleanup();
  }
}

/** Every recorded word of the root_cause is in symptom, cause and fix direction, read in that order. */
function expectEveryWord(rootCause: string, f: FindingOut | undefined): void {
  expect([...wordsOf(f?.symptom), ...wordsOf(f?.cause), ...wordsOf(f?.fixDirection)], 'every recorded word, in order').toEqual(
    wordsOf(rootCause),
  );
}

describe('text the real rounds write: a preamble, a repeated marker', () => {
  test('LOOP-4 · a preamble and a repeated marker keep every word of the root_cause', () => {
    const text = 'Layer note: filed as api. Symptom: S1. Cause: C1. Cause: C2. Fix direction: F1.';
    const i1 = compiledWith(text);
    const symptom = i1?.symptom ?? '';
    const cause = i1?.cause ?? '';
    expect(symptom.startsWith('Layer note: filed as api.'), `the preamble opens the symptom: ${JSON.stringify(symptom)}`).toBe(true);
    expect(symptom).toContain('S1.');
    expect(symptom).not.toContain('C1');
    expect(cause.indexOf('C1.'), `C1 is in the cause: ${JSON.stringify(cause)}`).toBeGreaterThanOrEqual(0);
    expect(cause.indexOf('C2.'), `C2 follows C1 in the cause: ${JSON.stringify(cause)}`).toBeGreaterThan(cause.indexOf('C1.'));
    expect(i1?.fixDirection ?? null).toBe('F1.');
    expectEveryWord(text, i1);
  }, SLOW);

  test("LOOP-4 · a round's sentence before Symptom:, as U3's round A2 writes it, opens the symptom and keeps every word", () => {
    const preamble = "Layer: screen only, no kit change. It is recorded as 'api' because the schema's layer enum has no ui layer.";
    const symptom =
      "every node's loop page says its events were 'each event recorded by the orchestrator'. In fact 37 lines in 7 real logs have source 'reconciled'.";
    const cause =
      "src/web/app/explorer/loop/Loop.tsx:42-43 prints that sentence as a fixed string. It never reads LoopEvent.source. Rule: DATA-2 says every item keeps its provenance, and HONEST-1 forbids a name the trail doesn't hold.";
    const fix = 'in the screen, derive the provenance clause from the source values of the events in the log, and name a line whose source differs.';
    const text = `${preamble} Symptom: ${symptom} Cause: ${cause} Fix direction: ${fix}`;
    const i1 = compiledWith(text);
    const got = i1?.symptom ?? '';
    expect(got.startsWith(preamble), `the preamble opens the symptom: ${JSON.stringify(got)}`).toBe(true);
    expect(got.endsWith(symptom), `the symptom ends with its own text: ${JSON.stringify(got)}`).toBe(true);
    expect([i1?.cause ?? null, i1?.fixDirection ?? null]).toEqual([cause, fix]);
    expectEveryWord(text, i1);
  }, SLOW);
});
