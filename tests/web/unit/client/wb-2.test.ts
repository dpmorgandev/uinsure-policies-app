// @vitest-environment node
// WB-2 · Policy view. By reference: status, current term, terms timeline (the dates the API returns; no window is
// shaded or computed), holders, property, payments, refunds, claims. The client reads one policy (getPolicy) and
// hands over the API's answer as it came, recorded in docs/ui/fixture/api/ (045 read back in full, 048 a
// lower-case reference).
import { describe, expect, test } from 'vitest';
import { getPolicy } from '../../../../src/web/app/data/api';
import { REC, answering, exchange, memoryStore, settle, unreachable } from './support/recorded';

describe('the request', () => {
  test('WB-2 · getPolicy asks for /api/policies/<reference>, once, with no body', async () => {
    const served = answering(exchange(REC.readBack, 1));
    await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'F2-MVFJQA9DQG'));
    expect(served.sent).toHaveLength(1);
    expect(served.sent[0]?.method).toBe('GET');
    expect(served.sent[0]?.url).toBe('/api/policies/F2-MVFJQA9DQG');
    expect(served.sent[0]?.body).toBeUndefined();
  });

  test('WB-2 · a lower-case reference is asked for as typed, and the API finds the policy under its own reference', async () => {
    const recorded = exchange(REC.lowerCase, 1);
    const served = answering(recorded);
    const answer = await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'f2-mvfjqeynmy'));
    expect(served.sent[0]?.url, 'the client computes no normalisation: the API does').toBe('/api/policies/f2-mvfjqeynmy');
    expect(answer.kind).toBe('ok');
    if (answer.kind !== 'ok') return;
    expect(answer.value.reference).toBe('F2-MVFJQEYNMY');
  });

  test('WB-2 · a reference holding "/", "?" or "#" stays one path segment, and reaches no other endpoint', async () => {
    const served = answering(exchange(REC.unknown, 0));
    await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, '../health?x#y'));
    expect(served.sent[0]?.url).toBe('/api/policies/..%2Fhealth%3Fx%23y');
  });
});

describe('the answer', () => {
  test('WB-2 · a 200 answers with the policy exactly as the API returned it, every section and date untouched', async () => {
    const recorded = exchange(REC.readBack, 1);
    const served = answering(recorded);
    const answer = await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'F2-MVFJQA9DQG'));
    expect(answer).toEqual({ kind: 'ok', status: 200, value: recorded.responseBody });
  });

  test("WB-2 · a policy's empty refunds and claims and its null cancellation are kept as the API sent them", async () => {
    const served = answering(exchange(REC.readBack, 1));
    const answer = await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'F2-MVFJQA9DQG'));
    expect(answer.kind).toBe('ok');
    if (answer.kind !== 'ok') return;
    expect(answer.value.refunds).toEqual([]);
    expect(answer.value.claims).toEqual([]);
    expect(answer.value.cancellation, 'null, never a default').toBeNull();
  });

  test('WB-2 · a policy the API never answers for is reported unreachable, with no status or policy', async () => {
    const served = unreachable();
    const answer = await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'F2-MVFJQA9DQG'));
    expect(answer.kind).toBe('unreachable');
    expect(answer).not.toHaveProperty('status');
    expect(answer).not.toHaveProperty('value');
  });
});
