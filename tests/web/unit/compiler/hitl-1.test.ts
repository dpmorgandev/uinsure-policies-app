// @vitest-environment node
// HITL-1 · Human decisions. Every point David decided: pause 1, pause 2, steers (D-findings), rulings, sign-offs,
// merges, one list across nodes, each linked to its evidence. The compiler reads them from each node's loop.jsonl
// into trace.json's decisions[], in the design fixture's shape (docs/ui/fixture/trace.json: kind, round, at, plan,
// node, when, what, sha, evidence { file, line }), in log-line order. On the `agents` fixture trail
// (agents/README.md): build/F1's five decisions at lines 5, 6, 19, 20 and 21; build/F2 has none.
import { afterAll, beforeAll, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { LOOP_FILE, sha } from './support/loop';

interface DecisionOut {
  kind?: string;
  round?: string | null;
  at?: string | null;
  plan?: string;
  node?: string | null;
  when?: string | null;
  what?: string | null;
  sha?: string | null;
  evidence?: { file?: string; line?: number } | null;
}

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail('agents');
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

function decisions(): DecisionOut[] {
  expect(r.error, `the compile ran: ${thrown(r)}`).toBeUndefined();
  return (r.trace?.['decisions'] ?? []) as DecisionOut[];
}

test("HITL-1 · build/F1's decisions are its five, in log-line order: pause1, steer, pause2, signoff, merge", () => {
  const f1 = decisions().filter((d) => d.plan === 'build' && d.node === 'F1');
  expect(f1.map((d) => [d.kind, d.evidence?.line])).toEqual([
    ['pause1', 5],
    ['steer', 6],
    ['pause2', 19],
    ['signoff', 20],
    ['merge', 21],
  ]);
});

test('HITL-1 · a steer is recorded with its round and the pause it was given at, what David said, when, and its line', () => {
  const steer = decisions().find((d) => d.kind === 'steer');
  expect(steer).toEqual({
    kind: 'steer',
    round: 'D1',
    at: 'pause1',
    plan: 'build',
    node: 'F1',
    when: '2026-10-16T13:25:00Z',
    what: 'David: change: name the start-date window in the 422 message',
    sha: null,
    evidence: { file: LOOP_FILE, line: 6 },
  });
});

test('HITL-1 · a pause has no round and no at: both null, not missing', () => {
  const pause = decisions().find((d) => d.kind === 'pause1');
  expect(pause !== undefined && 'round' in pause && 'at' in pause, 'the fields are present').toBe(true);
  expect(pause?.round).toBeNull();
  expect(pause?.at).toBeNull();
});
