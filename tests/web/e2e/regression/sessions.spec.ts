// sessions (U5's screen): its baseline, on the design fixture. The one state U5's tests reach on it is the populated
// page (the fixture's sessions list as it stands).
import { test } from '@playwright/test';
import { sessions } from '../U5/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('sessions', EXPLORER_NOW, [at(sessions.state, sessions.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
