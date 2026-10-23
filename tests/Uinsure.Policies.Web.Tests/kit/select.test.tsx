import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../../../src/Uinsure.Policies.Web/kit/primitives/select/Select';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/primitives/select/select.examples';

afterEach(cleanup);

const options = [
  { value: 'Card', label: 'Card' },
  { value: 'DirectDebit', label: 'Direct Debit' },
  { value: 'Cheque', label: 'Cheque' },
];

describe('Select', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByRole('combobox', { name: 'Payment method' }).length).toBeGreaterThan(0);
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['each value', 'invalid']);
  });

  it('the "each value" example shows every value, one select per value', () => {
    render(examples[0]!.element);
    const selects = screen.getAllByRole('combobox', { name: 'Payment method' }) as HTMLSelectElement[];
    expect(selects.map((s) => s.value)).toEqual(['Card', 'DirectDebit', 'Cheque']);
    expect(selects.map((s) => s.selectedOptions[0]?.textContent)).toEqual(['Card', 'Direct Debit', 'Cheque']);
    selects.forEach((s) => expect(s.getAttribute('aria-invalid')).toBeNull());
  });

  it('changes value from the keyboard-accessible native control', async () => {
    render(<Select aria-label="Payment method" options={options} defaultValue="Card" />);
    const select = screen.getByRole('combobox', { name: 'Payment method' }) as HTMLSelectElement;
    await userEvent.selectOptions(select, 'DirectDebit');
    expect(select.value).toBe('DirectDebit');
  });

  it('invalid: aria-invalid is true, the placeholder is shown and the message is linked', () => {
    render(examples[1]!.element);
    const select = screen.getByRole('combobox', { name: 'Payment method' }) as HTMLSelectElement;
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.value).toBe('');
    expect(select.selectedOptions[0]?.textContent).toBe('Choose a payment method');
    const id = select.getAttribute('aria-describedby') as string;
    expect(document.getElementById(id)?.textContent).toContain('Placeholder message');
  });

  it('invalid: only the chevron is in the box, and the field message carries the one error icon', () => {
    const { container } = render(examples[1]!.element);
    const select = screen.getByRole('combobox', { name: 'Payment method' });
    expect(select.parentElement?.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelectorAll('svg')).toHaveLength(2);
    const id = select.getAttribute('aria-describedby') as string;
    expect(document.getElementById(id)?.querySelector('svg')).not.toBeNull();
  });

  it('the placeholder option is disabled, so it cannot be chosen back', () => {
    render(<Select aria-label="Payment method" options={options} placeholder="Choose" />);
    const placeholder = screen.getByRole('option', { name: 'Choose' }) as HTMLOptionElement;
    expect(placeholder.disabled).toBe(true);
  });
});
