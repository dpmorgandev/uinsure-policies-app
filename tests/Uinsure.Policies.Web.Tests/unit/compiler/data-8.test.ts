// @vitest-environment node
// DATA-8 · Tolerates a trail in flight. A node in progress compiles with what exists, shown as in progress. Malformed
// lines are reported, never silently dropped (trace-data skill: reported with the file and line, and kept as `raw`).
// On the `in-flight` fixture trail (in-flight/README.md): build/F1 mid-loop with a loop log and an activity log and no
// README, walkthrough.md or verdicts yet; loop.jsonl line 4 and activity.jsonl line 3 are malformed; F1's commits so
// far are c1 (main, no TDD trailer), c2 (tester, red) and c3 (builder, stub), none with a walkthrough row.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { readIn, replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { entryOf, eventsOf, field, idOf, IN_FLIGHT, walkthroughOf } from './support/plans';

const LOOP = 'docs/trace/build/F1/loop.jsonl';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(IN_FLIGHT);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

describe('what exists so far', () => {
  test("DATA-8 · F1's walkthrough, with no walkthrough.md yet, lists the commits made so far, c1, c2 and c3, oldest first", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(walkthroughOf(r, 'build', 'F1').map((entry) => idOf(trail, entry.sha))).toEqual(['c1', 'c2', 'c3']);
  });

  test("DATA-8 · F1's commits so far carry no walkthrough row number: each n is null, never a count the trail doesn't hold", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const entries = walkthroughOf(r, 'build', 'F1');
    expect(entries.length, "F1's walkthrough lists its commits so far").toBe(3);
    expect(entries.map((entry) => field(entry, 'n'))).toEqual([null, null, null]);
  });

  test("DATA-8 · F1's commits so far carry their trailers: c1 main with no step, c2 red by the tester, c3 stub by the builder", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(['c1', 'c2', 'c3'].map((id) => {
      const entry = entryOf(r, trail, 'build', 'F1', id);
      return [id, field(entry, 'tdd'), field(entry, 'agent')];
    })).toEqual([
      ['c1', null, 'main'],
      ['c2', 'red', 'tester'],
      ['c3', 'stub', 'builder'],
    ]);
  });
});

describe('a malformed line is kept', () => {
  test('DATA-8 · the malformed loop line, loop.jsonl line 4, is kept verbatim as raw at its node and line, not dropped', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const written = readIn(trail.root, LOOP).split(/\r?\n/)[3];
    expect(written, 'fixture: loop.jsonl line 4 is the line cut off mid-write').toMatch(/"event":"gate\.st$/);
    const kept = eventsOf(r).filter((e) => e.plan === 'build' && e.node === 'F1' && e.line === 4);
    expect(kept.map((e) => field(e, 'raw'))).toEqual([written]);
  });
});
