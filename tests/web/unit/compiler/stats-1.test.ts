// @vitest-environment node
// STATS-1 · Delivery stats. Commits per agent, attempts per node, elapsed time per node from the trail timestamps,
// shown as facts, never as scores. The stats screen (docs/ui/derived/U5/stats/screen.json) reads each verdict's
// stamp and attempt (verdicts[*].ts, verdicts[*].attempt) and each node's attempt count; the compiler takes the stamp
// and attempt from the verdict file's envelope, and a value the file doesn't hold is null. On U5's overlay over the
// `complete` trail (tests/web/fixtures/trails/complete/README.md): build/F1, attempt 1, A1 reviewer PASS and A1
// security PASS, both stamped 2026-10-18T16:00:00Z; five commits, main 1, tester 2, builder 2.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { run, SLOW, thrown, writeIn } from './support/trail';
import type { Run, Trail } from './support/trail';
import { overlayDir, replayU5 } from './support/u5';
import type { Verdict } from './support/u5';
import { replayTrail } from './support/trail';
import { cpSync } from 'node:fs';

describe('on U5 overlay', () => {
  let trail: Trail;
  let r: Run;
  beforeAll(() => {
    trail = replayU5();
    r = run(trail.root);
  }, SLOW);
  afterAll(() => trail?.cleanup());

  const verdicts = (): Verdict[] => (r.trace?.['verdicts'] as Verdict[] | undefined) ?? [];

  test("STATS-1 · each verdict carries its envelope's stamp: F1's A1 reviewer and security, 2026-10-18T16:00:00Z", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(
      verdicts()
        .filter((v) => v.plan === 'build' && v.node === 'F1')
        .map((v) => [v.round, v.agent, v.verdict, v.ts ?? null])
        .sort(),
    ).toEqual([
      ['A1', 'reviewer', 'PASS', '2026-10-18T16:00:00Z'],
      ['A1', 'security', 'PASS', '2026-10-18T16:00:00Z'],
    ]);
  });

  test("STATS-1 · each verdict carries the attempt it was recorded under: F1's two, attempt 1", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(verdicts().filter((v) => v.node === 'F1').map((v) => v.attempt ?? null)).toEqual([1, 1]);
  });
});

describe('a verdict file with no stamp and no attempt', () => {
  let trail: Trail;
  let r: Run;
  beforeAll(() => {
    trail = replayTrail('complete', (root) => {
      cpSync(overlayDir, root, { recursive: true });
      // The A2 reviewer verdict, bare (no envelope): it holds no ts and no attempt.
      writeIn(
        root,
        'docs/trace/build/F1/verdicts/A2-reviewer.json',
        JSON.stringify({ agent: 'reviewer', verdict: 'PASS', head_sha: null, rules_covered: [], rules_missing: [], findings: [] }),
      );
    });
    r = run(trail.root);
  }, SLOW);
  afterAll(() => trail?.cleanup());

  test('STATS-1 · a verdict that holds no stamp or attempt has both null, never a default, beside one that does', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const of = (round: string): [unknown, unknown] | undefined => {
      const v = ((r.trace?.['verdicts'] as Verdict[] | undefined) ?? []).find((x) => x.round === round && x.agent === 'reviewer');
      return v === undefined ? undefined : [v.ts, v.attempt];
    };
    expect([of('A1'), of('A2')]).toEqual([
      ['2026-10-18T16:00:00Z', 1],
      [null, null],
    ]);
  });
});
