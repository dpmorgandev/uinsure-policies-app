// HONEST-1 · a request whose fetch is rejected is announced and tagged as failed in the requests drawer, never
// "answered" or "Problem" (bug-002 N4; bug-002/N3 review A1 R4, P2). N3 made RequestsDrawer pass `outcome: 'problem'`
// and a "The request failed" note for it, but the kit InspectorDrawer still announces any outcome but pending as
// "Request #n answered" and tags a status-less problem "Problem": the API never answered and gave no problem.
// Sent through the page's own logging fetch (browserDeps) to a fetch that rejects as the browser does.
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { RequestsDrawer } from '../../../../src/Uinsure.Policies.Web/app/workbench/RequestsDrawer';
import { browserDeps } from '../../../../src/Uinsure.Policies.Web/app/workbench/browser';
import { notFound } from './support/app';

function apiDown(): void {
  vi.stubGlobal('fetch', async (input: string) => {
    if (!String(input).startsWith('/api/')) return notFound();
    throw new TypeError('Failed to fetch');
  });
}

async function sendRejected(path: string): Promise<void> {
  await act(async () => {
    await browserDeps()
      .fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      .catch(() => undefined);
  });
}

const textOf = (el: Element | null | undefined): string => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The drawer, after one rejected sale to `path` is the latest request. */
async function drawerAfterRejected(path: string): Promise<HTMLElement> {
  apiDown();
  render(<RequestsDrawer />);
  await sendRejected(path);
  return screen.getByRole('complementary', { name: 'The requests as sent' });
}

test('HONEST-1 · the requests drawer announces a rejected fetch as failed, never as answered', async () => {
  const drawer = await drawerAfterRejected('/api/policies/N4U-ANNOUNCE');
  const announced = textOf(within(drawer).getByRole('status'));
  expect(announced, 'setup: the drawer announces the latest request').toMatch(/#1/);
  expect(announced, 'a request that got no response is not announced as answered').not.toMatch(/answered/i);
  expect(announced, 'the rejected request is announced as failed').toMatch(/fail/i);
});

test("HONEST-1 · the requests drawer tags a rejected fetch as failed, never 'Problem'", async () => {
  const drawer = await drawerAfterRejected('/api/policies/N4U-TAG');
  const item = within(drawer)
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes('/policies/N4U-TAG'));
  expect(item, 'setup: the drawer lists the rejected request').toBeDefined();
  const tag = (item as HTMLElement).querySelector('[data-status]');
  expect(tag, 'setup: the request carries a status tag').not.toBeNull();
  expect(textOf(tag), 'the API gave no problem, so the tag does not say Problem').not.toMatch(/problem/i);
  expect(textOf(tag), 'the tag says the request failed').toMatch(/fail/i);
});
