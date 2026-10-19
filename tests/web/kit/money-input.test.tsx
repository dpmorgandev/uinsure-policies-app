import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoneyInput } from '../../../src/web/kit/primitives/money-input/MoneyInput';
import { examples } from '../../../src/web/kit/primitives/money-input/money-input.examples';

afterEach(cleanup);

describe('MoneyInput', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('textbox', { name: 'Amount' })).toBeTruthy();
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['empty', 'filled', 'over 2 dp', 'invalid by rule']);
  });

  it('is a text field with a decimal keyboard', () => {
    render(<MoneyInput aria-label="Amount" />);
    const input = screen.getByRole('textbox', { name: 'Amount' });
    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('decimal');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('never rounds or pads on entry', async () => {
    render(<MoneyInput aria-label="Amount" />);
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
    await userEvent.type(input, '445.1112');
    await userEvent.tab();
    expect(input.value).toBe('445.1112');
  });

  it('the filled example keeps its trailing zero', () => {
    render(examples[1]!.element);
    expect((screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement).value).toBe('615.40');
  });

  it.each([2, 3])('invalid example %i is aria-invalid and linked to its message', (index) => {
    render(examples[index]!.element);
    const input = screen.getByRole('textbox', { name: 'Amount' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const id = input.getAttribute('aria-describedby') as string;
    expect(document.getElementById(id)?.textContent).toContain('Placeholder message');
  });

  it('draws no icon over the right-aligned digits when invalid: the field message carries the only icon', () => {
    const { container } = render(examples[2]!.element);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    const input = screen.getByRole('textbox', { name: 'Amount' });
    expect(input.parentElement?.querySelector('input + svg')).toBeNull();
    const id = input.getAttribute('aria-describedby') as string;
    expect(document.getElementById(id)?.querySelector('svg')).not.toBeNull();
  });
});
