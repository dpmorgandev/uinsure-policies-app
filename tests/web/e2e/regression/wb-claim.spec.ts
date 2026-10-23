// wb-claim (W3's screen): its baselines, on the recorded API answers W3's parity flows use (docs/ui/fixture/api/),
// with the clock at their recording. populated (070), api-error (084), api-unreachable; submitting is BUSY-1's.
import { test } from '@playwright/test';
import { claimStates } from '../W3/support/states';
import { WORKBENCH_NOW, cases, fixedFormats, idle } from './support/regression';

test.use(fixedFormats);

for (const c of cases('wb-claim', WORKBENCH_NOW, [
  { name: claimStates.populated.state, open: claimStates.populated.open, drawn: idle },
  { name: claimStates.error.state, open: claimStates.error.open, drawn: idle },
  { name: claimStates.unreachable.state, open: claimStates.unreachable.open, drawn: idle },
])) {
  test(c.title, async ({ page }) => c.run(page));
}
