// loop (U3's screen): its baselines, on the design fixture. The states U3's tests reach on it: populated (build/F3,
// two attempts, gate.stub ok false at line 4), long-content (build/F1, the most loop events) and git-only (build/F0a,
// which predates the trail and has no loop.jsonl).
import { test } from '@playwright/test';
import { loop, loopGitOnly, loopLong } from '../U3/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('loop', EXPLORER_NOW, [at(loop.state, loop.path), at(loopLong.state, loopLong.path), at(loopGitOnly.state, loopGitOnly.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
