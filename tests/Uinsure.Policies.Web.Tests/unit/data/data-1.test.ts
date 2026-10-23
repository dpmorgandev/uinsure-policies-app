// @vitest-environment node
// DATA-1 · One compiled data file. The SPA reads only the versioned trace.json the compiler wrote, and the lazy
// chunks it names: no runtime read of the repo, no server. The loader (app/data/trace.ts) is served the compiled
// `complete` fixture trail (tests/Uinsure.Policies.Web.Tests/fixtures/trails/complete/README.md): plan `build` "Fixture build", node F1
// "Sell", and one activity record per commit, c0 to c4.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { loadActivity, loadTrace } from '../../../../src/Uinsure.Policies.Web/app/data/trace';
import type { Trace } from '../../../../src/Uinsure.Policies.Web/app/data/trace';
import { SLOW } from '../compiler/support/trail';
import { changed, compileFixture, serve, settle } from './support/served';
import type { Compiled } from './support/served';

let fixture: Compiled;
beforeAll(() => {
  fixture = compileFixture('complete');
}, SLOW);
afterAll(() => {
  fixture?.trail.cleanup();
});

const F1_COMMANDS = [
  'git commit -m "plan(build/F1): F1 pending → in_progress"',
  'git commit -m "test(SELL-1): red: the acceptance suite"',
  'git commit -m "feat(F1): stub the sale route"',
  'git commit -m "feat(SELL-1): green: the sale"',
  'git commit -m "docs(F1): QA script"',
];

/** The compiled trace.json as the loader's type, for the chunk tests. */
const compiledTrace = (): Trace => fixture.trace as unknown as Trace;

/** trace.json served with a different schemaVersion (or none, for undefined). */
const withVersion = (version: string | undefined): string =>
  changed(fixture.trace, (copy) => {
    if (version === undefined) delete copy['schemaVersion'];
    else copy['schemaVersion'] = version;
  });

describe('trace.json', () => {
  test('DATA-1 · the loader reads the compiled trace.json and hands over what it holds', async () => {
    const served = serve(fixture.run.publicDir);
    const loaded = await settle(() => loadTrace(served.fetch));
    expect(loaded.state).toBe('ready');
    if (loaded.state !== 'ready') return;
    expect(loaded.trace.schemaVersion).toBe('1.0.0');
    expect(loaded.trace.plans.map((p) => [p.id, p.title])).toEqual([['build', 'Fixture build']]);
    expect(loaded.trace.nodes.find((n) => n.plan === 'build' && n.id === 'F1')?.title).toBe('Sell');
    expect(loaded.trace).toEqual(fixture.trace);
  });

  test('DATA-1 · the loader makes one request, for trace.json beside the app, and no other', async () => {
    const served = serve(fixture.run.publicDir);
    await settle(() => loadTrace(served.fetch));
    expect(served.paths(), 'relative to the app, so the static build serves it from any path').toEqual(['trace.json']);
  });

  test('DATA-1 · a trace.json of the same major version (1.4.0) is read', async () => {
    const served = serve(fixture.run.publicDir, { 'trace.json': withVersion('1.4.0') });
    const loaded = await settle(() => loadTrace(served.fetch));
    expect(loaded.state).toBe('ready');
    if (loaded.state === 'ready') expect(loaded.trace.schemaVersion).toBe('1.4.0');
  });

  test('DATA-1 · a trace.json of the next major version (2.0.0) is refused, naming its version', async () => {
    const served = serve(fixture.run.publicDir, { 'trace.json': withVersion('2.0.0') });
    const loaded = await settle(() => loadTrace(served.fetch));
    expect(loaded.state).toBe('error');
    expect(loaded).not.toHaveProperty('trace');
    if (loaded.state === 'error') expect(loaded.reason).toContain('2.0.0');
  });

  test('DATA-1 · a trace.json of an earlier major version (0.9.0) is refused, naming its version', async () => {
    const served = serve(fixture.run.publicDir, { 'trace.json': withVersion('0.9.0') });
    const loaded = await settle(() => loadTrace(served.fetch));
    expect(loaded.state).toBe('error');
    expect(loaded).not.toHaveProperty('trace');
    if (loaded.state === 'error') expect(loaded.reason).toContain('0.9.0');
  });

  test('DATA-1 · a trace.json with no schemaVersion is refused', async () => {
    const served = serve(fixture.run.publicDir, { 'trace.json': withVersion(undefined) });
    const loaded = await settle(() => loadTrace(served.fetch));
    expect(loaded.state).toBe('error');
    expect(loaded).not.toHaveProperty('trace');
    if (loaded.state === 'error') expect(loaded.reason).toContain('schemaVersion');
  });

  test('DATA-1 · no trace.json (404) is an error naming trace.json, never an empty trace', async () => {
    const served = serve(fixture.run.publicDir, { 'trace.json': null });
    const loaded = await settle(() => loadTrace(served.fetch));
    expect(loaded.state).toBe('error');
    expect(loaded).not.toHaveProperty('trace');
    if (loaded.state === 'error') expect(loaded.reason).toContain('trace.json');
    expect(served.paths(), 'it does not go looking elsewhere').toEqual(['trace.json']);
  });

  test('DATA-1 · a trace.json that is not JSON is an error, never an empty trace', async () => {
    const served = serve(fixture.run.publicDir, { 'trace.json': '<!doctype html><title>index</title>' });
    const loaded = await settle(() => loadTrace(served.fetch));
    expect(loaded.state).toBe('error');
    expect(loaded).not.toHaveProperty('trace');
  });

  test('DATA-1 · a fetch that fails outright settles as an error, not a rejection', async () => {
    const loaded = await settle(() => loadTrace(() => Promise.reject(new TypeError('Failed to fetch'))));
    expect(loaded.state).toBe('error');
    expect(loaded).not.toHaveProperty('trace');
  });
});

