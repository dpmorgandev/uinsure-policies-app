// plan (U2's screen): its baseline, on the design fixture. The one state U2's tests reach on it is the populated page
// (the build plan); in-flight and not-built are cut variants the design fixture doesn't hold.
import { test } from '@playwright/test';
import { plan } from '../U2/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('plan', EXPLORER_NOW, [at(plan.state, plan.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
