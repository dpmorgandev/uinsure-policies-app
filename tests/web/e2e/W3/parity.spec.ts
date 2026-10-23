// Parity with W3's derived reference (docs/ui/derived/W3/): wb-claim and wb-renew under WB-5, wb-requests under
// WB-7, each brought to its reference state by the recorded answers it names (support/states.ts). Structure only.
import { test } from '@playwright/test';
import { claimStates, expectEveryRegionsComponents, expectRegionsInOrder, expectTokensOnly, renewStates, requestsStates } from './support/states';
import type { W3Screen } from './support/states';

const byRule: [string, W3Screen[]][] = [
  ['WB-5', [...Object.values(claimStates), ...Object.values(renewStates)]],
  ['WB-7', Object.values(requestsStates)],
];

for (const [rule, screens] of byRule) {
  for (const s of screens) {
    test(`${rule} · parity: ${s.screen} ${s.state} carries every tagged region of its reference, in order`, async ({ page }) => {
      await expectRegionsInOrder(page, s);
    });
    test(`${rule} · parity: ${s.screen} ${s.state} has each region's data-req and catalogued components`, async ({ page }) => {
      await expectEveryRegionsComponents(page, s);
    });
    test(`${rule} · parity: ${s.screen} ${s.state} colours from tokens only, light and dark`, async ({ page }) => {
      await expectTokensOnly(page, s);
    });
  }
}
