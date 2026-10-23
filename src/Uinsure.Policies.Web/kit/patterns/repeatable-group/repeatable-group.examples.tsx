import type { JSX } from 'react';
import { TextInput } from '../../primitives/text-input/TextInput';
import { Field } from '../field/Field';
import { RepeatableGroup } from './RepeatableGroup';
import type { RepeatableMember } from './RepeatableGroup';

const note = {
  margin: 'var(--space-2) 0 0',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-14)',
} as const;

/** Placeholder field: the mockups hold no policyholder fields, so one labelled "Name" stands in. */
function NameField({ error }: { error?: string }) {
  return (
    <Field label="Name" error={error}>
      {(control) => <TextInput {...control} />}
    </Field>
  );
}

function members(count: number, invalidAt?: number): RepeatableMember[] {
  return Array.from({ length: count }, (_, position) => {
    const index = position + 1;
    const invalid = invalidAt === index;
    return {
      id: `policyholder-${index}`,
      invalid,
      error: invalid ? 'Placeholder message: the trail holds no policyholder error.' : undefined,
      children: <NameField error={invalid ? 'Placeholder message: the trail holds no name error.' : undefined} />,
    };
  });
}

const caption = <p style={note}>Placeholder: the field "Name" and the messages are not in the mockups; the 1 to 3 range is the catalog row's.</p>;

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'one',
    element: (
      <div style={{ maxWidth: '40rem' }}>
        <RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={members(1)} />
        {caption}
      </div>
    ),
  },
  {
    state: 'two',
    element: (
      <div style={{ maxWidth: '40rem' }}>
        <RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={members(2)} />
        {caption}
      </div>
    ),
  },
  {
    state: 'three (add hidden)',
    element: (
      <div style={{ maxWidth: '40rem' }}>
        <RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={members(3)} />
        {caption}
      </div>
    ),
  },
  {
    state: 'invalid member',
    element: (
      <div style={{ maxWidth: '40rem' }}>
        <RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={members(2, 2)} />
        {caption}
      </div>
    ),
  },
];
