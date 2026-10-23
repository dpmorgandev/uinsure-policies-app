// @vitest-environment node
// AGENT-1 · Who touched what. Per node: each commit's `Agent` trailer beside the agent the hook saw make it, with the
// match. The compiler gives each commit in trace.json its `hookAgent`: the agent of the activity.jsonl line that
// logged the commit (its `commit.sha`), or null when no activity line logged it, never the trailer copied across.
// On the `agents` fixture trail (agents/README.md): c5 is trailered `builder` and logged by `main` (the one
// disagreement); c4 is trailered and logged `builder`; c0 (build/F0a, git-only) has no activity line.
import { afterAll, beforeAll, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { sha } from './support/loop';

interface CommitOut {
  sha?: string;
  agent?: string | null;
  hookAgent?: string | null;
}

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail('agents');
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

function commitOf(id: string): CommitOut | undefined {
  expect(r.error, `the compile ran: ${thrown(r)}`).toBeUndefined();
  return ((r.trace?.commits ?? []) as CommitOut[]).find((c) => c.sha === sha(trail, id));
}

test('AGENT-1 · a commit the hook logged under its trailer agent has that agent as hookAgent', () => {
  const c4 = commitOf('c4');
  expect(c4?.agent).toBe('builder');
  expect(c4?.hookAgent).toBe('builder');
});

test('AGENT-1 · a commit the hook logged under another agent keeps both: trailer builder, hookAgent main', () => {
  const c5 = commitOf('c5');
  expect(c5?.agent).toBe('builder');
  expect(c5?.hookAgent).toBe('main');
});

test('AGENT-1 · a commit no activity line logged has hookAgent null, not its trailer agent', () => {
  const c0 = commitOf('c0');
  expect(c0, 'trace.json lists c0').toBeDefined();
  expect(c0 !== undefined && 'hookAgent' in c0, 'the field is present').toBe(true);
  expect(c0?.hookAgent).toBeNull();
});
