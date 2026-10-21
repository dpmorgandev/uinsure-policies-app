// @vitest-environment node
// MATRIX-1 · Interactive requirements matrix. Every rule in requirements.md → plan/node → tests (pass/total) → red,
// green and refactor commits → QA step → sign-off → PR, the same columns as requirements-matrix.md, filterable by status
// and feature. The compiler holds each rule's title, feature and priority as its requirements file gives them
// (docs/ui/derived/U1/matrix/screen.json: rules[*].id, title, feature; the design fixture's rules[*].priority). The
// feature is the requirements heading's name, never the node that owns the rule.
// On the `rules` fixture trail (rules/base/docs/requirements.md: Sell (MUST-1), Retrieve (MUST-2), Cancel (SHOULD-1)),
// and on `requirements-shapes` (its README: RENEW-1/2, a dash note row, a heading with no priority tag, and
// ui-requirements.md's `| ID | Priority | Requirement | Draft interpretation |` shape).
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { ruleOf, rulesOf, RULES, SHAPES } from './support/rules';

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

/** Each rule's id and the named fields, in trace.json's order. */
const fieldsOf = (run: Run, ...fields: ('title' | 'feature' | 'priority')[]): unknown[][] =>
  rulesOf(run).map((rule) => [rule.id ?? null, ...fields.map((field) => rule[field] ?? null)]);

describe("the requirements.md shape: '### Sell (MUST-1)', then '| ID | Rule | Agreed interpretation |'", () => {
  test("MATRIX-1 · every rule in requirements.md once, in its order, each titled with its Rule cell", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(fieldsOf(r, 'title')).toEqual([
      ['SELL-1', 'Policy reference must be unique'],
      ['SELL-2', 'Can only be sold up to 60 days in advance'],
      ['GET-1', 'Retrieve a policy'],
      ['CANCEL-1', 'Cancel with a pro-rata refund'],
      ['CANCEL-2', 'No refund after a claim'],
    ]);
  });

  test("MATRIX-1 · each rule's feature is its heading's name (Sell, Retrieve, Cancel), not its node, and a rule no node owns has one too", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    // F1 owns SELL-1 and SELL-2, F2 GET-1, F3 CANCEL-1; CANCEL-2 is in no node and is still under Cancel.
    expect(fieldsOf(r, 'feature')).toEqual([
      ['SELL-1', 'Sell'],
      ['SELL-2', 'Sell'],
      ['GET-1', 'Retrieve'],
      ['CANCEL-1', 'Cancel'],
      ['CANCEL-2', 'Cancel'],
    ]);
  });

  test("MATRIX-1 · each rule's priority is its heading's tag without the number: MUST-1 and MUST-2 are MUST, SHOULD-1 is SHOULD", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(fieldsOf(r, 'priority')).toEqual([
      ['SELL-1', 'MUST'],
      ['SELL-2', 'MUST'],
      ['GET-1', 'MUST'],
      ['CANCEL-1', 'SHOULD'],
      ['CANCEL-2', 'SHOULD'],
    ]);
  });
});

describe("requirements.md's awkward rows, as the real file has them", () => {
  test('MATRIX-1 · RENEW-1/2 is one rule, its ID as written; the dash note row and the data appendix are no rule', () => {
    expect(s.error, thrown(s)).toBeUndefined();
    // requirements-shapes/README.md: requirements.md's four rules in its order, then ui-requirements.md's two.
    expect(rulesOf(s).map((rule) => rule.id ?? null)).toEqual(['SELL-1', 'GET-1', 'RENEW-1/2', 'COULD-1', 'NAV-1', 'NAV-4']);
  });

  test("MATRIX-1 · RENEW-1/2 carries its row's title, the Renew feature and its heading's SHOULD", () => {
    expect(s.error, thrown(s)).toBeUndefined();
    const rule = ruleOf(s, 'RENEW-1/2');
    expect([rule?.title ?? null, rule?.feature ?? null, rule?.priority ?? null]).toEqual([
      'Renew within 30 days of the end date, not after it',
      'Renew',
      'SHOULD',
    ]);
  });

  test("MATRIX-1 · a heading with no priority tag, 'Could-haves (all in scope)', is the feature whole, and its rule has no priority", () => {
    expect(s.error, thrown(s)).toBeUndefined();
    const rule = ruleOf(s, 'COULD-1');
    expect([rule?.title ?? null, rule?.feature ?? null, rule?.priority ?? null]).toEqual([
      'Quote the cancellation refund without cancelling',
      'Could-haves (all in scope)',
      null,
    ]);
  });

  test("MATRIX-1 · the feature is the heading even where one node owns rules under two: F1 holds SELL-1 (Sell) and GET-1 (Retrieve)", () => {
    expect(s.error, thrown(s)).toBeUndefined();
    expect(['SELL-1', 'GET-1'].map((id) => [id, ruleOf(s, id)?.feature ?? null])).toEqual([
      ['SELL-1', 'Sell'],
      ['GET-1', 'Retrieve'],
    ]);
  });
});

describe("the ui-requirements.md shape: '| ID | Priority | Requirement | Draft interpretation |'", () => {
  test('MATRIX-1 · a rule takes its title from the Requirement column, its priority from the Priority column, its feature from its heading', () => {
    expect(s.error, thrown(s)).toBeUndefined();
    expect(['NAV-1', 'NAV-4'].map((id) => {
      const rule = ruleOf(s, id);
      return [id, rule?.title ?? null, rule?.priority ?? null, rule?.feature ?? null];
    })).toEqual([
      ['NAV-1', 'Overview answers the question first', 'MUST', 'Navigation and overview'],
      ['NAV-4', 'Search', 'SHOULD', 'Navigation and overview'],
    ]);
  });
});
