import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateInput } from '../../../src/web/kit/primitives/date-input/DateInput';
import { examples } from '../../../src/web/kit/primitives/date-input/date-input.examples';

afterEach(cleanup);

describe('DateInput', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('textbox', { name: 'Cancellation date' })).toBeTruthy();
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['empty', 'filled', 'invalid format', 'invalid by rule']);
  });

  it('is a text field with a numeric keyboard and the yyyy-MM-dd hint, not a date picker', () => {
    render(<DateInput aria-label="Cancellation date" />);
    const input = screen.getByRole('textbox', { name: 'Cancellation date' });
    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('placeholder')).toBe('yyyy-MM-dd');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('shows what was typed, never reformatted', async () => {
    render(<DateInput aria-label="Cancellation date" />);
    const input = screen.getByRole('textbox', { name: 'Cancellation date' }) as HTMLInputElement;
    await userEvent.type(input, '18/11/2026');
    expect(input.value).toBe('18/11/2026');
  });

  it('the filled example holds 2027-01-27 exactly', () => {
    render(examples[1]!.element);
    expect((screen.getByRole('textbox', { name: 'Cancellation date' }) as HTMLInputElement).value).toBe('2027-01-27');
  });

  it.each([
    [2, 'The cancellation date must be a date in the form yyyy-MM-dd.'],
    [3, 'Cancellation date in the past. Today is 2026-10-19.'],
  ])('invalid example %i is aria-invalid and linked to its message', (index, text) => {
    render(examples[index as number]!.element);
    const input = screen.getByRole('textbox', { name: 'Cancellation date' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const id = input.getAttribute('aria-describedby') as string;
    const message = document.getElementById(id) as HTMLElement;
    expect(message.textContent).toBe(`Error: ${text}`);
    expect(message.querySelectorAll('svg')).toHaveLength(1);
  });

  it('draws no icon of its own when invalid', () => {
    const { container } = render(<DateInput aria-label="Cancellation date" invalid />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
