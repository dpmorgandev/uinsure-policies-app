// sessions (U4 builds its open snapshot, NAV-2): its baseline, on the design fixture. The one state U4's tests reach on
// it is the populated page with the last snapshot, f6-done-merged, open at its own URL.
import { test } from '@playwright/test';
import { sessions } from '../U4/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('sessions', EXPLORER_NOW, [at(sessions.state, sessions.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
