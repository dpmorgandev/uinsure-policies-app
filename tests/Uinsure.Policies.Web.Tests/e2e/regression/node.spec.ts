// node (U1's screen, its completeness banner; backfilled by W1): its baselines, on the design fixture. The states U1's
// tests reach on it: populated (build/F3) and git-only (build/F0a, which predates the trail).
import { test } from '@playwright/test';
import { gitOnlyNode, node } from '../U1/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('node', EXPLORER_NOW, [at(node.state, node.path), at(gitOnlyNode.state, gitOnlyNode.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
