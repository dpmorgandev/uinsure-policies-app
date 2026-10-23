// A11Y-1 · WCAG 2.2 AA. Keyboard reachable, visible focus, contrast in both themes, status never by colour alone,
// checked with axe on every route the node builds, light and dark, at 1440 and 390. On the `complete` fixture
// trail: each audit runs on the page showing the fixture's own data, since an audit of canned content proves
// nothing about the screen. Parity on the design fixture against docs/ui/derived/U0b/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  axeViolations,
  backgroundToken,
  builtRoutes,
  expectFooterStamp,
  fixtureNode,
  route,
  serveTrace,
  setTheme,
  snapshotOf,
  themes,
  tokenBackground,
  viewports,
} from './support/app';
import type { Snapshot } from './support/app';
import { newest, screenIds, screenPaths } from './support/built';
import { about, activity, expectRegionComponents, gitOnly } from './support/parity';
import { compileFixture } from './support/trail';
import type { CompiledTrail } from './support/trail';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileFixture('complete');
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

const widths = [1440, 390] as const;

/** Opens `path` fresh in each theme and width, waits for `ready`, and gathers axe's violations for each. */
async function auditEverywhere(page: Page, path: string, ready: (page: Page) => Promise<void>): Promise<void> {
  for (const theme of themes) {
    for (const width of widths) {
      await setTheme(page, theme);
      await page.setViewportSize(viewports[width]);
      await page.goto('about:blank');
      await page.goto(path);
      await ready(page);
      expect(await backgroundToken(page), `the ${theme} theme's tokens are in force at ${width}`).toBe(tokenBackground[theme]);
      expect.soft(await axeViolations(page), `axe, ${theme} at ${width}`).toEqual([]);
    }
  }
}

const showsFixture = (snap: Snapshot) => (page: Page) => expectFooterStamp(page, snap);

test.describe('axe', () => {
  for (const r of builtRoutes) {
    test(`A11Y-1 · the ${r.name} has no axe violation, light and dark, at 1440 and 390`, async ({ page }) => {
      const snap = snapshotOf(fixture.compiled);
      await serveTrace(page, fixture.compiled.publicDir);
      await auditEverywhere(page, r.path, showsFixture(snap));
    });
  }

  test("A11Y-1 · the page shown when trace.json can't be read has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    await serveTrace(page, null);
    await auditEverywhere(page, route.overview, async (p) => {
      await expect(p.getByRole('main').locator('[data-status="fail"]').first()).toBeVisible();
    });
  });

  // U10: re-pointed. U4 built the last unbuilt screens, so the newest derived reference lists none and this test had no
  // page to audit. The page a reader meets at a route the app has no screen for is now the not-found page.
  test("A11Y-1 · the not-found page, shown at a route with no screen, has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    await serveTrace(page, fixture.compiled.publicDir);
    expect(screenIds, 'not-found is a screen in docs/ui/screens.json').toContain('not-found');
    expect(newest.notBuiltScreens, `${newest.node}'s derived reference lists no unbuilt screen`).toEqual([]);
    const path = screenPaths(fixture.trail.shas['c1'] ?? 'c1')['not-found'] ?? '';
    await auditEverywhere(page, path, async (p) => {
      await expect(p.getByRole('heading', { level: 1 })).toHaveText('Nothing at /no-such-page');
    });
  });
});

