// TDD-1 · Walkthrough timeline. Every commit of the node in order, coloured by TDD step (scaffold, red, stub, green,
// refactor) and by Agent trailer, with the commit subject in the agent's words. U2's acceptance: the walkthrough
// lists the node's commits in order with their TDD steps, and heads the node shown. On U1's `rules` fixture trail
// (rules/README.md): F1's walkthrough is rows 1 to 9 (c1 to c9), F2's rows 1 to 3 (c10 to c12). Parity on the design
// fixture against docs/ui/derived/U2/walkthrough/.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  CHIP,
  REPO,
  SEQUENCE,
  auditEverywhere,
  commitHref,
  compileRules,
  heading,
  openHeaded,
  openOnFixture,
  region,
  route,
  shaOf,
  short,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, gitOnlyWalkthrough, walkthrough } from './support/parity';

const F1_COMMITS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'];

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRules();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** One row of the walkthrough's table as the page shows it. */
interface Row {
  text: string;
  /** The row's first cell: its number in the walkthrough. */
  first: string;
  step: string | null;
  agent: string | null;
  links: { text: string; href: string }[];
  chips: { text: string; href: string }[];
}

async function rows(scope: Locator): Promise<Row[]> {
  const table = scope.locator('table').first();
  if ((await table.count()) === 0) return [];
  return table.locator('tbody tr').evaluateAll((trs, chip) =>
    trs.map((tr) => {
      const clean = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim();
      const link = (a: Element) => ({ text: clean(a.textContent), href: a.getAttribute('href') ?? '' });
      return {
        text: clean(tr.textContent),
        first: clean(tr.querySelector('th, td')?.textContent ?? ''),
        step: tr.querySelector('[data-step]')?.getAttribute('data-step') ?? null,
        agent: tr.querySelector('[data-agent]')?.getAttribute('data-agent') ?? null,
        links: Array.from(tr.querySelectorAll('a')).map(link),
        chips: Array.from(tr.querySelectorAll(chip)).map(link),
      };
    }),
  CHIP);
}

/** The fixture commit ids of the walkthrough's rows, in page order, by the short SHA each row shows. */
async function rowCommits(page: Page): Promise<string[]> {
  const commits = Object.entries(fixture.trail.shas);
  return (await rows(region(page, SEQUENCE))).map((row) => commits.find(([, sha]) => row.text.includes(short(sha)))?.[0] ?? '?');
}

/** The walkthrough row that shows a fixture commit. */
async function rowOf(page: Page, id: string): Promise<Row | undefined> {
  const sha = short(shaOf(fixture, id));
  await expect.poll(() => rowCommits(page), `the walkthrough shows ${id}`).toContain(id);
  return (await rows(region(page, SEQUENCE))).find((row) => row.text.includes(sha));
}

async function openWalkthrough(page: Page, node: string): Promise<void> {
  await openHeaded(page, fixture, route.walkthrough('build', node), node);
}

test.describe('the commits in order', () => {
  test("TDD-1 · F1's walkthrough lists its nine commits in walkthrough order, c1 to c9", async ({ page }) => {
    await openWalkthrough(page, 'F1');
    await expect.poll(() => rowCommits(page)).toEqual(F1_COMMITS);
  });

  test("TDD-1 · F1's walkthrough numbers each row by its place in the walkthrough, #1 to #9", async ({ page }) => {
    await openWalkthrough(page, 'F1');
    await expect.poll(() => rowCommits(page)).toEqual(F1_COMMITS);
    const numbers = (await rows(region(page, SEQUENCE))).map((row) => row.first);
    expect(numbers).toEqual(F1_COMMITS.map((_, i) => expect.stringMatching(new RegExp(`^#?${i + 1}$`))));
  });

  test("TDD-1 · F2's walkthrough lists F2's own three commits, c10 to c12, and none of F1's, under F2's heading", async ({ page }) => {
    await openWalkthrough(page, 'F2');
    await expect(heading(page)).toContainText('F2 Retrieve');
    await expect.poll(() => rowCommits(page)).toEqual(['c10', 'c11', 'c12']);
  });
});

