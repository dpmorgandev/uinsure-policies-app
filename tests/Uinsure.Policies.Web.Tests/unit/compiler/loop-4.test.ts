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

describe('text the real rounds write: a qualified marker', () => {
  test('LOOP-4 · a qualified marker such as Cause (kit): splits the text as its marker does, keeping the qualifier', () => {
    const text = 'Symptom (security S1): S1. Cause (screen): C1. Cause (kit): C2. Fix direction: F1.';
    const i1 = compiledWith(text);
    const symptom = i1?.symptom ?? '';
    const cause = i1?.cause ?? '';
    expect(symptom, 'the symptom keeps its qualifier').toContain('(security S1)');
    expect(symptom).toContain('S1.');
    for (const other of ['(screen)', 'C1', '(kit)', 'C2', 'F1']) expect(symptom, `the symptom holds no ${other}`).not.toContain(other);
    const at = ['(screen)', 'C1.', '(kit)', 'C2.'].map((part) => cause.indexOf(part));
    expect(at[0], `the cause opens with (screen): ${JSON.stringify(cause)}`).toBeGreaterThanOrEqual(0);
    expect(at, `the cause holds (screen) C1 then (kit) C2, in order: ${JSON.stringify(cause)}`).toEqual([...at].sort((a, b) => a - b));
    expect(new Set(at).size, 'each part is its own place in the cause').toBe(4);
    expect(i1?.fixDirection ?? null).toBe('F1.');
    expectEveryWord(text, i1);
  }, SLOW);

  test("LOOP-4 · a round with Cause (screen): and Cause (kit):, as U3's round A2 writes it, keeps both causes out of the symptom and in order", () => {
    const preamble = "Layer: the kit, with a screen part. It is recorded as 'api' because the schema's layer enum has no ui layer.";
    const symptom = "a gate event whose log line holds no ok is drawn as 'Waived'.";
    const screen = "resultOf maps event.ok === null to 'waived' (src/web/app/explorer/Ladder.tsx:19), and its own comment (:16) says such a gate 'did not decide'.";
    const kit =
      'GateResult has only held, failed, expected-fail and waived (src/web/kit/project/gate-row/GateRow.tsx:13). Rule: LOOP-1 shows ok as the line records it, and HONEST-1 applies.';
    const fix = "a kit change in a /kit-gap node for gate-row, with a state for 'ok not recorded'.";
    const text = `${preamble} Symptom: ${symptom} Cause (screen): ${screen} Cause (kit): ${kit} Fix direction: ${fix}`;
    const i1 = compiledWith(text);
    const got = i1?.symptom ?? '';
    const cause = i1?.cause ?? '';
    expect(got.endsWith(symptom), `the symptom ends with its own text: ${JSON.stringify(got)}`).toBe(true);
    for (const other of ['resultOf', 'GateResult']) expect(got, `the symptom holds no cause text (${other})`).not.toContain(other);
    expect(cause.indexOf('(screen)'), `the cause keeps (screen): ${JSON.stringify(cause)}`).toBeGreaterThanOrEqual(0);
    expect(cause.indexOf(screen), 'the screen cause follows its qualifier').toBeGreaterThan(cause.indexOf('(screen)'));
    expect(cause.indexOf('(kit)'), 'the kit qualifier follows the screen cause').toBeGreaterThan(cause.indexOf(screen));
    expect(cause.indexOf(kit), 'the kit cause follows its qualifier').toBeGreaterThan(cause.indexOf('(kit)'));
    expect(i1?.fixDirection ?? null).toBe(fix);
    expectEveryWord(text, i1);
  }, SLOW);

  test("LOOP-4 · a Symptom (security S1, P2, verdict PASS): marker, as U3's round A2 writes it, opens the symptom with its qualifier", () => {
    const preamble = "Layer: the kit primitives. It is recorded as 'api' because the schema's layer enum has no ui layer.";
    const symptom = "external GitHub anchors render without rel='noreferrer'.";
    const cause = "ShaLink's anchors (src/web/kit/primitives/sha-link/ShaLink.tsx:45-54 and :61) set no rel attribute.";
    const fix = "none in U3. Leave it to U7, which adds rel='noreferrer' to the kit's external anchors.";
    const text = `${preamble} Symptom (security S1, P2, verdict PASS): ${symptom} Cause: ${cause} Fix direction: ${fix}`;
    const i1 = compiledWith(text);
    const got = i1?.symptom ?? '';
    expect(got, 'the symptom keeps its qualifier').toContain('(security S1, P2, verdict PASS)');
    expect(got.endsWith(symptom), `the symptom ends with its own text: ${JSON.stringify(got)}`).toBe(true);
    expect(got.indexOf('(security S1, P2, verdict PASS)'), 'the qualifier comes before the symptom text').toBeLessThan(got.indexOf(symptom));
    expect([i1?.cause ?? null, i1?.fixDirection ?? null]).toEqual([cause, fix]);
    expectEveryWord(text, i1);
  }, SLOW);
});

