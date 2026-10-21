// RULE-1 · Rule page. The rule's text and agreed interpretation (from requirements.md), its status codes, its tests by
// name, its commits in TDD order, its QA step and its sign-off. On the `rules` fixture trail (its README gives every
// fact below); parity on the design fixture against docs/ui/derived/U1/rule/.
import { expect, test } from '@playwright/test';
import {
  QA,
  RULE_TEXT,
  TESTS,
  auditEverywhere,
  compileRules,
  openOnFixture,
  openRule,
  region,
  route,
  rungCommits,
  rungOf,
  shaOf,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, rule, ruleLong } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRules();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

test.describe('the rule, from requirements.md', () => {
  test("RULE-1 · the rule page heads SELL-1 with its title, 'Policy reference must be unique'", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Policy reference must be unique');
  });

  test('RULE-1 · the rule page shows the agreed interpretation from requirements.md as rendered text, not Markdown', async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const text = region(page, RULE_TEXT);
    await expect(text).toContainText('The client supplies the reference. It is trimmed and upper-cased, then must match');
    await expect(text).toContainText('A duplicate returns 409');
    await expect(text.locator('code', { hasText: '^[A-Z0-9-]{3,20}$' }), 'the inline code is code').toHaveCount(1);
    const shown = await text.innerText();
    expect(shown, 'no Markdown bold marks').not.toContain('**');
    expect(shown, 'no Markdown code marks').not.toContain('`');
  });

  test("RULE-1 · the rule page shows SELL-1's status codes, 400 and 409, marked as the interpretation marks them", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const text = region(page, RULE_TEXT);
    await expect(text.locator('strong', { hasText: /^400$/ })).toHaveCount(1);
    await expect(text.locator('strong', { hasText: /^409$/ })).toHaveCount(1);
  });

  test("RULE-1 · the rule page gives SELL-1's feature, Sell, and its priority, MUST, from its requirements.md heading", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const text = region(page, RULE_TEXT);
    await expect(text).toContainText(/Sell\b/);
    await expect(text).toContainText('MUST');
  });
});

test.describe('its tests, by name', () => {
  test("RULE-1 · the rule page lists SELL-2's three tests by name, with 3 of 3 passing", async ({ page }) => {
    await openRule(page, fixture, 'SELL-2');
    const tests = region(page, TESTS);
    // rules/files/tests/web/e2e/F1/sell.spec.ts.fixture and sell-window.spec.ts.fixture: SELL-2's titles.
    for (const name of ['a start date of today answers 201', 'a start date of today + 60 answers 201', 'a start date of today + 61 answers 422']) {
      await expect(tests, `the test "${name}"`).toContainText(name);
    }
    await expect(tests).toContainText('3 of 3');
  });

  test("RULE-1 · the rule page lists SELL-1's tests by name and no other rule's", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const tests = region(page, TESTS);
    await expect(tests).toContainText('a sale with a new reference answers 201');
    await expect(tests).toContainText('a second sale with the same reference answers 409');
    await expect(tests).not.toContainText('a start date of today');
    await expect(tests).not.toContainText('an unknown reference answers 404');
  });
});

test.describe('its commits, in TDD order', () => {
  test("RULE-1 · the rule page lists SELL-1's commits in TDD order: red c2, stub c3, green c4, refactor c5", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    await expect.poll(() => rungCommits(page, fixture)).toEqual(['c2', 'c3', 'c4', 'c5']);
    const steps: [string, string][] = [['c2', 'Red'], ['c3', 'Stub'], ['c4', 'Green'], ['c5', 'Refactor']];
    for (const [id, step] of steps) await expect(rungOf(page, shaOf(fixture, id)).first(), `${id} is the ${step} step`).toContainText(step);
  });

  test("RULE-1 · each of SELL-1's commits is told in its own words, the subject the agent wrote", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    await expect(rungOf(page, shaOf(fixture, 'c2')).first()).toContainText('the acceptance suite');
    await expect(rungOf(page, shaOf(fixture, 'c4')).first()).toContainText('the sale');
    await expect(rungOf(page, shaOf(fixture, 'c5')).first()).toContainText('name the reference check');
  });
});

test.describe('its QA step and sign-off', () => {
  test("RULE-1 · the rule page shows SELL-1's QA step, docs/qa/build-F1.md#1, and David's sign-off on 2026-10-18", async ({ page }) => {
    await openRule(page, fixture, 'SELL-1');
    const qa = region(page, QA);
    await expect(qa).toContainText('docs/qa/build-F1.md#1');
    await expect(qa).toContainText('David');
    await expect(qa).toContainText('2026-10-18');
  });

  test('RULE-1 · the rule page shows GET-1, with no QA step and no sign-off in the trail, claiming neither', async ({ page }) => {
    await openRule(page, fixture, 'GET-1');
    const qa = region(page, QA);
    await expect(qa).toBeVisible();
    await expect(qa).not.toContainText('docs/qa/build-F');
    await expect(qa).not.toContainText('David');
    await expect(qa).not.toContainText('Accept');
  });
});

test.describe('reachable', () => {
  test('RULE-1 · reachable: a rule route answers with the rule page, its rule text region first', async ({ page }) => {
    await openOnFixture(page, fixture, route.rule('SELL-1'));
    await expect(page.getByRole('main').locator('[data-region]').first()).toHaveAttribute('data-region', RULE_TEXT);
  });
});

test.describe('axe', () => {
  test("RULE-1 · SELL-1's rule page on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    await openOnFixture(page, fixture, route.rule('SELL-1'));
    await auditEverywhere(page, route.rule('SELL-1'), async (p) => {
      await expect(p.getByRole('heading', { level: 1 })).toContainText('Policy reference must be unique');
    });
  });
});

test.describe('parity', () => {
  test("RULE-1 · parity: the rule page keeps its reference's regions in order, the unbuilt ones as not built yet", async ({ page }) => {
    await expectRegionsInOrder(page, rule);
  });

  test("RULE-1 · parity: the longest rule trail (COULD-2) keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, ruleLong);
  });

  test("RULE-1 · parity: the rule text region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, rule, RULE_TEXT);
  });

  test("RULE-1 · parity: the tests region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, rule, TESTS);
  });

  test("RULE-1 · parity: the QA step and sign-off region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, rule, QA);
  });

  test("RULE-1 · parity: the rule page's shell, primary nav, current item and title are its reference's", async ({ page }) => {
    await expectShell(page, rule);
  });

  test('RULE-1 · parity: the rule page takes every colour from a token, light and dark', async ({ page }) => {
    await expectTokensOnly(page, rule);
  });
});
