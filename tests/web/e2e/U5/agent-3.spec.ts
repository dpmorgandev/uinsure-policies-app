// AGENT-3 · Harness anatomy. The agents, their tools, preloaded skills and never-dos, and the hooks and what each
// guards, from the generated harness file (DATA-7). U5's acceptance: the harness page lists each agent from the
// harness file with its model and tools, the skills, and each hook with its purpose and the gates it guards, under
// the file's provenance. On the `complete` trail with U5's overlay (tests/web/fixtures/overlays/u5/README.md): agents
// tester (opus) and builder (sonnet); skills requirements-trace and testing; hooks guard-agent.mjs (G1) and
// gate-red.mjs (G4, G5); provenance "... at tree a1b2c3d". Parity on the design fixture against
// docs/ui/derived/U5/harness/.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { AGENTS, HOOKS, auditEverywhere, compileU5, heading, openOnFixture, region, route } from './support/app';
import type { CompiledTrail } from './support/app';
import { expectRegionComponents, expectRegionsInOrder, expectShell, expectTokensOnly, harness } from './support/parity';

let fixture: CompiledTrail;
test.beforeAll(() => {
  fixture = compileU5();
});
test.afterAll(() => {
  fixture?.trail.cleanup();
});

async function openHarness(page: Page): Promise<void> {
  await openOnFixture(page, fixture, route.harness);
  await expect(region(page, AGENTS), 'the agents region is drawn').toBeVisible();
}

test("AGENT-3 · the agents region lists the harness file's two agents, tester and builder, each with its model", async ({ page }) => {
  await openHarness(page);
  const agents = region(page, AGENTS);
  const tester = agents.locator('tr').filter({ hasText: 'tester' }).first();
  const builder = agents.locator('tr').filter({ hasText: 'builder' }).first();
  await expect(tester).toContainText('opus');
  await expect(builder).toContainText('sonnet');
});

test("AGENT-3 · each agent shows its tools and its description from the harness file", async ({ page }) => {
  await openHarness(page);
  const tester = region(page, AGENTS).locator('tr').filter({ hasText: 'tester' }).first();
  await expect(tester).toContainText('Read, Grep, Glob, Edit, Write, Bash');
  await expect(tester).toContainText('Writes the red tests for one plan node before any behaviour exists.');
});

test("AGENT-3 · the harness file's skills are listed by name", async ({ page }) => {
  await openHarness(page);
  const agents = region(page, AGENTS);
  await expect(agents).toContainText('requirements-trace');
  await expect(agents).toContainText('The red, stub, green and refactor sequence per node.');
});

test('AGENT-3 · the hooks region lists each hook with what it guards: guard-agent.mjs G1, gate-red.mjs G4 and G5', async ({ page }) => {
  await openHarness(page);
  const hooks = region(page, HOOKS);
  const guard = hooks.locator('tr').filter({ hasText: 'guard-agent.mjs' });
  const red = hooks.locator('tr').filter({ hasText: 'gate-red.mjs' });
  await expect(guard).toContainText('G1');
  await expect(guard).toContainText('each agent writes only inside its own scope');
  await expect(red).toContainText('G4');
  await expect(red).toContainText('G5');
});

test("AGENT-3 · the page names the harness file's provenance, the generated file at tree a1b2c3d", async ({ page }) => {
  await openHarness(page);
  await expect(page.getByRole('main')).toContainText('a1b2c3d');
  await expect(page.getByRole('main').locator('[data-provenance="generated"]').first()).toBeVisible();
});

test('AGENT-3 · reachable: the harness route answers with its own heading', async ({ page }) => {
  await openOnFixture(page, fixture, route.harness);
  await expect(heading(page)).toBeVisible();
});

test('AGENT-3 · the harness page has no axe violation, light and dark, at 1440 and 390', async ({ page }) => {
  await openOnFixture(page, fixture, route.harness);
  await auditEverywhere(page, route.harness, async (p) => {
    await expect(region(p, HOOKS).locator('tbody tr').first()).toBeVisible();
  });
});

test("AGENT-3 · parity: the harness page keeps its reference's regions in order", async ({ page }) => {
  await expectRegionsInOrder(page, harness);
});

test("AGENT-3 · parity: the agents region carries its reference's components", async ({ page }) => {
  await expectRegionComponents(page, harness, AGENTS);
});

test("AGENT-3 · parity: the hooks region carries its reference's components", async ({ page }) => {
  await expectRegionComponents(page, harness, HOOKS);
});

test("AGENT-3 · parity: the harness page's shell, primary nav and title are its reference's", async ({ page }) => {
  await expectShell(page, harness, true);
});

test('AGENT-3 · parity: the harness page uses tokens only, no literal colour', async ({ page }) => {
  await expectTokensOnly(page, harness);
});
