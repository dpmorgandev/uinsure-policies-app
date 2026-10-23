import type { JSX } from 'react';
import { PageHeader } from './PageHeader';

// pop: the rule page header of the rule mockup (GET-1, build/F2, PR #17, compiled 2026-10-19T00:07:57Z by
// render-trace.mjs, snapshot SHA "not in the excerpt").
// nb: the mockup's not-built board. "‹ruleId›" is its own placeholder, since no unbuilt rule ID is in the data.
// live: the wb-cancel header (policy F3-MVEOSVDQJQ; status and compiled-at "not in this screen's data").
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <PageHeader
        eyebrow="Rule · build/F2"
        title="GET-1 Retrieve a policy"
        question="Did this rule's test fail before its code made it pass, and who signed it off?"
        answer="Yes. Red is rung #5, green is rung #17, and David Morgan signed it off on 2026-10-19."
        status={{ value: 'pass', label: 'Pass 59 of 59' }}
        ids={[
          { label: 'Rule', value: 'GET-1', href: '#' },
          { label: 'PR', value: '#17', href: 'https://github.com/dpmorgandev/uinsure-policies-api/pull/17' },
          { label: 'Snapshot SHA', value: null, missing: 'not in the excerpt' },
        ]}
        mode="compiled"
        compiledAt="2026-10-19T00:07:57Z"
        compiledBy=".claude/scripts/render-trace.mjs"
        provenance="generated"
      />
    ),
  },
  {
    state: 'nb',
    element: (
      <PageHeader
        eyebrow="Rule · placeholder"
        title="Rule ‹ruleId›"
        answer="Not built yet. There is no red, green, refactor, QA step or sign-off to show."
        status={{ value: 'not-built', label: 'Not built yet' }}
        ids={[{ label: 'Rule', value: '‹ruleId›' }]}
        mode="compiled"
        compiledAt={null}
        missingLabel="nothing compiled: not built yet"
        note="Placeholder: no unbuilt rule ID is in this page's data."
      />
    ),
  },
  {
    state: 'live',
    element: (
      <PageHeader
        eyebrow="Workbench · Quote and cancel · policy F3-MVEOSVDQJQ"
        title="Quote and cancel"
        question="If I cancel on the date I quoted, is the refund the one I was quoted?"
        answer="Cancel on 2027-01-27 and the refund is 445.11."
        status={null}
        ids={[{ label: 'Policy', value: 'F3-MVEOSVDQJQ' }]}
        mode="live"
        missingLabel="not in this screen's data"
        liveNote="answered by the API; the quote reports quotedOn 2026-10-19"
      />
    ),
  },
];
