import type { JSX } from 'react';
import { MarkdownText } from './MarkdownText';

// The words are the reviewer's and the gate's own, from the retry branch and the attempt 3 verdicts in the
// rule mockup. The markdown marks around them (bold, list, code) are the only thing added.
const VERDICT = [
  '**Reviewer verdict A3: Pass.**',
  '',
  '- A2 R1-R6 resolved',
  '- inv-001 approach followed',
  '- P2 R1: Postman `decimal.MinValue` SELL-7 check is a prefix match that passes with or without `.00`.',
  '',
  'Opened as a draft earlier; see [PR #17](https://github.com/dpmorgandev/uinsure-policies-api/pull/17).',
].join('\n');

// A code fence is three backticks in a row, built here so the fence characters are not typed out in the file.
const FENCE = '`'.repeat(3);

const LONG = [
  '# gate.stub, attempt 1',
  '',
  'Exit 2, expected "every GET-1 test fails", ok false. 25 total, 13 failed, 12 passed.',
  '',
  '(a) 5 pass by the canned status Active coinciding: Policy_sold_to_start_today_reads_back_Active, Status_on_the_start_date_is_Active, Status_on_the_end_date_is_Active, Status_at_23_30_UTC_on_an_end_date_in_GMT_is_Active, Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active.',
  '',
  '(b) 7 pass on behaviour already delivered by F1/F1b: the four RetrieveNotFoundTests 404 rows; Today_inside_the_first_of_two_terms_shows_the_first_term, Last_day_of_the_first_term_still_shows_the_first_term, Unpaid_second_term_reads_back_with_no_payment_reference_and_no_payment.',
  '',
  '> David: fix (a), accept (b) as pinned.',
  '',
  '## The P2 findings',
  '',
  '1. R2 stale PolicyResponse comment',
  '2. R3 F2 converter as a second rounding path',
  '3. R4 unknown-query filter counts route/body/special params as known',
  '4. R5 unpaid-second-term row lacks status',
  '5. R6 no Services not-found test',
  '',
  FENCE,
  'git log --reverse --format="%h %(trailers:key=TDD,valueonly) %s" 94a7473^..92ede9e',
  FENCE,
].join('\n');

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: <MarkdownText source={VERDICT} />,
  },
  {
    state: 'long',
    element: (
      <div style={{ maxWidth: '26rem' }}>
        <MarkdownText source={LONG} />
      </div>
    ),
  },
];
