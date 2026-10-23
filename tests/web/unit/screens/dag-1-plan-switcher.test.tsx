// DAG-1 · Plan DAG view: "Shows build (F0a–F7), ui, and investigations such as inv-001". The Plan entry of the primary
// nav offers every plan trace.json holds, each opening #/plans/<id> (David 2026-10-23, U9 Pause 2: "how do i swap to
// see the ui plan in docket?"). Until U10 it always opened the plan of kind build (src/web/app/shell/Frame.tsx), and
// both real DAGs say `kind: build`, so the ui plan had no way in from the nav.
// On a small trace written here, with the plans fixture's three plans (tests/web/fixtures/trails/plans/README.md):
// build and ui, both `kind: build` as the real DAGs are, and the investigation inv-001. The app is rendered at its
// router root; the Plan entry is activated as a person would (a link or a button named Plan), then every plan's link
// must be on the page.
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { notFound, renderAppAt } from './support/app';

const SHA = 'c3d4e5f60718293a4b5c6d7e8f9012345678a1b2';

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

function serveTrace(): void {
  vi.stubGlobal('fetch', (input: string) =>
    Promise.resolve(
      String(input).endsWith('trace.json')
        ? new Response(JSON.stringify(trace), { status: 200, headers: { 'content-type': 'application/json' } })
        : notFound(),
    ),
  );
}

/** Every in-app plan link on the page, by its href. */
const planHrefs = (): string[] =>
  [...new Set(Array.from(document.querySelectorAll('a[href^="#/plans/"]')).map((a) => a.getAttribute('href') ?? ''))].filter((href) =>
    /^#\/plans\/[^/]+$/.test(href),
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('DAG-1 · the Plan nav entry offers every plan in trace.json, build, ui and inv-001, each opening #/plans/<id>', async () => {
  serveTrace();
  renderAppAt('no-such-page');
  const user = userEvent.setup();
  await waitFor(() => expect(document.querySelector(`footer a[href$="/commit/${SHA}"]`), 'setup: trace.json has answered').not.toBeNull());
  const nav = screen.getByRole('navigation', { name: /^Primary/ });
  const entry = within(nav).queryByRole('button', { name: /^Plans?\b/ }) ?? within(nav).getByRole('link', { name: /^Plans?$/ });
  await user.click(entry);
  await waitFor(() => expect(planHrefs().sort()).toEqual(['#/plans/build', '#/plans/inv-001', '#/plans/ui']));
});
