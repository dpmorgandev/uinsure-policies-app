// wb-sell (W1's screen): its baselines, on the recorded API answers W1's parity flows use (docs/ui/fixture/api/), with
// the clock at their recording. populated: the SELL-1 sale answered 201; submitting: that sale held in flight
// (BUSY-1); api-error: the SELL-2 sale sent anyway and answered 422; api-unreachable: the sale refused.
import { test } from '@playwright/test';
import { sellStates } from '../W1/support/parity';
import { WORKBENCH_NOW, cases, fixedFormats, idle, selling } from './support/regression';

test.use(fixedFormats);

for (const c of cases('wb-sell', WORKBENCH_NOW, [
  { name: sellStates.populated.state, open: sellStates.populated.open, drawn: idle },
  { name: sellStates.submitting.state, open: sellStates.submitting.open, drawn: selling },
  { name: sellStates.error.state, open: sellStates.error.open, drawn: idle },
  { name: sellStates.unreachable.state, open: sellStates.unreachable.open, drawn: idle },
])) {
  test(c.title, async ({ page }) => c.run(page));
}
