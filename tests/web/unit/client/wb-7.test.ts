// @vitest-environment node
// WB-7 · HTTP inspector. The exact request and response of every action. The app's fetch goes through loggingFetch,
// which keeps each exchange (method, path, request body, status, response body) in the request log, as it went over
// the wire, and hands the response on unread. On the recorded answers in docs/ui/fixture/api/.
import { describe, expect, test } from 'vitest';
import { loggingFetch, recordClaim } from '../../../../src/web/app/data/api';
import type { LoggedExchange } from '../../../../src/web/app/data/api';
import { answering, exchange, memoryStore, outcome, settle, unreachable } from './support/recorded';

const CLAIM = '070-could-2-claim-dated-today-201.json';
const REFUSED_CLAIM = '084-could-2a-claim-dated-tomorrow-422.json';

describe('the request log', () => {
  test('WB-7 · a claim through the logging fetch is logged with its method, path, request body, status and response body', async () => {
    const recorded = exchange(CLAIM, 1);
    const served = answering(recorded);
    const log: LoggedExchange[] = [];
    const fetch = outcome(() => loggingFetch(served.fetch, log));
    await settle(() => recordClaim({ fetch, storage: memoryStore() }, 'F3-MVFJRDH152', recorded.requestBody as { claimDate: string }));
    expect(log).toEqual([
      { method: 'POST', path: '/api/policies/F3-MVFJRDH152/claims', requestBody: recorded.requestBody, status: 201, responseBody: recorded.responseBody },
    ]);
  });

  test('WB-7 · a refused request is logged with the problem the API answered, exactly', async () => {
    const recorded = exchange(REFUSED_CLAIM, 1);
    expect(recorded.status, 'fixture setup: 084 exchange 1 is the 422').toBe(422);
    const served = answering(recorded);
    const log: LoggedExchange[] = [];
    const fetch = outcome(() => loggingFetch(served.fetch, log));
    await settle(() => recordClaim({ fetch, storage: memoryStore() }, 'F3-MVFJRZIXM3', recorded.requestBody as { claimDate: string }));
    expect(log[0]?.status).toBe(422);
    expect(log[0]?.responseBody).toEqual(recorded.responseBody);
  });

  test('WB-7 · a request that gets no answer is logged with a null status and no response body', async () => {
    const served = unreachable();
    const log: LoggedExchange[] = [];
    const fetch = outcome(() => loggingFetch(served.fetch, log));
    await settle(() => recordClaim({ fetch, storage: memoryStore() }, 'F3-X', { claimDate: '2026-10-19' }));
    expect(log).toEqual([{ method: 'POST', path: '/api/policies/F3-X/claims', requestBody: { claimDate: '2026-10-19' }, status: null, responseBody: null }]);
  });

  test('WB-7 · the logging fetch hands the caller the response unread, so the client still reads its body', async () => {
    const recorded = exchange(CLAIM, 1);
    const served = answering(recorded);
    const fetch = outcome(() => loggingFetch(served.fetch, []));
    const answer = await settle(() => recordClaim({ fetch, storage: memoryStore() }, 'F3-MVFJRDH152', recorded.requestBody as { claimDate: string }));
    expect(answer).toEqual({ kind: 'ok', status: 201, value: recorded.responseBody });
  });

  test('WB-7 · exchanges are logged in the order they were sent', async () => {
    const recorded = exchange(CLAIM, 1);
    const served = answering(recorded);
    const log: LoggedExchange[] = [];
    const fetch = outcome(() => loggingFetch(served.fetch, log));
    await settle(() => recordClaim({ fetch, storage: memoryStore() }, 'A1', { claimDate: '2026-10-19' }));
    await settle(() => recordClaim({ fetch, storage: memoryStore() }, 'B2', { claimDate: '2026-10-19' }));
    expect(log.map((e) => e.path)).toEqual(['/api/policies/A1/claims', '/api/policies/B2/claims']);
  });
});
