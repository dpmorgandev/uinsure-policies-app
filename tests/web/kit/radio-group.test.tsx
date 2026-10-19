import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup } from '../../../src/web/kit/primitives/radio-group/RadioGroup';
import { examples } from '../../../src/web/kit/primitives/radio-group/radio-group.examples';

afterEach(cleanup);

const options = [
  { value: 'Card', label: 'Card' },
  { value: 'DirectDebit', label: 'Direct Debit' },
  { value: 'Cheque', label: 'Cheque' },
];

describe('RadioGroup', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByRole('radiogroup', { name: 'Payment method' }).length).toBeGreaterThan(0);
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['each value', 'invalid']);
  });

  it('is a radiogroup named by its legend, with one native radio per option', () => {
    render(<RadioGroup legend="Payment method" options={options} />);
    const group = screen.getByRole('radiogroup', { name: 'Payment method' });
    expect(group.tagName).toBe('FIELDSET');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(group.getAttribute('aria-invalid')).toBeNull();
  });

  it('the "each value" example checks a different value in each group', () => {
    render(examples[0]!.element);
    const groups = screen.getAllByRole('radiogroup', { name: 'Payment method' });
    const checked = groups.map((g) =>
      (Array.from(g.querySelectorAll('input')) as HTMLInputElement[]).filter((r) => r.checked).map((r) => r.value),
    );
    expect(checked).toEqual([['Card'], ['DirectDebit'], ['Cheque']]);
  });

  it('choosing an option checks only it and reports the value', async () => {
    const onChange = vi.fn();
    render(<RadioGroup legend="Payment method" options={options} defaultValue="Card" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Direct Debit' }));
    expect((screen.getByRole('radio', { name: 'Direct Debit' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('radio', { name: 'Card' }) as HTMLInputElement).checked).toBe(false);
    expect(onChange).toHaveBeenCalledWith('DirectDebit');
  });

  it('the radios share one name, so the keyboard moves between them as one group', () => {
    render(<RadioGroup legend="Payment method" options={options} />);
    const names = new Set((screen.getAllByRole('radio') as HTMLInputElement[]).map((r) => r.name));
    expect(names.size).toBe(1);
  });

  it('invalid: aria-invalid is true on the group, nothing is chosen and the message is linked', () => {
    render(examples[1]!.element);
    const group = screen.getByRole('radiogroup', { name: 'Payment method' });
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect((screen.getAllByRole('radio') as HTMLInputElement[]).some((r) => r.checked)).toBe(false);
    const id = group.getAttribute('aria-describedby') as string;
    expect(document.getElementById(id)?.textContent).toContain('Placeholder message');
  });
});
