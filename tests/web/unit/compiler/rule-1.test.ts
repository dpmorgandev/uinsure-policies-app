// @vitest-environment node
// RULE-1 · Rule page. The rule's text and agreed interpretation (from requirements.md), its status codes, its tests by
// name, its commits in TDD order, its QA step and its sign-off. The compiler holds the interpretation as written, its
// Markdown kept for the page to render (docs/ui/derived/U1/rule/screen.json: rules[id].interpretation; the status codes
// are the interpretation's own **400**, **409**), and each rule's tests by name from the test sources at the ref
// (rules[*].tests: { name, file }).
// On the `rules` fixture trail: SELL-1 has two tests and SELL-2 two in tests/web/e2e/F1/sell.spec.ts and one in
// sell-window.spec.ts; GET-1 one in tests/web/e2e/F2/get.spec.ts; CANCEL-1 and CANCEL-2 none. A web test's name is its
// title after its `<ID> · ` tag. On `requirements-shapes`: ui-requirements.md's Draft interpretation column, and
// tests/Fixture.Api.Tests/RetrieveTests.cs, whose methods are named by `[Trait("Rule", …)]`, one rule per attribute.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { decisionsOf, ruleOf, RULES, SHAPES, shaOf, TWO_PLANS } from './support/rules';
import type { TestOut } from './support/rules';

let trail: Trail;
let r: Run;
let shapes: Trail;
let s: Run;
beforeAll(() => {
  trail = replayTrail(RULES);
  r = run(trail.root);
  shapes = replayTrail(SHAPES);
  s = run(shapes.root);
}, SLOW * 2);
afterAll(() => {
  trail?.cleanup();
  shapes?.cleanup();
});

const SELL_SPEC = 'tests/web/e2e/F1/sell.spec.ts';
const SELL_WINDOW_SPEC = 'tests/web/e2e/F1/sell-window.spec.ts';
const GET_SPEC = 'tests/web/e2e/F2/get.spec.ts';
const RETRIEVE_CS = 'tests/Fixture.Api.Tests/RetrieveTests.cs';

/** By code point, never by locale: the order a test expects doesn't move with the machine's collation. */
const byCodePoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** A rule's tests as [name, file], sorted by file then name, or null when the rule or its tests field is missing. */
function testsOf(run: Run, id: string): [string | null, string | null][] | null {
  const tests: TestOut[] | undefined = ruleOf(run, id)?.tests;
  if (!Array.isArray(tests)) return null;
  return tests
    .map((t): [string | null, string | null] => [t.name ?? null, t.file ?? null])
    .sort((a, b) => byCodePoint(String(a[1]), String(b[1])) || byCodePoint(String(a[0]), String(b[0])));
}

describe('the agreed interpretation, from requirements.md', () => {
  test("RULE-1 · each rule's interpretation is its Agreed interpretation cell, word for word", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const shown = ['SELL-1', 'SELL-2', 'GET-1', 'CANCEL-1', 'CANCEL-2'].map((id) => [id, ruleOf(r, id)?.interpretation ?? null]);
    // rules/base/docs/requirements.md, lines 13, 14, 20, 26 and 27.
    expect(shown).toEqual([
      ['SELL-1', 'The client supplies the reference. It is trimmed and upper-cased, then must match `^[A-Z0-9-]{3,20}$` (else **400**). A duplicate returns **409**'],
      ['SELL-2', 'Start date must be between today and today + 60, inclusive. **No backdating**: otherwise **422**'],
      ['GET-1', 'By reference. Returns the policy and its terms. **404** if not found'],
      ['CANCEL-1', 'Refund the unused days of the current term. Otherwise **422**'],
      ['CANCEL-2', 'A policy with a claim refunds nothing'],
    ]);
  });

  test("RULE-1 · the interpretation keeps its Markdown as written: SELL-1's inline code and its bold status codes 400 and 409", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const text = ruleOf(r, 'SELL-1')?.interpretation ?? '(no interpretation)';
    expect(text).toContain('`^[A-Z0-9-]{3,20}$`');
    expect(text).toContain('(else **400**)');
    expect(text).toContain('returns **409**');
    expect(text, 'not rendered to HTML').not.toMatch(/<(code|strong)>/);
  });

  test("RULE-1 · a ui-requirements.md rule's interpretation is its Draft interpretation cell", () => {
    expect(s.error, thrown(s)).toBeUndefined();
    expect(['NAV-1', 'NAV-4'].map((id) => [id, ruleOf(s, id)?.interpretation ?? null])).toEqual([
      ['NAV-1', 'The landing screen states, from the data: rules built / total, tests passing, nodes done, attempts and FAILs taken, human decisions recorded. Each figure links to its source screen'],
      ['NAV-4', 'Jump to any rule ID, node, SHA or file path from one input'],
    ]);
  });
});

