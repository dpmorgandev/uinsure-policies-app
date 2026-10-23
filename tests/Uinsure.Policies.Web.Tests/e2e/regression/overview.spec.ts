// overview (U0a's and U0b's screen, its headline and receipt figures U1's; backfilled by W1): its baseline, on the
// design fixture. The one state the tests reach on it is the populated page; in-flight and not-built are cut variants
// the design fixture doesn't hold.
import { test } from '@playwright/test';
import { overview } from '../U0b/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('overview', EXPLORER_NOW, [at(overview.state, overview.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
