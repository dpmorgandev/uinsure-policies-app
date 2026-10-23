import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TextInput } from '../../../src/Uinsure.Policies.Web/kit/primitives/text-input/TextInput';
import { Field } from '../../../src/Uinsure.Policies.Web/kit/patterns/field/Field';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/field/field.examples';

afterEach(cleanup);

function describedBy(input: HTMLElement): string[] {
  return (input.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
}

describe('Field', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['plain', 'with hint', 'invalid', 'required']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('textbox', { name: /Cancellation date/ })).toBeTruthy();
  });

  it('plain: the label names the input and nothing is described or invalid', () => {
    render(examples[0]!.element);
    const input = screen.getByRole('textbox', { name: 'Cancellation date' });
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect((input as HTMLInputElement).value).toBe('2027-01-27');
  });

  it('with hint: the hint is wired by aria-describedby', () => {
    render(examples[1]!.element);
    const input = screen.getByRole('textbox', { name: 'Cancellation date' });
    const ids = describedBy(input);
    expect(ids).toHaveLength(1);
    expect(document.getElementById(ids[0]!)?.textContent).toContain('the only format the API accepts');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('invalid: aria-invalid, and the hint then the error are described, in that order', () => {
    render(examples[2]!.element);
    const input = screen.getByRole('textbox', { name: 'Cancellation date' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const ids = describedBy(input);
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0]!)?.textContent).toBe('Format yyyy-MM-dd.');
    expect(document.getElementById(ids[1]!)?.textContent).toContain('Cancellation date in the past. Today is 2026-10-19.');
  });

  it('invalid: exactly one error icon, in the message, none on the input', () => {
    const { container } = render(examples[2]!.element);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    const input = screen.getByRole('textbox', { name: 'Cancellation date' });
    const ids = describedBy(input);
    expect(document.getElementById(ids[1]!)?.querySelector('svg')).not.toBeNull();
    expect(input.parentElement?.tagName).toBe('DIV');
  });

  it('required: says so in words and sets aria-required', () => {
    render(examples[3]!.element);
    const input = screen.getByRole('textbox', { name: 'Cancellation date (required)' });
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('puts the error after the hint and before the input in the document', () => {
    const { container } = render(
      <Field label="Cancellation date" hint="The hint" error="The error">
        {(control) => <TextInput {...control} />}
      </Field>,
    );
    const text = container.textContent ?? '';
    expect(text.indexOf('The hint')).toBeLessThan(text.indexOf('The error'));
    const error = screen.getByText('The error');
    const input = screen.getByRole('textbox');
    expect(error.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('describes the constraint between the hint and the error', () => {
    render(
      <Field label="Amount" hint="The hint" constraint={<span>≤ 2 dp</span>} error="The error">
        {(control) => <TextInput {...control} />}
      </Field>,
    );
    const ids = describedBy(screen.getByRole('textbox', { name: 'Amount' }));
    const texts = ids.map((id) => document.getElementById(id)?.textContent ?? '');
    expect(texts).toHaveLength(3);
    expect(texts[0]).toBe('The hint');
    expect(texts[1]).toBe('≤ 2 dp');
    expect(texts[2]).toContain('The error');
  });

  it('uses the id it is given, so the error summary can link to it', () => {
    render(
      <Field label="Cancellation date" id="cancellationDate">
        {(control) => <TextInput {...control} />}
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Cancellation date' }).id).toBe('cancellationDate');
  });

  it('several messages are all described and all shown', () => {
    render(
      <Field label="Cancellation date" error={['First problem', 'Second problem']}>
        {(control) => <TextInput {...control} />}
      </Field>,
    );
    expect(screen.getByText('First problem')).toBeTruthy();
    expect(screen.getByText('Second problem')).toBeTruthy();
    const input = screen.getByRole('textbox', { name: 'Cancellation date' });
    expect(describedBy(input)).toHaveLength(1);
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
