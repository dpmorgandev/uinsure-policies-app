// @vitest-environment node
// LOOP-1 · Gate timeline. Every loop.jsonl event: gate, command, exit code, expected outcome, ok, and the detail line.
// FAILs stand out. The compiler holds each node's loop events in trace.json's events[], one per log line, in the
// design fixture's shape (docs/ui/derived/U3/loop/screen.json, "gate timeline": events[*].line, attempt, event, kind,
// gate, cmd, exit, expect, ok, head, detail). On the `retry-ladder` fixture trail (retry-ladder/README.md): build/F1's
// 23 log lines, twelve of them gate or state events, gate.stub at line 4 the only one recorded ok false. A value the
// line doesn't hold is null, never a default; ok is the line's own, never re-derived from the exit code.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { readIn, replayTrail, run, SLOW, thrown, writeIn } from './support/trail';
import type { Run, Trail } from './support/trail';
import { RULES } from './support/rules';
import { eventAt, eventsOf, LOOP_FILE, linesOf, RETRY, sha } from './support/loop';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(RETRY);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

/** Each log line's event and kind, as the design fixture classes them: a gate.* event is a gate, a state(…) a state. */
const EVENTS: [number, string, string][] = [
  [1, 'setup', 'setup'],
  [2, 'state(in_progress)', 'state'],
  [3, 'gate.red', 'gate'],
  [4, 'gate.stub', 'gate'],
  [5, 'attempt++', 'attempt++'],
  [6, 'findings(docs/trace/build/F1/findings/A1.md)', 'findings'],
  [7, 'gate.finding-red', 'gate'],
  [8, 'gate.stub', 'gate'],
  [9, 'pause1', 'pause1'],
  [10, 'gate.green', 'gate'],
  [11, 'verdict(security,PASS,docs/trace/build/F1/verdicts/A2-security.json)', 'verdict'],
  [12, 'verdict(reviewer,FAIL,docs/trace/build/F1/verdicts/A2-reviewer.json)', 'verdict'],
  [13, 'attempt++', 'attempt++'],
  [14, 'investigation.opened(inv-001)', 'investigation.opened'],
  [15, 'state(investigating)', 'state'],
  [16, 'findings(docs/trace/build/F1/findings/A2.md)', 'findings'],
  [17, 'state(in_progress)', 'state'],
  [18, 'gate.finding-red', 'gate'],
  [19, 'gate.green', 'gate'],
  [20, 'verdict(security,PASS,docs/trace/build/F1/verdicts/A3-security.json)', 'verdict'],
  [21, 'verdict(reviewer,PASS,docs/trace/build/F1/verdicts/A3-reviewer.json)', 'verdict'],
  [22, 'gate.qa', 'gate'],
  [23, 'gate.integrate', 'gate'],
];

describe('one event per log line', () => {
  test("LOOP-1 · build/F1's 23 log lines compile to 23 events, one per line, in log order", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(eventsOf(r).map((e) => e.line)).toEqual(EVENTS.map(([line]) => line));
  });

  test('LOOP-1 · each event keeps its event name as the line records it, and its kind: gate, state or the event it is', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(eventsOf(r).map((e) => [e.line, e.event ?? null, e.kind ?? null])).toEqual(EVENTS);
  });

  test("LOOP-1 · each gate event names its gate, the event's name after gate.", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(eventsOf(r).filter((e) => e.kind === 'gate').map((e) => [e.line, e.gate ?? null])).toEqual([
      [3, 'red'],
      [4, 'stub'],
      [7, 'finding-red'],
      [8, 'stub'],
      [10, 'green'],
      [18, 'finding-red'],
      [19, 'green'],
      [22, 'qa'],
      [23, 'integrate'],
    ]);
  });

  test('LOOP-1 · each event keeps its log line, verbatim, as raw', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const lines = linesOf(trail.root, LOOP_FILE);
    expect(eventsOf(r).map((e) => [e.line, e.raw ?? null])).toEqual([...lines].map(([line, text]) => [line, text]));
  });
});

