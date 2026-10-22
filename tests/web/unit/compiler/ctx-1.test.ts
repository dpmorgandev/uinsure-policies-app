// @vitest-environment node
// CTX-1 · Sessions. The docs/context/ snapshot chain as a timeline across days, showing how work resumed between
// sessions. The compiler reads each snapshot's front matter into trace.json's sessions[] { file, ts, slug, plan, node,
// status, nextAction } (trace-data skill; docs/ui/derived/U5/sessions/screen.json). On U5's overlay
// (tests/web/fixtures/overlays/u5/README.md): three dated snapshots over 2026-10-18 and 2026-10-19, and one with no
// front matter, which is reported, never guessed.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';
import { replayU5 } from './support/u5';
import type { Session } from './support/u5';

const STARTED = 'docs/context/20261018-090000-f1-started.md';
const PAUSED = 'docs/context/20261018-171500-f1-pause-one.md';
const RESUMED = 'docs/context/20261019-081000-day-two-resumed.md';
const UNDATED = 'docs/context/20261019-120000-no-front-matter.md';

describe('on U5 overlay', () => {
  let trail: Trail;
  let r: Run;
  beforeAll(() => {
    trail = replayU5();
    r = run(trail.root);
  }, SLOW);
  afterAll(() => trail?.cleanup());

  const sessions = (): Session[] => (r.trace?.['sessions'] as Session[] | undefined) ?? [];

  test('CTX-1 · the three dated snapshots are the sessions, oldest first, across two days', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(sessions().map((s) => [s.file, s.ts])).toEqual([
      [STARTED, '2026-10-18T09:00:00Z'],
      [PAUSED, '2026-10-18T17:15:00Z'],
      [RESUMED, '2026-10-19T08:10:00Z'],
    ]);
  });

  test("CTX-1 · a session holds its snapshot's slug, plan, node, status and next action, field by field", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(sessions().find((s) => s.file === PAUSED)).toEqual({
      file: PAUSED,
      ts: '2026-10-18T17:15:00Z',
      slug: 'f1-pause-one',
      plan: 'build',
      node: 'F1',
      status: 'blocked',
      nextAction: 'David opens the stub routes at pause 1',
    });
  });

  test('CTX-1 · a snapshot whose plan and node are null keeps them null, never a default', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const resumed = sessions().find((s) => s.file === RESUMED);
    expect([resumed?.plan, resumed?.node, resumed?.status, resumed?.nextAction]).toEqual([
      null,
      null,
      'in-progress',
      "Resume F1 from pause 1 after David's ruling",
    ]);
  });

  test('CTX-1 · a snapshot with no front matter is reported in problems[] by its file, and is not in the timeline', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(sessions().map((s) => s.file)).not.toContain(UNDATED);
    expect((r.trace?.problems ?? []).map((p) => p.file)).toContain(UNDATED);
  });
});
