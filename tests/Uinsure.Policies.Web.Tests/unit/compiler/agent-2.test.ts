// @vitest-environment node
// AGENT-2 · Agent swimlanes. activity.jsonl as per-agent lanes over time: tool, file, command. The compiler writes
// each node's activity chunk (trace/<plan>/<node>/activity.json) one entry per log line, in line order, and a line
// that logged a commit carries the commit's own TDD trailer beside its SHA and subject (the screen marks a lane's
// red, stub and green ticks from it, docs/ui/screens/activity/screen.json: activity.json[].commit.tdd); a commit with
// no TDD trailer carries tdd null. On the `agents` fixture trail (agents/README.md): build/F1's 11 lines, four
// agents, the tools Bash, Edit and Read.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { sha } from './support/loop';

interface Entry {
  line?: number;
  attempt?: number | null;
  agent?: string | null;
  tool?: string | null;
  file?: string | null;
  command?: string | null;
  commit?: { sha?: string; subject?: string; tdd?: string | null } | null;
}

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail('agents');
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

function chunk(): Entry[] {
  expect(r.error, `the compile ran: ${thrown(r)}`).toBeUndefined();
  const file = join(r.publicDir, 'trace', 'build', 'F1', 'activity.json');
  expect(existsSync(file), 'the activity chunk is written').toBe(true);
  return JSON.parse(readFileSync(file, 'utf8')) as Entry[];
}

const commitAt = (line: number): Entry['commit'] => chunk().find((e) => e.line === line)?.commit;

test("AGENT-2 · a line that logged a red commit carries the commit's TDD trailer beside its SHA and subject", () => {
  expect(commitAt(2)).toEqual({ sha: sha(trail, 'c2'), subject: 'test(SELL-1): red: the acceptance suite', tdd: 'red' });
});

test('AGENT-2 · the stub and green commits carry stub and green', () => {
  expect([commitAt(3)?.tdd, commitAt(5)?.tdd]).toEqual(['stub', 'green']);
});

test('AGENT-2 · a line that logged a commit with no TDD trailer carries tdd null, not missing', () => {
  const c1 = commitAt(1);
  expect(c1?.sha).toBe(sha(trail, 'c1'));
  expect(c1 !== null && c1 !== undefined && 'tdd' in c1, 'the field is present').toBe(true);
  expect(c1?.tdd).toBeNull();
});
