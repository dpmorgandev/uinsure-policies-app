// rule (U1's screen, backfilled by W1): its baselines, on the design fixture. The states U1's tests reach on it:
// populated (GET-1, build/F2) and long-content (COULD-2, build/F3, the longest trail).
import { test } from '@playwright/test';
import { rule, ruleLong } from '../U1/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('rule', EXPLORER_NOW, [at(rule.state, rule.path), at(ruleLong.state, ruleLong.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
