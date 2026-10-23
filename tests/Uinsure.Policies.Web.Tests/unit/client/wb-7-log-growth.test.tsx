// WB-7 · the workbench's request log (src/Uinsure.Policies.Web/app/workbench/browser.ts) does not cost the page more with every
// exchange it has already logged (W3 security A4 S1): either the log is capped, or publish() stops re-copying the
// whole log on every exchange. Either is enough: after 2000 exchanges the log the page reads holds fewer than 2000
// (a cap below that), or an exchange that has settled is the same object in every later snapshot (not re-copied).
// The fetch is a stub that answers at once: this is about the log, not the network.
import { act, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { browserDeps, useRequestLog } from '../../../../src/Uinsure.Policies.Web/app/workbench/browser';
import type { LoggedExchange } from '../../../../src/Uinsure.Policies.Web/app/data/api';

const SENT = 2000;

let latest: readonly LoggedExchange[] = [];

function Probe() {
  latest = useRequestLog();
  return null;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('WB-7 · the request log is capped, or a settled exchange is not re-copied each time another is logged', async () => {
  vi.stubGlobal('fetch', () => Promise.resolve(new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } })));
  render(<Probe />);
  const deps = browserDeps();

  await act(async () => {
    await deps.fetch('/api/policies/U8LOG-1');
  });
  expect(latest, 'setup: the first exchange is logged and answered').toHaveLength(1);
  const first = latest[0];
  expect(first?.status, 'setup: the first exchange has settled').toBe(200);

  await act(async () => {
    for (let n = 2; n <= SENT; n += 1) await deps.fetch(`/api/policies/U8LOG-${n}`);
  });
  const capped = latest.length < SENT;
  const kept = latest.includes(first as LoggedExchange);
  expect({ capped, kept }, 'the log is capped below 2000, or the settled first exchange is the same object, not a copy').not.toEqual({
    capped: false,
    kept: false,
  });
});