describe('its tests, by name', () => {
  test("RULE-1 · SELL-1's tests are its two titles in sell.spec.ts, each named after its rule tag, with its file", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(testsOf(r, 'SELL-1')).toEqual([
      ['a sale with a new reference answers 201', SELL_SPEC],
      ['a second sale with the same reference answers 409', SELL_SPEC],
    ]);
  });

  test("RULE-1 · SELL-2's tests are its three, across two files: two in sell.spec.ts and the one sell-window.spec.ts added at c7", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(testsOf(r, 'SELL-2')).toEqual([
      ['a start date of today + 61 answers 422', SELL_WINDOW_SPEC],
      ['a start date of today + 60 answers 201', SELL_SPEC],
      ['a start date of today answers 201', SELL_SPEC],
    ]);
  });

  test("RULE-1 · each rule lists only its own tests: no title under two rules, and CANCEL-1 and CANCEL-2 list none", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const names = (id: string): (string | null)[] | null => testsOf(r, id)?.map(([name]) => name) ?? null;
    expect(['SELL-1', 'SELL-2', 'GET-1', 'CANCEL-1', 'CANCEL-2'].map((id) => [id, names(id)])).toEqual([
      ['SELL-1', ['a sale with a new reference answers 201', 'a second sale with the same reference answers 409']],
      ['SELL-2', ['a start date of today + 61 answers 422', 'a start date of today + 60 answers 201', 'a start date of today answers 201']],
      ['GET-1', ['an unknown reference answers 404']],
      ['CANCEL-1', []],
      ['CANCEL-2', []],
    ]);
  });

  test('RULE-1 · a C# test is named by its method, under each rule it is traited with; a method with no Rule trait is under none', () => {
    expect(s.error, thrown(s)).toBeUndefined();
    // requirements-shapes/README.md: the theory carries SELL-1 and GET-1; The_client_is_created is plumbing.
    expect(['SELL-1', 'GET-1', 'RENEW-1/2', 'COULD-1'].map((id) => [id, testsOf(s, id)])).toEqual([
      ['SELL-1', [['A_reference_sold_in_lower_case_is_retrieved_in_upper_case', RETRIEVE_CS]]],
      ['GET-1', [
        ['A_reference_sold_in_lower_case_is_retrieved_in_upper_case', RETRIEVE_CS],
        ['Retrieve_of_an_unknown_reference_answers_404', RETRIEVE_CS],
      ]],
      ['RENEW-1/2', []],
      ['COULD-1', []],
    ]);
  });
});

// U1 D2: the `two-plans` fixture trail (its README). build/F1's loop.jsonl records signoff(<c4>) at line 4 and
// merged(<c5>) at line 5, as the real build/F1 loop does at lines 82 and 84. tests/web/e2e/U1/nav-1.spec.ts holds
// three NAV-1 titles, cut from the real one: a plain title, a template literal in a loop that interpolates three values,
// and a backtick title that interpolates nothing.
describe('both plans: the sign-off and merge, and a parameterised title', () => {
  const F1_LOOP = 'docs/trace/build/F1/loop.jsonl';
  let two: Trail;
  let t: Run;
  beforeAll(() => {
    two = replayTrail(TWO_PLANS);
    t = run(two.root);
  }, SLOW);
  afterAll(() => two?.cleanup());

  /** build/F1's decisions of one kind, each as [kind, sha, evidence file, evidence line]. */
  const decisions = (kind: string): unknown[][] =>
    decisionsOf(t)
      .filter((d) => d.plan === 'build' && d.node === 'F1' && d.kind === kind)
      .map((d) => [d.kind, d.sha ?? null, d.evidence?.file ?? null, d.evidence?.line ?? null]);

  test("RULE-1 · a signoff(<sha>) event is a sign-off decision carrying its SHA: build/F1's names c4, at loop.jsonl line 4", () => {
    expect(t.error, thrown(t)).toBeUndefined();
    expect(decisions('signoff')).toEqual([['signoff', shaOf(two, 'c4'), F1_LOOP, 4]]);
  });

  test("RULE-1 · a merged(<sha>) event is a merge decision carrying its SHA: build/F1's PR #10 merged at c5, loop.jsonl line 5", () => {
    expect(t.error, thrown(t)).toBeUndefined();
    expect(decisions('merge')).toEqual([['merge', shaOf(two, 'c5'), F1_LOOP, 5]]);
  });
});
