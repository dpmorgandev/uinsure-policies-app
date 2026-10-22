// @vitest-environment node
// WB-6 · Send it anyway. A switch that turns off client-side validation, so the API's own violations can be shown.
// prepareSale runs the form's own checks with send anyway off: a value they catch is marked on its own field, with
// the rule it would break, and nothing is sent. With send anyway on there are no checks, and the body goes as
// typed. Each check is tried on both sides of its boundary; `today` is the fixed day the checks are given.
import { describe, expect, test } from 'vitest';
import { prepareSale } from '../../../../src/web/app/data/api';
import type { FieldError, PreparedSale, SellForm, SellRequest } from '../../../../src/web/app/data/api';
import {
  ADA,
  BARBARA,
  EDSGER,
  PAST_START,
  RADIA,
  TODAY,
  TODAY_PLUS_60,
  TODAY_PLUS_61,
  YESTERDAY,
  sellForm,
} from './support/forms';
import { outcome } from './support/recorded';

const off = { sendAnyway: false, today: TODAY };
const on = { sendAnyway: true, today: TODAY };

/** Each caught field with the rule it names, and a check that every one says something. */
function caught(prepared: PreparedSale): { field: string; ruleId: string | null }[] {
  expect(prepared.kind, `the checks catch it (it was: ${JSON.stringify(prepared)})`).toBe('caught');
  const errors = (prepared as { kind: 'caught'; errors: FieldError[] }).errors;
  for (const e of errors) expect(e.message, `${e.field} says what is wrong`).not.toBe('');
  return errors.map((e) => ({ field: e.field, ruleId: e.ruleId }));
}

/** The body a prepared sale sends; fails, as an assertion, when the checks caught it instead. */
function sent(prepared: PreparedSale): SellRequest {
  expect(prepared.kind, `the form is sent (it was: ${JSON.stringify(prepared)})`).toBe('send');
  return (prepared as { kind: 'send'; body: SellRequest }).body;
}

const checked = (form: SellForm): PreparedSale => outcome(() => prepareSale(form, off));
const anyway = (form: SellForm): PreparedSale => outcome(() => prepareSale(form, on));

describe('send anyway off: the start date, inside the sale window (SELL-2)', () => {
  test('WB-6 · with send anyway off, a start date in 2020 is caught on the start date, under SELL-2', () => {
    expect(caught(checked(sellForm({ startDate: PAST_START })))).toEqual([{ field: 'startDate', ruleId: 'SELL-2' }]);
  });

  test('WB-6 · with send anyway off, a start date of yesterday is caught', () => {
    expect(caught(checked(sellForm({ startDate: YESTERDAY })))).toEqual([{ field: 'startDate', ruleId: 'SELL-2' }]);
  });

  test('WB-6 · with send anyway off, a start date of today passes', () => {
    expect(sent(checked(sellForm({ startDate: TODAY }))).startDate).toBe(TODAY);
  });

  test('WB-6 · with send anyway off, a start date of today + 60 passes', () => {
    expect(sent(checked(sellForm({ startDate: TODAY_PLUS_60 }))).startDate).toBe(TODAY_PLUS_60);
  });

  test('WB-6 · with send anyway off, a start date of today + 61 is caught', () => {
    expect(caught(checked(sellForm({ startDate: TODAY_PLUS_61 })))).toEqual([{ field: 'startDate', ruleId: 'SELL-2' }]);
  });

  test('WB-6 · with send anyway off, the window runs over a year end: from 2026-12-15, 2027-02-13 passes', () => {
    const prepared = outcome(() => prepareSale(sellForm({ startDate: '2027-02-13' }), { sendAnyway: false, today: '2026-12-15' }));
    expect(sent(prepared).startDate).toBe('2027-02-13');
  });

  test('WB-6 · with send anyway off, the window runs over a year end: from 2026-12-15, 2027-02-14 is caught', () => {
    const prepared = outcome(() => prepareSale(sellForm({ startDate: '2027-02-14' }), { sendAnyway: false, today: '2026-12-15' }));
    expect(caught(prepared)).toEqual([{ field: 'startDate', ruleId: 'SELL-2' }]);
  });

  test('WB-6 · with send anyway off, an empty start date is caught on the start date', () => {
    expect(caught(checked(sellForm({ startDate: '' }))).map((e) => e.field)).toEqual(['startDate']);
  });
});

