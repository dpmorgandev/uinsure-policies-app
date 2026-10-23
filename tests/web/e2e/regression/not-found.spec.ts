// not-found (U4's screen): its baseline, on the design fixture. The one state U4's tests reach on it is the populated
// page: a path that names nothing (/#/no/such/page), on a compiled snapshot.
import { test } from '@playwright/test';
import { notFound } from '../U4/support/parity';
import { EXPLORER_NOW, at, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

for (const c of cases('not-found', EXPLORER_NOW, [at(notFound.state, notFound.path)])) {
  test(c.title, async ({ page }) => c.run(page));
}
