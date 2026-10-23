// LOOP-4 · Findings. Each investigator finding: symptom, cause, file:line, fix direction, suggested test, testable or
// not, and the commit that fixed it. On the `retry-ladder` fixture trail (retry-ladder/README.md): round A1 (source
// the gate.stub FAIL at c2) holds I1, testable, fixed by c4 then c5 (Fixes-Finding: A1/I1), and I2, untestable with
// its reason and no fix commit; round A2 (source the A2 reviewer verdict) holds I1, fixed by c8 then c9. Each
// finding's text is one root_cause with its own "Symptom:", "Cause:" and "Fix direction:" markers. Parity on the
// design fixture against docs/ui/derived/U3/finding/.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  FINDINGS,
  FIXED_BY,
  REPO,
  RETRY,
  auditEverywhere,
  compileRetry,
  fact,
  findingCard,
  openOnFixture,
  openRegion,
  region,
  route,
  shaOf,
  short,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, finding, findingLong } from './support/parity';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileFixture } from '../U0b/support/trail';

const A1 = route.findings('build', 'F1', 'A1');
const A1_I1 = {
  symptom: 'a second POST /policies with a reference already answered returns 500, a status the contract never gives.',
  cause:
    'the stub keeps the references it has answered and throws on a repeat instead of answering, so the duplicate path never reaches a response.',
  fix: 'have the stub answer a repeat with the canned 409 the contract gives for a duplicate reference, and keep its first answer 201.',
  test: 'Given a reference the stub has answered once, When it is sold again, Then the answer is 409, not 500.',
};
const A1_I2_REASON = 'A test that is meant to fail at the stub step fails the same way for either cause, so no test can show which one it was.';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRetry();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** Opens a finding round and waits until its findings region names the fixture's node. */
async function openRound(page: Page, path = A1): Promise<Locator> {
  const findings = await openRegion(page, fixture, path, FINDINGS);
  await expect(findings, "the round is the fixture's build/F1").toContainText('build/F1');
  return findings;
}

/** The widest block around a finding card that holds no other finding card: the finding with its own heading line. */
function ownBlock(card: Locator): Locator {
  return card.locator('xpath=ancestor-or-self::*[count(.//article[@data-testable]) + count(self::article[@data-testable]) = 1][last()]');
}

/** A commit link into the app's commit page, for the full SHA or its short form. */
function commitPage(sha: string): string {
  return `a[href*="#/commits/${short(sha)}"]`;
}

test.describe("each finding's fields", () => {
  test("LOOP-4 · round A1 shows its two findings in the round's order, I1 then I2", async ({ page }) => {
    const findings = await openRound(page);
    const ids = await findings
      .locator('article[data-testable]')
      .evaluateAll((cards) => cards.map((card) => (card.querySelector('h2, h3, h4')?.textContent ?? '').trim().split(/\s/)[0]));
    expect(ids).toEqual(['I1', 'I2']);
  });

  test('LOOP-4 · I1 names its rule SELL-2 and its layer api, I2 its rule SELL-1 and its layer tests', async ({ page }) => {
    const findings = await openRound(page);
    const i1 = ownBlock(findingCard(findings, 'I1'));
    await expect(i1).toContainText('SELL-2');
    await expect(i1).toContainText(/\bapi\b/);
    await expect(i1).not.toContainText('SELL-1');
    const i2 = ownBlock(findingCard(findings, 'I2'));
    await expect(i2).toContainText('SELL-1');
    await expect(i2).toContainText(/\btests\b/);
    await expect(i2).not.toContainText('SELL-2');
  });

  test("LOOP-4 · I1's symptom, cause and fix direction are its recorded text, each from its own marker", async ({ page }) => {
    const i1 = findingCard(await openRound(page), 'I1');
    await expect(fact(i1, 'Symptom')).toHaveText(A1_I1.symptom);
    await expect(fact(i1, 'Cause')).toHaveText(A1_I1.cause);
    await expect(fact(i1, 'Fix direction')).toHaveText(A1_I1.fix);
  });

  test("LOOP-4 · I1 links each file it names to the file on GitHub", async ({ page }) => {
    const files = fact(findingCard(await openRound(page), 'I1'), 'Files');
    for (const path of ['src/sell.txt', 'tests/web/e2e/F1/sell.spec.ts']) {
      const link = files.locator(`a[href^="${REPO}/blob/"][href$="/${path}"]`);
      await expect(link, path).toHaveCount(1);
      await expect(link).toHaveText(path);
    }
  });

  test('LOOP-4 · I1 is marked testable and shows its suggested test', async ({ page }) => {
    const i1 = findingCard(await openRound(page), 'I1');
    await expect(i1).toHaveAttribute('data-testable', 'true');
    await expect(fact(i1, 'Suggested test')).toHaveText(A1_I1.test);
  });

  test('LOOP-4 · I2 is marked untestable and gives its recorded reason, with no suggested test', async ({ page }) => {
    const i2 = findingCard(await openRound(page), 'I2');
    await expect(i2).toHaveAttribute('data-testable', 'false');
    await expect(i2.getByRole('heading')).toContainText('Untestable');
    await expect(fact(i2, 'Why untestable')).toHaveText(A1_I2_REASON);
    await expect(i2.locator('dt', { hasText: 'Suggested test' })).toHaveCount(0);
  });

  test("LOOP-4 · round A1 names its source, the gate.stub FAIL at c2", async ({ page }) => {
    const findings = await openRound(page);
    await expect(findings).toContainText(`gate.stub (ok:false) at ${shaOf(fixture, 'c2')}`);
  });
});

