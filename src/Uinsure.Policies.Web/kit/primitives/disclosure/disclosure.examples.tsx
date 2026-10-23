import type { JSX } from 'react';
import { Disclosure } from './Disclosure';

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'open',
    element: (
      <Disclosure summary="Full detail" defaultOpen>
        <p>
          (a) 5 pass by the canned status Active coinciding: Policy_sold_to_start_today_reads_back_Active,
          Status_on_the_start_date_is_Active, Status_on_the_end_date_is_Active,
          Status_at_23_30_UTC_on_an_end_date_in_GMT_is_Active, Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active.
          (b) 7 pass on behaviour already delivered by F1/F1b. David: fix (a), accept (b) as pinned.
        </p>
      </Disclosure>
    ),
  },
  {
    state: 'closed',
    element: (
      <Disclosure summary="The P2 findings">
        <p>
          P2s: R2 stale PolicyResponse comment, R3 F2 converter as a second rounding path, R4 unknown-query filter
          counts route/body/special params as known, R5 unpaid-second-term row lacks status, R6 no Services not-found
          test.
        </p>
      </Disclosure>
    ),
  },
];
