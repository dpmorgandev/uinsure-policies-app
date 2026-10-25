// DAG-1 · the Plan entry of the primary nav offers every plan before, or without, landing on the build plan
// (bug-002 N4; inv-009 #11, I16; David 2026-10-23: fix the nav, not reword the acceptance line). Frame.tsx's navFor
// hard-wires the entry to #/plans/<the first plan of kind build>, so the ui plan and the investigations are reached
// only by first opening the build plan and then its plan tabs.
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

function serveTrace(): void {
  vi.stubGlobal('fetch', (input: string) =>
    Promise.resolve(
      String(input).endsWith('trace.json')
        ? new Response(JSON.stringify(trace), { status: 200, headers: { 'content-type': 'application/json' } })
        : notFound(),
    ),
  );
}

const planHrefs = (): string[] =>
  [...new Set(Array.from(document.querySelectorAll('a[href^="#/plans/"]')).map((a) => a.getAttribute('href') ?? ''))].filter((href) =>
    /^#\/plans\/[^/]+$/.test(href),
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('DAG-1 · activating the Plan nav entry offers build, ui and inv-001 without landing on the build plan', async () => {
  serveTrace();
  renderAppAt('');
  const user = userEvent.setup();
  await waitFor(() => expect(document.querySelector(`footer a[href$="/commit/${SHA}"]`), 'setup: trace.json has answered').not.toBeNull());
  const nav = screen.getByRole('navigation', { name: /^Primary/ });
  const entry = within(nav).queryByRole('button', { name: /^Plans?\b/ }) ?? within(nav).getByRole('link', { name: /^Plans?$/ });
  await user.click(entry);
  await waitFor(() => expect(planHrefs().sort(), 'the Plan entry offers every plan').toEqual(['#/plans/build', '#/plans/inv-001', '#/plans/ui']));
  expect(window.location.hash, 'the Plan entry has not opened the build plan on its own').not.toBe('#/plans/build');
});
