// DATA-2 · Provenance labels survive. Every item keeps its label from docs/trace/README.md: generated (a hook or
// render-trace.mjs wrote it), recorded (an agent's judgement stored verbatim) or written (by David or the main
// session), shown wherever the item appears. U3's screens: the about page's provenance labels, the verdict (recorded:
// verdicts/<round>-<agent>.json), the finding round (recorded: findings/<round>.md) and the compiled-at stamp beside
// it (generated). On the `retry-ladder` fixture trail (retry-ladder/README.md); parity on the design fixture against
// docs/ui/derived/U3/about/.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  FINDINGS,
  PROVENANCE,
  RAW_JSON,
  REPO,
  SUMMARY,
  auditEverywhere,
  compileRetry,
  openOnFixture,
  openRegion,
  region,
  route,
  snapshotOf,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { about, expectRegionComponents, expectRegionsInOrder } from './support/parity';

/** Each label's meaning, as docs/trace/README.md gives it and the kit's provenance-label words it. */
const MEANING = {
  generated: 'a hook or render-trace.mjs wrote it, never an agent producing the code',
  recorded: "a hook stored an agent's judgement verbatim; the agent can't alter it afterwards",
  written: 'by David or the main session',
} as const;

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRetry();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** A provenance label of one kind in `scope`. */
function label(scope: Locator, kind: keyof typeof MEANING): Locator {
  return scope.locator(`[data-provenance="${kind}"]`);
}

/** Opens the about page and waits until its provenance region names the fixture's snapshot. */
async function openAbout(page: Page): Promise<Locator> {
  const labels = await openRegion(page, fixture, route.about, PROVENANCE);
  await expect(labels, "the region names the fixture's snapshot").toContainText(snapshotOf(fixture.compiled).short);
  return labels;
}

test.describe('the about page', () => {
  test("DATA-2 · the about page labels the fixture snapshot's compiled-at stamp generated", async ({ page }) => {
    const labels = await openAbout(page);
    await expect(label(labels, 'generated').first()).toBeVisible();
  });

  test('DATA-2 · the about page shows the three labels, generated, recorded and written, each with its meaning', async ({ page }) => {
    const labels = await openAbout(page);
    for (const kind of ['generated', 'recorded', 'written'] as const) {
      const shown = label(labels, kind).filter({ hasText: MEANING[kind] });
      await expect(shown.first(), `${kind}, with its meaning`).toBeVisible();
      await expect(shown.first()).toContainText(kind);
    }
  });
});

test.describe('the verdict', () => {
  test('DATA-2 · the verdict summary labels the A2 reviewer verdict recorded, with its meaning', async ({ page }) => {
    const summary = await openRegion(page, fixture, route.verdict('build', 'F1', 'A2', 'reviewer'), SUMMARY);
    await expect(summary, "the summary is the fixture's build/F1").toContainText('build/F1');
    await expect(label(summary, 'recorded').first()).toContainText(MEANING.recorded);
  });

  test("DATA-2 · the raw JSON is labelled recorded and names the verdict file it was read from, at the snapshot's SHA", async ({ page }) => {
    await openOnFixture(page, fixture, route.verdict('build', 'F1', 'A2', 'reviewer'));
    const raw = region(page, RAW_JSON);
    const file = 'docs/trace/build/F1/verdicts/A2-reviewer.json';
    await expect(raw.locator(`a[href="${REPO}/blob/${snapshotOf(fixture.compiled).sha}/${file}"]`)).toContainText(file);
    await expect(label(raw, 'recorded').first()).toContainText(MEANING.recorded);
    await expect(label(raw, 'generated'), 'a recorded verdict is not labelled generated').toHaveCount(0);
  });
});

test.describe('the finding round', () => {
  test('DATA-2 · the finding round labels its findings recorded, naming the findings file they were read from', async ({ page }) => {
    const findings = await openRegion(page, fixture, route.findings('build', 'F1', 'A1'), FINDINGS);
    await expect(findings.locator('a[href$="/docs/trace/build/F1/findings/A1.md"]').first()).toContainText('docs/trace/build/F1/findings/A1.md');
    await expect(label(findings, 'recorded').first()).toContainText(MEANING.recorded);
  });

  test("DATA-2 · the finding page labels the snapshot's compiled-at stamp generated", async ({ page }) => {
    const findings = await openRegion(page, fixture, route.findings('build', 'F1', 'A1'), FINDINGS);
    await expect(findings).toContainText(snapshotOf(fixture.compiled).short);
    await expect(label(findings, 'generated').first()).toContainText('generated');
  });
});

test.describe('axe', () => {
  test('DATA-2 · the about page on the fixture has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
    await openOnFixture(page, fixture, route.about);
    const short = snapshotOf(fixture.compiled).short;
    await auditEverywhere(page, route.about, async (p) => {
      await expect(region(p, PROVENANCE)).toContainText(short);
    });
  });
});

test.describe('parity', () => {
  test("DATA-2 · parity: the about page keeps its U3 reference's regions in order, the provenance labels built", async ({ page }) => {
    await expectRegionsInOrder(page, about);
  });

  test("DATA-2 · parity: the about page's provenance labels region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, about, PROVENANCE);
  });
});
