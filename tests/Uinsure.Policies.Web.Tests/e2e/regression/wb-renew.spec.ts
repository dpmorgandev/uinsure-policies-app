// wb-renew (W3's screen): its baselines, on the recorded API answers W3's parity flows use (docs/ui/fixture/api/),
// with the clock at their recording. populated (092), api-error (094), api-unreachable; submitting is BUSY-1's.
import { test } from '@playwright/test';
import { renewStates } from '../W3/support/states';
import { WORKBENCH_NOW, cases, fixedFormats, idle } from './support/regression';

test.use(fixedFormats);

for (const c of cases('wb-renew', WORKBENCH_NOW, [
  { name: renewStates.populated.state, open: renewStates.populated.open, drawn: idle },
  { name: renewStates.error.state, open: renewStates.error.open, drawn: idle },
  { name: renewStates.unreachable.state, open: renewStates.unreachable.open, drawn: idle },
])) {
  test(c.title, async ({ page }) => c.run(page));
}
