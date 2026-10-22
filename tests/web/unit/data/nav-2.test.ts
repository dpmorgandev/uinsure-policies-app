// @vitest-environment node
// NAV-2 · Every entity has a URL. Rules, nodes, commits, verdicts, findings and sessions are each deep-linkable, so
// David can paste a link into the conversation. `entityUrl` gives each its hash route, the routes of
// docs/ui/screens/<screen>/screen.json: /rules/:ruleId, /plans/:planId/:nodeId, /commits/:sha,
// /plans/:planId/:nodeId/verdicts/:round/:agent, /plans/:planId/:nodeId/findings/:round and /sessions/:file, the
// session's file named by its basename without `.md`. A commit's URL takes its short SHA; a segment is URL-encoded.
import { describe, expect, test } from 'vitest';
import { entityUrl } from '../../../../src/web/app/data/trace';

const FULL = '3a092b06f4691f5cb5ee8ed117d4e755e2095545';

describe('each entity kind', () => {
  test('NAV-2 · a rule opens at #/rules/<id>', () => {
    expect(entityUrl({ kind: 'rule', id: 'SELL-2' })).toBe('#/rules/SELL-2');
  });

  test('NAV-2 · a slash rule keeps its slash encoded, so the route takes it as one segment', () => {
    expect(entityUrl({ kind: 'rule', id: 'RENEW-1/2' })).toBe('#/rules/RENEW-1%2F2');
  });

  test('NAV-2 · a node opens at #/plans/<plan>/<node>', () => {
    expect(entityUrl({ kind: 'node', plan: 'build', node: 'F1' })).toBe('#/plans/build/F1');
  });

  test('NAV-2 · a commit opens at #/commits/<short SHA>, from its full SHA', () => {
    expect(entityUrl({ kind: 'commit', sha: FULL })).toBe('#/commits/3a092b0');
  });

  test('NAV-2 · a verdict opens at #/plans/<plan>/<node>/verdicts/<round>/<agent>', () => {
    expect(entityUrl({ kind: 'verdict', plan: 'build', node: 'F3', round: 'A2.3', agent: 'reviewer' })).toBe(
      '#/plans/build/F3/verdicts/A2.3/reviewer',
    );
  });

  test("NAV-2 · a finding round opens at #/plans/<plan>/<node>/findings/<round>", () => {
    expect(entityUrl({ kind: 'finding', plan: 'build', node: 'F1', round: 'D2' })).toBe('#/plans/build/F1/findings/D2');
  });

  test('NAV-2 · a session opens at #/sessions/<file basename, no .md>, from its docs/context path', () => {
    expect(entityUrl({ kind: 'session', file: 'docs/context/20261019-151542-f6-done-merged.md' })).toBe(
      '#/sessions/20261019-151542-f6-done-merged',
    );
  });
});
