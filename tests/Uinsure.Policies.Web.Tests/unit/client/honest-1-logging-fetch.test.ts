// HONEST-1 · loggingFetch (src/Uinsure.Policies.Web/app/data/api.ts) records a rejected fetch exactly as it records one
// still in flight: status, response headers and response body all stay null, so nothing downstream can tell "no answer
// yet" from "no answer ever" (bug-002 N3; inv-011 I3). Once fetch rejects, the logged exchange must say so.
import { expect, test } from 'vitest';
import { loggingFetch } from '../../../../src/Uinsure.Policies.Web/app/data/api';
import type { LoggedExchange } from '../../../../src/Uinsure.Policies.Web/app/data/api';

test('HONEST-1 · once fetch rejects, the logged exchange no longer reads as one still waiting for its answer', async () => {
  let reject: (reason: unknown) => void = () => undefined;
  const network = (): Promise<Response> =>
    new Promise<Response>((_, fail) => {
      reject = fail;
    });
  const log: LoggedExchange[] = [];
  const sending = loggingFetch(network, log)('/api/policies', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  expect(log, 'setup: the exchange is logged as it is sent').toHaveLength(1);
  const inFlight = { ...(log[0] as LoggedExchange) };

  reject(new TypeError('Failed to fetch'));
  await sending.catch(() => undefined);

  expect({ ...(log[0] as LoggedExchange) }, 'the rejected exchange differs from the same exchange in flight').not.toEqual(inFlight);
});
