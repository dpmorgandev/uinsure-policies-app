// @vitest-environment node
// WB-3 · Problem details. Every 400/404/409/422 rendered from its ProblemDetails, each violation as a rule chip.
// The client reads a problem (readProblem, and through sellPolicy and getPolicy) into its title, status, detail and
// rule, and one item per message: a 422's violations, each with its rule and no field (the API names none), and a
// 400's errors, each under its key as sent and, where the key is a sell form field, that field. Every expected
// value is the API's, recorded in docs/ui/fixture/api/.
import { describe, expect, test } from 'vitest';
import { getPolicy, readProblem, sellPolicy } from '../../../../src/Uinsure.Policies.Web/app/data/api';
import type { ApiAnswer, Policy, Problem, SellRequest } from '../../../../src/Uinsure.Policies.Web/app/data/api';
import { REC, answering, answeringText, exchange, memoryStore, outcome, settle } from './support/recorded';
import type { RecordedExchange } from './support/recorded';

interface RecordedProblem {
  title: string;
  status: number;
  detail?: string;
  ruleId?: string;
  violations?: { ruleId: string; detail: string }[];
  errors?: Record<string, string[]>;
}

const problemIn = (recorded: RecordedExchange): RecordedProblem => recorded.responseBody as RecordedProblem;

/** The problem readProblem makes of a recorded answer. */
const read = (recorded: RecordedExchange): Problem => outcome(() => readProblem(recorded.status, recorded.responseBody));

/** The problem an answer carries; fails, as an assertion, when the answer is not a problem. */
function problemOf(answer: ApiAnswer<Policy>, status: number): Problem {
  expect(answer.kind, `the answer is a problem (it was: ${JSON.stringify(answer)})`).toBe('problem');
  expect(answer).toHaveProperty('status', status);
  return (answer as { kind: 'problem'; problem: Problem }).problem;
}

describe('422', () => {
  test("WB-3 · a 422 from the sale is a problem with the API's title, status, detail and rule", async () => {
    const recorded = exchange(REC.refused, 0);
    const served = answering(recorded);
    const answer = await settle(() => sellPolicy({ fetch: served.fetch, storage: memoryStore() }, recorded.requestBody as SellRequest));
    const problem = problemOf(answer, 422);
    const sent = problemIn(recorded);
    expect({ status: problem.status, title: problem.title, detail: problem.detail, ruleId: problem.ruleId }).toEqual({
      status: 422,
      title: sent.title,
      detail: sent.detail,
      ruleId: sent.ruleId,
    });
  });

  test('WB-3 · a 422 lists every violation the API returned, in its order, each with its detail and rule', () => {
    const recorded = exchange(REC.refused, 0);
    const violations = problemIn(recorded).violations ?? [];
    expect(violations, 'fixture: SELL-2, SELL-4, SELL-5 and SELL-7').toHaveLength(4);
    const problem = read(recorded);
    expect(problem.items.map((i) => ({ message: i.message, ruleId: i.ruleId }))).toEqual(
      violations.map((v) => ({ message: v.detail, ruleId: v.ruleId })),
    );
  });

  test('WB-3 · a 422 violation, which names no field, is placed on no field and under no key', () => {
    const problem = read(exchange(REC.refused, 0));
    expect(problem.items).toHaveLength(4);
    for (const item of problem.items) {
      expect(item.field, `${item.ruleId ?? '?'}: listed for the whole request`).toBeNull();
      expect(item.fieldKey).toBeNull();
    }
  });
});

