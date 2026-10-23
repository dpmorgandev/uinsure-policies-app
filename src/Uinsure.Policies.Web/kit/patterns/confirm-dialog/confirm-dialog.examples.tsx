import type { JSX } from 'react';
import { Money } from '../../primitives/money/Money';
import { RuleChip } from '../../primitives/rule-chip/RuleChip';
import { ConfirmDialog } from './ConfirmDialog';

// Every word and value is from the wb-cancel mockup's confirm board: policy F3-MVEOSVDQJQ, the quoted date
// 2027-01-27, the refund 445.11 to DirectDebit, and CANCEL-4 for cancelling again. Both are laid out
// inline so the two states can sit side by side; the dialog itself overlays the page when used.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'open',
    element: (
      <ConfirmDialog
        placement="inline"
        focusOnOpen={false}
        title="Cancel policy F3-MVEOSVDQJQ?"
        confirmLabel="Cancel policy on 2027-01-27"
        busyLabel="Cancelling…"
      >
        <p>
          This cancels the policy on <code>2027-01-27</code>, the date you quoted, and refunds <Money value="445.11" />{' '}
          to DirectDebit. It can&apos;t be undone: cancelling again answers 409 under <RuleChip ruleId="CANCEL-4" />.
        </p>
      </ConfirmDialog>
    ),
  },
  {
    state: 'submitting',
    element: (
      <ConfirmDialog
        placement="inline"
        focusOnOpen={false}
        busy
        title="Cancel policy F3-MVEOSVDQJQ?"
        confirmLabel="Cancel policy on 2027-01-27"
        busyLabel="Cancelling…"
      >
        <p>
          This cancels the policy on <code>2027-01-27</code>, the date you quoted, and refunds <Money value="445.11" />{' '}
          to DirectDebit.
        </p>
      </ConfirmDialog>
    ),
  },
];
