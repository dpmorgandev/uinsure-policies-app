import type { JSX } from 'react';
import { InspectorDrawer } from './InspectorDrawer';
import type { InspectorRequest } from './InspectorDrawer';

// Every value below is from the wb-cancel mockup: the recorded F3 case (QA step 10) for the quote and the
// cancel, and the CANCEL-3 problem on policy F3-MVEOTAONJW (QA step 16).
const QUOTE_PATH = '/policies/F3-MVEOSVDQJQ/cancellation-quote?cancellationDate=2027-01-27';

const quote: InspectorRequest = {
  number: 1,
  method: 'GET',
  path: QUOTE_PATH,
  status: 200,
  outcome: 'ok',
  exchange: [
    'reference         "F3-MVEOSVDQJQ"',
    'quotedOn          "2026-10-19"',
    'cancellationDate  "2027-01-27"',
    'ruleApplied       "CANCEL-1c"',
    'totalRefund       445.11',
    'terms             [ {1, CANCEL-1c, 365, 101, 264, 445.11} ]',
    'refunds           [ {DirectDebit, 445.11, PAY-7f24722e…} ]   (no reference)',
  ].join('\n'),
  note: "Shown as recorded in QA step 10. terms and refunds are positional because the data excerpt doesn't hold their key names.",
};

const cancel: InspectorRequest = {
  number: 2,
  method: 'POST',
  path: '/policies/F3-MVEOSVDQJQ/cancellation',
  status: 201,
  outcome: 'ok',
  exchange: [
    'request   cancellationDate  "2027-01-27"',
    'response  cancellationDate  "2027-01-27"',
    '          ruleApplied       "CANCEL-1c"',
    '          totalRefund       445.11',
    '          terms             [ {1, CANCEL-1c, 365, 101, 264, 445.11} ]',
    '          refunds           [ {REF-c1b44418…, DirectDebit, 445.11, PAY-7f24722e…} ]',
  ].join('\n'),
};

// In the open drawer the older request is a line only, as in the mockup.
const quoteLineOnly: InspectorRequest = { number: 1, method: 'GET', path: QUOTE_PATH, status: 200, outcome: 'ok' };

const problem: InspectorRequest = {
  number: 1,
  method: 'GET',
  path: '/policies/F3-MVEOTAONJW/cancellation-quote?cancellationDate=2026-10-18',
  status: 422,
  outcome: 'problem',
  exchange: [
    'type        /problems/cancel-3',
    'instance    /policies/F3-MVEOTAONJW/cancellation-quote',
    'ruleId      "CANCEL-3"',
    'violations  [CANCEL-3]',
    'today       "2026-10-19"',
    'traceId     (present; value not in the data)',
  ].join('\n'),
};

// A request the API never answered (the fetch was rejected). No source records one, so the path is the recorded quote
// again and the note says the rest is a placeholder: there is no status and no exchange to show.
const noResponse: InspectorRequest = {
  number: 2,
  method: 'GET',
  path: QUOTE_PATH,
  outcome: 'problem',
  note: 'Placeholder: no response came back, so there is no status or exchange. No source records a rejected fetch.',
};

export const examples: { state: string; element: JSX.Element }[] = [
  { state: 'closed', element: <InspectorDrawer requests={[cancel, quoteLineOnly]} defaultOpen={false} /> },
  { state: 'open', element: <InspectorDrawer requests={[cancel, quoteLineOnly]} defaultOpen /> },
  { state: 'one request', element: <InspectorDrawer requests={[quote]} defaultOpen /> },
  { state: 'problem', element: <InspectorDrawer requests={[noResponse, problem]} defaultOpen /> },
];
