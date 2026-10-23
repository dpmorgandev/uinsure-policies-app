// DATA-1 · One compiled data file. `npm run trace` compiles the trail into a versioned trace.json at build time;
// the SPA reads only that file (and the chunks it names): no runtime reads of the repo, no server.
// On the `complete` fixture trail (tests/Uinsure.Policies.Web.Tests/fixtures/trails/complete/README.md).
import { expect, test } from '@playwright/test';
import { fixtureNode, recordRequests, route, serveTrace, snapshotOf } from './support/app';
import { activityLines, compile, compileFixture, replayTrail } from './support/trail';
import type { CompiledTrail } from './support/trail';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileFixture('complete');
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

test('DATA-1 · npm run trace compiles a trail into one versioned trace.json, and the activity chunk it names', () => {
  const trail = replayTrail('complete');
  try {
    const run = compile(trail.root);
    expect(run.status, run.output).toBe(0);
    expect(run.trace, 'trace.json is written to src/Uinsure.Policies.Web/public/').not.toBeNull();
    expect(run.trace?.schemaVersion).toBe('1.0.0');
    expect(run.trace?.plans?.map((p) => [p.id, p.title])).toEqual([['build', 'Fixture build']]);
    expect(run.trace?.nodes?.find((n) => n.plan === 'build' && n.id === 'F1')?.title).toBe('Sell');
    // complete/README.md: one activity record per commit, c0 to c4.
    expect(activityLines(run, 'build', 'F1').map((l) => l.command)).toEqual([
      'git commit -m "plan(build/F1): F1 pending → in_progress"',
      'git commit -m "test(SELL-1): red: the acceptance suite"',
      'git commit -m "feat(F1): stub the sale route"',
      'git commit -m "feat(SELL-1): green: the sale"',
      'git commit -m "docs(F1): QA script"',
    ]);
  } finally {
    trail.cleanup();
  }
});

test('DATA-1 · the app shows the trail it is served as trace.json, and fetches nothing from the repo or a server', async ({ page }) => {
  snapshotOf(fixture.compiled);
  await serveTrace(page, fixture.compiled.publicDir);
  const seen = recordRequests(page);
  await page.goto(route.about);
  await expect(page.getByRole('main')).toContainText('Fixture build');
  await page.goto(route.activity(fixtureNode.plan, fixtureNode.node));
  // U10 diagnosis: the fixture still has 5 activity lines (complete/README.md, c0 to c4). The page draws them twice: in
  // the event table and in the AgentLanes kit table U4's lanes added, so main held 10 rows. The count reads the table.
  await expect(page.getByRole('main').locator('[data-region="event-table-text-equivalent"] tbody tr')).toHaveCount(5);

  const origin = new URL(page.url()).origin;
  expect(seen.filter((u) => u.origin !== origin).map(String), 'no request leaves the app').toEqual([]);
  const data = [...new Set(seen.filter((u) => u.pathname.endsWith('.json')).map((u) => u.pathname))].sort();
  expect(data).toContain('/trace.json');
  expect(data).toContain('/trace/build/F1/activity.json');
  expect(
    data.filter((p) => !/^\/(trace\.json|trace\/[^/]+\/[^/]+\/(activity|diffs)\.json)$/.test(p)),
    'the only data read is trace.json and its chunks',
  ).toEqual([]);
  expect(
    seen.filter((u) => /^\/(docs|src|tests|api|\.git|\.claude|@fs)(\/|$)/.test(u.pathname)).map(String),
    'nothing is read from the repo or an API',
  ).toEqual([]);
});
