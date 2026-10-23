import type { JSX } from 'react';
import { HttpExchange } from './HttpExchange';

const note = {
  margin: 'var(--space-2) 0 0',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-14)',
} as const;

// Paths, statuses and bodies are the recorded cases in the wb-cancel mockup: the quote and the cancel for
// F3-MVEOSVDQJQ (QA step 10, bodies positional because the excerpt holds no key names for terms and
// refunds) and the CANCEL-3 rejection for F3-MVEOTAONJW (QA step 16). The mockup records no headers, times,
// sizes or host; each is a placeholder and says so under the example.
const QUOTE_PATH = '/policies/F3-MVEOSVDQJQ/cancellation-quote?cancellationDate=2027-01-27';
const QUOTE_BODY = `reference         "F3-MVEOSVDQJQ"
quotedOn          "2026-10-19"
cancellationDate  "2027-01-27"
ruleApplied       "CANCEL-1c"
totalRefund       445.11
terms             [ {1, CANCEL-1c, 365, 101, 264, 445.11} ]
refunds           [ {DirectDebit, 445.11, PAY-7f24722e…} ]`;

const PROBLEM_PATH = '/policies/F3-MVEOTAONJW/cancellation-quote?cancellationDate=2026-10-18';
const PROBLEM_BODY = `type        /problems/cancel-3
instance    /policies/F3-MVEOTAONJW/cancellation-quote
ruleId      "CANCEL-3"
violations  [CANCEL-3]
today       "2026-10-19"
traceId     (present; value not in the data)`;

const CANCEL_PATH = '/policies/F3-MVEOSVDQJQ/cancellation';
const CANCEL_BODY = `cancellationDate  "2027-01-27"`;
const CANCEL_RESPONSE = `cancellationDate  "2027-01-27"
ruleApplied       "CANCEL-1c"
totalRefund       445.11
terms             [ {1, CANCEL-1c, 365, 101, 264, 445.11} ]
refunds           [ {REF-c1b44418…, DirectDebit, 445.11, PAY-7f24722e…} ]`;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: '2xx',
    element: (
      <div style={{ maxWidth: '48rem' }}>
        <HttpExchange
          n={1}
          request={{ method: 'GET', url: QUOTE_PATH }}
          response={{
            status: 200,
            timeMs: 52,
            sizeBytes: 412,
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            body: QUOTE_BODY,
          }}
          curl={`curl -X GET 'http://localhost:5080${QUOTE_PATH}'`}
        />
        <p style={note}>Placeholder: the header, the 52 ms, the 412 B and the host in the curl are not in the mockups.</p>
      </div>
    ),
  },
  {
    state: 'problem',
    element: (
      <div style={{ maxWidth: '48rem' }}>
        <HttpExchange
          n={1}
          request={{ method: 'GET', url: PROBLEM_PATH }}
          response={{
            status: 422,
            timeMs: 31,
            sizeBytes: 268,
            headers: [{ name: 'Content-Type', value: 'application/problem+json' }],
            body: PROBLEM_BODY,
          }}
          curl={`curl -X GET 'http://localhost:5080${PROBLEM_PATH}'`}
        />
        <p style={note}>Placeholder: the header, the 31 ms, the 268 B and the host in the curl are not in the mockups.</p>
      </div>
    ),
  },
  {
    state: 'unreachable',
    element: (
      <div style={{ maxWidth: '48rem' }}>
        <HttpExchange
          n={1}
          request={{ method: 'GET', url: QUOTE_PATH }}
          failure="The API did not answer. No request was completed."
        />
        <p style={note}>Placeholder wording: the trail holds no unreachable case.</p>
      </div>
    ),
  },
  {
    state: 'long',
    element: (
      <div style={{ maxWidth: '22rem' }}>
        <HttpExchange
          n={2}
          request={{
            method: 'POST',
            url: CANCEL_PATH,
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            body: CANCEL_BODY,
          }}
          response={{
            status: 201,
            timeMs: 87,
            sizeBytes: 540,
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            body: CANCEL_RESPONSE,
          }}
          curl={`curl -X POST 'http://localhost:5080${CANCEL_PATH}' -H 'Content-Type: application/json' -d '{"cancellationDate":"2027-01-27"}'`}
        />
        <p style={note}>Placeholder: headers, times, sizes, the host and the JSON encoding of the body are not in the mockups.</p>
      </div>
    ),
  },
];
