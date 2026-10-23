// LOOP-2 · Retry ladder. Each attempt as a chain: FAIL → findings → red test → the Fixes-Finding commit → re-run
// verdicts. F2's attempts 1–3 and inv-001 are the reference case. On the `retry-ladder` fixture trail, cut from that
// case (retry-ladder/README.md): attempt 1 FAILs at gate.stub (c2); attempt 2 opens with round A1, its red test c4 and
// fix c5 (Fixes-Finding: A1/I1), and ends on the re-run A2 verdicts, the reviewer's a FAIL at c6; inv-001 steps off
// the spine before attempt 3, which opens with round A2, its red test c8 and fix c9 (Fixes-Finding: A2/I1), and ends
// on an A3 PASS pair at c9. The ladder is drawn on the loop page and on the node page's attempts region; the plan
// page's investigation body is the investigation's own. Parity on the design fixture against docs/ui/derived/U3/.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  ATTEMPTS,
  FINDINGS,
  INVESTIGATION,
  LADDER,
  auditEverywhere,
  compileRetry,
  openOnFixture,
  openRegion,
  region,
  route,
  rung,
  shaOf,
  short,
  spineItems,
  stagesOf,
  stepsAt,
  stepsOf,
} from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, loop, node, plan } from './support/parity';

/** The chain LOOP-2 names, as the kit's attempt ladder stages it. */
const CHAIN = ['findings', 'red test', 'fix commit', 'verdict'];

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileRetry();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

/** The chain stages of an attempt's steps, in order, a run of one stage counted once. */
function chainOf(stages: string[]): string[] {
  return stages.filter((stage) => CHAIN.includes(stage)).filter((stage, at, all) => at === 0 || all[at - 1] !== stage);
}

async function openLoopLadder(page: Page): Promise<Locator> {
  const ladder = await openRegion(page, fixture, route.loop('build', 'F1'), LADDER);
  // The turn-over at attempt 1, from the fixture's attempt++ line: the ladder is drawing the fixture.
  await expect(ladder, "the ladder shows the fixture's attempts").toContainText('(sale route 500); failure route round A1');
  return ladder;
}

async function openAttempts(page: Page): Promise<Locator> {
  const attempts = await openRegion(page, fixture, route.node('build', 'F1'), ATTEMPTS);
  await expect(attempts, "the attempts show the fixture's investigation").toContainText('inv-001');
  return attempts;
}

test.describe('the loop page: one rung per attempt', () => {
  test('LOOP-2 · the loop page draws one rung per attempt, attempts 1, 2 and 3, oldest first', async ({ page }) => {
    const ladder = await openLoopLadder(page);
    const rungs = (await spineItems(ladder)).filter((item) => item.kind === 'rung');
    expect(rungs.map((item) => item.label)).toEqual(['Attempt 1', 'Attempt 2', 'Attempt 3']);
  });

  test("LOOP-2 · attempts 1 and 2 end failed, at gate.stub and at the reviewer's A2 verdict; attempt 3 ends passed", async ({ page }) => {
    const ladder = await openLoopLadder(page);
    const rungs = (await spineItems(ladder)).filter((item) => item.kind === 'rung');
    expect(rungs.map((item) => item.status)).toEqual(['fail', 'fail', 'pass']);
    expect(rungs[0]?.tag, "attempt 1's outcome names its gate").toContain('gate.stub');
    expect(rungs[1]?.tag, "attempt 2's outcome names its round").toContain('A2');
  });

  test("LOOP-2 · attempt 1's rung holds its FAIL: gate.stub, recorded ok false at c2", async ({ page }) => {
    const first = rung(await openLoopLadder(page), 'Attempt 1');
    const fail = first.getByRole('group', { name: /gate\.stub: Gate failed$/ });
    await expect(fail).toHaveCount(1);
    await expect(fail).toContainText(short(shaOf(fixture, 'c2')));
  });

  test("LOOP-2 · attempt 1's rung says where it turned over, as the attempt++ line records it", async ({ page }) => {
    const first = rung(await openLoopLadder(page), 'Attempt 1');
    await expect(first).toContainText(`1 → 2 on gate.stub FAIL at ${short(shaOf(fixture, 'c2'))} (sale route 500); failure route round A1`);
  });

  test("LOOP-2 · attempt 2 opens with round A1's findings, then the finding's red gate", async ({ page }) => {
    const steps = await stepsOf(await openLoopLadder(page), 2);
    expect((await stagesOf(steps)).slice(0, 2)).toEqual(['findings', 'gate']);
    await expect(stepsAt(steps, 'findings').first()).toContainText('A1');
  });

  test('LOOP-2 · attempt 2 re-runs gate.stub at the fix, c5, and it holds as the stub step expects', async ({ page }) => {
    const steps = await stepsOf(await openLoopLadder(page), 2);
    const rerun = steps.getByRole('group', { name: /gate\.stub: Failed as expected$/ });
    await expect(rerun).toHaveCount(1);
    await expect(rerun).toContainText(short(shaOf(fixture, 'c5')));
  });

  test("LOOP-2 · attempt 2's rung turns over on the reviewer FAIL at A2, as the attempt++ line records it", async ({ page }) => {
    const second = rung(await openLoopLadder(page), 'Attempt 2');
    await expect(second).toContainText(`2 → 3 on reviewer FAIL at ${short(shaOf(fixture, 'c6'))} (A2)`);
  });
});

