// walkthrough (U2's screen): its baselines, on the design fixture. The states U2's tests reach on it: populated
// (build/F3, 77 rows) and git-only (build/F0a, which predates the trail).
import { test } from '@playwright/test';
import { gitOnlyWalkthrough, walkthrough } from '../U2/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('walkthrough', EXPLORER_NOW, [
  at(walkthrough.state, walkthrough.path),
  at(gitOnlyWalkthrough.state, gitOnlyWalkthrough.path),
])) {
  test(c.title, async ({ page }) => c.run(page));
}
