// plan (U3 builds its investigation body; the header and the node graph are later nodes'): its baselines, on the
// design fixture. The state U3's tests reach on it: populated (the build plan, whose investigation body is empty
// because it is not an investigation).
import { test } from '@playwright/test';
import { plan } from '../U3/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('plan', EXPLORER_NOW, [at(plan.state, plan.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
