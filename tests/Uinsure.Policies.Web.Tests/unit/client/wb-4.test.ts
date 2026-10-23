// @vitest-environment node
// WB-4 · Cancel with quote. The client asks for a cancellation quote (quoteCancellation) and sends the cancellation
// (cancelPolicy), and hands back the API's answer as it came: ruleApplied, the day counts and the refund maths are the
// API's, never worked out here. On the recorded answers in docs/ui/fixture/api/: 068 a quote then a cancel for the
// same date, 069 a quote, 074 a quote dated yesterday (422), 076 a second cancel (409), 077 a quote of a cancelled
// policy (409).
import { describe, expect, test } from 'vitest';
import { cancelPolicy, quoteCancellation, readProblem } from '../../../../src/Uinsure.Policies.Web/app/data/api';
import { answering, exchange, memoryStore, settle, unreachable } from './support/recorded';

const CANCEL_REC = {
  /** COULD-1: 1 GET quote 200 F3-MVFJRA2XTI for 2027-01-27, 2 POST cancellation 201 for the same date. */
  agree: '068-could-1-quote-then-cancel-for-the-same-date-agree-201.json',
  /** COULD-1: 2 GET quote 200 F3-MVFJRBS7C7 for 2026-12-02. */
  quoted: '069-could-1-quote-changes-nothing-200.json',
  /** CANCEL-3: 1 GET quote 422 F3-MVFJRJURJ4 for yesterday. */
  quotePast: '074-cancel-3-quote-dated-yesterday-422.json',
  /** CANCEL-4: 2 POST cancellation 409 F3-MVFJRN08DV, already cancelled. */
  cancelTwice: '076-cancel-4-cancel-twice-409.json',
  /** CANCEL-4: 2 GET quote 409 F3-MVFJROKG89, already cancelled. */
  quoteCancelled: '077-cancel-4-quote-a-cancelled-policy-409.json',
} as const;

const deps = (fetch: Parameters<typeof quoteCancellation>[0]['fetch']) => ({ fetch, storage: memoryStore() });

describe('the quote', () => {
  test('WB-4 · quoteCancellation asks GET /api/policies/<reference>/cancellation-quote?cancellationDate=<date>, once, with no body', async () => {
    const served = answering(exchange(CANCEL_REC.quoted, 2));
    await settle(() => quoteCancellation(deps(served.fetch), 'F3-MVFJRBS7C7', '2026-12-02'));
    expect(served.sent).toHaveLength(1);
    expect(served.sent[0]?.method).toBe('GET');
    expect(served.sent[0]?.url).toBe('/api/policies/F3-MVFJRBS7C7/cancellation-quote?cancellationDate=2026-12-02');
    expect(served.sent[0]?.body).toBeUndefined();
  });

  test('WB-4 · a quote\'s reference and date stay one path segment and one query value each', async () => {
    const served = answering(exchange(CANCEL_REC.quoted, 2));
    await settle(() => quoteCancellation(deps(served.fetch), '../health?x#y', '2026-12-02&cancellationDate=2020-01-01'));
    expect(served.sent[0]?.url).toBe(
      '/api/policies/..%2Fhealth%3Fx%23y/cancellation-quote?cancellationDate=2026-12-02%26cancellationDate%3D2020-01-01',
    );
  });

  test("WB-4 · a quote's 200 is handed back exactly as the API returned it: ruleApplied, day counts, refunds and quotedOn", async () => {
    const recorded = exchange(CANCEL_REC.quoted, 2);
    const served = answering(recorded);
    const answer = await settle(() => quoteCancellation(deps(served.fetch), 'F3-MVFJRBS7C7', '2026-12-02'));
    expect(answer).toEqual({ kind: 'ok', status: 200, value: recorded.responseBody });
  });

  test('WB-4 · a quote refused 422 for a past date is a problem under CANCEL-3, as the API wrote it', async () => {
    const recorded = exchange(CANCEL_REC.quotePast, 1);
    const served = answering(recorded);
    const answer = await settle(() => quoteCancellation(deps(served.fetch), 'F3-MVFJRJURJ4', '2026-10-18'));
    expect(answer).toEqual({ kind: 'problem', status: 422, problem: readProblem(422, recorded.responseBody) });
    if (answer.kind !== 'problem') return;
    expect(answer.problem.ruleId).toBe('CANCEL-3');
  });

  test('WB-4 · a quote of a cancelled policy refused 409 is a problem under CANCEL-4, with its detail', async () => {
    const recorded = exchange(CANCEL_REC.quoteCancelled, 2);
    const served = answering(recorded);
    const answer = await settle(() => quoteCancellation(deps(served.fetch), 'F3-MVFJROKG89', '2027-01-07'));
    expect(answer).toEqual({ kind: 'problem', status: 409, problem: readProblem(409, recorded.responseBody) });
    if (answer.kind !== 'problem') return;
    expect(answer.problem.ruleId).toBe('CANCEL-4');
    expect(answer.problem.detail).toBe((recorded.responseBody as { detail: string }).detail);
  });

  test('WB-4 · a quote the API never answers is reported unreachable, with no status or quote', async () => {
    const served = unreachable();
    const answer = await settle(() => quoteCancellation(deps(served.fetch), 'F3-MVFJRBS7C7', '2026-12-02'));
    expect(answer.kind).toBe('unreachable');
    expect(answer).not.toHaveProperty('status');
    expect(answer).not.toHaveProperty('value');
  });
});

