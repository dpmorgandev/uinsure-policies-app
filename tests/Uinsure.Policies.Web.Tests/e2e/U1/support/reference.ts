// Parity with U1's derived reference (docs/ui/derived/U1/<screen>/<state>.html), structure first. The reader is
// U0b's (tests/Uinsure.Policies.Web.Tests/e2e/U0b/support/reference.ts): the tagged regions in order, the catalogued components inside
// each, the shell's own components, the title and the navigation; a component counts by its data-comp root or the
// kit's own class for it (kit-<id>__<part>). Only the directory differs.
import type { BrowserContext } from '@playwright/test';
import { readReference as readFromU0b } from '../../U0b/support/reference';
import type { Structure } from '../../U0b/support/reference';

export { literalColours, readBuilt, regionNamed, regionOrder } from '../../U0b/support/reference';
export type { Region, Structure } from '../../U0b/support/reference';

/**
 * Reads docs/ui/derived/U1/<screen>/<state>.html in a page of its own beside the test's. U0b's reader joins
 * docs/ui/derived/U0b with the screen it is given, so the screen is passed as ../U1/<screen>.
 */
export function readReference(context: BrowserContext, screen: string, state: string): Promise<Structure> {
  return readFromU0b(context, `../U1/${screen}`, state);
}
