// bug-002 N3's locators: the live page header's fields and the requests drawer.
import type { Locator, Page } from '@playwright/test';

/** The live page header (kit PageHeader, mode="live"). */
export const header = (page: Page): Locator => page.locator('header[data-mode="live"]');

/** The dd of the live header's field labelled `label`. */
export const headerField = (page: Page, label: string): Locator =>
  header(page)
    .locator('dl > div')
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) })
    .locator('dd');

/** The kit InspectorDrawer: an aside labelled by its heading. */
export const drawerIn = (page: Page): Locator => page.getByRole('complementary', { name: 'The requests as sent' });
