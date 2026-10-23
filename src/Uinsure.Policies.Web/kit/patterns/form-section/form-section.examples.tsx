import type { JSX } from 'react';
import { DateInput } from '../../primitives/date-input/DateInput';
import { TextInput } from '../../primitives/text-input/TextInput';
import { ConstraintHint } from '../constraint-hint/ConstraintHint';
import { Field } from '../field/Field';
import { FormSection } from './FormSection';

const note = {
  margin: 'var(--space-3) 0 0',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-14)',
} as const;

// The section title "Policy" and the constraints are from the catalog row. The two field labels are
// placeholders: the mockups hold no sell form, so the examples say so under the section.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: (
      <div style={{ maxWidth: '40rem' }}>
        <FormSection title="Policy" number={1} description="Placeholder wording: the mockups hold no sell form.">
          <Field label="Policy reference" constraint={<ConstraintHint constraint="^[A-Z0-9-]{3,20}$" />}>
            {(control) => <TextInput {...control} mono defaultValue="F3-MVEOSVDQJQ" />}
          </Field>
          <Field label="Start date" hint="Format yyyy-MM-dd." constraint={<ConstraintHint constraint="today … today + 60" />}>
            {(control) => <DateInput {...control} />}
          </Field>
        </FormSection>
        <p style={note}>Placeholder: the labels "Policy reference" and "Start date" are not in the mockups.</p>
      </div>
    ),
  },
  {
    state: 'with errors',
    element: (
      <div style={{ maxWidth: '40rem' }}>
        <FormSection title="Policy" number={1} errorCount={2} description="Placeholder wording: the mockups hold no sell form.">
          <Field
            label="Policy reference"
            constraint={<ConstraintHint constraint="^[A-Z0-9-]{3,20}$" violated />}
            error="Placeholder message: the trail holds no reference error."
          >
            {(control) => <TextInput {...control} mono defaultValue="ab" />}
          </Field>
          <Field
            label="Start date"
            hint="Format yyyy-MM-dd."
            constraint={<ConstraintHint constraint="today … today + 60" violated />}
            error="Placeholder message: the trail holds no start date error."
          >
            {(control) => <DateInput {...control} defaultValue="2026-10-18" />}
          </Field>
        </FormSection>
        <p style={note}>Placeholder: the labels, the values "ab" and 2026-10-18 and the messages are not in the mockups.</p>
      </div>
    ),
  },
];
