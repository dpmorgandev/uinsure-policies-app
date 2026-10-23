// DATA-3 · Compiled-at stamp. trace.json records the commit SHA and UTC time it was compiled from; every screen
// shows it, so the reader knows the snapshot is not live. On the `complete` fixture trail; parity on the design
// fixture against docs/ui/derived/U0b/.
import { expect, test } from '@playwright/test';
import { builtRoutes, expectFooterStamp, route, serveTrace, snapshotOf } from './support/app';
import { about, expectRegionComponents, overview } from './support/parity';
import { compile, compileFixture, replayTrail } from './support/trail';
import type { CompiledTrail } from './support/trail';

const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileFixture('complete');
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

test.describe('the compiler stamps trace.json', () => {
  test('DATA-3 · trace.json records the ref, the full SHA and the UTC time it was compiled from', () => {
    const trail = replayTrail('complete');
    try {
      const run = compile(trail.root);
      expect(run.status, run.output).toBe(0);
      expect(run.trace?.compiledAt?.ref).toBe('HEAD');
      expect(run.trace?.compiledAt?.sha).toBe(trail.head);
      expect(run.trace?.compiledAt?.utc).toMatch(UTC);
    } finally {
      trail.cleanup();
    }
  });

  test("DATA-3 · compiling at an earlier ref stamps that ref's commit, not HEAD's", () => {
    const trail = replayTrail('complete');
    try {
      const run = compile(trail.root, { ref: 'HEAD~1' });
      expect(run.status, run.output).toBe(0);
      expect(run.trace?.compiledAt?.ref).toBe('HEAD~1');
      // HEAD is the committed trail; HEAD~1 is c4, the QA script (complete/README.md).
      expect(run.trace?.compiledAt?.sha).toBe(trail.shas['c4']);
      expect(run.trace?.compiledAt?.sha).not.toBe(trail.head);
    } finally {
      trail.cleanup();
    }
  });
});

test.describe('every screen shows the stamp', () => {
  for (const r of builtRoutes) {
    test(`DATA-3 · the ${r.name}'s footer stamps the snapshot's SHA, linked to its commit, and its UTC time`, async ({ page }) => {
      const snap = snapshotOf(fixture.compiled);
      expect(snap.sha, 'the stamp is the fixture repo HEAD').toBe(fixture.trail.head);
      await serveTrace(page, fixture.compiled.publicDir);
      await page.goto(r.path);
      await expectFooterStamp(page, snap);
    });
  }

  test("DATA-3 · the overview's snapshot region states the ref, the short SHA and the UTC time", async ({ page }) => {
    const snap = snapshotOf(fixture.compiled);
    await serveTrace(page, fixture.compiled.publicDir);
    await page.goto(route.overview);
    const region = page.getByRole('main').locator('[data-req~="DATA-3"]');
    await expect(region).toContainText(snap.ref);
    await expect(region).toContainText(snap.short);
    await expect(region).toContainText(snap.utc);
  });

  test("DATA-3 · the about page's stamp region states the ref, the full SHA and the UTC time", async ({ page }) => {
    const snap = snapshotOf(fixture.compiled);
    await serveTrace(page, fixture.compiled.publicDir);
    await page.goto(route.about);
    const region = page.getByRole('main').locator('[data-req~="DATA-3"]');
    await expect(region).toContainText(snap.ref);
    await expect(region).toContainText(snap.sha);
    await expect(region).toContainText(snap.utc);
  });
});

test.describe('parity', () => {
  test("DATA-3 · parity: the overview's compiled-at stamp region is its reference's", async ({ page }) => {
    await expectRegionComponents(page, overview, 'compiled-at-stamp');
  });

  test("DATA-3 · parity: the about page's compiled-at stamp region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, about, 'compiled-at-stamp-the-commit-sha-and-utc-time-trace-json-was-compiled-from');
  });
});