test.describe('the commit that fixed it', () => {
  test("LOOP-4 · I1 is fixed by c4 then c5, the commits trailed Fixes-Finding: A1/I1, each linked to its commit page", async ({ page }) => {
    await openRound(page);
    const row = region(page, FIXED_BY).locator('li').filter({ hasText: /^\s*I1\b/ });
    await expect(row).toHaveCount(1);
    const c4 = shaOf(fixture, 'c4');
    const c5 = shaOf(fixture, 'c5');
    await expect(row.locator(commitPage(c4))).toHaveCount(1);
    await expect(row.locator(commitPage(c5))).toHaveCount(1);
    const text = (await row.innerText()).replace(/\s+/g, ' ');
    expect(text.indexOf(short(c4)), 'c4 before c5').toBeLessThan(text.indexOf(short(c5)));
    expect(text.indexOf(short(c4)), 'c4 is named').toBeGreaterThanOrEqual(0);
  });

  test("LOOP-4 · I1's card is marked fixed and names its commits, c4 and c5", async ({ page }) => {
    const i1 = findingCard(await openRound(page), 'I1');
    await expect(i1).toHaveAttribute('data-fixed', 'true');
    await expect(fact(i1, 'Fixed by')).toContainText(short(shaOf(fixture, 'c4')));
    await expect(fact(i1, 'Fixed by')).toContainText(short(shaOf(fixture, 'c5')));
  });

  test('LOOP-4 · I2, which no commit names in Fixes-Finding, says no fix commit is recorded', async ({ page }) => {
    const findings = await openRound(page);
    const i2 = findingCard(findings, 'I2');
    await expect(i2).toHaveAttribute('data-fixed', 'false');
    await expect(fact(i2, 'Fixed by')).toContainText('No fix commit recorded');
    for (const id of ['c4', 'c5', 'c8', 'c9']) await expect(fact(i2, 'Fixed by')).not.toContainText(short(shaOf(fixture, id)));
  });

  test('LOOP-4 · in the fixed-by region, I2 lists no commit', async ({ page }) => {
    await openRound(page);
    const fixedBy = region(page, FIXED_BY);
    await expect(fixedBy.locator('li').filter({ hasText: /^\s*I1\b/ }), "the region lists the fixture's I1").toHaveCount(1);
    await expect(fixedBy.locator('li').filter({ hasText: /^\s*I2\b/ }).locator('a[href*="/commit"]')).toHaveCount(0);
  });

  test("LOOP-4 · round A2's I1 is fixed by c8 then c9, not by A1's commits", async ({ page }) => {
    await openRound(page, route.findings('build', 'F1', 'A2'));
    const row = region(page, FIXED_BY).locator('li').filter({ hasText: /^\s*I1\b/ });
    await expect(row).toHaveCount(1);
    await expect(row.locator(commitPage(shaOf(fixture, 'c8')))).toHaveCount(1);
    await expect(row.locator(commitPage(shaOf(fixture, 'c9')))).toHaveCount(1);
    await expect(row.locator(commitPage(shaOf(fixture, 'c4')))).toHaveCount(0);
    await expect(row.locator(commitPage(shaOf(fixture, 'c5')))).toHaveCount(0);
  });

  test("LOOP-4 · round A2's I1 shows its own symptom, layer services and suggested test", async ({ page }) => {
    const findings = await openRound(page, route.findings('build', 'F1', 'A2'));
    const i1 = findingCard(findings, 'I1');
    await expect(fact(i1, 'Symptom')).toHaveText('a reference that differs from a sold one only in case is sold again, 201.');
    await expect(fact(i1, 'Suggested test')).toHaveText('Given ABC-1 sold, When abc-1 is sold, Then the answer is 409.');
    await expect(ownBlock(i1)).toContainText(/\bservices\b/);
  });
});

