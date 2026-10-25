// bug-002 N4 · DATA-4 · the matrix's Step 3, the test-count scope note (inv-009 #8, I6; David: build the note). The
// matrix counts a rule's tests at the node that built it, while the rule page lists every test traited with it, so
// the two figures differ (the design's SELL-7: 10 at F1 against 15 traited). Matrix.tsx draws the step as the kit's
// "not built yet" placeholder, although trace.json holds every figure the note needs (rules[].matrix.node and
// rules[].matrix.tests).
// On the `rules` fixture trail (tests/Uinsure.Policies.Web.Tests/fixtures/trails/rules/README.md): SELL-1 2/2 and SELL-2 3/3, both at F1.
import { expect, test } from '@playwright/test';
import { compileRules, matrixRuleIds, openOnFixture, region, route } from '../U1/support/app';
import type { CompiledTrail } from '../U1/support/app';

const SCOPE_NOTE = 'test-count-scope-note-counts-are-per-node-sell-7-10-at-f1-vs-15-traited';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRules();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

test("DATA-4 · the matrix's Step 3 draws the test-count scope note from trace.json's per-node counts, with no not-built-yet marker", async ({ page }) => {
  await openOnFixture(page, fixture, route.matrix);
  await expect.poll(() => matrixRuleIds(page), { message: 'setup: the matrix shows the fixture rules' }).toContain('SELL-1');
  const note = region(page, SCOPE_NOTE);
  await expect(note, 'setup: the matrix draws its Step 3').toHaveCount(1);
  const body = note.locator('.s-body');
  await expect(body, 'the note is not the kit\'s not-built-yet placeholder').not.toContainText(/not built yet/i);
  await expect(body.locator('[class*="kit-not-built-yet"]'), 'no not-built-yet marker in the note').toHaveCount(0);
  await expect(body, 'the note names the node the counts were taken at').toContainText(/\bF1\b/);
  await expect(body, "the note gives a count from the matrix's per-node figures").toContainText(/\b[23]\/[23]\b|\b[23] (of|tests?)\b/);
});
