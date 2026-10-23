// @vitest-environment node
// HONEST-1 · No invented data, at the compiler. The activity chunk carries each line's fields as the log wrote them,
// so the screen never shows a dash ("the log holds none") for a value the log holds. A value a line really lacks is
// null, never a default. On the `complete` fixture trail (tests/Uinsure.Policies.Web.Tests/fixtures/trails/complete/README.md): build/F1's
// activity.jsonl, five lines, each attempt 1.
import { describe, expect, test } from 'vitest';
import { ACTIVITY, activity, readIn, replayTrail, run, SLOW, thrown, writeIn } from './support/trail';

/** The fields of an activity line the screen reads (docs/ui/derived/U0b/activity/screen.json), as a tuple. */
const FIELDS = ['line', 'ts', 'attempt', 'agent', 'tool', 'file', 'command', 'commit'] as const;

/** The replayed trail's activity.jsonl, one parsed record per line. */
const logLines = (root: string): Record<string, unknown>[] =>
  readIn(root, ACTIVITY)
    .split('\n')
    .filter((raw) => raw.trim() !== '')
    .map((raw) => JSON.parse(raw) as Record<string, unknown>);

describe("the activity chunk keeps each line's attempt", () => {
  test("HONEST-1 · the activity chunk carries each line's attempt as the log wrote it", () => {
    const trail = replayTrail('complete');
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      const chunk = activity(r, 'build', 'F1');
      expect(chunk?.map((l) => l.attempt), 'each entry carries activity.jsonl lines 1-5 attempt 1').toEqual([1, 1, 1, 1, 1]);
      // Each entry, field by field, as its log line holds it (the line number is its position in the log). The
      // commit object also carries the commit's own TDD trailer (AGENT-2), exactly as commits.json records it:
      // c0 and c4 have none (null), c1 red, c2 stub, c3 green.
      const TDD = [null, 'red', 'stub', 'green', null];
      const fromLog = logLines(trail.root).map((record, i) =>
        FIELDS.map((f) => {
          if (f === 'line') return i + 1;
          if (f === 'commit') return { ...(record[f] as Record<string, unknown>), tdd: TDD[i] };
          return record[f];
        }),
      );
      expect(chunk?.map((l) => FIELDS.map((f) => l[f]))).toEqual(fromLog);
    } finally {
      trail.cleanup();
    }
  }, SLOW);

  test("HONEST-1 · a line's attempt is the log's own: 2 stays 2, and a line with none carries null", () => {
    // Every fixture line holds attempt 1, so a hard-coded 1 would pass the test above. Here line 5 says 2 and
    // line 4 holds no attempt at all.
    const trail = replayTrail('complete', (root) => {
      const records = logLines(root);
      const four = records[3];
      const five = records[4];
      if (four === undefined || five === undefined) throw new Error('fixture setup: the complete trail has five activity lines');
      delete four['attempt'];
      five['attempt'] = 2;
      writeIn(root, ACTIVITY, `${records.map((record) => JSON.stringify(record)).join('\n')}\n`);
    });
    try {
      const r = run(trail.root);
      expect(r.error, thrown(r)).toBeUndefined();
      const chunk = activity(r, 'build', 'F1');
      // toEqual tells null from undefined inside a list, so an absent attempt on line 4 fails here too.
      expect(chunk?.map((l) => l.attempt)).toEqual([1, 1, 1, null, 2]);
    } finally {
      trail.cleanup();
    }
  }, SLOW);
});
