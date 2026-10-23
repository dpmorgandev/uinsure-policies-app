import type { JSX } from 'react';
import { JsonViewer } from './JsonViewer';

// The fields and values are the quote response recorded in QA step 10 of F3 (wb-cancel mockup): reference,
// quotedOn, cancellationDate, ruleApplied and totalRefund. The mockup shows `terms` and `refunds` by position
// only, because the data excerpt does not hold their key names, so they are left out here.
const QUOTE =
  '{"reference":"F3-MVEOSVDQJQ","quotedOn":"2026-10-19","cancellationDate":"2027-01-27","ruleApplied":"CANCEL-1c","totalRefund":445.11}';

// 'long': "placeholder_detail" is a placeholder key. The excerpt holds the gate.stub detail text (rule mockup)
// but not the key it is stored under.
const LONG =
  '{"placeholder_detail":"(a) 5 pass by the canned status Active coinciding: Policy_sold_to_start_today_reads_back_Active, Status_on_the_start_date_is_Active, Status_on_the_end_date_is_Active, Status_at_23_30_UTC_on_an_end_date_in_GMT_is_Active, Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active.","reference":"F3-MVEOSVDQJQ","quotedOn":"2026-10-19","cancellationDate":"2027-01-27","ruleApplied":"CANCEL-1c","totalRefund":445.11}';

// 'malformed': the quote response cut off after "cancellationDate":
const MALFORMED = '{"reference":"F3-MVEOSVDQJQ","quotedOn":"2026-10-19","cancellationDate":';

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: <JsonViewer label="quote response" json={QUOTE} />,
  },
  {
    state: 'long',
    element: (
      <div style={{ maxWidth: '26rem' }}>
        <JsonViewer label="quote response with a long detail" json={LONG} defaultOpen />
      </div>
    ),
  },
  {
    state: 'malformed',
    element: <JsonViewer label="quote response, cut off" json={MALFORMED} />,
  },
];
