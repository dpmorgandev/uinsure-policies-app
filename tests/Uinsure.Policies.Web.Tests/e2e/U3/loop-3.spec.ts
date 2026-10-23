// LOOP-3 · Verdicts. Each reviewer and security verdict rendered from its JSON: verdict, gate refs, head SHA, diff
// fingerprint, findings. Raw JSON one click away. On the `retry-ladder` fixture trail (retry-ladder/README.md):
// verdicts/A2-reviewer.json is a FAIL at head c6, base c0, with five gate refs, SELL-2 missing and findings R1 (P1,
// src/sell.txt:1) and R2 (P2, tests/web/e2e/F1/sell.spec.ts:4); A2 security, A3 reviewer and A3 security PASS. A P0
// finding on the `p0-reconciled` fixture (p0-reconciled/README.md), round A2's I1. Parity on the design fixture against
// docs/ui/derived/U3/verdict/.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  LADDER,
  RAW_JSON,
  REPO,
  SUMMARY,
  VERDICT_FINDINGS,
  auditEverywhere,
  blobHref,
  compileP0Reconciled,
  compileRetry,
  fact,
  openOnFixture,
  openRegion,
  region,
  route,
  shaOf,
  short,
  stepsAt,
  stepsOf,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, verdict, verdictLong } from './support/parity';

const A2_REVIEWER = route.verdict('build', 'F1', 'A2', 'reviewer');
const FINGERPRINT = '7c2e9a41d06b38f5e1a4c9d27b80f63e5a1d4c98';
const R1 = {
  what: 'A reference that differs from a sold one only in case is sold again, 201, so the reference is not unique.',
  why: 'SELL-2 says the reference is unique, and the agreed interpretation compares it as stored; no test sells a case-only pair, so the suite cannot see it.',
};
const R2 = {
  what: "The 409 test checks the status only; the problem body's rule is never read.",
  why: "The contract's 409 names the broken rule, and a canned body without it would pass this test.",
};

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRetry();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** Opens a verdict and waits until its summary names the fixture's node: the page is drawing the fixture. */
async function openSummary(page: Page, path = A2_REVIEWER): Promise<Locator> {
  const summary = await openRegion(page, fixture, path, SUMMARY);
  await expect(summary, "the summary is the fixture's build/F1").toContainText('build/F1');
  return summary;
}

/** The verdict card (the kit's verdict-card) in the summary. */
function card(summary: Locator): Locator {
  return summary.locator('article[data-verdict]');
}

/** A verdict finding in the findings region, by its id: the block that heads it. */
function finding(findings: Locator, id: string): Locator {
  return findings.locator('article').filter({ hasText: new RegExp(`^\\s*${id}\\b`) });
}

