// @vitest-environment node
// WB-5 · Claims and renew. Record a claim and see the quote drop to £0; renew inside the window; cheque blocked for
// auto-renew. The client records a claim (recordClaim), quotes a cancellation (quoteCancellation) and renews
// (renewPolicy), handing back the API's answer as it came, recorded in docs/ui/fixture/api/: 070 a claim, 072 the
// quote after one, 092 the window's refusal, 098 cheque on an auto-renewing policy, 095 RENEW-3b, 100 RENEW-6.
// No 201 renewal is recorded (renewing inside the window needs the API's fake clock, docs/ui/fixture/api/fake-clock/),
// so the accepted renewal is answered with 070's own policy read-back plus a second term: the shape the API returns.
import { describe, expect, test } from 'vitest';
import { quoteCancellation, recordClaim, renewPolicy } from '../../../../src/web/app/data/api';
import { answering, exchange, memoryStore, settle } from './support/recorded';
import type { RecordedExchange } from './support/recorded';

const CLAIM = '070-could-2-claim-dated-today-201.json';
const QUOTE_AFTER_CLAIM = '072-could-2-quote-for-a-policy-with-a-claim-quotes-nothing-200.json';
const OUTSIDE_WINDOW = '092-renew-1-2-renew-on-the-day-of-sale-422.json';
const CHEQUE = '098-could-3-explicit-cheque-on-an-auto-renewing-policy-today-422.json';
const CANCELLED = '100-renew-6-renew-a-policy-cancelled-today-409.json';

const deps = (served: ReturnType<typeof answering>) => ({ fetch: served.fetch, storage: memoryStore() });

describe('a claim', () => {
  test('WB-5 · recordClaim posts the claim date and description as JSON to /api/policies/<reference>/claims', async () => {
    const recorded = exchange(CLAIM, 1);
    const served = answering(recorded);
    await settle(() => recordClaim(deps(served), 'F3-MVFJRDH152', recorded.requestBody as { claimDate: string; description: string }));
    expect(served.sent).toHaveLength(1);
    expect(served.sent[0]?.method).toBe('POST');
    expect(served.sent[0]?.url).toBe('/api/policies/F3-MVFJRDH152/claims');
    expect(served.sent[0]?.contentType).toBe('application/json');
    expect(served.sent[0]?.body).toEqual(recorded.requestBody);
  });

  test('WB-5 · a 201 claim answers with the claim exactly as the API returned it', async () => {
    const recorded = exchange(CLAIM, 1);
    const served = answering(recorded);
    const answer = await settle(() => recordClaim(deps(served), 'F3-MVFJRDH152', recorded.requestBody as { claimDate: string }));
    expect(answer).toEqual({ kind: 'ok', status: 201, value: recorded.responseBody });
  });
});

describe('the quote', () => {
  test('WB-5 · quoteCancellation asks GET /api/policies/<reference>/cancellation-quote with the date, and no body', async () => {
    const served = answering(exchange(QUOTE_AFTER_CLAIM, 2));
    await settle(() => quoteCancellation(deps(served), 'F3-MVFJRGRPYD', '2026-10-22'));
    expect(served.sent[0]?.method).toBe('GET');
    expect(served.sent[0]?.url).toBe('/api/policies/F3-MVFJRGRPYD/cancellation-quote?cancellationDate=2026-10-22');
    expect(served.sent[0]?.body).toBeUndefined();
  });

  test('WB-5 · the quote after a claim is handed back as the API sent it: 0 refunded under COULD-2', async () => {
    const recorded = exchange(QUOTE_AFTER_CLAIM, 2);
    const served = answering(recorded);
    const answer = await settle(() => quoteCancellation(deps(served), 'F3-MVFJRGRPYD', '2026-10-22'));
    expect(answer).toEqual({ kind: 'ok', status: 200, value: recorded.responseBody });
    if (answer.kind !== 'ok') return;
    expect(answer.value.totalRefund).toBe(0);
    expect(answer.value.ruleApplied).toBe('COULD-2');
  });
});

describe('a renewal', () => {
  test('WB-5 · renewPolicy posts the amount and payment method to /api/policies/<reference>/renewals', async () => {
    const recorded = exchange(CHEQUE, 1);
    const served = answering(recorded);
    await settle(() => renewPolicy(deps(served), 'F4-MVFJSLYM28', { amount: 472.3, paymentMethod: 'Cheque' }));
    expect(served.sent[0]?.method).toBe('POST');
    expect(served.sent[0]?.url).toBe('/api/policies/F4-MVFJSLYM28/renewals');
    expect(served.sent[0]?.body).toEqual(recorded.requestBody);
  });

  test('WB-5 · a renewal with no payment method sends only the amount (auto-renew off)', async () => {
    const recorded = exchange(OUTSIDE_WINDOW, 1);
    const served = answering(recorded);
    await settle(() => renewPolicy(deps(served), 'F4-MVFJSC6LXX', { amount: 401.16 }));
    expect(served.sent[0]?.body).toEqual({ amount: 401.16 });
  });

  test('WB-5 · a renewal inside the window answers with the renewed policy, its new term last, as the API returned it', async () => {
    const policy = exchange(CLAIM, 2).responseBody as { terms: { termNumber: number }[] };
    const renewed = {
      ...policy,
      currentTermNumber: 1,
      terms: [...policy.terms, { termNumber: 2, startDate: '2027-10-19', endDate: '2028-10-18', amount: 401.16, paymentReference: 'PAY-2' }],
    };
    const accepted: RecordedExchange = { ...exchange(OUTSIDE_WINDOW, 1), status: 201, responseBody: renewed };
    const served = answering(accepted);
    const answer = await settle(() => renewPolicy(deps(served), 'F3-MVFJRDH152', { amount: 401.16 }));
    expect(answer).toEqual({ kind: 'ok', status: 201, value: renewed });
  });

  test('WB-5 · a renewal outside the window is a 422 problem under RENEW-1/2, its detail naming the window', async () => {
    const recorded = exchange(OUTSIDE_WINDOW, 1);
    const served = answering(recorded);
    const answer = await settle(() => renewPolicy(deps(served), 'F4-MVFJSC6LXX', { amount: 401.16 }));
    expect(answer.kind).toBe('problem');
    if (answer.kind !== 'problem') return;
    expect(answer.status).toBe(422);
    expect(answer.problem.ruleId).toBe('RENEW-1/2');
    expect(answer.problem.detail).toBe((recorded.responseBody as { detail: string }).detail);
  });

  test('WB-5 · cheque on an auto-renewing policy comes back with a COULD-3 item among the problems', async () => {
    const recorded = exchange(CHEQUE, 1);
    const served = answering(recorded);
    const answer = await settle(() => renewPolicy(deps(served), 'F4-MVFJSLYM28', { amount: 472.3, paymentMethod: 'Cheque' }));
    expect(answer.kind).toBe('problem');
    if (answer.kind !== 'problem') return;
    expect(answer.problem.items.map((i) => i.ruleId)).toContain('COULD-3');
  });

  test('WB-5 · renewing a cancelled policy is a 409 problem under RENEW-6', async () => {
    const recorded = exchange(CANCELLED, 2);
    expect(recorded.status, 'fixture setup: 100 exchange 2 is the 409').toBe(409);
    const served = answering(recorded);
    const answer = await settle(() => renewPolicy(deps(served), 'F4-X', recorded.requestBody as { amount: number }));
    expect(answer.kind).toBe('problem');
    if (answer.kind !== 'problem') return;
    expect(answer.status).toBe(409);
    expect(answer.problem.ruleId).toBe('RENEW-6');
  });
});