// A marker quoted inside a sentence (A4/R1). The real rounds quote the marker words when they write about them
// ("open with 'Symptom:'", "says 'no \"Cause:\" marker'", "has 'Cause (kit):'", U3's own round A3). A quoted marker is
// not a split point: its words stay in place, in the field the sentence around it belongs to. The word check here
// strips nothing. A field's words, read in order, are the recorded words with only the split-point markers taken out,
// so a quoted "Symptom:" or "Cause:" that went missing, or moved, fails it.

/** The words of a text as written, split at white space only; nothing is stripped. */
function wordsAsWritten(text: string | null | undefined): string[] {
  return (text ?? '').split(/\s+/).filter(Boolean);
}

/** Symptom, cause and fix direction, read in that order, hold exactly `bodies`' words: the text without its split markers. */
function expectEveryWordAsWritten(bodies: string[], f: FindingOut | undefined): void {
  expect(
    [...wordsAsWritten(f?.symptom), ...wordsAsWritten(f?.cause), ...wordsAsWritten(f?.fixDirection)],
    'every recorded word, the quoted marker words included, in order',
  ).toEqual(bodies.flatMap(wordsAsWritten));
}

describe('text the real rounds write: a marker quoted inside a sentence', () => {
  test("LOOP-4 · a quoted 'Symptom:' and 'Cause:' inside the cause are not split points: the cause keeps them, word for word", () => {
    const cause = "it matches only 'Symptom:' and 'Cause:'.";
    const text = `Cause: ${cause} Fix direction: F1.`;
    const i1 = compiledWith(text);
    expect([i1?.symptom ?? null, i1?.cause ?? null, i1?.fixDirection ?? null]).toEqual([null, cause, 'F1.']);
    expectEveryWordAsWritten([cause, 'F1.'], i1);
  }, SLOW);

  test('LOOP-4 · a double-quoted "Cause:" and a quoted \'Fix direction:\' inside the symptom stay in the symptom', () => {
    const symptom = "the Cause field says 'no \"Cause:\" marker in the recorded text', and the fix direction opens on 'Fix direction:'.";
    const text = `Symptom: ${symptom} Cause: C1. Fix direction: F1.`;
    const i1 = compiledWith(text);
    expect([i1?.symptom ?? null, i1?.cause ?? null, i1?.fixDirection ?? null]).toEqual([symptom, 'C1.', 'F1.']);
    expectEveryWordAsWritten([symptom, 'C1.', 'F1.'], i1);
  }, SLOW);

  test("LOOP-4 · a quoted qualified marker such as 'Symptom (security S1, P2, verdict PASS):' is not a split point: the cause keeps it whole", () => {
    const cause = "real rounds write 'Symptom (security S1, P2, verdict PASS):', 'Cause (kit):' and 'Cause (screen):'.";
    const text = `Cause: ${cause} Fix direction: F1.`;
    const i1 = compiledWith(text);
    expect([i1?.symptom ?? null, i1?.cause ?? null, i1?.fixDirection ?? null]).toEqual([null, cause, 'F1.']);
    expectEveryWordAsWritten([cause, 'F1.'], i1);
  }, SLOW);

  test("LOOP-4 · a round that quotes the markers in its cause, as U3's round A3 writes it, keeps the whole cause in the cause field", () => {
    const preamble =
      "Reviewer R1 (P1), part 1 of 2. I split R1 in two because it has two separate code faults; I2 is the other part. Layer: the ui compiler. It is recorded as 'api' because the schema's layer enum has no ui layer, as in A2.";
    const symptom =
      'on the finding page, text the investigator recorded before the first marker is missing, and so is text after a repeated marker.';
    const cause =
      "splitRootCause (src/web/compiler/plans.ts:232-243) builds each field only from the text between one marker and the next. The signed-off reference already decides the preamble case. docs/ui/derived/U3/finding/long-content.html:33 says 'Where a sentence comes before the \"Symptom:\" marker, it opens the Symptom field', and :61 draws D2 I7 that way. Only about 35 of the roughly 148 root_cause values open with 'Symptom:'. The marker pattern at src/web/compiler/plans.ts:233 matches only the exact words 'Symptom:', 'Cause:' and 'Fix direction:'. Real rounds also write qualified forms: 'Cause (kit):' and 'Cause (screen):'.";
    const fix =
      'every character of the recorded root_cause must end up in some field. A preamble opens the Symptom field, as long-content.html:33 says. Recurrence: new fingerprint.';
    const text = `${preamble} Symptom: ${symptom} Cause: ${cause} Fix direction: ${fix}`;
    const i1 = compiledWith(text);
    const got = i1?.symptom ?? '';
    expect(got.startsWith(preamble), `the preamble opens the symptom: ${JSON.stringify(got)}`).toBe(true);
    expect(got.endsWith(symptom), `the symptom ends with its own text and holds no cause text: ${JSON.stringify(got)}`).toBe(true);
    expect(i1?.cause ?? null, 'the cause, its quoted "Symptom:", \'Symptom:\', \'Cause:\', \'Fix direction:\' and qualified forms in place').toBe(cause);
    expect(i1?.fixDirection ?? null).toBe(fix);
    expectEveryWordAsWritten([preamble, symptom, cause, fix], i1);
  }, SLOW);
});
