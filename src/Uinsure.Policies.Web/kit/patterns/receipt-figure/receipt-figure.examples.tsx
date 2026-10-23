import type { JSX } from 'react';
import { ReceiptFigure } from './ReceiptFigure';

// pop: "41 of 41" steps passed, from the QA step and sign-off region of the rule mockup, whose source link
// (docs/qa/build-F2.md) and provenance (written) are in the same mockup.
// nb: the mockup's not-built board; "‹ruleId›" is its placeholder, since no unbuilt rule ID is in the data.
// live: 445.11, the refund the API quoted for 2027-01-27 (wb-cancel mockup); its source is the request
// inspector, "The requests as sent", which the mockup gives the id insp-h.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <ReceiptFigure
        value="41 of 41"
        unit="steps passed in the QA step for build/F2"
        source={{
          label: 'docs/qa/build-F2.md#1',
          href: 'https://github.com/dpmorgandev/uinsure-policies-api/blob/main/docs/qa/build-F2.md',
          external: true,
        }}
        provenance="written"
      />
    ),
  },
  {
    state: 'nb',
    element: (
      <ReceiptFigure
        value={null}
        unit="Tests counted for rule ‹ruleId› (placeholder)"
        source={null}
        note="Placeholder: no unbuilt rule ID is in this page's data."
      />
    ),
  },
  {
    state: 'live',
    element: (
      <ReceiptFigure
        value="445.11"
        unit="refundAmount: the total refund for a cancellation on 2027-01-27 under CANCEL-1c"
        source={{
          label: 'GET /policies/F3-MVEOSVDQJQ/cancellation-quote?cancellationDate=2027-01-27',
          href: '#insp-h',
        }}
        live
        liveNote="answered 200 by the API"
      />
    ),
  },
];
