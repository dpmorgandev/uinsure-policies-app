// The sell form's values as a person types them, for the client's own checks (prepareSale). `today` is passed in
// as a fixed yyyy-MM-dd, never read from the clock: the window SELL-2 checks is counted from it.
import type { Policyholder, SellForm } from '../../../../../src/web/app/data/api';

/** The day the checks are told it is. Its window (SELL-2): 2026-10-21 to 2026-12-20. */
export const TODAY = '2026-10-21';
export const YESTERDAY = '2026-10-20';
export const TODAY_PLUS_60 = '2026-12-20';
export const TODAY_PLUS_61 = '2026-12-21';

/** A start date the API refuses under SELL-2 whatever today is: no backdating. */
export const PAST_START = '2020-01-01';

export const ADA: Policyholder = { firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: '1985-12-10' };
export const EDSGER: Policyholder = { firstName: 'Edsger', lastName: 'Dijkstra', dateOfBirth: '1979-05-11' };
export const BARBARA: Policyholder = { firstName: 'Barbara', lastName: 'Liskov', dateOfBirth: '1972-11-07' };
export const RADIA: Policyholder = { firstName: 'Radia', lastName: 'Perlman', dateOfBirth: '1988-01-18' };

/** A form the checks pass as it is, with values of its own (none equal to a recorded request's). */
export function sellForm(overrides: Partial<SellForm> = {}): SellForm {
  return {
    reference: 'W1-UNIT-1',
    type: 'Household',
    startDate: '2026-11-20',
    amount: '527.18',
    paymentMethod: 'DirectDebit',
    autoRenew: true,
    policyholders: [ADA],
    property: { addressLine1: '12 Mill Lane', addressLine2: 'Floor 2', addressLine3: 'Castlefield', postcode: 'M15 4PS' },
    ...overrides,
  };
}