// A3/I1: text as the real rounds write it. U3's own round A2 opens each root_cause with a sentence before "Symptom:"
// ("Layer: ... recorded as 'api' because ..."). The signed-off reference decides where it goes: "Where a sentence comes
// before the "Symptom:" marker, it opens the Symptom field" (docs/ui/derived/U3/finding/long-content.html).
test.describe('text the real rounds write', () => {
  const A2_ROOT_CAUSE =
    'Symptom: a reference that differs from a sold one only in case is sold again, 201. Cause: the uniqueness check compares references as written, case-sensitively. Hypothesis inv-001 holds: no test sells such a pair. Fix direction: compare the normalised reference, with the case-only pair as a red test first.';
  const PREAMBLE = "Layer: screen only, no kit change. It is recorded as 'api' because the schema's layer enum has no ui layer.";
  const SYMPTOM =
    "every node's loop page says its events were 'each event recorded by the orchestrator'. In fact 37 lines in 7 real logs have source 'reconciled'.";
  const CAUSE = 'src/web/app/explorer/loop/Loop.tsx:42-43 prints that sentence as a fixed string. It never reads LoopEvent.source.';
  const FIX = 'in the screen, derive the provenance clause from the source values of the events in the log.';
  const TEXT = `${PREAMBLE} Symptom: ${SYMPTOM} Cause: ${CAUSE} Fix direction: ${FIX}`;

  let preambled: CompiledTrail;
  test.beforeAll(() => {
    preambled = compileFixture(RETRY, (root) => {
      const file = join(root, 'docs/trace/build/F1/findings/A2.md');
      const text = readFileSync(file, 'utf8');
      if (!text.includes(A2_ROOT_CAUSE)) throw new Error("fixture setup: retry-ladder's round A2 holds no I1 root_cause to replace");
      writeFileSync(file, text.replace(A2_ROOT_CAUSE, JSON.stringify(TEXT).slice(1, -1)));
    });
  });
  test.afterAll(() => {
    preambled?.trail.cleanup();
  });

  test("LOOP-4 · a finding whose recorded text opens with a sentence before Symptom: shows that sentence at the start of its Symptom field", async ({
    page,
  }) => {
    const findings = await openRegion(page, preambled, route.findings('build', 'F1', 'A2'), FINDINGS);
    await expect(findings, "the round is the fixture's build/F1").toContainText('build/F1');
    const i1 = findingCard(findings, 'I1');
    const symptom = fact(i1, 'Symptom');
    await expect(symptom).toHaveText(new RegExp(`^\\s*${PREAMBLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    await expect(symptom).toContainText(SYMPTOM);
    await expect(fact(i1, 'Cause')).toHaveText(CAUSE);
    await expect(fact(i1, 'Fix direction')).toHaveText(FIX);
  });
});

test.describe('reachable', () => {
  test('LOOP-4 · reachable: a finding round route answers with the finding page and its findings region', async ({ page }) => {
    await openOnFixture(page, fixture, A1);
    await expect(region(page, FINDINGS)).toBeVisible();
  });
});

test.describe('axe', () => {
  test("LOOP-4 · round A1's finding page on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    await openOnFixture(page, fixture, A1);
    await auditEverywhere(page, A1, async (p) => {
      await expect(region(p, FINDINGS)).toContainText(A1_I2_REASON);
    });
  });
});

test.describe('parity', () => {
  test("LOOP-4 · parity: the finding page keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, finding);
  });

  test("LOOP-4 · parity: the longest finding round (build/F1 D2) keeps its reference's regions in order", async ({ page }) => {
    await expectRegionsInOrder(page, findingLong);
  });

  test("LOOP-4 · parity: the findings region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, finding, FINDINGS);
  });

  test("LOOP-4 · parity: the fixed-by region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, finding, FIXED_BY);
  });

  test("LOOP-4 · parity: the finding page's shell, primary nav and title are its reference's", async ({ page }) => {
    await expectShell(page, finding, true);
  });

  test('LOOP-4 · parity: the finding page takes every colour from a token, light and dark', async ({ page }) => {
    await expectTokensOnly(page, finding);
  });
});
