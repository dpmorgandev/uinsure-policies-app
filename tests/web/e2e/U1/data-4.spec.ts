// DATA-4 · Incomplete is never clean. A node whose README says TRAIL INCOMPLETE shows the reasons verbatim; a rule
// with no node or no tests shows `not built yet`; F0a shows `OK (git-only, F0a)`. And, from
// docs/trace/ui/DS/g4-defects.md section 3 (U1's acceptance): every rule chip opens its own rule, and an incomplete
// node's reasons are rendered text, not raw Markdown split across list items. On the `rules` fixture trail
// (rules/README.md: F0a git-only, F1 OK, F2 TRAIL INCOMPLETE with five reasons, F3 no trail; CANCEL-1 on F3 with no
// tests, CANCEL-2 on no node). Parity on the design fixture against docs/ui/derived/U1/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  CHIP,
  PLACEHOLDER,
  auditEverywhere,
  banners,
  compileRules,
  matrixRuleIds,
  openOnFixture,
  openRule,
  readMatrix,
  region,
  route,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, gitOnlyNode, matrix, node, overview } from './support/parity';

const TRAIL = 'trail-completeness-trail-incomplete-reasons-verbatim-not-built-yet-and-f0a-as-git-only';
const SCOPE_NOTE = 'test-count-scope-note-counts-are-per-node-sell-7-10-at-f1-vs-15-traited';
const F2_REASONS = [
  'rule GET-1 has no red commit before its green commit',
  'rule GET-1 has no QA step',
  'gate.red is not ok',
  'gate.green is missing',
  'gate.integrate is missing',
];
const F2_LABEL = `TRAIL INCOMPLETE: ${F2_REASONS.join('; ')}`;

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRules();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** Opens a node page on the fixture and waits until its heading names the node. */
async function openNode(page: Page, id: string): Promise<void> {
  await openOnFixture(page, fixture, route.node('build', id));
  await expect(page.getByRole('heading', { level: 1 }), `the page heads node ${id}`).toContainText(id);
}

async function openOverviewTrail(page: Page) {
  await openOnFixture(page, fixture, route.overview);
  const trail = region(page, TRAIL);
  // A reason only the fixture's F2 has: the region is showing the fixture, not canned content.
  await expect(trail, "the overview's trail region shows the fixture's incomplete node").toContainText('gate.red is not ok');
  return trail;
}

