import type { JSX } from 'react';
import { CodeBlock } from './CodeBlock';

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <CodeBlock label="Command to re-check the order" copyLabel="Copy command">
        {'git log --reverse --format="%h %(trailers:key=TDD,valueonly) %s" 94a7473^..92ede9e'}
      </CodeBlock>
    ),
  },
  {
    state: 'long',
    element: (
      <div style={{ maxWidth: '22rem' }}>
        <CodeBlock label="Detail line from gate.stub">
          {
            '(a) 5 pass by the canned status Active coinciding: Policy_sold_to_start_today_reads_back_Active, Status_on_the_start_date_is_Active, Status_on_the_end_date_is_Active, Status_at_23_30_UTC_on_an_end_date_in_GMT_is_Active, Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active.'
          }
        </CodeBlock>
      </div>
    ),
  },
];