describe('the cancellation', () => {
  test('WB-4 · cancelPolicy POSTs the date as JSON { cancellationDate } to /api/policies/<reference>/cancellation, once', async () => {
    const recorded = exchange(CANCEL_REC.agree, 2);
    const served = answering(recorded);
    await settle(() => cancelPolicy(deps(served.fetch), 'F3-MVFJRA2XTI', '2027-01-27'));
    expect(served.sent).toHaveLength(1);
    expect(served.sent[0]?.method).toBe('POST');
    expect(served.sent[0]?.url).toBe('/api/policies/F3-MVFJRA2XTI/cancellation');
    expect(served.sent[0]?.contentType).toBe('application/json');
    expect(served.sent[0]?.body).toEqual(recorded.requestBody);
  });

  test('WB-4 · a cancellation\'s reference stays one path segment', async () => {
    const served = answering(exchange(CANCEL_REC.agree, 2));
    await settle(() => cancelPolicy(deps(served.fetch), '../health?x#y', '2027-01-27'));
    expect(served.sent[0]?.url).toBe('/api/policies/..%2Fhealth%3Fx%23y/cancellation');
  });

  test("WB-4 · a cancellation's 201 is handed back exactly as the API returned it: ruleApplied, terms and refunds", async () => {
    const recorded = exchange(CANCEL_REC.agree, 2);
    const served = answering(recorded);
    const answer = await settle(() => cancelPolicy(deps(served.fetch), 'F3-MVFJRA2XTI', '2027-01-27'));
    expect(answer).toEqual({ kind: 'ok', status: 201, value: recorded.responseBody });
  });

  test('WB-4 · the quote and the cancellation for the same date come back with the same date, rule and total refund (068)', async () => {
    const quoted = await settle(() => quoteCancellation(deps(answering(exchange(CANCEL_REC.agree, 1)).fetch), 'F3-MVFJRA2XTI', '2027-01-27'));
    const cancelled = await settle(() => cancelPolicy(deps(answering(exchange(CANCEL_REC.agree, 2)).fetch), 'F3-MVFJRA2XTI', '2027-01-27'));
    expect(quoted.kind).toBe('ok');
    expect(cancelled.kind).toBe('ok');
    if (quoted.kind !== 'ok' || cancelled.kind !== 'ok') return;
    expect(cancelled.value.cancellationDate).toBe(quoted.value.cancellationDate);
    expect(cancelled.value.ruleApplied).toBe(quoted.value.ruleApplied);
    expect(cancelled.value.totalRefund).toBe(quoted.value.totalRefund);
    expect(cancelled.value.terms).toEqual(quoted.value.terms);
  });

  test('WB-4 · a second cancel refused 409 is a problem under CANCEL-4, as the API wrote it', async () => {
    const recorded = exchange(CANCEL_REC.cancelTwice, 2);
    const served = answering(recorded);
    const answer = await settle(() => cancelPolicy(deps(served.fetch), 'F3-MVFJRN08DV', '2026-11-28'));
    expect(answer).toEqual({ kind: 'problem', status: 409, problem: readProblem(409, recorded.responseBody) });
    if (answer.kind !== 'problem') return;
    expect(answer.problem.ruleId).toBe('CANCEL-4');
  });

  test('WB-4 · a cancellation the API never answers is reported unreachable, with no status or result', async () => {
    const served = unreachable();
    const answer = await settle(() => cancelPolicy(deps(served.fetch), 'F3-MVFJRA2XTI', '2027-01-27'));
    expect(answer.kind).toBe('unreachable');
    expect(answer).not.toHaveProperty('status');
    expect(answer).not.toHaveProperty('value');
  });
});