test.describe('the overview: TRAIL INCOMPLETE, git-only and not built yet', () => {
  test("DATA-4 · the overview shows F2's TRAIL INCOMPLETE reasons verbatim, all five, in their order", async ({ page }) => {
    const trail = await openOverviewTrail(page);
    await expect(banners(trail).and(page.locator('[data-completeness="incomplete"]'))).toHaveCount(1);
    await expect(trail).toContainText('TRAIL INCOMPLETE');
    for (const reason of F2_REASONS) await expect(trail, reason).toContainText(reason);
    const text = (await trail.innerText()).replace(/\s+/g, ' ');
    const at = F2_REASONS.map((reason) => text.indexOf(reason));
    expect(at, 'the reasons in the order the README gives them').toEqual([...at].sort((a, b) => a - b));
  });

  test('DATA-4 · the overview never shows F2 as clean: the OK banner names F1, not F2', async ({ page }) => {
    const trail = await openOverviewTrail(page);
    const ok = banners(trail).and(page.locator('[data-completeness="ok"]'));
    await expect(ok.filter({ hasText: /\bF1\b/ }), 'F1 reads OK').toHaveCount(1);
    await expect(ok.filter({ hasText: /\bF2\b/ }), 'F2 does not read OK').toHaveCount(0);
  });

  test('DATA-4 · the overview shows F0a as OK (git-only, F0a)', async ({ page }) => {
    const trail = await openOverviewTrail(page);
    await expect(banners(trail).and(page.locator('[data-completeness="git-only"]'))).toContainText('OK (git-only, F0a)');
  });

  test("DATA-4 · the overview renders F0a's reasons as text, not raw Markdown: the bold is bold and no mark is left", async ({ page }) => {
    const trail = await openOverviewTrail(page);
    await expect(trail).toContainText('Hooks not yet live: witnessed by git and trailers only.');
    await expect(trail.locator('strong', { hasText: 'Hooks not yet live: witnessed by git and trailers only.' })).toHaveCount(1);
    const text = await trail.innerText();
    expect(text, 'no Markdown bold marks').not.toContain('**');
    expect(text, 'no Markdown code marks').not.toContain('`');
  });

  test("DATA-4 · the overview keeps F0a's wrapped sentence whole, not split across list items", async ({ page }) => {
    const trail = await openOverviewTrail(page);
    // base/docs/trace/build/F0a/README.md wraps this sentence over two lines.
    const holder = trail.locator('p, li').filter({ hasText: 'Every F0a commit is on main' }).last();
    await expect(holder).toContainText(
      'Every F0a commit is on main, and the activity hook records only on feature/* branches, so F0a has no activity, loop or verdict receipts.',
    );
  });

  test('DATA-4 · the overview says F3, with no trail yet, is not built yet', async ({ page }) => {
    const trail = await openOverviewTrail(page);
    const f3 = trail.locator('[data-kind="node"]').filter({ hasText: /\bF3\b/ });
    await expect(f3).toHaveCount(1);
    await expect(f3).toContainText('not built yet');
  });

  test('DATA-4 · the overview lists CANCEL-1 and CANCEL-2 as not built yet, each chip opening its own rule', async ({ page }) => {
    const trail = await openOverviewTrail(page);
    for (const id of ['CANCEL-1', 'CANCEL-2']) {
      const chip = trail.locator(CHIP).filter({ hasText: id });
      await expect(chip, `${id} has a chip`).toHaveCount(1);
      await expect(chip, `${id} reads not built yet`).toContainText('not built yet');
      await expect(chip, `${id}'s chip opens ${id}`).toHaveAttribute('href', new RegExp(`#/rules/${id}$`));
    }
  });

  test('DATA-4 · every rule chip on the overview opens its own rule', async ({ page }) => {
    await openOverviewTrail(page);
    const chips = page.getByRole('main').locator(CHIP);
    await expect(chips.filter({ hasText: 'CANCEL-1' }), "the overview's chips are the fixture's").toHaveCount(1);
    for (const chip of await chips.all()) {
      const id = ((await chip.textContent()) ?? '').trim().split(/\s/)[0] ?? '';
      expect(id, 'the chip names a rule').toMatch(/^[A-Z][A-Z0-9]*-\d/);
      await expect(chip, `${id}'s chip opens ${id}`).toHaveAttribute('href', new RegExp(`#/rules/${id.replace('/', '%2F')}$`));
    }
  });
});

test.describe('the node page: its completeness banner', () => {
  test("DATA-4 · F2's node page carries its TRAIL INCOMPLETE banner with the README's line verbatim", async ({ page }) => {
    await openNode(page, 'F2');
    const banner = banners(page.getByRole('main'));
    await expect(banner).toHaveCount(1);
    await expect(banner).toHaveAttribute('data-completeness', 'incomplete');
    await expect(banner).toContainText(F2_LABEL);
  });

  test("DATA-4 · F0a's node page reads OK (git-only, F0a)", async ({ page }) => {
    await openNode(page, 'F0a');
    const banner = banners(page.getByRole('main'));
    await expect(banner).toHaveAttribute('data-completeness', 'git-only');
    await expect(banner).toContainText('OK (git-only, F0a)');
  });

  test("DATA-4 · F0a's node page gives its reasons as rendered text, not raw Markdown", async ({ page }) => {
    await openNode(page, 'F0a');
    const answer = region(page, 'completeness-banner');
    await expect(answer).toContainText('Hooks not yet live: witnessed by git and trailers only.');
    // The fixture's own wording (the real F0a README also names bug/* branches): the reasons are read, not canned.
    await expect(answer).toContainText('the activity hook records only on feature/* branches, so F0a has no activity, loop or verdict receipts.');
    const text = await answer.innerText();
    expect(text, 'no Markdown bold marks').not.toContain('**');
    expect(text, 'no Markdown code marks').not.toContain('`');
  });

  test("DATA-4 · F1's node page reads OK, and only OK", async ({ page }) => {
    await openNode(page, 'F1');
    const banner = banners(page.getByRole('main'));
    await expect(banner).toHaveAttribute('data-completeness', 'ok');
    await expect(banner).not.toContainText('TRAIL INCOMPLETE');
  });
});

