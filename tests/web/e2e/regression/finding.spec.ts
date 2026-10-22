// finding (U3's screen): its baselines, on the design fixture. The states U3's tests reach on it: populated (build/F3
// round A1, two findings, both with fix commits) and long-content (build/F1 round D2, the longest round, I8 with no fix
// commit).
import { test } from '@playwright/test';
import { finding, findingLong } from '../U3/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('finding', EXPLORER_NOW, [at(finding.state, finding.path), at(findingLong.state, findingLong.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
