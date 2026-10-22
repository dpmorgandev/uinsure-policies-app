// activity (U0b's screen, backfilled by W1): its baselines, on the design fixture. The states U0b's tests reach on it:
// populated (build/F3's activity chunk) and git-only (build/F0a, which has no activity file).
import { test } from '@playwright/test';
import { activity, gitOnly } from '../U0b/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('activity', EXPLORER_NOW, [at(activity.state, activity.path), at(gitOnly.state, gitOnly.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