test.describe('the node page: the chain of each attempt', () => {
  test("LOOP-2 · the node page's attempts show attempts 1 and 2, then inv-001 stepping off the spine, then attempt 3", async ({ page }) => {
    const attempts = await openAttempts(page);
    expect((await spineItems(attempts)).map((item) => item.label)).toEqual(['Attempt 1', 'Attempt 2', 'Investigation inv-001', 'Attempt 3']);
  });

  test('LOOP-2 · the investigation inv-001 rejoins the spine at attempt 3', async ({ page }) => {
    const attempts = await openAttempts(page);
    const branch = attempts.locator('li[data-kind="branch"]');
    await expect(branch).toHaveCount(1);
    await expect(branch).toContainText('inv-001');
    await expect(branch).toContainText('Rejoins the spine at');
    await expect(branch.getByRole('link', { name: /attempt 3/i })).toHaveCount(1);
  });

  test('LOOP-2 · attempt 1 holds its FAIL: gate.stub at c2, recorded ok false', async ({ page }) => {
    const steps = await stepsOf(await openAttempts(page), 1);
    const fail = steps.getByRole('group', { name: /gate\.stub: Gate failed$/ });
    await expect(fail).toHaveCount(1);
    await expect(fail).toContainText(short(shaOf(fixture, 'c2')));
  });

  test('LOOP-2 · attempt 2 is the chain: findings, then the red test, then the Fixes-Finding commit, then the re-run verdicts', async ({ page }) => {
    const steps = await stepsOf(await openAttempts(page), 2);
    expect(chainOf(await stagesOf(steps))).toEqual(CHAIN);
  });

  test("LOOP-2 · attempt 2's findings are round A1's, its red test c4 and its fix commit c5, both trailed Fixes-Finding: A1/I1", async ({ page }) => {
    const steps = await stepsOf(await openAttempts(page), 2);
    await expect(stepsAt(steps, 'findings')).toHaveCount(1);
    await expect(stepsAt(steps, 'findings')).toContainText('A1');
    await expect(stepsAt(steps, 'red test')).toHaveCount(1);
    await expect(stepsAt(steps, 'red test')).toContainText(short(shaOf(fixture, 'c4')));
    await expect(stepsAt(steps, 'fix commit')).toHaveCount(1);
    await expect(stepsAt(steps, 'fix commit')).toContainText(short(shaOf(fixture, 'c5')));
  });

  test("LOOP-2 · attempt 2's re-run verdicts are round A2's at c6: security PASS, then reviewer FAIL", async ({ page }) => {
    const steps = await stepsOf(await openAttempts(page), 2);
    const verdicts = stepsAt(steps, 'verdict');
    await expect(verdicts).toHaveCount(2);
    expect(await verdicts.locator('article[data-verdict]').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-verdict')))).toEqual(['PASS', 'FAIL']);
    await expect(verdicts.nth(0)).toContainText('security verdict A2');
    await expect(verdicts.nth(1)).toContainText('reviewer verdict A2');
    for (const at of [0, 1]) await expect(verdicts.nth(at)).toContainText(short(shaOf(fixture, 'c6')));
  });

  test('LOOP-2 · attempt 3 is the chain: findings, then the red test, then the Fixes-Finding commit, then the re-run verdicts', async ({ page }) => {
    const steps = await stepsOf(await openAttempts(page), 3);
    expect(chainOf(await stagesOf(steps))).toEqual(CHAIN);
  });

  test("LOOP-2 · attempt 3's findings are round A2's, its red test c8, its fix c9, and its verdicts round A3's, both PASS", async ({ page }) => {
    const steps = await stepsOf(await openAttempts(page), 3);
    await expect(stepsAt(steps, 'findings')).toContainText('A2');
    await expect(stepsAt(steps, 'red test')).toContainText(short(shaOf(fixture, 'c8')));
    await expect(stepsAt(steps, 'fix commit')).toContainText(short(shaOf(fixture, 'c9')));
    const verdicts = stepsAt(steps, 'verdict');
    await expect(verdicts).toHaveCount(2);
    expect(await verdicts.locator('article[data-verdict]').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-verdict')))).toEqual(['PASS', 'PASS']);
    for (const at of [0, 1]) await expect(verdicts.nth(at)).toContainText('verdict A3');
  });
});

test.describe('the way back to the FAIL', () => {
  test("LOOP-2 · round A1's findings page links back to F1's loop, where its FAIL is", async ({ page }) => {
    const findings = await openRegion(page, fixture, route.findings('build', 'F1', 'A1'), FINDINGS);
    await expect(findings.locator('a[href$="#/plans/build/F1/loop"]').first()).toBeVisible();
  });
});

test.describe('the investigation', () => {
  test("LOOP-2 · inv-001's plan page shows the investigation's question and hypothesis as its plan file states them", async ({ page }) => {
    const body = await openRegion(page, fixture, route.plan('inv-001'), INVESTIGATION);
    await expect(body).toContainText(
      'Why does the reviewer FAIL build/F1 at attempt 2 when every gate held, and is the cause in the code or in the tests?',
    );
    await expect(body).toContainText('The sale compares references as written, and no test sells a reference that differs from a sold one only in case.');
  });
});

test.describe('axe', () => {
  test("LOOP-2 · F1's node page, with its attempts and the investigation branch, has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    const path = route.node('build', 'F1');
    await openOnFixture(page, fixture, path);
    await auditEverywhere(page, path, async (p) => {
      await expect(region(p, ATTEMPTS).locator('li[data-kind="branch"]')).toContainText('inv-001');
    });
  });

  test("LOOP-2 · inv-001's plan page on the fixture has no axe violation, light and dark, at 1440 and 390", async ({ page }) => {
    const path = route.plan('inv-001');
    await openOnFixture(page, fixture, path);
    await auditEverywhere(page, path, async (p) => {
      await expect(region(p, INVESTIGATION)).toContainText('when every gate held');
    });
  });
});

test.describe('parity', () => {
  test("LOOP-2 · parity: the loop page's attempt ladder region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, loop, LADDER);
  });

  test("LOOP-2 · parity: the node page keeps its U3 reference's regions in order, the attempts built", async ({ page }) => {
    await expectRegionsInOrder(page, node);
  });

  test("LOOP-2 · parity: the node page's attempts region carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, node, ATTEMPTS);
  });

  test("LOOP-2 · parity: the plan page keeps its reference's regions in order, the investigation body built", async ({ page }) => {
    await expectRegionsInOrder(page, plan);
  });

  test("LOOP-2 · parity: the plan page's investigation body carries its reference's components", async ({ page }) => {
    await expectRegionComponents(page, plan, INVESTIGATION);
  });

  test("LOOP-2 · parity: the plan page's shell, primary nav and title are its reference's", async ({ page }) => {
    await expectShell(page, plan, true);
  });

  test('LOOP-2 · parity: the plan page takes every colour from a token, light and dark', async ({ page }) => {
    await expectTokensOnly(page, plan);
  });
});