test.describe('rules with no node or no tests', () => {
  test('DATA-4 · the matrix shows CANCEL-1 (no tests) and CANCEL-2 (no node) as not built yet, and no other rule', async ({ page }) => {
    await openOnFixture(page, fixture, route.matrix);
    await expect.poll(() => matrixRuleIds(page)).toEqual(['SELL-1', 'SELL-2', 'GET-1', 'CANCEL-1', 'CANCEL-2']);
    const { rows } = await readMatrix(page);
    const notBuilt = rows.filter((r) => Object.values(r).some((cell) => cell.text.includes('not built yet')));
    expect(notBuilt.map((r) => (r['Rule']?.text ?? '').split(' ')[0])).toEqual(['CANCEL-1', 'CANCEL-2']);
  });

  test('DATA-4 · the matrix on the fixture shows no raw placeholder', async ({ page }) => {
    await openOnFixture(page, fixture, route.matrix);
    await expect.poll(() => matrixRuleIds(page)).toContain('CANCEL-2');
    expect(await page.locator('body').innerText()).not.toMatch(PLACEHOLDER);
  });

  test('DATA-4 · the rule page of CANCEL-1, on a node with no tests yet, says not built yet and links no commit', async ({ page }) => {
    await openRule(page, fixture, 'CANCEL-1');
    const main = page.getByRole('main');
    await expect(main).toContainText('not built yet');
    await expect(main.locator('a[href*="/commit/"]')).toHaveCount(0);
    await expect(main).toContainText('Cancel with a pro-rata refund');
  });

  test('DATA-4 · the rule page of CANCEL-2, which no node owns, says not built yet', async ({ page }) => {
    await openRule(page, fixture, 'CANCEL-2');
    const main = page.getByRole('main');
    await expect(main).toContainText('not built yet');
    await expect(main.locator('a[href*="/commit/"]')).toHaveCount(0);
    await expect(main).toContainText('No refund after a claim');
  });

  test("DATA-4 · a not-built rule's page shows no raw placeholder", async ({ page }) => {
    await openRule(page, fixture, 'CANCEL-2');
    expect(await page.locator('body').innerText()).not.toMatch(PLACEHOLDER);
  });
});

test.describe('axe', () => {
  test("DATA-4 · F2's incomplete node page on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    await openOnFixture(page, fixture, route.node('build', 'F2'));
    await auditEverywhere(page, route.node('build', 'F2'), async (p) => {
      await expect(banners(p.getByRole('main'))).toContainText(F2_LABEL);
    });
  });

  test("DATA-4 · CANCEL-1's not-built rule page on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    await openOnFixture(page, fixture, route.rule('CANCEL-1'));
    await auditEverywhere(page, route.rule('CANCEL-1'), async (p) => {
      await expect(p.getByRole('heading', { level: 1 })).toContainText('CANCEL-1');
    });
  });
});

test.describe('parity', () => {
  test("DATA-4 · parity: the overview's trail completeness region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, overview, TRAIL);
  });

  test("DATA-4 · parity: the matrix's test-count scope note region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, matrix, SCOPE_NOTE);
  });

  test("DATA-4 · parity: the node page keeps its reference's regions in order, all but the banner not built yet", async ({ page }) => {
    await expectRegionsInOrder(page, node);
  });

  test("DATA-4 · parity: the node page's completeness region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, node, 'completeness-banner');
  });

  test("DATA-4 · parity: the node page's shell, header, banner, tabs and title are its reference's", async ({ page }) => {
    await expectShell(page, node);
  });

  test("DATA-4 · parity: the git-only node page (F0a) keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, gitOnlyNode);
  });

  test("DATA-4 · parity: the git-only node page's shell, header, banner, tabs and title are its reference's", async ({ page }) => {
    await expectShell(page, gitOnlyNode);
  });
});
