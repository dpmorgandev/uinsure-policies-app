// matrix (U1's screen, backfilled by W1): its baseline, on the design fixture. The one state U1's tests reach on it is
// the populated page (all 29 rules); not-built and disagreement are variants the design fixture doesn't hold.
import { test } from '@playwright/test';
import { matrix } from '../U1/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('matrix', EXPLORER_NOW, [at(matrix.state, matrix.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
