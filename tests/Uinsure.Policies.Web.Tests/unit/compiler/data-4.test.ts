// @vitest-environment node
// DATA-4 · Incomplete is never clean. A node whose README says TRAIL INCOMPLETE shows the reasons verbatim; a rule with
// no node or no tests shows `not built yet`; F0a shows `OK (git-only, F0a)`. The compiler holds each node's
// completeness and its reasons as the trace step wrote them (docs/ui/derived/U1/overview/screen.json, "trail
// completeness": nodes[*].completeness, completenessReasons, trail), and each rule's status. A value the trail doesn't
// hold is null, never a default such as OK. On the `rules` fixture trail (rules/README.md, "Completeness"): F0a
// `OK (git-only, F0a)`, F1 `OK`, F2 TRAIL INCOMPLETE with five reasons, F3 no trail; CANCEL-1 on F3 with no tests,
// CANCEL-2 on no node.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { readIn, replayTrail, run, SLOW, thrown, writeIn } from './support/trail';
import type { Run, Trail } from './support/trail';
import { F2_LABEL, F2_README, F2_REASONS, nodeOf, ruleOf, RULES } from './support/rules';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(RULES);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

const completenessOf = (run: Run, id: string): [string | null, string[] | null] => {
  const n = nodeOf(run, id);
  return [n?.completeness ?? null, n?.completenessReasons ?? null];
};

describe('TRAIL INCOMPLETE, verbatim', () => {
  test("DATA-4 · F2's completeness is its README's TRAIL INCOMPLETE line, verbatim", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(nodeOf(r, 'F2')?.completeness ?? null).toBe(F2_LABEL);
  });

  test("DATA-4 · F2's reasons are the README's five, each verbatim, in the README's order", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(nodeOf(r, 'F2')?.completenessReasons ?? null).toEqual(F2_REASONS);
  });

  test("DATA-4 · a TRAIL INCOMPLETE line with one reason, in words no fixture has, is kept as written: one reason", () => {
    // The README is the trace step's own judgement: the compiler reads it, it does not re-derive or reword it.
    const label = 'TRAIL INCOMPLETE: the QA script names a step no test covers';
    const one = replayTrail(RULES, (root) => {
      const text = readIn(root, F2_README);
      if (!text.includes(F2_LABEL)) throw new Error(`fixture setup: ${F2_README} holds no ${F2_LABEL}`);
      writeIn(root, F2_README, text.replace(F2_LABEL, label));
    });
    try {
      const changed = run(one.root);
      expect(changed.error, thrown(changed)).toBeUndefined();
      expect(completenessOf(changed, 'F2')).toEqual([label, ['the QA script names a step no test covers']]);
    } finally {
      one.cleanup();
    }
  }, SLOW);
});

describe('clean, git-only and no trail', () => {
  test('DATA-4 · F1, whose README says OK, reads OK with no reasons', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(completenessOf(r, 'F1')).toEqual(['OK', []]);
  });

  test("DATA-4 · F0a reads OK (git-only, F0a), its README's reasons kept as written", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const [completeness, reasons] = completenessOf(r, 'F0a');
    expect(completeness).toBe('OK (git-only, F0a)');
    // base/docs/trace/build/F0a/README.md, "## Completeness", after the label line: Markdown kept for the screen to
    // render, the wrapped sentence whole once the lines are joined.
    const said = (reasons ?? []).join(' ').replace(/\s+/g, ' ');
    expect(said).toContain('**Hooks not yet live: witnessed by git and trailers only.**');
    expect(said).toContain(
      'Every F0a commit is on `main`, and the activity hook records only on `feature/*` branches, so F0a has no activity, loop or verdict receipts.',
    );
    expect(said).not.toContain('TRAIL INCOMPLETE');
  });

  test('DATA-4 · F3, with no trail, has no completeness and no reasons, and is marked as having no trail: never OK', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect([...completenessOf(r, 'F3'), nodeOf(r, 'F3')?.trail ?? null]).toEqual([null, [], false]);
  });

  test('DATA-4 · F0a, F1 and F2 each have a trail', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(['F0a', 'F1', 'F2'].map((id) => [id, nodeOf(r, id)?.trail ?? null])).toEqual([
      ['F0a', true],
      ['F1', true],
      ['F2', true],
    ]);
  });
});

describe('not built yet', () => {
  test('DATA-4 · CANCEL-1, on node F3 with no tests, is not built', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(ruleOf(r, 'CANCEL-1')?.status ?? null).toBe('not-built');
    expect(ruleOf(r, 'CANCEL-1')?.matrix?.tests ?? null, 'no count is made up for it').toBeNull();
  });

  test('DATA-4 · CANCEL-2, which no node owns, is not built', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(ruleOf(r, 'CANCEL-2')?.status ?? null).toBe('not-built');
    expect(ruleOf(r, 'CANCEL-2')?.matrix?.tests ?? null, 'no count is made up for it').toBeNull();
  });

  test("DATA-4 · GET-1, on an incomplete trail with no pass count, is built and keeps ?/1: pass is null, not a number", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(ruleOf(r, 'GET-1')?.status ?? null).toBe('built');
    expect(ruleOf(r, 'GET-1')?.matrix?.tests ?? null).toEqual({ pass: null, total: 1, raw: '?/1' });
  });
});