test.describe('TDD steps, agents and subjects', () => {
  test("TDD-1 · each of F1's TDD commits carries its step: c2 red, c3 stub, c4 green, c5 refactor, c7 red, c8 green", async ({ page }) => {
    await openWalkthrough(page, 'F1');
    const want: [string, string][] = [
      ['c2', 'red'],
      ['c3', 'stub'],
      ['c4', 'green'],
      ['c5', 'refactor'],
      ['c7', 'red'],
      ['c8', 'green'],
    ];
    for (const [id, step] of want) {
      const row = await rowOf(page, id);
      expect(row?.step, `${id} is drawn as ${step}`).toBe(step);
      expect(row?.text, `${id} says ${step} in words`).toContain(step);
    }
  });

  test("TDD-1 · each commit carries its Agent trailer: c1 and c6 main, c2, c7 and c9 tester, c3, c4, c5 and c8 builder", async ({ page }) => {
    await openWalkthrough(page, 'F1');
    const want: Record<string, string> = { c1: 'main', c2: 'tester', c3: 'builder', c4: 'builder', c5: 'builder', c6: 'main', c7: 'tester', c8: 'builder', c9: 'tester' };
    for (const [id, agent] of Object.entries(want)) {
      const row = await rowOf(page, id);
      expect(row?.agent, `${id} is drawn as ${agent}'s`).toBe(agent);
      expect(row?.text, `${id} names ${agent}`).toContain(agent);
    }
  });

  test("TDD-1 · each row gives the commit's subject in the agent's words", async ({ page }) => {
    await openWalkthrough(page, 'F1');
    const want: Record<string, string> = {
      c2: 'the acceptance suite',
      c4: 'the sale',
      c5: 'name the reference check',
      c7: 'a start date 61 days ahead answers 422',
      c8: 'bound the start date at today + 60',
    };
    for (const [id, subject] of Object.entries(want)) expect((await rowOf(page, id))?.text, id).toContain(subject);
  });

  test("TDD-1 · each row's rules are chips opening each rule: c2 SELL-1 and SELL-2, c5 SELL-1 alone", async ({ page }) => {
    await openWalkthrough(page, 'F1');
    const c2 = await rowOf(page, 'c2');
    expect(c2?.chips.map((c) => c.text)).toEqual(['SELL-1', 'SELL-2']);
    for (const chip of c2?.chips ?? []) expect(chip.href, chip.text).toMatch(new RegExp(`#/rules/${chip.text}$`));
    expect((await rowOf(page, 'c5'))?.chips.map((c) => c.text)).toEqual(['SELL-1']);
  });

  test("TDD-1 · each row's SHA links to that commit on GitHub", async ({ page }) => {
    await openWalkthrough(page, 'F1');
    for (const id of F1_COMMITS) {
      const sha = shaOf(fixture, id);
      const row = await rowOf(page, id);
      const link = row?.links.find((l) => l.text.includes(short(sha)));
      expect(link?.href, `${id} on GitHub`).toMatch(commitHref(REPO, sha));
    }
  });
});

test.describe('axe', () => {
  test("TDD-1 · F1's walkthrough on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    const path = route.walkthrough('build', 'F1');
    await openOnFixture(page, fixture, path);
    await auditEverywhere(page, path, async (p) => {
      await expect(region(p, SEQUENCE)).toContainText(short(shaOf(fixture, 'c9')));
    });
  });
});

test.describe('parity', () => {
  test("TDD-1 · parity: the walkthrough keeps its reference's region, commit sequence", async ({ page }) => {
    await expectRegionsInOrder(page, walkthrough);
  });

  test("TDD-1 · parity: the walkthrough's commit sequence carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, walkthrough, SEQUENCE);
  });

  test("TDD-1 · parity: the walkthrough's shell, header, banner, tabs and title are its reference's", async ({ page }) => {
    await expectShell(page, walkthrough, true);
  });

  test("TDD-1 · parity: the git-only walkthrough (F0a) carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, gitOnlyWalkthrough, SEQUENCE);
  });

  test("TDD-1 · parity: the git-only walkthrough's shell, header, banner, tabs and title are its reference's", async ({ page }) => {
    await expectShell(page, gitOnlyWalkthrough, true);
  });

  test('TDD-1 · parity: the walkthrough takes every colour from a token', async ({ page }) => {
    await expectTokensOnly(page, walkthrough);
  });
});
