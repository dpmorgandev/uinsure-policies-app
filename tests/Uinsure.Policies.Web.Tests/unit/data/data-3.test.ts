// @vitest-environment node
// DATA-3 · Compiled-at stamp. The loader hands every screen the snapshot trace.json was compiled from: its ref,
// full SHA, short SHA and UTC time, exactly as compiledAt holds them, so the reader knows it is not live. A file
// whose stamp is missing or malformed is refused, and a refused load carries no snapshot to claim (HONEST-1's
// "no snapshot claim" rests on it). On the compiled `complete` fixture trail, at the compiler's injected clock.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { loadTrace } from '../../../../src/Uinsure.Policies.Web/app/data/trace';
import { NOW, SLOW } from '../compiler/support/trail';
import { changed, compileFixture, serve, settle } from './support/served';
import type { Compiled } from './support/served';

let fixture: Compiled;
beforeAll(() => {
  fixture = compileFixture('complete');
}, SLOW);
afterAll(() => {
  fixture?.trail.cleanup();
});

/** trace.json served with its compiledAt changed. */
const withStamp = (change: (stamp: Record<string, unknown>) => void): string =>
  changed(fixture.trace, (copy) => change(copy['compiledAt'] as Record<string, unknown>));

/** Serves `body` as trace.json, and checks the load is refused, naming compiledAt, with no snapshot and no trace. */
async function expectRefused(body: string): Promise<void> {
  const served = serve(fixture.run.publicDir, { 'trace.json': body });
  const loaded = await settle(() => loadTrace(served.fetch));
  expect(loaded.state).toBe('error');
  expect(loaded, 'a refused load states no snapshot').not.toHaveProperty('snapshot');
  expect(loaded).not.toHaveProperty('trace');
  if (loaded.state === 'error') expect(loaded.reason).toContain('compiledAt');
}

describe('the snapshot', () => {
  test("DATA-3 · the snapshot is the compiled stamp: the ref, the full SHA, its first 7 characters and the UTC time", async () => {
    const served = serve(fixture.run.publicDir);
    const loaded = await settle(() => loadTrace(served.fetch));
    expect(loaded.state).toBe('ready');
    if (loaded.state !== 'ready') return;
    const head = fixture.trail.head;
    expect(loaded.snapshot).toEqual({ ref: 'HEAD', sha: head, short: head.slice(0, 7), utc: NOW.toISOString() });
  });

  test("DATA-3 · the snapshot is the file's stamp, verbatim, not HEAD's commit or the clock's time", async () => {
    const c3 = fixture.trail.shas['c3'] ?? '(no c3)';
    const body = withStamp((stamp) => {
      stamp['ref'] = 'v0.3';
      stamp['sha'] = c3;
      stamp['utc'] = '2027-01-02T03:04:05Z';
    });
    const served = serve(fixture.run.publicDir, { 'trace.json': body });
    const loaded = await settle(() => loadTrace(served.fetch));
    expect(loaded.state).toBe('ready');
    if (loaded.state !== 'ready') return;
    expect(loaded.snapshot).toEqual({ ref: 'v0.3', sha: c3, short: c3.slice(0, 7), utc: '2027-01-02T03:04:05Z' });
  });

  test('DATA-3 · a trace.json with no compiledAt is refused, and states no snapshot', async () => {
    await expectRefused(changed(fixture.trace, (copy) => delete copy['compiledAt']));
  });

  test.each(['ref', 'sha', 'utc'])('DATA-3 · a stamp with no compiledAt.%s is refused, and states no snapshot', async (field) => {
    await expectRefused(withStamp((stamp) => delete stamp[field]));
  });

  test('DATA-3 · a stamp whose sha is a short SHA (7 characters) is refused: the stamp is the full SHA', async () => {
    const head = fixture.trail.head;
    await expectRefused(withStamp((stamp) => (stamp['sha'] = head.slice(0, 7))));
  });

  test('DATA-3 · a stamp whose sha is not hex is refused', async () => {
    await expectRefused(withStamp((stamp) => (stamp['sha'] = 'z'.repeat(40))));
  });

  test('DATA-3 · a stamp time with an offset (+01:00), not UTC, is refused', async () => {
    await expectRefused(withStamp((stamp) => (stamp['utc'] = '2026-10-19T09:30:15+01:00')));
  });

  test('DATA-3 · a stamp time with no time of day is refused', async () => {
    await expectRefused(withStamp((stamp) => (stamp['utc'] = '2026-10-19')));
  });
});
