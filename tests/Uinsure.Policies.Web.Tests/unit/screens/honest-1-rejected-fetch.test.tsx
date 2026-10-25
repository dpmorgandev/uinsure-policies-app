// HONEST-1 · a request whose fetch is rejected (the API down, or the browser blocking it) never got a status, yet main
// shows it as still waiting for one (bug-002 N3; inv-011 I3, the N2 carry-over): loggingFetch leaves the logged exchange
// at status null when fetch rejects (app/data/api.ts), so the requests drawer reads "Waiting" and the request log
// "pending", a state the API never gave. It must read as failed in both.
// Sent through the page's own logging fetch (browserDeps) to a fetch that rejects as the browser does.
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestsDrawer } from '../../../../src/Uinsure.Policies.Web/app/workbench/RequestsDrawer';
import { browserDeps } from '../../../../src/Uinsure.Policies.Web/app/workbench/browser';
import { notFound, renderAppAt } from './support/app';

/** The API is not there: every /api request is rejected, as fetch rejects on a refused connection. */
function apiDown(): void {
  vi.stubGlobal('fetch', async (input: string) => {
    if (!String(input).startsWith('/api/')) return notFound();
    throw new TypeError('Failed to fetch');
  });
}

/** Sends a sale to `path` through the page's logging fetch; its rejection is the test's to read, not to throw. */
async function sendRejected(path: string): Promise<void> {
  await act(async () => {
    await browserDeps()
      .fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      .catch(() => undefined);
  });
}

const textOf = (el: Element): string => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('HONEST-1 · a request whose fetch is rejected reads as failed in the requests drawer, never Waiting', async () => {
  apiDown();
  render(<RequestsDrawer />);
  await sendRejected('/api/policies/N3U-DRAWER');
  const drawer = screen.getByRole('complementary', { name: 'The requests as sent' });
  const item = within(drawer)
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes('/policies/N3U-DRAWER'));
  expect(item, 'setup: the drawer lists the rejected request').toBeDefined();
  const line = textOf(item as HTMLElement);
  expect(line, 'the rejected request is not drawn as waiting for an answer').not.toMatch(/waiting/i);
  expect(line, 'the rejected request is drawn as failed').toMatch(/fail/i);
});

test('HONEST-1 · a request whose fetch is rejected reads as failed in the request log, never pending', async () => {
  apiDown();
  renderAppAt('workbench/requests');
  await screen.findByRole('heading', { level: 1, name: 'Requests' });
  await sendRejected('/api/policies/N3U-LOG');
  const row = screen.getAllByRole('row').find((r) => r.textContent?.includes('/policies/N3U-LOG'));
  expect(row, 'setup: the request log lists the rejected request').toBeDefined();
  const line = textOf(row as HTMLElement);
  expect(line, 'the rejected request is not drawn as pending or waiting').not.toMatch(/pending|waiting/i);
  expect(line, 'the rejected request is drawn as failed').toMatch(/fail/i);
});
