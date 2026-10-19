import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TextInput } from '../../../src/web/kit/primitives/text-input/TextInput';
import { Field } from '../../../src/web/kit/patterns/field/Field';
import { FormSection } from '../../../src/web/kit/patterns/form-section/FormSection';
import { examples } from '../../../src/web/kit/patterns/form-section/form-section.examples';

afterEach(cleanup);

describe('FormSection', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'with errors']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('group', { name: 'Policy' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Policy reference' })).toBeTruthy();
  });

  it('is a named group whose heading is its title', () => {
    render(
      <FormSection title="Policyholders" headingLevel={3}>
        <Field label="Name">{(control) => <TextInput {...control} />}</Field>
      </FormSection>,
    );
    const group = screen.getByRole('group', { name: 'Policyholders' });
    expect(group.querySelector('h3')?.textContent).toBe('Policyholders');
    expect(screen.getByRole('heading', { level: 3, name: 'Policyholders' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeTruthy();
  });

  it('defaults to a level 2 heading', () => {
    render(
      <FormSection title="Property">
        <p>Fields</p>
      </FormSection>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Property' })).toBeTruthy();
  });

  it('shows its rung number, hidden from assistive technology because the order is the document order', () => {
    const { container } = render(
      <FormSection title="Policy" number={1}>
        <p>Fields</p>
      </FormSection>,
    );
    const rail = container.querySelector('[aria-hidden="true"]');
    expect(rail?.textContent).toBe('1');
  });

  it('pop: no problem line and nothing described', () => {
    render(
      <FormSection title="Policy">
        <p>Fields</p>
      </FormSection>,
    );
    const group = screen.getByRole('group', { name: 'Policy' });
    expect(group.getAttribute('aria-describedby')).toBeNull();
    expect(screen.queryByText(/problem/)).toBeNull();
  });

  it('with errors: counts the problems in words and describes the group with the count', () => {
    render(
      <FormSection title="Policy" errorCount={2}>
        <p>Fields</p>
      </FormSection>,
    );
    const group = screen.getByRole('group', { name: 'Policy' });
    const ids = (group.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    expect(ids).toHaveLength(1);
    expect(document.getElementById(ids[0]!)?.textContent).toBe('2 problems in this section');
  });

  it('with errors: each invalid input is marked by aria-invalid and has no icon beside it', () => {
    render(examples[1]!.element);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs).toHaveLength(2);
    inputs.forEach((input) => {
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.nextElementSibling).toBeNull();
      expect(input.previousElementSibling?.querySelector('svg')).not.toBeNull();
    });
  });

  it('says "1 problem" for one', () => {
    render(
      <FormSection title="Policy" errorCount={1}>
        <p>Fields</p>
      </FormSection>,
    );
    expect(screen.getByText('1 problem in this section')).toBeTruthy();
  });

  it('describes the group with its description', () => {
    render(
      <FormSection title="Policy" description="What this section is for">
        <p>Fields</p>
      </FormSection>,
    );
    const group = screen.getByRole('group', { name: 'Policy' });
    expect(group.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByText('What this section is for')).toBeTruthy();
  });
});
