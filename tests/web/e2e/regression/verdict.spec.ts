// verdict (U3's screen): its baselines, on the design fixture. The states U3's tests reach on it: populated (build/F3
// A2.3 reviewer, a PASS with one P2 finding) and long-content (build/F2 A2 reviewer, a FAIL with six findings).
import { test } from '@playwright/test';
import { verdict, verdictLong } from '../U3/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('verdict', EXPLORER_NOW, [at(verdict.state, verdict.path), at(verdictLong.state, verdictLong.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
