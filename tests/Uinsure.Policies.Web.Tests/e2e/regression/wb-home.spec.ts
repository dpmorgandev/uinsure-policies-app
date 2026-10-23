// wb-home (W1's screen): its baselines, on the recorded API answers W1's parity flows use (docs/ui/fixture/api/),
// with the clock at their recording. populated: F1-MVFJOFJ8IS then F2-MVFJQA9DQG sold in this browser; submitting:
// a policy opening, its GET held (BUSY-1); api-unreachable: that GET refused.
import { test } from '@playwright/test';
import { homeStates } from '../W1/support/parity';
import { WORKBENCH_NOW, cases, fixedFormats, idle, opening } from './support/regression';

test.use(fixedFormats);

for (const c of cases('wb-home', WORKBENCH_NOW, [
  { name: homeStates.populated.state, open: homeStates.populated.open, drawn: idle },
  { name: homeStates.submitting.state, open: homeStates.submitting.open, drawn: opening },
  { name: homeStates.unreachable.state, open: homeStates.unreachable.open, drawn: idle },
])) {
  test(c.title, async ({ page }) => c.run(page));
}
