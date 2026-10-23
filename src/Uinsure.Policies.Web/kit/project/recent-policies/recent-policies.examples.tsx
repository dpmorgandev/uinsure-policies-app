import type { JSX } from 'react';
import { RecentPolicies } from './RecentPolicies';

const note = {
  margin: '0 0 var(--space-2)',
  padding: 'var(--space-1) var(--space-2)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-text-secondary)',
  border: '1.5px dashed var(--color-text-secondary)',
  borderRadius: 'var(--radius)',
} as const;

// Observed: the references are the policies the F2 and F3 QA records name (F2-MVEHF2QGG5, F3-MVEOSVDQJQ, QA-F3-CLAIM).
// Each links to the workbench route /workbench/policies/<reference>, not the API's own /policies/<reference>.
// Placeholder: which of them this browser sold or opened and their order are not recorded anywhere, because no
// request log exists yet.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div>
        <p style={note}>
          Placeholder: the sold or opened word on each reference and their order are invented. The three references are
          from the F2 and F3 QA records.
        </p>
        <RecentPolicies
          policies={[
            { reference: 'F3-MVEOSVDQJQ', href: '/workbench/policies/F3-MVEOSVDQJQ', how: 'opened' },
            { reference: 'QA-F3-CLAIM', href: '/workbench/policies/QA-F3-CLAIM', how: 'opened' },
            { reference: 'F2-MVEHF2QGG5', href: '/workbench/policies/F2-MVEHF2QGG5', how: 'sold' },
          ]}
        />
      </div>
    ),
  },
  {
    state: 'empty',
    element: <RecentPolicies policies={[]} />,
  },
  {
    state: 'storage unavailable',
    element: <RecentPolicies policies={[]} storage="unavailable" />,
  },
];
