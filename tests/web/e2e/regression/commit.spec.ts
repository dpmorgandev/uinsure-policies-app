// commit (U1's screen, its links out; backfilled by W1): its baseline, on the design fixture. The one state U1's tests
// reach on it is the populated page (build/F3 commit 3a092b0).
import { test } from '@playwright/test';
import { commit } from '../U1/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('commit', EXPLORER_NOW, [at(commit.state, commit.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