describe('400', () => {
  test("WB-3 · a 400 from the sale is a problem with the API's title and status, and no rule it didn't send", async () => {
    const recorded = exchange(REC.noStartDate, 0);
    const served = answering(recorded);
    const answer = await settle(() => sellPolicy({ fetch: served.fetch, storage: memoryStore() }, recorded.requestBody as SellRequest));
    const problem = problemOf(answer, 400);
    expect(problem.title).toBe(problemIn(recorded).title);
    expect(problem.ruleId, 'a 400 names no rule').toBeNull();
    expect(problem.detail, 'a 400 sends no detail').toBeNull();
  });

  test("WB-3 · a 400's message under a form field's key is placed on that field, under its key as sent", () => {
    const problem = read(exchange(REC.noStartDate, 0));
    expect(problem.items).toEqual([
      { message: 'The StartDate field is required.', field: 'startDate', fieldKey: 'startDate', ruleId: null },
    ]);
  });

  test('WB-3 · a 400 keyed "$.startDate" is placed on the start date, and its "request" message on no field, in the order sent', () => {
    const recorded = exchange(REC.badStartDate, 0);
    const errors = problemIn(recorded).errors ?? {};
    expect(Object.keys(errors), 'fixture: "request" then "$.startDate"').toEqual(['request', '$.startDate']);
    const problem = read(recorded);
    expect(problem.items).toEqual([
      { message: errors['request']?.[0], field: null, fieldKey: 'request', ruleId: null },
      { message: errors['$.startDate']?.[0], field: 'startDate', fieldKey: '$.startDate', ruleId: null },
    ]);
  });

  test("WB-3 · a 400 on a property line is placed on that line's field", () => {
    const problem = read(exchange(REC.noAddressLine1, 0));
    expect(problem.items).toEqual([
      { message: 'The AddressLine1 field is required.', field: 'property.addressLine1', fieldKey: 'property.addressLine1', ruleId: null },
    ]);
  });

  test("WB-3 · a 400 on a policyholder's date of birth is placed on that policyholder's field", () => {
    const problem = read(exchange(REC.noDateOfBirth, 0));
    expect(problem.items).toEqual([
      {
        message: 'The DateOfBirth field is required.',
        field: 'policyholders[0].dateOfBirth',
        fieldKey: 'policyholders[0].dateOfBirth',
        ruleId: null,
      },
    ]);
  });

  test('WB-3 · a 400 on a member the form has no field for ("$.hasClaims") is listed under its key, on no field', () => {
    const recorded = exchange(REC.hasClaims, 0);
    const problem = read(recorded);
    const hasClaims = problem.items.find((i) => i.fieldKey === '$.hasClaims');
    expect(hasClaims, 'listed under its key').toBeDefined();
    expect(hasClaims?.message).toBe(problemIn(recorded).errors?.['$.hasClaims']?.[0]);
    expect(hasClaims?.field, 'the form has no hasClaims field').toBeNull();
  });

  test('WB-3 · a 400 on the whole body ("$") is listed under its key, on no field', () => {
    const recorded = exchange(REC.malformed, 0);
    const problem = read(recorded);
    expect(problem.items.map((i) => i.fieldKey)).toEqual(Object.keys(problemIn(recorded).errors ?? {}));
    for (const item of problem.items) expect(item.field, `${item.fieldKey ?? '?'}: on no field`).toBeNull();
  });
});

describe('409', () => {
  test("WB-3 · a 409 from the sale is a problem with the API's title, detail and SELL-1 rule, and no item", async () => {
    const recorded = exchange(REC.duplicate, 1);
    const served = answering(recorded);
    const answer = await settle(() => sellPolicy({ fetch: served.fetch, storage: memoryStore() }, recorded.requestBody as SellRequest));
    const problem = problemOf(answer, 409);
    expect(problem).toEqual({
      status: 409,
      title: 'Policy reference already exists',
      detail: "A policy with reference 'F1-MVFJOXHYS1' already exists.",
      ruleId: 'SELL-1',
      items: [],
    });
  });
});

describe('404', () => {
  test("WB-3 · a 404 from the policy read is a problem with the API's title, status, detail and GET-1 rule", async () => {
    const recorded = exchange(REC.unknown, 0);
    const served = answering(recorded);
    const answer = await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'F2-MVFJQMPREM'));
    const problem = problemOf(answer, 404);
    expect(problem).toEqual({
      status: 404,
      title: 'Policy not found',
      detail: "No policy with reference 'F2-MVFJQMPREM'.",
      ruleId: 'GET-1',
      items: [],
    });
  });
});

// inv-006 I4: an answer that came, with a body that can't be read as JSON, is still an answer with its status.
// Only a request that never got an answer is unreachable.
describe('an answer whose body is not JSON', () => {
  const BAD_GATEWAY = '<html><head><title>502 Bad Gateway</title></head><body><h1>502 Bad Gateway</h1></body></html>';

  test('WB-3 · a 502 with a body that is not JSON, from the policy read, keeps its status and is never "unreachable"', async () => {
    const served = answeringText(502, BAD_GATEWAY);
    const answer = await settle(() => getPolicy({ fetch: served.fetch, storage: memoryStore() }, 'F2-MVFJQA9DQG'));
    expect(served.sent, 'the request was sent, and answered').toHaveLength(1);
    expect(answer.kind, `an answer came (it was: ${JSON.stringify(answer)})`).not.toBe('unreachable');
    expect(answer).toHaveProperty('status', 502);
  });

  test('WB-3 · a 502 with a body that is not JSON, from the sale, keeps its status and is never "unreachable"', async () => {
    const recorded = exchange(REC.sold, 0);
    const served = answeringText(502, BAD_GATEWAY);
    const answer = await settle(() => sellPolicy({ fetch: served.fetch, storage: memoryStore() }, recorded.requestBody as SellRequest));
    expect(served.sent, 'the request was sent, and answered').toHaveLength(1);
    expect(answer.kind, `an answer came (it was: ${JSON.stringify(answer)})`).not.toBe('unreachable');
    expect(answer).toHaveProperty('status', 502);
  });
});

describe('what the API did not send', () => {
  test('WB-3 · a problem with no title, detail or rule gets none invented, and keeps its HTTP status', () => {
    const problem = outcome(() => readProblem(500, {}));
    expect(problem).toEqual({ status: 500, title: null, detail: null, ruleId: null, items: [] });
  });
});
