// decisions (U4's screen): its baseline, on the design fixture. The one state U4's tests reach on it is the populated
// page (the fixture's own decisions list: 35 records across 12 nodes of the build and ui plans).
import { test } from '@playwright/test';
import { decisions } from '../U4/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('decisions', EXPLORER_NOW, [at(decisions.state, decisions.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
