// DAG-1 · the Plan entry of the primary nav, to the line as amended by David's steer D1 (bug-002 N4, 2026-10-25,
// pause 1: "the plan page should display a tabbed plan open users can click another plan from the tabs to load it").
// D1 supersedes the inv-009 #11 I16 reading this file was first written to ("offer every plan without landing on the
// build plan"), so this red-commit test is rewritten on D1's authority (finding D1/I2).
// The Plan entry opens a plan page (#/plans/<id>), where the navigation landmark named "Plans" holds one tab per plan.
// Clicking each tab in turn loads that plan's own page, and only the clicked tab is aria-current=page. Every plan link
// is looked for inside that landmark only (finding D1/I3).
// On a small trace written here with two plans of kind build, as the real DAGs are (build and ui), and inv-001.
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { notFound, renderAppAt } from './support/app';

const SHA = 'd4e5f60718293a4b5c6d7e8f9012345678a1b2c3';

const trace = {
  schemaVersion: '1.0.0',
  compiledAt: { ref: 'HEAD', sha: SHA, utc: '2026-10-18T17:00:00Z' },
  problems: [],
  rules: [],
  plans: [
    { id: 'build', kind: 'build', title: 'Fixture build', nodes: [] },
    { id: 'ui', kind: 'build', title: 'Fixture ui', nodes: [] },
    { id: 'inv-001', kind: 'inv', title: 'F2 stub-gate escalation', nodes: [] },
  ],
  nodes: [],
  commits: [],
  events: [],
  verdicts: [],
  findings: [],
  decisions: [],
  sessions: [],
  harness: null,
};

/** Each plan's own title, which only its own page draws. */
const TITLES: Record<string, string> = { build: 'Fixture build', ui: 'Fixture ui', 'inv-001': 'F2 stub-gate escalation' };

function serveTrace(): void {
  vi.stubGlobal('fetch', (input: string) =>
    Promise.resolve(
      String(input).endsWith('trace.json')
        ? new Response(JSON.stringify(trace), { status: 200, headers: { 'content-type': 'application/json' } })
        : notFound(),
    ),
  );
}

/** The navigation landmark named "Plans": the plan tabs. */
const planTabs = (): HTMLElement => screen.getByRole('navigation', { name: 'Plans' });

/** The plan tabs' hrefs, sorted, and the hrefs of those marked current. */
function tabState(): { hrefs: string[]; current: string[] } {
  const links = within(planTabs()).getAllByRole('link');
  return {
    hrefs: links.map((a) => a.getAttribute('href') ?? '').sort(),
    current: links.filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.getAttribute('href') ?? ''),
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('DAG-1 · the Plan nav entry opens a plan page whose "Plans" tabs load each plan, only the clicked tab current', async () => {
  serveTrace();
  renderAppAt('');
  const user = userEvent.setup();
  await waitFor(() => expect(document.querySelector(`footer a[href$="/commit/${SHA}"]`), 'setup: trace.json has answered').not.toBeNull());
  const nav = screen.getByRole('navigation', { name: /^Primary/ });
  const entry = within(nav).queryByRole('button', { name: /^Plans?\b/ }) ?? within(nav).getByRole('link', { name: /^Plans?$/ });
  await user.click(entry);
  await waitFor(() => expect(window.location.hash, 'the Plan entry opens a plan page, #/plans/<id>').toMatch(/^#\/plans\/[^/]+$/));
  await waitFor(() =>
    expect(tabState(), 'the plan page draws one "Plans" tab per plan, the open plan current').toEqual({
      hrefs: ['#/plans/build', '#/plans/inv-001', '#/plans/ui'],
      current: [window.location.hash],
    }),
  );
  for (const id of ['ui', 'inv-001', 'build']) {
    const tab = within(planTabs())
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === `#/plans/${id}`);
    expect(tab, `a "Plans" tab opens #/plans/${id}`).toBeDefined();
    await user.click(tab as HTMLElement);
    await waitFor(() => expect(window.location.hash, `the ${id} tab opens #/plans/${id}`).toBe(`#/plans/${id}`));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent, `the page heads plan ${id}`).toContain(`Plan ${id}`));
    expect(screen.getByRole('main').textContent, `the ${id} page draws its own title`).toContain(TITLES[id]);
    expect(tabState().current, `only the ${id} tab is current`).toEqual([`#/plans/${id}`]);
  }
});