describe('the FAIL, and the gates that held', () => {
  test('LOOP-1 · gate.stub at line 4 keeps its command, exit 1, expectation, ok false, head c2 and detail, verbatim', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(eventAt(r, 4) ?? null).toMatchObject({
      plan: 'build',
      node: 'F1',
      line: 4,
      ts: '2026-10-18T12:25:00Z',
      attempt: 1,
      event: 'gate.stub',
      kind: 'gate',
      gate: 'stub',
      cmd: 'npm run e2e -- --grep "SELL-"; curl -X POST /policies twice with reference ABC-1',
      exit: 1,
      expect: 'every SELL test fails and the route answers its happy-path status',
      ok: false,
      head: sha(trail, 'c2'),
      detail:
        'tests: 2 total, 2 failed. Live: the first POST answered 201, the second POST with the same reference answered 500: the stub throws on a reference it has answered. API stopped.',
      source: 'orchestrator',
    });
  });

  test('LOOP-1 · line 4 is the only event recorded ok false, so the FAIL can stand out', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(eventsOf(r).length, 'the log compiled to events').toBe(23);
    expect(eventsOf(r).filter((e) => e.ok === false).map((e) => e.line)).toEqual([4]);
  });

  test('LOOP-1 · gate.red at line 3 exited 2 expecting fail, and stays ok true as recorded', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const red = eventAt(r, 3);
    expect([red?.exit ?? null, red?.expect ?? null, red?.ok ?? null]).toEqual([2, 'fail', true]);
  });

  test("LOOP-1 · gate.stub at line 8 exited 1, as line 4's did, and stays ok true as recorded, never re-derived from the exit", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const rerun = eventAt(r, 8);
    expect([rerun?.gate ?? null, rerun?.exit ?? null, rerun?.ok ?? null, rerun?.head ?? null]).toEqual(['stub', 1, true, sha(trail, 'c5')]);
  });

  test('LOOP-1 · gate.green at line 10 exited 0, ok true, with its command and detail', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const green = eventAt(r, 10);
    expect([green?.cmd ?? null, green?.exit ?? null, green?.expect ?? null, green?.ok ?? null, green?.detail ?? null]).toEqual([
      'npm run e2e -- --grep "SELL-"',
      0,
      'pass, >=1 test per rule',
      true,
      'SELL-1 1/1 and SELL-2 2/2 pass',
    ]);
  });
});

describe('a value the line does not hold is null', () => {
  test('LOOP-1 · lines 2, 15 and 23 have no detail: null, never an empty string; line 17 keeps its own', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(eventsOf(r).length, 'the log compiled to events').toBe(23);
    expect([2, 15, 17, 23].map((line) => [line, eventAt(r, line)?.detail])).toEqual([
      [2, null],
      [15, null],
      [17, 'inv-001 hand-back: recommendation 1 accepted by David; route for round A2 briefed'],
      [23, null],
    ]);
  });

  test('LOOP-1 · the attempt++ event at line 5 has no gate, command, exit, expectation or ok: each null', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const turn = eventAt(r, 5);
    expect(turn, 'line 5 compiled to an event').toBeDefined();
    expect([turn?.gate, turn?.cmd, turn?.exit, turn?.expect, turn?.ok]).toEqual([null, null, null, null, null]);
  });

  test("LOOP-1 · each event's head is the full SHA the line names: c0 at line 1, c2 at 4, c6 at 12, c10 at 23", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect([1, 4, 12, 23].map((line) => [line, eventAt(r, line)?.head ?? null])).toEqual([
      [1, sha(trail, 'c0')],
      [4, sha(trail, 'c2')],
      [12, sha(trail, 'c6')],
      [23, sha(trail, 'c10')],
    ]);
  });
});

describe('a malformed line and a node with no loop', () => {
  test('LOOP-1 · a malformed line 24 stays an event at its line, kept as raw with no event or kind, and is named in problems', () => {
    const malformed = '{"v":1,"event":"gate.green","ok":true';
    const broken = replayTrail(RETRY, (root) => writeIn(root, LOOP_FILE, `${readIn(root, LOOP_FILE).replace(/\n?$/, '\n')}${malformed}\n`));
    try {
      const b = run(broken.root);
      expect(b.error, thrown(b)).toBeUndefined();
      expect(eventsOf(b).map((e) => e.line)).toEqual([...EVENTS.map(([line]) => line), 24]);
      expect(eventsOf(b).find((e) => e.line === 24) ?? null).toMatchObject({ plan: 'build', node: 'F1', line: 24, raw: malformed, event: null, kind: null });
      expect((b.trace?.problems ?? []).filter((p) => p.file === LOOP_FILE).map((p) => p.line)).toEqual([24]);
    } finally {
      broken.cleanup();
    }
  }, SLOW);

  test("LOOP-1 · on the rules trail each node's events are its own loop's lines; F0a and F3, with no loop.jsonl, have none", () => {
    const rules = replayTrail(RULES);
    try {
      const own = run(rules.root);
      expect(own.error, thrown(own)).toBeUndefined();
      const expected = ['F0a', 'F1', 'F2', 'F3'].map((node) => {
        const path = `docs/trace/build/${node}/loop.jsonl`;
        return [node, existsSync(join(rules.root, path)) ? [...linesOf(rules.root, path).keys()] : []];
      });
      expect(expected.map(([node, lines]) => [node, (lines as number[]).length]), "the fixture's own loops").toEqual([
        ['F0a', 0],
        ['F1', 18],
        ['F2', 3],
        ['F3', 0],
      ]);
      expect(['F0a', 'F1', 'F2', 'F3'].map((node) => [node, eventsOf(own, node).map((e) => e.line)])).toEqual(expected);
    } finally {
      rules.cleanup();
    }
  }, SLOW);
});
