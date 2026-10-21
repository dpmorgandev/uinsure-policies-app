// @vitest-environment node
// NAV-3 · Links out. Commit SHAs link to the commit on GitHub, PR numbers to the PR, file:line references to the file at
// that SHA. The compiler holds what each link is built from: each rule's row in its requirements file
// (rules[*].source { file, line }, the rule page's "docs/requirements.md, line 69" link) and each commit's parents, as
// full SHAs in git's order (commits[*].parents, the commit page's parent links; docs/ui/derived/U1/commit/screen.json).
// On the `rules` fixture trail: SELL-1, SELL-2, GET-1, CANCEL-1 and CANCEL-2 at lines 13, 14, 20, 26 and 27 of
// docs/requirements.md; c0 to c12 made one after another on one branch over the base commit. On `requirements-shapes`:
// its README's source lines in both requirements files, and a merge the test makes on top of the fixture's commits.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { git, replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { commitOf, commitsOf, MATRIX_FILE, REQUIREMENTS_FILE, ruleOf, RULES, SHAPES, shortOf, TWO_PLANS, UI_REQUIREMENTS_FILE } from './support/rules';

let trail: Trail;
let r: Run;
let shapes: Trail;
let s: Run;
/** The merge made on requirements-shapes: its SHA, and the side-branch commit it merges. */
let merge = { sha: '(no merge)', side: '(no side commit)' };
beforeAll(() => {
  trail = replayTrail(RULES);
  r = run(trail.root);
  shapes = replayTrail(SHAPES, (root) => {
    git(root, 'checkout', '-q', '-b', 'side');
    git(root, 'commit', '-q', '--allow-empty', '-m', 'side: a commit off the feature branch');
    const side = git(root, 'rev-parse', 'HEAD');
    git(root, 'checkout', '-q', 'feature/build/F1');
    git(root, 'merge', '-q', '--no-ff', '-m', 'Merge branch side into feature/build/F1', 'side');
    merge = { sha: git(root, 'rev-parse', 'HEAD'), side };
  });
  s = run(shapes.root);
}, SLOW * 2);
afterAll(() => {
  trail?.cleanup();
  shapes?.cleanup();
});

const sourceOf = (run: Run, id: string): unknown => {
  const source = ruleOf(run, id)?.source;
  return source === undefined || source === null ? null : { file: source.file ?? null, line: source.line ?? null };
};

describe("file:line: each rule's row in its requirements file", () => {
  test("NAV-3 · each rule's source is docs/requirements.md at its row's line", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    // rules/base/docs/requirements.md: three tables, each under its own heading; the line counts every line of the file.
    expect(['SELL-1', 'SELL-2', 'GET-1', 'CANCEL-1', 'CANCEL-2'].map((id) => [id, sourceOf(r, id)])).toEqual([
      ['SELL-1', { file: REQUIREMENTS_FILE, line: 13 }],
      ['SELL-2', { file: REQUIREMENTS_FILE, line: 14 }],
      ['GET-1', { file: REQUIREMENTS_FILE, line: 20 }],
      ['CANCEL-1', { file: REQUIREMENTS_FILE, line: 26 }],
      ['CANCEL-2', { file: REQUIREMENTS_FILE, line: 27 }],
    ]);
  });

  test("NAV-3 · a rule after the dash note row keeps its own line: RENEW-1/2 at 26 and COULD-1 at 32", () => {
    expect(s.error, thrown(s)).toBeUndefined();
    expect(['SELL-1', 'GET-1', 'RENEW-1/2', 'COULD-1'].map((id) => [id, sourceOf(s, id)])).toEqual([
      ['SELL-1', { file: REQUIREMENTS_FILE, line: 13 }],
      ['GET-1', { file: REQUIREMENTS_FILE, line: 19 }],
      ['RENEW-1/2', { file: REQUIREMENTS_FILE, line: 26 }],
      ['COULD-1', { file: REQUIREMENTS_FILE, line: 32 }],
    ]);
  });

  test("NAV-3 · a ui-requirements.md rule's source is that file, not requirements.md: NAV-1 at 12 and NAV-4 at 13", () => {
    expect(s.error, thrown(s)).toBeUndefined();
    expect(['NAV-1', 'NAV-4'].map((id) => [id, sourceOf(s, id)])).toEqual([
      ['NAV-1', { file: UI_REQUIREMENTS_FILE, line: 12 }],
      ['NAV-4', { file: UI_REQUIREMENTS_FILE, line: 13 }],
    ]);
  });
});

describe("each commit's parents, for the commit page's parent links", () => {
  test('NAV-3 · each fixture commit has one parent, the commit made before it, as a full SHA', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const base = git(trail.root, 'rev-parse', `${trail.shas['c0']}^`);
    const ids = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'];
    const shown = ids.map((id) => [id, commitOf(r, trail, id)?.parents ?? null]);
    expect(shown).toEqual(ids.map((id, i) => [id, [i === 0 ? base : trail.shas[ids[i - 1] ?? '']]]));
  });

  test('NAV-3 · the root commit has no parents: an empty list, not a missing field', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const base = git(trail.root, 'rev-parse', `${trail.shas['c0']}^`);
    const root = commitsOf(r).find((c) => c.sha === base);
    expect(root?.sha ?? null, 'the base commit is compiled').toBe(base);
    expect(root?.parents ?? null).toEqual([]);
  });

  test('NAV-3 · a merge commit has both parents, the branch it was made on first, then the commit it merged', () => {
    expect(s.error, thrown(s)).toBeUndefined();
    const found = commitsOf(s).find((c) => c.sha === merge.sha);
    expect(found?.sha ?? null, 'the merge commit is compiled').toBe(merge.sha);
    expect(found?.parents ?? null).toEqual([shapes.shas['c1'], merge.side]);
  });
});

// U1 D2: the `two-plans` fixture trail (its README). docs/trace/requirements-matrix.md, as the real one has it:
// SELL-1's refactor cell is a short SHA (c3, line 6); CANCEL-5's (line 7) and RENEW-1/2's (line 8) read `undefined`,
// the literal an earlier render-trace wrote and the current one copies forward.
describe('a matrix commit cell that is not a SHA', () => {
  let two: Trail;
  let t: Run;
  beforeAll(() => {
    two = replayTrail(TWO_PLANS);
    t = run(two.root);
  }, SLOW);
  afterAll(() => two?.cleanup());

  const refactorOf = (id: string): unknown[] => {
    const rule = ruleOf(t, id);
    return [id, rule?.matrix?.refactor ?? null, rule?.refactor ?? null];
  };

  test("NAV-3 · an 'undefined' refactor cell is no commit: CANCEL-5 has none, while SELL-1's SHA cell stays its commit", () => {
    expect(t.error, thrown(t)).toBeUndefined();
    expect([refactorOf('SELL-1'), refactorOf('CANCEL-5')]).toEqual([
      ['SELL-1', shortOf(two, 'c3'), [shortOf(two, 'c3')]],
      ['CANCEL-5', null, []],
    ]);
  });

  test("NAV-3 · an 'undefined' commit cell is reported in problems[] at its file and line, requirements-matrix.md line 7, and a SHA cell is not", () => {
    expect(t.error, thrown(t)).toBeUndefined();
    const lines = (t.trace?.problems ?? []).filter((p) => p.file === MATRIX_FILE).map((p) => p.line ?? null);
    expect(lines, 'CANCEL-5, line 7').toContain(7);
    expect(lines, 'SELL-1, line 6, holds a SHA').not.toContain(6);
  });
});
