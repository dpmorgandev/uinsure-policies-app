// @vitest-environment node
// NAV-4 · Search. Jump to any rule ID, node, SHA or file path from one input. `searchIndex` lists every rule ID, node,
// commit SHA and file path trace.json names (a rule's requirements file, a node's QA script, a verdict's file and
// a finding's files), each once, with the URL it opens; `searchTrace` returns the entries matching what was typed:
// case-insensitive, a SHA by any prefix of four or more hex characters, a rule or node by its ID, a path by any
// part of it. Nothing typed, or a query nothing matches, gives no entries. On a small trace written here: its own
// values, so a canned answer can't pass.
import { describe, expect, test } from 'vitest';
import { searchIndex, searchTrace } from '../../../../src/web/app/data/trace';
import type { SearchEntry, Trace } from '../../../../src/web/app/data/trace';

const C2 = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const C4 = 'b2c3d4e5f60718293a4b5c6d7e8f901234567890';

const trace = {
  schemaVersion: '1.0.0',
  compiledAt: { ref: 'origin/main', sha: C4, utc: '2026-10-19T08:30:15Z' },
  problems: [],
  rules: [
    { id: 'SELL-2', title: 'Start date window', source: { file: 'docs/requirements.md', line: 41 } },
    { id: 'RENEW-1/2', title: 'Renewal window', source: { file: 'docs/requirements.md', line: 77 } },
  ],
  plans: [{ id: 'build', kind: 'build', title: 'Build', nodes: ['F1'] }],
  nodes: [{ plan: 'build', id: 'F1', title: 'Sell', qa: 'docs/qa/build-F1.md', rules: ['SELL-2'], chunks: { activity: null, diffs: null } }],
  commits: [
    { sha: C2, short: C2.slice(0, 7), subject: 'test(SELL-2): red: the window', plan: 'build', node: 'F1', agent: 'tester', rule: ['SELL-2'], tdd: 'red', order: 2 },
    { sha: C4, short: C4.slice(0, 7), subject: 'feat(SELL-2): green: the window', plan: 'build', node: 'F1', agent: 'builder', rule: ['SELL-2'], tdd: 'green', order: 4 },
  ],
  events: [],
  verdicts: [{ plan: 'build', node: 'F1', round: 'A1', agent: 'reviewer', verdict: 'FAIL', file: 'docs/trace/build/F1/verdicts/A1-reviewer.json' }],
  findings: [{ plan: 'build', node: 'F1', round: 'A1', id: 'I1', files: ['src/Uinsure.Policies.Domain/StartDate.cs'] }],
  decisions: [],
  sessions: [],
  harness: null,
} as unknown as Trace;

// U10 (U4 review A2 R3): SearchEntry.href is split into `route` (in-app) and `repoPath` (a file); each entry is read by
// the field its kind fills.
const pick = (entries: SearchEntry[]): [string, string, string][] =>
  entries.map((e) => [e.kind, e.label, (e.kind === 'path' ? e.repoPath : e.route) ?? '(none)']);

describe('the index', () => {
  test('NAV-4 · the index holds each rule, node and commit once, with the URL each opens', () => {
    const entries = searchIndex(trace);
    expect(pick(entries.filter((e) => e.kind !== 'path'))).toEqual(
      expect.arrayContaining([
        ['rule', 'SELL-2', '#/rules/SELL-2'],
        ['rule', 'RENEW-1/2', '#/rules/RENEW-1%2F2'],
        ['node', 'build/F1', '#/plans/build/F1'],
        ['sha', C2.slice(0, 7), `#/commits/${C2.slice(0, 7)}`],
        ['sha', C4.slice(0, 7), `#/commits/${C4.slice(0, 7)}`],
      ]),
    );
    expect(entries.filter((e) => e.kind !== 'path')).toHaveLength(5);
  });

  test("NAV-4 · the index holds the paths the trace names: a finding's file, a verdict's file and a node's QA script", () => {
    const paths = searchIndex(trace)
      .filter((e) => e.kind === 'path')
      .map((e) => e.label);
    expect(paths).toEqual(
      expect.arrayContaining(['src/Uinsure.Policies.Domain/StartDate.cs', 'docs/trace/build/F1/verdicts/A1-reviewer.json', 'docs/qa/build-F1.md']),
    );
  });

  test("NAV-4 · a path's entry links to the file itself, a repo-relative path, not an in-app '#/files/' route", () => {
    // A3 I1/I4: the path's link is what its consumer opens on GitHub at the snapshot SHA (REPO/blob/<sha>/<path>),
    // so it ends in the path as trace.json names it, unencoded, and holds no hash route the app doesn't serve.
    const entry = searchIndex(trace).find((e) => e.kind === 'path' && e.label === 'src/Uinsure.Policies.Domain/StartDate.cs');
    expect(entry, 'the finding file is in the index').toBeDefined();
    expect(entry?.repoPath).toBe('src/Uinsure.Policies.Domain/StartDate.cs');
    expect(entry?.repoPath ?? '#', 'the repo path holds no hash route').not.toContain('#');
  });

  test('NAV-4 · a path entry names its repo path and no route; a rule, node or commit names its route and no repo path', () => {
    const entries = searchIndex(trace);
    const path = entries.find((e) => e.kind === 'path' && e.label === 'docs/qa/build-F1.md');
    const rule = entries.find((e) => e.kind === 'rule' && e.label === 'SELL-2');
    expect({ route: path?.route ?? null, repoPath: path?.repoPath ?? null }).toEqual({ route: null, repoPath: 'docs/qa/build-F1.md' });
    expect({ route: rule?.route ?? null, repoPath: rule?.repoPath ?? null }).toEqual({ route: '#/rules/SELL-2', repoPath: null });
  });
});

describe('a query', () => {
  test('NAV-4 · a rule ID finds its rule, in any case', () => {
    expect(pick(searchTrace(searchIndex(trace), 'sell-2')).filter(([kind]) => kind === 'rule')).toEqual([['rule', 'SELL-2', '#/rules/SELL-2']]);
  });

  test('NAV-4 · a node ID finds its node', () => {
    expect(pick(searchTrace(searchIndex(trace), 'F1')).filter(([kind]) => kind === 'node')).toEqual([['node', 'build/F1', '#/plans/build/F1']]);
  });

  test('NAV-4 · a SHA prefix of four characters finds its one commit', () => {
    expect(pick(searchTrace(searchIndex(trace), 'b2c3'))).toEqual([['sha', C4.slice(0, 7), `#/commits/${C4.slice(0, 7)}`]]);
  });

  test("NAV-4 · a full SHA finds its commit", () => {
    expect(pick(searchTrace(searchIndex(trace), C2))).toEqual([['sha', C2.slice(0, 7), `#/commits/${C2.slice(0, 7)}`]]);
  });

  test('NAV-4 · part of a path finds the path', () => {
    expect(searchTrace(searchIndex(trace), 'StartDate').map((e) => [e.kind, e.label])).toEqual([['path', 'src/Uinsure.Policies.Domain/StartDate.cs']]);
  });

  test('NAV-4 · a query nothing matches gives no entries', () => {
    expect(searchTrace(searchIndex(trace), 'ZZ-99')).toEqual([]);
  });

  test('NAV-4 · nothing typed gives no entries', () => {
    expect(searchTrace(searchIndex(trace), '   ')).toEqual([]);
  });
});
