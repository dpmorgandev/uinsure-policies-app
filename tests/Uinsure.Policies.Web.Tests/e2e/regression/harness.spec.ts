// harness (U5's screen): its baseline, on the design fixture. The one state U5's tests reach on it is the populated
// page (the fixture's own harness block).
import { test } from '@playwright/test';
import { harness } from '../U5/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('harness', EXPLORER_NOW, [at(harness.state, harness.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