test.describe('the keyboard', () => {
  test('A11Y-1 · the keyboard reaches the skip link first, and it takes focus to the content', async ({ page }) => {
    const snap = snapshotOf(fixture.compiled);
    await serveTrace(page, fixture.compiled.publicDir);
    await page.goto(route.overview);
    await expectFooterStamp(page, snap);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to the content');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test("A11Y-1 · on the page shown when trace.json can't be read, the keyboard reaches the skip link first, it takes focus to the content, and the page keeps its footer landmark", async ({ page }) => {
    await serveTrace(page, null);
    await page.goto(route.overview);
    await expect(page.getByRole('main').locator('[data-status="fail"]').first(), 'the read-failure notice is shown').toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus'), 'the first Tab lands on the skip link').toHaveText('Skip to the content');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.getByRole('contentinfo'), 'the page has one footer landmark').toHaveCount(1);
  });

  test('A11Y-1 · every stop on the keyboard path shows a visible focus indicator', async ({ page }) => {
    const snap = snapshotOf(fixture.compiled);
    await serveTrace(page, fixture.compiled.publicDir);
    await page.goto(route.overview);
    await expectFooterStamp(page, snap);
    const unmarked: string[] = [];
    const stops: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      // The focused element draws the ring, or the element beside it does (a radio's visible face follows it).
      const stop = await page.evaluate(() => {
        const el = document.activeElement;
        if (el === null || el === document.body) return null;
        const ringed = (node: Element | null): boolean => {
          if (node === null) return false;
          const s = getComputedStyle(node);
          return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none';
        };
        const name = `${el.tagName.toLowerCase()} "${(el.textContent ?? el.getAttribute('aria-label') ?? '').trim().slice(0, 40)}"`;
        return { name, ringed: ringed(el) || ringed(el.nextElementSibling) };
      });
      if (stop === null) continue;
      stops.push(stop.name);
      if (!stop.ringed) unmarked.push(stop.name);
    }
    expect(stops.length, 'the keyboard path has stops').toBeGreaterThan(3);
    expect(unmarked, 'every stop shows where focus is').toEqual([]);
  });

  test('A11Y-1 · reachable: each built nav entry opens its screen, marked current by aria-current, not colour alone', async ({ page }) => {
    await serveTrace(page, fixture.compiled.publicDir);
    await page.goto(route.overview);
    const nav = page.getByRole('navigation', { name: /^Primary/ });
    await expect(nav.getByRole('link', { name: 'How to read this' }), 'the primary nav links the about page').toBeVisible();
    await nav.getByRole('link', { name: 'How to read this' }).click();
    await expect(page).toHaveURL(/#\/about$/);
    await expect(nav.getByRole('link', { name: 'How to read this' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current', 'page');
    await nav.getByRole('link', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/#\/$/);
    await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'How to read this' })).not.toHaveAttribute('aria-current', 'page');
  });
});

test.describe('a text equivalent', () => {
  test('A11Y-1 · the activity page lists every activity line of the node as a row of text', async ({ page }) => {
    const snap = snapshotOf(fixture.compiled);
    await serveTrace(page, fixture.compiled.publicDir);
    await page.goto(route.activity(fixtureNode.plan, fixtureNode.node));
    await expectFooterStamp(page, snap);
    const table = page.getByRole('main').locator('[data-req~="A11Y-1"] table');
    await expect(table.locator('caption')).toContainText('build/F1');
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(5);
    // The header words as the DOM holds them: the kit's table uppercases its headers in CSS, which innerText reports.
    const headers = (await table.locator('thead th').allTextContents()).map((h) => h.trim());
    const column = (name: string): number => {
      const i = headers.findIndex((h) => h.startsWith(name));
      expect(i, `the table has a "${name}" column`).toBeGreaterThanOrEqual(0);
      return i;
    };
    const short = (id: string): string => (fixture.trail.shas[id] ?? id).slice(0, 7);
    // complete/README.md and its activity.jsonl: one line per commit, c0 to c4, every one a Bash git commit.
    const expected = [
      { agent: 'main', command: 'git commit -m "plan(build/F1): F1 pending → in_progress"', commit: short('c0'), tdd: 'none' },
      { agent: 'tester', command: 'git commit -m "test(SELL-1): red: the acceptance suite"', commit: short('c1'), tdd: 'red' },
      { agent: 'builder', command: 'git commit -m "feat(F1): stub the sale route"', commit: short('c2'), tdd: 'stub' },
      { agent: 'builder', command: 'git commit -m "feat(SELL-1): green: the sale"', commit: short('c3'), tdd: 'green' },
      { agent: 'tester', command: 'git commit -m "docs(F1): QA script"', commit: short('c4'), tdd: 'none' },
    ];
    for (const [i, line] of expected.entries()) {
      const cells = rows.nth(i).locator('th, td');
      await expect(cells.nth(column('Line')), `row ${i + 1}`).toHaveText(String(i + 1));
      await expect(cells.nth(column('Agent')), `row ${i + 1}`).toHaveText(line.agent);
      await expect(cells.nth(column('Tool')), `row ${i + 1}`).toHaveText('Bash');
      await expect(cells.nth(column('File or command')), `row ${i + 1}`).toHaveText(line.command);
      await expect(cells.nth(column('Commit')), `row ${i + 1}`).toContainText(line.commit);
      await expect(cells.nth(column('TDD')), `row ${i + 1}`).toHaveText(line.tdd);
    }
  });
});

test.describe('parity', () => {
  test("A11Y-1 · parity: the about page's glossary and status legend carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, about, 'glossary-and-status-legend');
  });

  test("A11Y-1 · parity: the activity page's event table carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, activity, 'event-table-text-equivalent');
  });

  test("A11Y-1 · parity: a git-only node's activity page keeps the event table, empty, as its reference", async ({ page }) => {
    await expectRegionComponents(page, gitOnly, 'event-table-text-equivalent');
  });
});