describe('the activity chunk', () => {
  test("DATA-1 · a node's activity is read from the chunk trace.json names, record by record", async () => {
    const served = serve(fixture.run.publicDir);
    const loaded = await settle(() => loadActivity(compiledTrace(), 'build', 'F1', served.fetch));
    expect(loaded.state).toBe('ready');
    if (loaded.state !== 'ready') return;
    expect(loaded.records.map((r) => r.command)).toEqual(F1_COMMANDS);
    expect(loaded.records.map((r) => r.line)).toEqual([1, 2, 3, 4, 5]);
  });

  test("DATA-1 · reading a node's activity makes one request, for its chunk beside the app", async () => {
    const served = serve(fixture.run.publicDir);
    await settle(() => loadActivity(compiledTrace(), 'build', 'F1', served.fetch));
    expect(served.paths()).toEqual(['trace/build/F1/activity.json']);
  });

  test('DATA-1 · a node whose chunk trace.json names as null has no activity, and nothing is fetched', async () => {
    const trace = JSON.parse(
      changed(fixture.trace, (copy) => {
        for (const n of copy['nodes'] as { chunks: { activity: string | null } }[]) n.chunks.activity = null;
      }),
    ) as Trace;
    const served = serve(fixture.run.publicDir);
    const loaded = await settle(() => loadActivity(trace, 'build', 'F1', served.fetch));
    expect(loaded).toEqual({ state: 'none' });
    expect(served.paths(), 'the file is on the host, but trace.json does not name it').toEqual([]);
  });

  test('DATA-1 · a node trace.json does not hold is an error, and nothing is fetched', async () => {
    const served = serve(fixture.run.publicDir);
    const loaded = await settle(() => loadActivity(compiledTrace(), 'build', 'F9', served.fetch));
    expect(loaded.state).toBe('error');
    expect(served.paths()).toEqual([]);
  });

  test.each([
    ['the trail file in the repo', 'docs/trace/build/F1/activity.jsonl'],
    ['a path that climbs out of the app', '../../docs/trace/build/F1/activity.jsonl'],
    ['a chunk path that climbs back out', 'trace/build/F1/../../../docs/requirements.md'],
    ['another host', 'https://example.invalid/trace/build/F1/activity.json'],
    ['the API', 'api/policies'],
  ])('DATA-1 · a chunk path that is not a trace chunk (%s) is refused, and nothing is fetched', async (_name, path) => {
    const trace = JSON.parse(
      changed(fixture.trace, (copy) => {
        for (const n of copy['nodes'] as { chunks: { activity: string | null } }[]) n.chunks.activity = path;
      }),
    ) as Trace;
    const served = serve(fixture.run.publicDir);
    const loaded = await settle(() => loadActivity(trace, 'build', 'F1', served.fetch));
    expect(loaded.state).toBe('error');
    expect(served.requested, 'a path that is not trace/<plan>/<node>/activity.json is never requested').toEqual([]);
  });

  test("DATA-1 · a chunk the host doesn't have (404) is an error, never an empty activity", async () => {
    const served = serve(fixture.run.publicDir, { 'trace/build/F1/activity.json': null });
    const loaded = await settle(() => loadActivity(compiledTrace(), 'build', 'F1', served.fetch));
    expect(loaded.state).toBe('error');
    expect(loaded).not.toHaveProperty('records');
  });

  test('DATA-1 · a chunk that is not a JSON array is an error, never an empty activity', async () => {
    const served = serve(fixture.run.publicDir, { 'trace/build/F1/activity.json': '{"records":[]}' });
    const loaded = await settle(() => loadActivity(compiledTrace(), 'build', 'F1', served.fetch));
    expect(loaded.state).toBe('error');
    expect(loaded).not.toHaveProperty('records');
  });
});
