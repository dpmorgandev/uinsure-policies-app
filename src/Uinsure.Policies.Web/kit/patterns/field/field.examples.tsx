import type { JSX } from 'react';
import { DateInput } from '../../primitives/date-input/DateInput';
import { Field } from './Field';

const HINT = 'Format yyyy-MM-dd, the only format the API accepts. Shown as typed.';

// Every value is from the wb-cancel mockup: the label, the hint, the dates 2027-01-27 and 2026-10-18
// (QA step 16, CANCEL-3) and the CANCEL-3 message with today, 2026-10-19.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'plain',
    element: (
      <Field label="Cancellation date">{(control) => <DateInput {...control} defaultValue="2027-01-27" />}</Field>
    ),
  },
  {
    state: 'with hint',
    element: (
      <Field label="Cancellation date" hint={HINT}>
        {(control) => <DateInput {...control} defaultValue="2027-01-27" />}
      </Field>
    ),
  },
  {
    state: 'invalid',
    element: (
      <Field
        label="Cancellation date"
        hint="Format yyyy-MM-dd."
        error="Cancellation date in the past. Today is 2026-10-19."
      >
        {(control) => <DateInput {...control} defaultValue="2026-10-18" />}
      </Field>
    ),
  },
  {
    state: 'required',
    element: (
      <Field label="Cancellation date" hint="Format yyyy-MM-dd, the only format the API accepts." required>
        {(control) => <DateInput {...control} />}
      </Field>
    ),
  },
];
