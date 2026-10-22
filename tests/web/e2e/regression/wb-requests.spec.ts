// wb-requests (W3's screen): its baseline, on the recorded read-back W3's parity flow leaves in the log
// (docs/ui/fixture/api/045), with the clock at its recording. long-content needs ten fixtures run through the app.
import { test } from '@playwright/test';
import { requestsStates } from '../W3/support/states';
import { WORKBENCH_NOW, cases, fixedFormats, idle } from './support/regression';

test.use(fixedFormats);

for (const c of cases('wb-requests', WORKBENCH_NOW, [
  { name: requestsStates.populated.state, open: requestsStates.populated.open, drawn: idle },
])) {
  test(c.title, async ({ page }) => c.run(page));
}
