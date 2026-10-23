// activity (U0b's screen, backfilled by W1): its baselines, on the design fixture. The states U0b's tests reach on it:
// populated (build/F3's activity chunk) and git-only (build/F0a, which has no activity file).
//
// U7 (W1 t17, David 2026-10-22): populated is photographed as a bounded shot, its first viewport, not the full page of
// about 1130 records (390x144310 px, about 5 MB, and past the 5000 ms screenshot timeout at 1440). git-only is one
// short page, so it stays a full-page shot.
import { expect, test } from '@playwright/test';
import { activity, gitOnly } from '../U0b/support/parity';
import { EXPLORER_NOW, at, bounded, cases, fixedFormats } from './support/regression';

test.use(fixedFormats);

const activityCases = cases('activity', EXPLORER_NOW, [bounded(at(activity.state, activity.path)), at(gitOnly.state, gitOnly.path)]);

for (const c of activityCases) {
  test(c.title, async ({ page }) => c.run(page));
}

test('activity · populated is a bounded shot at 1440 and 390, light and dark; git-only stays full-page', () => {
  const shots = Object.fromEntries(activityCases.map((c) => [c.title, c.fullPage ? 'full page' : 'bounded']));
  expect(shots).toEqual({
    [`activity · ${activity.state} 1440 light`]: 'bounded',
    [`activity · ${activity.state} 1440 dark`]: 'bounded',
    [`activity · ${activity.state} 390 light`]: 'bounded',
    [`activity · ${activity.state} 390 dark`]: 'bounded',
    [`activity · ${gitOnly.state} 1440 light`]: 'full page',
    [`activity · ${gitOnly.state} 1440 dark`]: 'full page',
    [`activity · ${gitOnly.state} 390 light`]: 'full page',
    [`activity · ${gitOnly.state} 390 dark`]: 'full page',
  });
});
