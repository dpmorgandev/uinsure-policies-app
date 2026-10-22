// stats (U5's screen): its baseline, on the design fixture. The one state U5's tests reach on it is the populated
// page (the fixture's build plan, 10 nodes with their attempts and verdicts); the in-flight state is not reached.
import { test } from '@playwright/test';
import { stats } from '../U5/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('stats', EXPLORER_NOW, [at(stats.state, stats.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
