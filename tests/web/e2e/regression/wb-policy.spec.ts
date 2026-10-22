// wb-policy (W1's screen): its baselines, on the recorded API answers W1's parity flows use (docs/ui/fixture/api/),
// with the clock at their recording. populated: F2-MVFJQA9DQG read back in full; api-error: an unknown reference
// answered 404; api-unreachable: the read refused. long-content is a fake-clock API test no flow can reach.
import { test } from '@playwright/test';
import { policyStates } from '../W1/support/parity';
import { WORKBENCH_NOW, cases, fixedFormats, idle } from './support/regression';

test.use(fixedFormats);

for (const c of cases('wb-policy', WORKBENCH_NOW, [
  { name: policyStates.populated.state, open: policyStates.populated.open, drawn: idle },
  { name: policyStates.error.state, open: policyStates.error.open, drawn: idle },
  { name: policyStates.unreachable.state, open: policyStates.unreachable.open, drawn: idle },
])) {
  test(c.title, async ({ page }) => c.run(page));
}