test.describe('the verdict, from its JSON', () => {
  test('LOOP-3 · the A2 reviewer verdict renders as a FAIL', async ({ page }) => {
    const verdictCard = card(await openSummary(page));
    await expect(verdictCard).toHaveCount(1);
    await expect(verdictCard).toHaveAttribute('data-verdict', 'FAIL');
    await expect(verdictCard.locator('[data-status="fail"]').first()).toHaveText('FAIL');
  });

  test('LOOP-3 · the verdict names its agent, its round A2 and its attempt 2', async ({ page }) => {
    const summary = await openSummary(page);
    await expect(fact(card(summary), 'Agent')).toContainText('reviewer');
    await expect(fact(card(summary), 'Round')).toHaveText('A2');
    await expect(fact(summary, 'Attempt')).toHaveText('2');
  });

  test('LOOP-3 · the verdict links its head SHA, c6, to the commit on GitHub', async ({ page }) => {
    const c6 = shaOf(fixture, 'c6');
    const head = fact(card(await openSummary(page)), 'Head');
    await expect(head.locator(`a[href="${REPO}/commit/${c6}"]`)).toHaveText(short(c6));
  });

  test('LOOP-3 · the verdict links its base SHA, c0, to the commit on GitHub', async ({ page }) => {
    const c0 = shaOf(fixture, 'c0');
    await expect((await openSummary(page)).locator(`a[href="${REPO}/commit/${c0}"]`).first()).toContainText(short(c0));
  });

  test('LOOP-3 · the verdict shows its diff fingerprint as the JSON holds it', async ({ page }) => {
    await expect(fact(await openSummary(page), 'Diff fingerprint')).toHaveText(FINGERPRINT);
  });

  test('LOOP-3 · the verdict shows SELL-1 covered and SELL-2 missing', async ({ page }) => {
    const verdictCard = card(await openSummary(page));
    await expect(fact(verdictCard, 'Rules covered')).toContainText('SELL-1');
    await expect(fact(verdictCard, 'Rules covered')).not.toContainText('SELL-2');
    await expect(fact(verdictCard, 'Rules missing')).toContainText('SELL-2');
    await expect(fact(verdictCard, 'Rules missing')).not.toContainText('SELL-1');
  });

  test('LOOP-3 · the verdict lists its five gate refs in recorded order, each SHA linked to its commit', async ({ page }) => {
    const refs = (await openSummary(page)).getByRole('list', { name: /gate ref/i });
    const items = refs.locator('xpath=./li');
    await expect(items).toHaveCount(5);
    const gates = await items.evaluateAll((lis) => lis.map((li) => (li.textContent ?? '').trim().split(/[\s@]/)[0]));
    expect(gates).toEqual(['gate.red', 'gate.stub', 'gate.finding-red', 'gate.stub', 'gate.green']);
    const hrefs = await items.evaluateAll((lis) => lis.map((li) => li.querySelector('a[href*="/commit/"]')?.getAttribute('href') ?? ''));
    expect(hrefs).toEqual(['c1', 'c2', 'c4', 'c5', 'c6'].map((id) => `${REPO}/commit/${shaOf(fixture, id)}`));
  });

  test("LOOP-3 · the verdict card lists each finding's id, severity, route and what, R1 then R2", async ({ page }) => {
    const list = card(await openSummary(page)).getByRole('list', { name: 'Findings of the reviewer verdict A2' });
    const items = list.locator('xpath=./li');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('R1');
    await expect(items.nth(0)).toContainText('P1');
    await expect(items.nth(0)).toContainText('tester');
    await expect(items.nth(0)).toContainText(R1.what);
    await expect(items.nth(1)).toContainText('R2');
    await expect(items.nth(1)).toContainText('P2');
    await expect(items.nth(1)).toContainText('builder');
    await expect(items.nth(1)).toContainText(R2.what);
  });
});

test.describe("the verdict's findings", () => {
  async function openFindings(page: Page): Promise<Locator> {
    await openSummary(page);
    return region(page, VERDICT_FINDINGS);
  }

  test('LOOP-3 · R1 shows its severity P1, its rule SELL-2, why it matters and who it is routed to', async ({ page }) => {
    const r1 = finding(await openFindings(page), 'R1');
    await expect(r1).toHaveCount(1);
    await expect(r1).toContainText('P1');
    await expect(r1).toContainText('SELL-2');
    await expect(r1).toContainText(R1.why);
    await expect(r1).toContainText('tester');
  });

  test("LOOP-3 · R1 links its file:line, src/sell.txt:1, to the file on GitHub at the verdict's head, c6", async ({ page }) => {
    const r1 = finding(await openFindings(page), 'R1');
    const link = r1.locator(`a[href="${blobHref(REPO, shaOf(fixture, 'c6'), 'src/sell.txt', 1)}"]`);
    await expect(link).toHaveText('src/sell.txt:1');
  });

  test('LOOP-3 · R2 shows its severity P2, its file:line at the head and who it is routed to', async ({ page }) => {
    const r2 = finding(await openFindings(page), 'R2');
    await expect(r2).toContainText('P2');
    await expect(r2).toContainText(R2.why);
    await expect(r2).toContainText('builder');
    await expect(r2.locator(`a[href="${blobHref(REPO, shaOf(fixture, 'c6'), 'tests/web/e2e/F1/sell.spec.ts', 4)}"]`)).toHaveText(
      'tests/web/e2e/F1/sell.spec.ts:4',
    );
  });
});

