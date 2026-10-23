// @vitest-environment node
// WB-2 · Policy view. By reference: status, current term, terms timeline (the dates the API returns; no window is
// shaded or computed), holders, property, payments, refunds, claims. The client reads one policy (getPolicy) and
// hands over the API's answer as it came, recorded in docs/ui/fixture/api/ (045 read back in full, 048 a
// lower-case reference, 063 a cancelled policy with a refund, 071 a claimed and cancelled one).
import { describe, expect, test } from 'vitest';
import { getPolicy } from '../../../../src/Uinsure.Policies.Web/app/data/api';
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

  // inv-006 I3: the populated sections, from recorded answers that hold them (063 and 071).
  test("WB-2 · a cancelled policy's refunds and cancellation are handed back exactly as the API sent them (063)", async () => {
    const recorded = exchange(REC.cancelled, 2);
    const sentBody = recorded.responseBody as { refunds: unknown[]; claims: unknown[]; cancellation: unknown };
    expect(sentBody.refunds.length, 'fixture setup: 063 holds a refund').toBeGreaterThan(0);
    expect(sentBody.cancellation, 'fixture setup: 063 holds a cancellation').not.toBeNull();
    const served = answering(recorded);
    const answer = await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'F3-MVFJR27M9J'));
    expect(answer.kind).toBe('ok');
    if (answer.kind !== 'ok') return;
    expect(answer.value.refunds).toEqual(sentBody.refunds);
    expect(answer.value.claims).toEqual(sentBody.claims);
    expect(answer.value.cancellation).toEqual(sentBody.cancellation);
  });

  test("WB-2 · a claimed policy's claims and cancellation are handed back exactly as the API sent them (071)", async () => {
    const recorded = exchange(REC.claimedThenCancelled, 3);
    const sentBody = recorded.responseBody as { refunds: unknown[]; claims: unknown[]; cancellation: unknown };
    expect(sentBody.claims.length, 'fixture setup: 071 holds a claim').toBeGreaterThan(0);
    expect(sentBody.cancellation, 'fixture setup: 071 holds a cancellation').not.toBeNull();
    const served = answering(recorded);
    const answer = await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'F3-MVFJRF5K95'));
    expect(answer.kind).toBe('ok');
    if (answer.kind !== 'ok') return;
    expect(answer.value.claims).toEqual(sentBody.claims);
    expect(answer.value.refunds).toEqual(sentBody.refunds);
    expect(answer.value.cancellation).toEqual(sentBody.cancellation);
  });

  test('WB-2 · a policy the API never answers for is reported unreachable, with no status or policy', async () => {
    const served = unreachable();
    const answer = await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'F2-MVFJQA9DQG'));
    expect(answer.kind).toBe('unreachable');
    expect(answer).not.toHaveProperty('status');
    expect(answer).not.toHaveProperty('value');
  });
});
