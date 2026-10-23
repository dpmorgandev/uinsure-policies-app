// @vitest-environment node
// WB-1 · Sell form. Every field of the sell request, 1–3 policyholders. The client turns the form's typed values
// into the sell request (prepareSale) and sends it (sellPolicy); its answer is the API's, recorded in
// docs/ui/fixture/api/ (003 a new reference, 004 a lower-case reference with spaces).
import { describe, expect, test } from 'vitest';
import { prepareSale, sellPolicy } from '../../../../src/Uinsure.Policies.Web/app/data/api';
import type { PreparedSale, SellRequest } from '../../../../src/Uinsure.Policies.Web/app/data/api';
import { ADA, BARBARA, EDSGER, TODAY, sellForm } from './support/forms';
import { REC, answering, exchange, memoryStore, outcome, settle, unreachable } from './support/recorded';

const checksOn = { sendAnyway: false, today: TODAY };

/** The body a prepared sale sends; fails, as an assertion, when the checks caught it instead. */
function bodyOf(prepared: PreparedSale): SellRequest {
  expect(prepared.kind, `the form is sent (caught: ${JSON.stringify(prepared)})`).toBe('send');
  return (prepared as { kind: 'send'; body: SellRequest }).body;
}

describe('the sell request', () => {
  test('WB-1 · a form the checks pass becomes the sell request, field by field', () => {
    const form = sellForm({ type: 'BuyToLet', paymentMethod: 'Card', autoRenew: false, policyholders: [ADA, EDSGER] });
    const prepared = outcome(() => prepareSale(form, checksOn));
    expect(prepared).toEqual({
      kind: 'send',
      body: {
        reference: 'W1-UNIT-1',
        type: 'BuyToLet',
        startDate: '2026-11-20',
        amount: 527.18,
        autoRenew: false,
        paymentMethod: 'Card',
        policyholders: [
          { firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: '1985-12-10' },
          { firstName: 'Edsger', lastName: 'Dijkstra', dateOfBirth: '1979-05-11' },
        ],
        property: { addressLine1: '12 Mill Lane', addressLine2: 'Floor 2', addressLine3: 'Castlefield', postcode: 'M15 4PS' },
      },
    });
  });

  test('WB-1 · empty address lines 2 and 3 are sent as null, and the lines typed as typed', () => {
    const form = sellForm({ property: { addressLine1: '3 Tib Street', addressLine2: '', addressLine3: '', postcode: 'M4 1SH' } });
    const body = bodyOf(outcome(() => prepareSale(form, checksOn)));
    expect(body.property).toEqual({ addressLine1: '3 Tib Street', addressLine2: null, addressLine3: null, postcode: 'M4 1SH' });
  });

  test('WB-1 · a whole-pound amount typed "100" is sent as the number 100', () => {
    const body = bodyOf(outcome(() => prepareSale(sellForm({ amount: '100' }), checksOn)));
    expect(body.amount).toBe(100);
  });

  test('WB-1 · one policyholder is sent as entered', () => {
    const body = bodyOf(outcome(() => prepareSale(sellForm({ policyholders: [BARBARA] }), checksOn)));
    expect(body.policyholders).toEqual([{ firstName: 'Barbara', lastName: 'Liskov', dateOfBirth: '1972-11-07' }]);
  });

  test('WB-1 · three policyholders are sent, in the order entered', () => {
    const body = bodyOf(outcome(() => prepareSale(sellForm({ policyholders: [EDSGER, BARBARA, ADA] }), checksOn)));
    expect(body.policyholders.map((h) => h.lastName)).toEqual(['Dijkstra', 'Liskov', 'Lovelace']);
  });
});

describe('the sale', () => {
  test('WB-1 · sellPolicy posts the sell request as JSON to /api/policies, once', async () => {
    const recorded = exchange(REC.sold, 0);
    const served = answering(recorded);
    await settle(() => sellPolicy({ fetch: served.fetch, storage: memoryStore() }, recorded.requestBody as SellRequest));
    expect(served.sent).toHaveLength(1);
    expect(served.sent[0]?.method).toBe('POST');
    expect(served.sent[0]?.url, "the app's /api proxy, relative to the app").toBe('/api/policies');
    expect(served.sent[0]?.contentType).toMatch(/^application\/json\b/);
    expect(served.sent[0]?.body, 'the body as given').toEqual(recorded.requestBody);
  });

  test('WB-1 · a 201 answers with the policy as the API stored it, its dates as the API wrote them', async () => {
    const recorded = exchange(REC.sold, 0);
    const served = answering(recorded);
    const answer = await settle(() => sellPolicy({ fetch: served.fetch, storage: memoryStore() }, recorded.requestBody as SellRequest));
    expect(answer).toEqual({ kind: 'ok', status: 201, value: recorded.responseBody });
    if (answer.kind !== 'ok') return;
    expect(answer.value.endDate, "the term's end, which only the API knows, as its yyyy-MM-dd string").toBe('2027-11-17');
  });

  test('WB-1 · a reference typed with spaces and lower case answers with the reference the API stored', async () => {
    const recorded = exchange(REC.normalised, 0);
    expect((recorded.requestBody as SellRequest).reference, 'fixture: typed with spaces and lower case').toBe('  f1-mvfjohjgc6  ');
    const served = answering(recorded);
    const answer = await settle(() => sellPolicy({ fetch: served.fetch, storage: memoryStore() }, recorded.requestBody as SellRequest));
    expect(answer.kind).toBe('ok');
    if (answer.kind !== 'ok') return;
    expect(answer.value.reference).toBe('F1-MVFJOHJGC6');
  });

  test('WB-1 · a sale the API never answers is reported unreachable, with no status or policy', async () => {
    const served = unreachable();
    const answer = await settle(() => sellPolicy({ fetch: served.fetch, storage: memoryStore() }, exchange(REC.sold, 0).requestBody as SellRequest));
    expect(answer.kind).toBe('unreachable');
    expect(answer, 'no status the API never sent').not.toHaveProperty('status');
    expect(answer, 'no policy the API never sent').not.toHaveProperty('value');
  });
});