test.describe('raw JSON, one click away', () => {
  test("LOOP-3 · the raw JSON starts closed, and one click opens it on the verdict's own values", async ({ page }) => {
    await openSummary(page);
    const raw = region(page, RAW_JSON);
    const open = raw.getByRole('button', { name: /Raw JSON/ });
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await expect(raw.getByText(FINGERPRINT).first(), 'the JSON is behind the control').toBeHidden();
    await open.click();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    const json = raw.getByText(FINGERPRINT).first();
    await expect(json).toBeVisible();
    await expect(json).toContainText('"FAIL"');
    await expect(json).toContainText(shaOf(fixture, 'c6'));
    await expect(json).toContainText(R1.what);
    await expect(json).toContainText(R2.why);
  });
});

test.describe('the other verdicts', () => {
  test('LOOP-3 · the A3 reviewer verdict renders as a PASS at c9, with nothing missing and no findings', async ({ page }) => {
    const summary = await openSummary(page, route.verdict('build', 'F1', 'A3', 'reviewer'));
    const verdictCard = card(summary);
    await expect(verdictCard).toHaveAttribute('data-verdict', 'PASS');
    await expect(fact(verdictCard, 'Head')).toContainText(short(shaOf(fixture, 'c9')));
    await expect(fact(verdictCard, 'Rules covered')).toContainText('SELL-2');
    await expect(fact(verdictCard, 'Rules missing')).toHaveText(/none/i);
    await expect(verdictCard).toContainText('No findings.');
    await expect(region(page, VERDICT_FINDINGS).locator('article')).toHaveCount(0);
  });

  test('LOOP-3 · the A2 security verdict renders as a PASS with its own rules covered', async ({ page }) => {
    const summary = await openSummary(page, route.verdict('build', 'F1', 'A2', 'security'));
    const verdictCard = card(summary);
    await expect(verdictCard).toHaveAttribute('data-verdict', 'PASS');
    await expect(verdictCard).toContainText('security verdict A2');
    await expect(fact(verdictCard, 'Rules covered')).toContainText('API1:2023');
    await expect(fact(verdictCard, 'Rules covered')).toContainText('API3:2023');
  });

  test("LOOP-3 · the verdict's breadcrumb leads back to F1's node and its loop", async ({ page }) => {
    const crumbs = (await openSummary(page)).getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.locator('a[href$="#/plans/build/F1"]')).toHaveCount(1);
    await expect(crumbs.locator('a[href$="#/plans/build/F1/loop"]')).toHaveCount(1);
  });
});

