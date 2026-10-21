// @vitest-environment node
// RULE-2 · Red before green, visibly. The rule page shows the red commit before the green one, with dates, and flags
// any rule where that order doesn't hold. The compiler holds what that is drawn from (docs/ui/derived/U1/rule/
// screen.json, the "red before green" region): each rule's red, green and refactor commits from its matrix row, each
// commit's row in its node's walkthrough (commits[*].order, the rung's "#n") and the date git recorded for it. The
// order is the commits' own, never re-sorted to look right. On the `rules` fixture trail: SELL-1's red c2 (row 2,
// 2026-10-16) comes before its green c4 (row 4, 2026-10-17); GET-1's green c11 (row 2) came before its red c12 (row 3).
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { commitByShort, commitOf, fixtureDates, ruleOf, RULES, shortOf } from './support/rules';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(RULES);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

/** The UTC wall time of an instant, to the second: "2026-10-16T12:00:00". */
const utcSecond = (iso: string): string => new Date(iso).toISOString().slice(0, 19);

describe("each rule's red, green and refactor commits", () => {
  test("RULE-2 · each rule's red, green and refactor are its matrix row's short SHAs; a dash or a blank is null", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const s = (id: string): string => shortOf(trail, id);
    const shown = ['SELL-1', 'SELL-2', 'GET-1', 'CANCEL-1', 'CANCEL-2'].map((id) => {
      const m = ruleOf(r, id)?.matrix;
      return [id, m?.red ?? null, m?.green ?? null, m?.refactor ?? null];
    });
    // rules/trail/docs/trace/requirements-matrix.md, lines 6 to 10.
    expect(shown).toEqual([
      ['SELL-1', s('c2'), s('c4'), s('c5')],
      ['SELL-2', s('c2'), s('c4'), null],
      ['GET-1', s('c12'), s('c11'), null],
      ['CANCEL-1', null, null, null],
      ['CANCEL-2', null, null, null],
    ]);
  });
});

describe("each commit's place and date", () => {
  test("RULE-2 · each commit's order is its row in its node's walkthrough, and a commit no walkthrough lists has none", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    // rules/README.md, "Walkthrough rows": F1's c1 to c9 are rows 1 to 9, F2's c10 to c12 rows 1 to 3. c0 (F0a,
    // git-only) is in no walkthrough.
    const ids = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'];
    expect(ids.map((id) => [id, commitOf(r, trail, id)?.order ?? null])).toEqual([
      ['c0', null],
      ['c1', 1],
      ['c2', 2],
      ['c3', 3],
      ['c4', 4],
      ['c5', 5],
      ['c6', 6],
      ['c7', 7],
      ['c8', 8],
      ['c9', 9],
      ['c10', 1],
      ['c11', 2],
      ['c12', 3],
    ]);
  });

  test('RULE-2 · each commit carries the date git recorded for it, its own and not the compile time', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const dated = fixtureDates().map(({ id }) => {
      const date = commitOf(r, trail, id)?.date ?? null;
      return [id, date === null || Number.isNaN(Date.parse(date)) ? date : utcSecond(date)];
    });
    expect(dated).toEqual(fixtureDates().map(({ id, date }) => [id, utcSecond(date)]));
  });

  test('RULE-2 · a commit date is written in UTC: the fixture commits made at 12:00Z read 12:00', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    // c2, c4 and c11 were made at 12:00 UTC (rules/README.md), so the page reads the same day in any zone it shows.
    for (const id of ['c2', 'c4', 'c11']) {
      expect(commitOf(r, trail, id)?.date ?? '(no date)', id).toMatch(/^\d{4}-\d{2}-\d{2}T12:00:00(?:\.0+)?(?:Z|\+00:00)$/);
    }
  });
});

describe('red before green, and the order that does not hold', () => {
  test("RULE-2 · SELL-1's red c2 comes before its green c4: walkthrough rows 2 and 4, dated 2026-10-16 and 2026-10-17", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const m = ruleOf(r, 'SELL-1')?.matrix;
    const red = commitByShort(r, m?.red);
    const green = commitByShort(r, m?.green);
    expect([red?.sha ?? null, red?.order ?? null, red?.date?.slice(0, 10) ?? null]).toEqual([trail.shas['c2'], 2, '2026-10-16']);
    expect([green?.sha ?? null, green?.order ?? null, green?.date?.slice(0, 10) ?? null]).toEqual([trail.shas['c4'], 4, '2026-10-17']);
  });

  test("RULE-2 · GET-1's order does not hold: its matrix red c12 is row 3, after its green c11 at row 2, as committed", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const m = ruleOf(r, 'GET-1')?.matrix;
    const red = commitByShort(r, m?.red);
    const green = commitByShort(r, m?.green);
    // Both on F2's walkthrough; kept in the order they were made, not swapped to read red first.
    expect([red?.sha ?? null, red?.node ?? null, red?.tdd ?? null, red?.order ?? null]).toEqual([trail.shas['c12'], 'F2', 'red', 3]);
    expect([green?.sha ?? null, green?.node ?? null, green?.tdd ?? null, green?.order ?? null]).toEqual([trail.shas['c11'], 'F2', 'green', 2]);
    expect(Date.parse(green?.date ?? ''), 'green c11 (12:00) is dated before red c12 (13:00)').toBeLessThan(Date.parse(red?.date ?? ''));
  });
});
