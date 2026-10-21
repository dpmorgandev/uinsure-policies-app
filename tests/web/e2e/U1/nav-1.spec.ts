// NAV-1 · Overview answers the question first. The landing screen states, from the data: rules built / total, tests
// passing, nodes done, attempts and FAILs taken, human decisions recorded; each figure links to its source. And, from
// docs/trace/ui/DS/g4-defects.md section 3 (U1's acceptance): the overview draws the search and the theme toggle once.
// On the `rules` fixture trail (its README lists every figure below); parity on the design fixture against
// docs/ui/derived/U1/overview/.
import { expect, test } from '@playwright/test';
import { REPO, auditEverywhere, compileRules, openOnFixture, region, route } from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, overview } from './support/parity';

const HEADLINE = 'headline-answer';
const FIGURES = 'receipt-figures-rules-built-total-tests-passing-nodes-done-attempts-and-fails-human-decisions';
const GITHUB_DOC = (path: string): RegExp =>
  new RegExp(`^${REPO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(blob|tree)/[^/]+/${path}`);

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRules();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

test.describe('the question first', () => {
  test('NAV-1 · the overview opens on the question, before any other region', async ({ page }) => {
    await openOnFixture(page, fixture, route.overview);
    const main = page.getByRole('main');
    await expect(main.locator('[data-region]').first(), 'the headline answer is the first region').toHaveAttribute('data-region', HEADLINE);
    const headline = region(page, HEADLINE);
    await expect(headline.getByRole('heading', { level: 1 })).toHaveText('Overview');
    await expect(headline).toContainText('Was this really test-driven, and was the AI really checked?');
    // The answer is the fixture's, not the design fixture's (29 rules, 51 verdicts).
    await expect(headline).toContainText('3 of 5');
  });

  test("NAV-1 · the answer states, from the fixture, that 3 of 5 rules list a red commit and 1 of 4 verdicts was FAIL", async ({ page }) => {
    await openOnFixture(page, fixture, route.overview);
    const headline = region(page, HEADLINE);
    await expect(headline).toContainText(/3 of 5 rules/);
    await expect(headline).toContainText(/1 of 4\b[^.]*FAIL/);
    for (const foreign of ['29 of 29', '9 of 51', 'b394466']) await expect(headline, `"${foreign}" is not in the fixture`).not.toContainText(foreign);
  });
});

// rules/README.md, "Receipt figures", in NAV-1's own order.
const figures = [
  { name: 'rules built', value: '3 of 5', unit: /rules built/i, label: /docs\/trace\/requirements-matrix\.md/, href: GITHUB_DOC('docs/trace/requirements-matrix\\.md') },
  { name: 'tests passing', value: '2 of 5', unit: /test/i, label: /docs\/trace\/requirements-matrix\.md/, href: GITHUB_DOC('docs/trace/requirements-matrix\\.md') },
  { name: 'nodes done', value: '2 of 4', unit: /nodes done/i, label: /docs\/plans\/active\/build\.dag\.yaml/, href: GITHUB_DOC('docs/plans/active/build\\.dag\\.yaml') },
  { name: 'attempts taken', value: '1 of 2', unit: /attempt/i, label: /docs\/plans\/active\/build\.dag\.yaml/, href: GITHUB_DOC('docs/plans/active/build\\.dag\\.yaml') },
  { name: 'FAILs taken', value: '1 of 4', unit: /FAIL/, label: /docs\/trace\/build\/.*verdicts/, href: GITHUB_DOC('docs/trace/build') },
  { name: 'human decisions recorded', value: '2', unit: /human decisions/i, label: /docs\/trace\/build\/.*loop\.jsonl/, href: GITHUB_DOC('docs/trace/build') },
] as const;

test.describe('the receipt figures', () => {
  test('NAV-1 · the overview shows six receipt figures, in the order the rule names them', async ({ page }) => {
    await openOnFixture(page, fixture, route.overview);
    const shown = region(page, FIGURES).locator('figure');
    await expect(shown).toHaveCount(figures.length);
    for (const [i, f] of figures.entries()) await expect(shown.nth(i).locator('figcaption'), `figure ${i + 1} is ${f.name}`).toContainText(f.unit);
  });

  for (const [i, f] of figures.entries()) {
    test(`NAV-1 · receipt figure ${i + 1}, ${f.name}, reads ${f.value} from the fixture`, async ({ page }) => {
      await openOnFixture(page, fixture, route.overview);
      const figure = region(page, FIGURES).locator('figure').nth(i);
      await expect(figure.locator('figcaption'), `figure ${i + 1} is ${f.name}`).toContainText(f.unit);
      await expect(figure.locator('p').first()).toHaveText(f.value);
    });

    test(`NAV-1 · receipt figure ${i + 1}, ${f.name}, links to the source it was counted from`, async ({ page }) => {
      await openOnFixture(page, fixture, route.overview);
      const figure = region(page, FIGURES).locator('figure').nth(i);
      await expect(figure.locator('p').first(), 'the figure is the fixture count').toHaveText(f.value);
      const source = figure.locator('figcaption a');
      await expect(source).toHaveCount(1);
      await expect(source).toContainText(f.label);
      await expect(source).toHaveAttribute('href', f.href);
    });
  }
});

test.describe('the global controls', () => {
  test('NAV-1 · the overview draws the search and the theme toggle once, in the top bar', async ({ page }) => {
    await openOnFixture(page, fixture, route.overview);
    await expect(region(page, FIGURES).locator('figure').first().locator('p').first(), 'the overview shows the fixture').toHaveText('3 of 5');
    await expect(page.getByRole('search'), 'one search on the page').toHaveCount(1);
    await expect(page.getByRole('radiogroup', { name: 'Theme' }), 'one theme toggle on the page').toHaveCount(1);
    await expect(page.getByRole('banner').getByRole('search'), 'the search is the top bar one').toHaveCount(1);
    await expect(page.getByRole('banner').getByRole('radiogroup', { name: 'Theme' }), 'the toggle is the top bar one').toHaveCount(1);
  });
});

test.describe('axe', () => {
  test('NAV-1 · the overview on the fixture has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
    await openOnFixture(page, fixture, route.overview);
    await auditEverywhere(page, route.overview, async (p) => {
      await expect(region(p, FIGURES).locator('figure').first().locator('p').first()).toHaveText('3 of 5');
    });
  });
});

test.describe('parity', () => {
  test("NAV-1 · parity: the overview keeps its reference's regions in order, the unbuilt ones as not built yet", async ({ page }) => {
    await expectRegionsInOrder(page, overview);
  });

  test("NAV-1 · parity: the overview's headline answer region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, overview, HEADLINE);
  });

  test("NAV-1 · parity: the overview's receipt figures region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, overview, FIGURES);
  });

  test("NAV-1 · parity: the overview's shell, primary nav, current item and title are its reference's", async ({ page }) => {
    await expectShell(page, overview);
  });

  test('NAV-1 · parity: the overview takes every colour from a token, light and dark', async ({ page }) => {
    await expectTokensOnly(page, overview);
  });
});
