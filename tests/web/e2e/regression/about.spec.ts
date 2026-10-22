// about (U0b's screen, backfilled by W1): its baseline, on the design fixture. The one state U0b's tests reach on it
// is the populated page (the fixture's own stamp, 5 plans and 2 problems).
import { test } from '@playwright/test';
import { about } from '../U0b/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('about', EXPLORER_NOW, [at(about.state, about.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
