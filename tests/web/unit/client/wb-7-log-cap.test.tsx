// WB-7 · the workbench's request log (src/web/app/workbench/browser.ts) is capped for the life of the page (W3
// security A4 S1, U8's carry to U10): the page keeps a bounded number of exchanges, the newest, however many it
// sends. Not re-copying settled entries (wb-7-log-growth) slows the growth; only a cap bounds it. After 2000 exchanges
// the log holds fewer than 2000, the newest is in it, and 500 more leave its length where it was.
// The fetch is a stub that answers at once: this is about the log, not the network.
import { act, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { browserDeps, useRequestLog } from '../../../../src/web/app/workbench/browser';
import type { LoggedExchange } from '../../../../src/web/app/data/api';

let latest: readonly LoggedExchange[] = [];

function Probe() {
  latest = useRequestLog();
  return null;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('WB-7 · the request log is capped: after 2000 exchanges it holds fewer, the newest kept, and it grows no further', async () => {
  vi.stubGlobal('fetch', () => Promise.resolve(new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } })));
  render(<Probe />);
  const deps = browserDeps();

  await act(async () => {
    for (let n = 1; n <= 2000; n += 1) await deps.fetch(`/api/policies/U10CAP-${n}`);
  });
  const capped = latest.length;
  expect(capped, 'the log holds fewer than the 2000 exchanges sent').toBeLessThan(2000);
  expect(latest.at(-1)?.path, 'the newest exchange is the last one kept').toBe('/api/policies/U10CAP-2000');

  await act(async () => {
    for (let n = 2001; n <= 2500; n += 1) await deps.fetch(`/api/policies/U10CAP-${n}`);
  });
  expect(latest.length, 'the log grows no further').toBe(capped);
  expect(latest.at(-1)?.path, 'the newest exchange is still the last one kept').toBe('/api/policies/U10CAP-2500');
});
