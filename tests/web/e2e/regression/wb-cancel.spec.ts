// wb-cancel (W2's screen): its baselines, on the recorded API answers W2's parity flows use (docs/ui/fixture/api/),
// with the clock at the populated state's recording. populated: F3-MVFJRBS7C7 quoted for 2026-12-02 (069);
// submitting: the same, the cancel held in flight; api-error: a quote of a cancelled policy refused 409 under
// CANCEL-4 (077); api-unreachable: the quote refused in the browser.
import { test } from '@playwright/test';
import { CANCEL_NOW, cancelStates, cancellingButtons } from '../W2/support/cancel';
import { busy, cases, fixedFormats, idle } from './support/regression';

test.use(fixedFormats);

const cancelling = busy(cancellingButtons, 'Cancelling…');

for (const c of cases('wb-cancel', CANCEL_NOW, [
  { name: cancelStates.populated.state, open: cancelStates.populated.open, drawn: idle },
  { name: cancelStates.submitting.state, open: cancelStates.submitting.open, drawn: cancelling },
  { name: cancelStates.error.state, open: cancelStates.error.open, drawn: idle },
  { name: cancelStates.unreachable.state, open: cancelStates.unreachable.open, drawn: idle },
])) {
  test(c.title, async ({ page }) => c.run(page));
}