// Round A2's I1: the verdict schema allows P0, P1 and P2, and the `p0-reconciled` fixture
// (tests/Uinsure.Policies.Web.Tests/fixtures/trails/p0-reconciled/README.md) records the A2 reviewer's R1 as P0. A severity is drawn as
// recorded, never fitted to another level, and P0 takes a tone at least as severe as P1's: the fail tone.
test.describe('a P0 finding, as recorded', () => {
  let p0: CompiledTrail;
  test.beforeAll(() => {
    p0 = compileP0Reconciled();
  });
  test.afterAll(() => {
    p0?.trail.cleanup();
  });

  /** Opens the P0 fixture's A2 reviewer verdict and waits until its findings region draws R1's own reason. */
  async function openP0Summary(page: Page): Promise<Locator> {
    const summary = await openRegion(page, p0, A2_REVIEWER, SUMMARY);
    await expect(summary, "the summary is the fixture's build/F1").toContainText('build/F1');
    await expect(region(page, VERDICT_FINDINGS), "the findings are the fixture's").toContainText(R1.why);
    return summary;
  }

  /** Each finding of a verdict card's findings list, as [id, its severity tag's text, the tag's tone]. */
  async function cardSeverities(scope: Locator): Promise<string[][]> {
    const items = scope.getByRole('list', { name: 'Findings of the reviewer verdict A2' }).locator('xpath=./li');
    await expect(items).toHaveCount(2);
    return items.evaluateAll((lis) =>
      lis.map((li) => {
        const tag = li.querySelector('[data-status]');
        // The card's first element names the finding: "R1".
        const id = (li.firstElementChild?.textContent ?? '').trim();
        return [id, (tag?.textContent ?? '').trim(), tag?.getAttribute('data-status') ?? ''];
      }),
    );
  }

  test('LOOP-3 · a P0 finding is drawn as P0 on its verdict card, never as P2', async ({ page }) => {
    const verdictCard = card(await openP0Summary(page));
    expect(await cardSeverities(verdictCard)).toEqual([
      ['R1', 'P0', 'fail'],
      ['R2', 'P2', 'warn'],
    ]);
  });

  test("LOOP-3 · a P0 finding's tag in the verdict's findings region reads P0, in the card's tone for it, the fail tone", async ({ page }) => {
    const verdictCard = card(await openP0Summary(page));
    const r1 = finding(region(page, VERDICT_FINDINGS), 'R1');
    await expect(r1).toHaveCount(1);
    const tag = r1.locator('[data-status]').first();
    await expect(tag).toHaveText('P0');
    const cardTone = (await cardSeverities(verdictCard))[0]?.[2];
    expect(await tag.getAttribute('data-status'), "R1's tone is the verdict card's tone for it").toBe(cardTone);
    await expect(tag, 'a P0 is at least as severe as a P1').toHaveAttribute('data-status', 'fail');
  });

  test("LOOP-3 · a P0 finding is drawn as P0 on attempt 2's A2 reviewer verdict in the loop ladder, never as P2", async ({ page }) => {
    const ladder = await openRegion(page, p0, route.loop('build', 'F1'), LADDER);
    await expect(ladder, "the ladder shows the fixture's attempts").toContainText('(sale route 500); failure route round A1');
    const verdicts = stepsAt(await stepsOf(ladder, 2), 'verdict');
    await expect(verdicts).toHaveCount(2);
    await expect(verdicts.nth(1)).toContainText('reviewer verdict A2');
    expect(await cardSeverities(verdicts.nth(1))).toEqual([
      ['R1', 'P0', 'fail'],
      ['R2', 'P2', 'warn'],
    ]);
  });
});

test.describe('reachable', () => {
  test('LOOP-3 · reachable: a verdict route answers with the verdict page and its summary region', async ({ page }) => {
    await openOnFixture(page, fixture, A2_REVIEWER);
    await expect(region(page, SUMMARY)).toBeVisible();
  });
});

test.describe('axe', () => {
  test('LOOP-3 · the A2 reviewer verdict page on the fixture has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
    await openOnFixture(page, fixture, A2_REVIEWER);
    await auditEverywhere(page, A2_REVIEWER, async (p) => {
      await expect(region(p, VERDICT_FINDINGS)).toContainText(R1.why);
    });
  });
});

test.describe('parity', () => {
  test("LOOP-3 · parity: the verdict page keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, verdict);
  });

  test("LOOP-3 · parity: the verdict with the most findings (build/F2 A2) keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, verdictLong);
  });

  test("LOOP-3 · parity: the verdict summary region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, verdict, SUMMARY);
  });

  test("LOOP-3 · parity: the verdict findings region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, verdict, VERDICT_FINDINGS);
  });

  test("LOOP-3 · parity: the raw JSON region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, verdict, RAW_JSON);
  });

  test("LOOP-3 · parity: the verdict page's shell, primary nav and title are its reference's", async ({ page }) => {
    await expectShell(page, verdict, true);
  });

  test('LOOP-3 · parity: the verdict page takes every colour from a token, light and dark', async ({ page }) => {
    await expectTokensOnly(page, verdict);
  });
});
