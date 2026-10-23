import type { JSX } from 'react';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import { Timestamp } from '../../primitives/timestamp/Timestamp';
import { KeyValueList } from './KeyValueList';

// 'pop' is the QA-step and sign-off list in the rule mockup. 'missing values' is the header list of the
// wb-cancel mockup, where the policy is known and the status and compiled-at stamp are "not in this
// screen's data".
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <KeyValueList
        items={[
          {
            label: 'QA step',
            value: (
              <>
                <a href="https://github.com/dpmorgandev/uinsure-policies-api/blob/main/docs/qa/build-F2.md">
                  docs/qa/build-F2.md#1
                </a>{' '}
                · GET-1 · sold policy reads back in full → 200{' '}
                <StatusTag status="pass">Pass</StatusTag>
              </>
            ),
          },
          { label: 'Steps passed', value: '41 of 41', mono: true },
          { label: 'Tester', value: 'David Morgan (steps run by the tester agent, verified by the orchestrator)' },
          { label: 'Verdict', value: <StatusTag status="pass">Accept F2</StatusTag> },
          { label: 'Signature', value: <Timestamp value="19/10/2026 01:05" /> },
        ]}
      />
    ),
  },
  {
    state: 'missing values',
    element: (
      <KeyValueList
        items={[
          { label: 'Policy', value: 'F3-MVEOSVDQJQ', mono: true },
          { label: 'Status', value: null, missing: "not in this screen's data" },
          { label: 'Compiled at', value: undefined, missing: "not in this screen's data" },
          { label: 'Snapshot SHA', value: '', missing: 'not in the excerpt' },
        ]}
      />
    ),
  },
];
