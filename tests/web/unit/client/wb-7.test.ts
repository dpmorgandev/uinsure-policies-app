// @vitest-environment node
// WB-7 · HTTP inspector. The exact request and response of every action. The app's fetch goes through loggingFetch,
// which keeps each exchange (method, path, headers both ways, request body, status, response body) in the request log, as it went over
// the wire, and hands the response on unread. On the recorded answers in docs/ui/fixture/api/.
import { describe, expect, test } from 'vitest';
import { loggingFetch, recordClaim } from '../../../../src/web/app/data/api';
import type { Fetch, LoggedExchange } from '../../../../src/web/app/data/api';
import { answering, exchange, memoryStore, outcome, settle } from './support/recorded';
import type { RecordedExchange } from './support/recorded';

const CLAIM = '070-could-2-claim-dated-today-201.json';
const REFUSED_CLAIM = '084-could-2a-claim-dated-tomorrow-422.json';

// A2/I3 (a strengthening of the red-committed assertions): the log keeps the exchange as it went over the wire, so
// it holds the headers as well as the bodies, and each body as the exact text, not a parsed value. "Exact" is what
// the page set and what it received: a browser's fetch never sees the headers the browser adds itself (user-agent,
// host), so the request headers are the client's own, not the recording's Postman set.

/** What the client put on the wire: its headers and its body, as text. */
interface Wire {
  headers: Record<string, string>;
  body: string | null;
}

/** The recorded answer's own headers, less the transfer framing a Response sets itself. */
function servedHeaders(recorded: RecordedExchange): Record<string, string> {
  return Object.fromEntries(Object.entries(recorded.responseHeaders).filter(([name]) => name !== 'transfer-encoding'));
}

/**
 * A fetch that answers with the recorded status and headers and this exact body text, and keeps what the client
 * sent. The text is laid out as JSON.stringify never would, so a log that parses and re-writes it can't match it.
 */
function servingText(recorded: RecordedExchange, text: string): { fetch: Fetch; sent: Wire[] } {
  const sent: Wire[] = [];
  const fetch: Fetch = async (_input, init) => {
    sent.push({ headers: Object.fromEntries(new Headers(init?.headers).entries()), body: typeof init?.body === 'string' ? init.body : null });
    return new Response(text, { status: recorded.status, headers: servedHeaders(recorded) });
  };
  return { fetch, sent };
}

/** A fetch that fails before an answer, and keeps what the client sent. */
function failingText(): { fetch: Fetch; sent: Wire[] } {
  const sent: Wire[] = [];
  const fetch: Fetch = async (_input, init) => {
    sent.push({ headers: Object.fromEntries(new Headers(init?.headers).entries()), body: typeof init?.body === 'string' ? init.body : null });
    throw new TypeError('Failed to fetch');
  };
  return { fetch, sent };
}

/** The recorded body as text the API could have sent, in a layout a re-stringified parse never produces. */
const asWireText = (body: unknown): string => JSON.stringify(body, null, 2) + '\n';

describe('the request log', () => {
  test('WB-7 · a claim through the logging fetch is logged with its method, path, request headers, exact request body, status, response headers and exact response body', async () => {
    const recorded = exchange(CLAIM, 1);
    const text = asWireText(recorded.responseBody);
    const served = servingText(recorded, text);
    const log: LoggedExchange[] = [];
    const fetch = outcome(() => loggingFetch(served.fetch, log));
    await settle(() => recordClaim({ fetch, storage: memoryStore() }, 'F3-MVFJRDH152', recorded.requestBody as { claimDate: string }));
    const wire = served.sent[0];
    expect(wire?.body, 'setup: the client sent its body as text').toEqual(expect.any(String));
    expect(wire?.headers['content-type'], 'setup: the client set its content type').toBe('application/json');
    expect(servedHeaders(recorded), 'setup: the recording served a location').toHaveProperty('location', '/policies/F3-MVFJRDH152');
    expect(log).toEqual([
      {
        method: 'POST',
        path: '/api/policies/F3-MVFJRDH152/claims',
        requestHeaders: wire?.headers,
        requestBody: wire?.body,
        status: 201,
        responseHeaders: servedHeaders(recorded),
        responseBody: text,
      },
    ]);
  });

  test('WB-7 · a refused request is logged with the problem the API answered, exactly', async () => {
    const recorded = exchange(REFUSED_CLAIM, 1);
    expect(recorded.status, 'fixture setup: 084 exchange 1 is the 422').toBe(422);
    const text = asWireText(recorded.responseBody);
    const served = servingText(recorded, text);
    const log: LoggedExchange[] = [];
    const fetch = outcome(() => loggingFetch(served.fetch, log));
    await settle(() => recordClaim({ fetch, storage: memoryStore() }, 'F3-MVFJRZIXM3', recorded.requestBody as { claimDate: string }));
    expect(log[0]?.status).toBe(422);
    expect(log[0]).toHaveProperty('responseHeaders', servedHeaders(recorded));
    expect(log[0]?.responseBody).toBe(text);
  });

  test('WB-7 · a request that gets no answer is logged with a null status and no response body', async () => {
    const served = failingText();
    const log: LoggedExchange[] = [];
    const fetch = outcome(() => loggingFetch(served.fetch, log));
    await settle(() => recordClaim({ fetch, storage: memoryStore() }, 'F3-X', { claimDate: '2026-10-19' }));
    const wire = served.sent[0];
    expect(log).toEqual([
      {
        method: 'POST',
        path: '/api/policies/F3-X/claims',
        requestHeaders: wire?.headers,
        requestBody: wire?.body,
        status: null,
        responseHeaders: null,
        responseBody: null,
      },
    ]);
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