describe('send anyway off: the reference pattern (SELL-1), on the reference as the API will store it', () => {
  test('WB-6 · with send anyway off, a 2-character reference is caught on the reference, under SELL-1', () => {
    expect(caught(checked(sellForm({ reference: 'w1' })))).toEqual([{ field: 'reference', ruleId: 'SELL-1' }]);
  });

  test('WB-6 · with send anyway off, a 3-character reference passes', () => {
    expect(sent(checked(sellForm({ reference: 'w1a' }))).reference).toBe('w1a');
  });

  test('WB-6 · with send anyway off, a 20-character reference passes', () => {
    const twenty = 'w1-twenty-characters';
    expect(twenty).toHaveLength(20);
    expect(sent(checked(sellForm({ reference: twenty }))).reference).toBe(twenty);
  });

  test('WB-6 · with send anyway off, a 21-character reference is caught', () => {
    const twentyOne = 'w1-twentyone-charactr';
    expect(twentyOne).toHaveLength(21);
    expect(caught(checked(sellForm({ reference: twentyOne })))).toEqual([{ field: 'reference', ruleId: 'SELL-1' }]);
  });

  test('WB-6 · with send anyway off, a reference with an underscore is caught', () => {
    expect(caught(checked(sellForm({ reference: 'w1_bad_1' })))).toEqual([{ field: 'reference', ruleId: 'SELL-1' }]);
  });

  test('WB-6 · with send anyway off, a reference with spaces and lower case passes, as the API will trim and upper-case it', () => {
    expect(sent(checked(sellForm({ reference: '  w1-norm-a ' }))).reference).toBe('  w1-norm-a ');
  });
});

describe('send anyway off: 1 to 3 policyholders (SELL-4), and an amount above 0 (SELL-7)', () => {
  test('WB-6 · with send anyway off, a fourth policyholder is caught on the policyholders, under SELL-4', () => {
    expect(caught(checked(sellForm({ policyholders: [ADA, EDSGER, BARBARA, RADIA] })))).toEqual([
      { field: 'policyholders', ruleId: 'SELL-4' },
    ]);
  });

  test('WB-6 · with send anyway off, an amount of 0 is caught on the amount, under SELL-7', () => {
    expect(caught(checked(sellForm({ amount: '0' })))).toEqual([{ field: 'amount', ruleId: 'SELL-7' }]);
  });

  test('WB-6 · with send anyway off, an amount of 0.01 passes', () => {
    expect(sent(checked(sellForm({ amount: '0.01' }))).amount).toBe(0.01);
  });

  test('WB-6 · with send anyway off, a negative amount is caught', () => {
    expect(caught(checked(sellForm({ amount: '-1' })))).toEqual([{ field: 'amount', ruleId: 'SELL-7' }]);
  });
});

describe('send anyway off: every problem at once, each on its own field', () => {
  test('WB-6 · with send anyway off, a bad reference, start date and amount are all caught, each on its field and no other', () => {
    const errors = caught(checked(sellForm({ reference: 'w1_bad_3', startDate: PAST_START, amount: '0' })));
    const byField = [...errors].sort((a, b) => a.field.localeCompare(b.field));
    expect(byField).toEqual([
      { field: 'amount', ruleId: 'SELL-7' },
      { field: 'reference', ruleId: 'SELL-1' },
      { field: 'startDate', ruleId: 'SELL-2' },
    ]);
  });
});

describe('send anyway on: no checks, the body as typed', () => {
  test('WB-6 · with send anyway on, a start date in 2020 is sent as typed', () => {
    expect(sent(anyway(sellForm({ startDate: PAST_START }))).startDate).toBe(PAST_START);
  });

  test('WB-6 · with send anyway on, an empty start date is sent as typed, empty', () => {
    expect(sent(anyway(sellForm({ startDate: '' }))).startDate).toBe('');
  });

  test('WB-6 · with send anyway on, a reference that breaks the pattern is sent exactly as typed', () => {
    expect(sent(anyway(sellForm({ reference: 'w1_bad_2' }))).reference).toBe('w1_bad_2');
  });

  test('WB-6 · with send anyway on, a reference with spaces and lower case is sent as typed, spaces and case kept', () => {
    expect(sent(anyway(sellForm({ reference: '  w1-raw-1 ' }))).reference).toBe('  w1-raw-1 ');
  });

  test('WB-6 · with send anyway on, four policyholders are sent, in the order entered', () => {
    const body = sent(anyway(sellForm({ policyholders: [ADA, EDSGER, BARBARA, RADIA] })));
    expect(body.policyholders).toEqual([ADA, EDSGER, BARBARA, RADIA]);
  });

  test('WB-6 · with send anyway on, an amount of 0 is sent as 0', () => {
    expect(sent(anyway(sellForm({ amount: '0' }))).amount).toBe(0);
  });

  test('WB-6 · with send anyway on, a form the checks would catch on three fields is sent whole, every field as typed', () => {
    const form = sellForm({ reference: 'w1_bad_4', startDate: PAST_START, amount: '0', type: 'BuyToLet', paymentMethod: 'Cheque' });
    expect(sent(anyway(form))).toEqual({
      reference: 'w1_bad_4',
      type: 'BuyToLet',
      startDate: PAST_START,
      amount: 0,
      autoRenew: true,
      paymentMethod: 'Cheque',
      policyholders: [ADA],
      property: { addressLine1: '12 Mill Lane', addressLine2: 'Floor 2', addressLine3: 'Castlefield', postcode: 'M15 4PS' },
    });
  });
});
