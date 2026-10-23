// commit (U1's screen, its links out; backfilled by W1; its diff U2's): its baselines, on the design fixture. The
// states the tests reach on it: populated (build/F3 commit 3a092b0, U1's and U2's) and long-content (build/F3 commit
// 949a082, whose patch runs to tens of kilobytes, U2's).
import { test } from '@playwright/test';
import { commit } from '../U1/support/parity';
import { longCommit } from '../U2/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('commit', EXPLORER_NOW, [at(commit.state, commit.path), at(longCommit.state, longCommit.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
