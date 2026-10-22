// @vitest-environment node
// TDD-1 · Walkthrough timeline. Every commit of the node in order, coloured by TDD step (scaffold, red, stub, green,
// refactor) and by Agent trailer, with the commit subject in the agent's words. The compiler holds each node's
// walkthrough (docs/ui/derived/U2/walkthrough/screen.json; the design fixture's nodes[*].walkthrough[*]: n, sha, tdd,
// agent, subject), each step and agent read from the commit's own trailers. On U1's `rules` fixture trail
// (rules/README.md, its commits table and "Walkthrough rows"): F1's walkthrough is rows 1 to 9 (c1 to c9), F2's rows
// 1 to 3 (c10 to c12); F0a, git-only, has no walkthrough.md and one commit, c0.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { RULES } from './support/rules';
import { entryOf, field, idOf, walkthroughOf } from './support/plans';

const F1_COMMITS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'];

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(RULES);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

const rowsOf = (node: string): [unknown, string][] => walkthroughOf(r, 'build', node).map((entry) => [field(entry, 'n'), idOf(trail, entry.sha)]);

describe('every commit of the node, in order', () => {
  test("TDD-1 · F1's walkthrough lists its nine commits in walkthrough order, c1 to c9, each numbered by its row, 1 to 9", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(rowsOf('F1')).toEqual(F1_COMMITS.map((id, at) => [at + 1, id]));
  });

  test("TDD-1 · F2's walkthrough lists F2's own three commits, c10 to c12 as rows 1 to 3, and none of F1's", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(rowsOf('F2')).toEqual([
      [1, 'c10'],
      [2, 'c11'],
      [3, 'c12'],
    ]);
  });

  test("TDD-1 · F0a, git-only with no walkthrough.md, still lists its one commit, c0, read from its Node trailer", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(walkthroughOf(r, 'build', 'F0a').map((entry) => idOf(trail, entry.sha))).toEqual(['c0']);
  });
});

describe('the TDD step, the agent and the subject', () => {
  test("TDD-1 · each of F1's TDD commits carries the step its TDD trailer gives: c2 red, c3 stub, c4 green, c5 refactor, c7 red, c8 green", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const want = [
      ['c2', 'red'],
      ['c3', 'stub'],
      ['c4', 'green'],
      ['c5', 'refactor'],
      ['c7', 'red'],
      ['c8', 'green'],
    ];
    expect(want.map(([id = '']) => [id, field(entryOf(r, trail, 'build', 'F1', id), 'tdd')])).toEqual(want);
  });

  test('TDD-1 · a commit with no TDD trailer carries no step: c9, the QA script, has null, never a default', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(field(entryOf(r, trail, 'build', 'F1', 'c9'), 'tdd')).toBeNull();
  });

  test("TDD-1 · each of F1's commits carries its Agent trailer: c1 and c6 main, c2, c7 and c9 tester, c3, c4, c5 and c8 builder", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const want: Record<string, string> = { c1: 'main', c2: 'tester', c3: 'builder', c4: 'builder', c5: 'builder', c6: 'main', c7: 'tester', c8: 'builder', c9: 'tester' };
    expect(F1_COMMITS.map((id) => [id, field(entryOf(r, trail, 'build', 'F1', id), 'agent')])).toEqual(F1_COMMITS.map((id) => [id, want[id]]));
  });

  test("TDD-1 · each of F1's commits carries its subject in the agent's words", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const want: Record<string, string> = {
      c2: 'the acceptance suite',
      c4: 'the sale',
      c5: 'name the reference check',
      c7: 'a start date 61 days ahead answers 422',
      c8: 'bound the start date at today + 60',
    };
    expect(Object.keys(want).map((id) => [id, field(entryOf(r, trail, 'build', 'F1', id), 'subject')])).toEqual(
      Object.entries(want).map(([id, words]) => [id, expect.stringContaining(words)]),
    );
  });
});
