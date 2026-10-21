// @vitest-environment node
// DATA-1 · One compiled data file. The compiler turns the trail into one versioned trace.json (v1.0.0, the
// trace-data index) and the lazy chunks it names, under src/web/public/. On the `complete` fixture trail
// (tests/web/fixtures/trails/complete/README.md): build/F1 Sell, rules SELL-1 and SELL-2, commits c0 to c4.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { activity, replayTrail, run, SLOW, thrown } from './support/trail';
import type { Run, Trail } from './support/trail';

/** The top-level fields of trace.json v1.0.0, and nothing else. */
const INDEX_FIELDS = [
  'commits',
  'compiledAt',
  'decisions',
  'events',
  'findings',
  'harness',
  'nodes',
  'plans',
  'problems',
  'rules',
  'schemaVersion',
  'sessions',
  'verdicts',
];
const LISTS = ['commits', 'decisions', 'events', 'findings', 'nodes', 'plans', 'problems', 'rules', 'sessions', 'verdicts'];

let trail: Trail;
let r: Run;
beforeAll(() => {
  trail = replayTrail('complete');
  r = run(trail.root);
}, SLOW);
afterAll(() => trail?.cleanup());

describe('the compiler writes one versioned trace.json', () => {
  test('DATA-1 · compile writes trace.json under src/web/public/, at schemaVersion 1.0.0', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(r.written).toContain('src/web/public/trace.json');
    expect(r.trace, 'trace.json is JSON').not.toBeNull();
    expect(r.trace?.schemaVersion).toBe('1.0.0');
  });

  test('DATA-1 · trace.json holds exactly the v1.0.0 index fields, each list a list', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(Object.keys(r.trace ?? {}).sort()).toEqual(INDEX_FIELDS);
    expect(LISTS.filter((field) => !Array.isArray(r.trace?.[field])), 'fields that are not lists').toEqual([]);
  });

  test('DATA-1 · a clean trail compiles with no problem listed', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(r.trace?.problems).toEqual([]);
  });

  test('DATA-1 · the plan, its node and its rules come from the plan DAG and the requirements', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(r.trace?.plans?.map((p) => [p.id, p.kind, p.title, p.nodes])).toEqual([['build', 'build', 'Fixture build', ['F1']]]);
    expect(r.trace?.nodes?.map((n) => [n.plan, n.id, n.title, n.rules])).toEqual([['build', 'F1', 'Sell', ['SELL-1', 'SELL-2']]]);
    expect(r.trace?.rules?.map((rule) => rule.id)).toEqual(['SELL-1', 'SELL-2']);
  });

  test("DATA-1 · the node's commits are read from their trailers, field by field", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const sha = (id: string): string => trail.shas[id] ?? `(no ${id})`;
    const ofNode = (r.trace?.commits ?? [])
      .filter((c) => c.plan === 'build' && c.node === 'F1')
      .map((c) => [c.sha, c.short, c.subject, c.agent, c.tdd])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    const expected = [
      ['c0', 'plan(build/F1): F1 pending → in_progress', 'main', null],
      ['c1', 'test(SELL-1): red: the acceptance suite', 'tester', 'red'],
      ['c2', 'feat(F1): stub the sale route', 'builder', 'stub'],
      ['c3', 'feat(SELL-1): green: the sale', 'builder', 'green'],
      ['c4', 'docs(F1): QA script', 'tester', null],
    ]
      .map(([id, subject, agent, tdd]) => [sha(id ?? ''), sha(id ?? '').slice(0, 7), subject, agent, tdd])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    expect(ofNode).toEqual(expected);
    // The comma form of the Rule trailer, "SELL-1, SELL-2", is two rules.
    expect(r.trace?.commits?.find((c) => c.sha === sha('c1'))?.rule).toEqual(['SELL-1', 'SELL-2']);
  });

  test('DATA-1 · events, verdicts and rule status stay empty until a node drives them', () => {
    // The lists exist (the index test above); no U0b test drives filling them, so they hold nothing yet: U1 owns
    // rule status and its red, green and refactor commits, U3 the loop events and the verdicts. The complete trail
    // has a nine-line loop.jsonl, two A1 verdicts and a green commit c3 naming SELL-1 and SELL-2, so a parser that
    // runs anyway shows here. A status the compile doesn't derive is null, never a default such as not-built.
    expect(r.error, thrown(r)).toBeUndefined();
    expect(r.trace?.events, 'events').toEqual([]);
    expect(r.trace?.['verdicts'], 'verdicts').toEqual([]);
    expect(r.trace?.rules?.map((rule) => [rule.id, rule.status, rule.red, rule.green, rule.refactor])).toEqual([
      ['SELL-1', null, [], [], []],
      ['SELL-2', null, [], [], []],
    ]);
  });
});

describe('the lazy chunks', () => {
  test("DATA-1 · trace.json names build/F1's activity chunk, and every chunk it names is written beside it", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const chunks = r.trace?.nodes?.find((n) => n.plan === 'build' && n.id === 'F1')?.chunks ?? null;
    expect(chunks?.activity).toBe('trace/build/F1/activity.json');
    const named = Object.values(chunks ?? {}).filter((c): c is string => typeof c === 'string');
    expect(named.filter((c) => !existsSync(join(r.publicDir, c))), 'named chunks not written').toEqual([]);
    for (const c of named) expect(() => JSON.parse(readFileSync(join(r.publicDir, c), 'utf8')), `${c} is JSON`).not.toThrow();
  });

  test('DATA-1 · the compiler writes trace.json and the chunks it names, and nothing else', () => {
    expect(r.error, thrown(r)).toBeUndefined();
    const named = (r.trace?.nodes ?? []).flatMap((n) => Object.values(n.chunks ?? {})).filter((c): c is string => typeof c === 'string');
    expect([...r.written].sort()).toEqual(['src/web/public/trace.json', ...named.map((c) => `src/web/public/${c}`)].sort());
  });

  test("DATA-1 · the activity chunk holds the node's activity, one entry per line, in order", () => {
    expect(r.error, thrown(r)).toBeUndefined();
    expect(activity(r, 'build', 'F1')?.map((l) => [l.line, l.attempt, l.agent, l.tool, l.file, l.command])).toEqual([
      [1, 1, 'main', 'Bash', null, 'git commit -m "plan(build/F1): F1 pending → in_progress"'],
      [2, 1, 'tester', 'Bash', null, 'git commit -m "test(SELL-1): red: the acceptance suite"'],
      [3, 1, 'builder', 'Bash', null, 'git commit -m "feat(F1): stub the sale route"'],
      [4, 1, 'builder', 'Bash', null, 'git commit -m "feat(SELL-1): green: the sale"'],
      [5, 1, 'tester', 'Bash', null, 'git commit -m "docs(F1): QA script"'],
    ]);
  });
});
