// @vitest-environment node
// LOOP-3 · Verdicts. Each reviewer and security verdict rendered from its JSON: verdict, gate refs, head SHA, diff
// fingerprint, findings. Raw JSON one click away. The compiler holds each verdicts/<round>-<agent>.json in trace.json's
// verdicts[] (docs/ui/derived/U3/verdict/screen.json: attempt, ts, verdict, head, base, rulesCovered, rulesMissing,
// findings, gateRefs, file), with the diff fingerprint LOOP-3 names and the file's own text as raw. On the
// `retry-ladder` fixture trail (retry-ladder/README.md): A2 reviewer FAIL at head c6, base c0, fingerprint 7c2e9a4…,
// five gate refs, SELL-2 missing, findings R1 and R2; A2 security, A3 reviewer and A3 security PASS. A value the file
// doesn't hold is null, never a default.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { readIn, replaceIn, replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { RETRY, sha, verdictFile, verdictOf } from './support/loop';

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail(RETRY);
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

const A2_FINGERPRINT = '7c2e9a41d06b38f5e1a4c9d27b80f63e5a1d4c98';
const A3_FINGERPRINT = 'e05b7d3c9a1f28e64b0c7d19a3f5e82c46b1d07a';

describe('the A2 reviewer FAIL, from its JSON', () => {
  test('LOOP-3 · the A2 reviewer verdict holds its head c6 and its base c0, full SHAs', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const v = verdictOf(r, 'A2', 'reviewer');
    expect([v?.verdict ?? null, v?.head ?? null, v?.base ?? null]).toEqual(['FAIL', sha(trail, 'c6'), sha(trail, 'c0')]);
  });

  test('LOOP-3 · the A2 reviewer verdict holds its diff fingerprint as recorded', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(verdictOf(r, 'A2', 'reviewer')?.diffFingerprint ?? null).toBe(A2_FINGERPRINT);
  });

  test('LOOP-3 · the A2 reviewer verdict lists its five gate refs in recorded order, each with its full SHA', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(verdictOf(r, 'A2', 'reviewer')?.gateRefs ?? null).toEqual([
      `gate.red@${sha(trail, 'c1')} (attempt 1)`,
      `gate.stub@${sha(trail, 'c2')} (attempt 1, ok:false)`,
      `gate.finding-red@${sha(trail, 'c4')}`,
      `gate.stub@${sha(trail, 'c5')}`,
      `gate.green@${sha(trail, 'c6')}`,
    ]);
  });

  test('LOOP-3 · the A2 reviewer verdict keeps the time its file records and the file it was read from', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const v = verdictOf(r, 'A2', 'reviewer');
    expect([v?.ts ?? null, v?.file ?? null]).toEqual(['2026-10-18T13:50:01Z', verdictFile('A2', 'reviewer')]);
  });

  test('LOOP-3 · the A2 reviewer verdict keeps SELL-1 covered, SELL-2 missing, and findings R1 then R2, every field as recorded', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const v = verdictOf(r, 'A2', 'reviewer');
    expect(v?.diffFingerprint ?? null, 'the verdict is read in full').toBe(A2_FINGERPRINT);
    expect([v?.rulesCovered ?? null, v?.rulesMissing ?? null]).toEqual([['SELL-1'], ['SELL-2']]);
    expect(v?.findings ?? null).toEqual([
      {
        id: 'R1',
        rule_id: 'SELL-2',
        severity: 'P1',
        file: 'src/sell.txt',
        line: 1,
        what: 'A reference that differs from a sold one only in case is sold again, 201, so the reference is not unique.',
        why: 'SELL-2 says the reference is unique, and the agreed interpretation compares it as stored; no test sells a case-only pair, so the suite cannot see it.',
        route_to: 'tester',
      },
      {
        id: 'R2',
        rule_id: 'SELL-2',
        severity: 'P2',
        file: 'tests/web/e2e/F1/sell.spec.ts',
        line: 4,
        what: "The 409 test checks the status only; the problem body's rule is never read.",
        why: "The contract's 409 names the broken rule, and a canned body without it would pass this test.",
        route_to: 'builder',
      },
    ]);
  });
});

describe('raw JSON', () => {
  test("LOOP-3 · the A2 reviewer verdict's raw is its file's JSON, verbatim, for the one-click view", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(verdictOf(r, 'A2', 'reviewer')?.raw ?? null).toBe(readIn(trail.root, verdictFile('A2', 'reviewer')));
  });

  test("LOOP-3 · each verdict's raw is its own file's: A3 security's is not A2 reviewer's", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const raw = verdictOf(r, 'A3', 'security')?.raw ?? null;
    expect(raw).toBe(readIn(trail.root, verdictFile('A3', 'security')));
    expect(raw).not.toContain(A2_FINGERPRINT);
  });
});

describe('the PASS verdicts', () => {
  test('LOOP-3 · the A3 reviewer PASS is at head c9, with gate refs c8 and c9, both rules covered, nothing missing, no findings', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const v = verdictOf(r, 'A3', 'reviewer');
    expect(v ?? null).toMatchObject({
      verdict: 'PASS',
      head: sha(trail, 'c9'),
      base: sha(trail, 'c0'),
      diffFingerprint: A3_FINGERPRINT,
      gateRefs: [`gate.finding-red@${sha(trail, 'c8')}`, `gate.green@${sha(trail, 'c9')}`],
      rulesCovered: ['SELL-1', 'SELL-2'],
      rulesMissing: [],
      findings: [],
    });
  });

  test('LOOP-3 · the A2 security PASS keeps its own rules covered and its one gate ref, at c6', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const v = verdictOf(r, 'A2', 'security');
    expect([v?.verdict ?? null, v?.rulesCovered ?? null, v?.gateRefs ?? null, v?.head ?? null]).toEqual([
      'PASS',
      ['API1:2023', 'API3:2023'],
      [`gate.green@${sha(trail, 'c6')}`],
      sha(trail, 'c6'),
    ]);
  });
});

describe('a value the file does not hold', () => {
  test('LOOP-3 · a verdict file with no diff fingerprint and no base compiles with each null, never a default', () => {
    const bare = replayTrail(RETRY, (root) => {
      const file = verdictFile('A3', 'security');
      replaceIn(root, file, `    "diff_fingerprint": "${A3_FINGERPRINT}",\n`, '');
      const text = readIn(root, file);
      const base = /^ {4}"base_sha": "[0-9a-f]{40}",\n/m.exec(text)?.[0];
      if (base === undefined) throw new Error(`fixture setup: ${file} holds no base_sha line`);
      replaceIn(root, file, base, '');
    });
    try {
      const b = run(bare.root);
      expect(b.error, thrown(b)).toBeUndefined();
      const v = verdictOf(b, 'A3', 'security');
      expect(v?.verdict ?? null, 'the verdict still compiles').toBe('PASS');
      expect(v).toHaveProperty('diffFingerprint', null);
      expect(v).toHaveProperty('base', null);
    } finally {
      bare.cleanup();
    }
  }, SLOW);
});
