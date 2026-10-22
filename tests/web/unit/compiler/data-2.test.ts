// @vitest-environment node
// DATA-2 · Provenance labels survive. Every item keeps its label from docs/trace/README.md: generated (a hook or
// render-trace.mjs wrote it), recorded (an agent's judgement stored verbatim) or written (by David or the main
// session). The compiler labels each item U3's screens show (trace-data: "every value the screen labels carries its
// provenance"): a loop.jsonl event is generated (the orchestrator's log), a verdicts/<round>-<agent>.json is recorded,
// and a findings/<round>.md finding is recorded (docs/trace/README.md, "What's here"). On the `retry-ladder` fixture
// trail (retry-ladder/README.md): 23 events, 4 verdicts, 3 findings.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { readIn, replayTrail, run, SLOW, thrown, writeIn } from './support/trail';
import type { Run, Trail } from './support/trail';
import { eventsOf, findingsOf, LOOP_FILE, RETRY, verdictsOf } from './support/loop';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(RETRY);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

describe('generated', () => {
  test("DATA-2 · each of build/F1's 23 loop events is labelled generated", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(eventsOf(r).map((e) => [e.line, e.provenance ?? null])).toEqual(Array.from({ length: 23 }, (_, at) => [at + 1, 'generated']));
  });

  test('DATA-2 · a malformed loop line, kept as raw, keeps the label of the log it came from: generated', () => {
    const broken = replayTrail(RETRY, (root) => writeIn(root, LOOP_FILE, `${readIn(root, LOOP_FILE).replace(/\n?$/, '\n')}not a json line\n`));
    try {
      const b = run(broken.root);
      expect(b.error, thrown(b)).toBeUndefined();
      const kept = eventsOf(b).find((e) => e.line === 24);
      expect([kept?.raw ?? null, kept?.provenance ?? null]).toEqual(['not a json line', 'generated']);
    } finally {
      broken.cleanup();
    }
  }, SLOW);
});

describe('recorded', () => {
  test("DATA-2 · each of build/F1's four verdicts is labelled recorded", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const labels = verdictsOf(r)
      .map((v) => [v.round ?? null, v.agent ?? null, v.provenance ?? null])
      .sort((a, b) => `${a[0]}-${a[1]}`.localeCompare(`${b[0]}-${b[1]}`));
    expect(labels).toEqual([
      ['A2', 'reviewer', 'recorded'],
      ['A2', 'security', 'recorded'],
      ['A3', 'reviewer', 'recorded'],
      ['A3', 'security', 'recorded'],
    ]);
  });

  test("DATA-2 · each of build/F1's three findings is labelled recorded", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(findingsOf(r).map((f) => [f.round ?? null, f.id ?? null, f.provenance ?? null])).toEqual([
      ['A1', 'I1', 'recorded'],
      ['A1', 'I2', 'recorded'],
      ['A2', 'I1', 'recorded'],
    ]);
  });
});
