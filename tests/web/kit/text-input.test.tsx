import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInput } from '../../../src/web/kit/primitives/text-input/TextInput';
import { examples } from '../../../src/web/kit/primitives/text-input/text-input.examples';

afterEach(cleanup);

describe('TextInput', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('textbox', { name: 'Policy reference' })).toBeTruthy();
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['empty', 'filled', 'invalid', 'disabled', 'focus']);
  });

  it('is a text input that takes what is typed', async () => {
    render(<TextInput aria-label="Policy reference" />);
    const input = screen.getByRole('textbox', { name: 'Policy reference' }) as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    await userEvent.type(input, 'F3-MVEOSVDQJQ');
    expect(input.value).toBe('F3-MVEOSVDQJQ');
  });

  it('when invalid: aria-invalid is true and the field message is linked by aria-describedby', () => {
    render(
      <>
        <TextInput aria-label="Policy reference" invalid aria-describedby="why" />
        <p id="why">Why it is invalid</p>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Policy reference' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('why');
    expect(input.parentElement?.querySelector('svg')).not.toBeNull();
  });

  it('the invalid example links its message', () => {
    render(examples[2]!.element);
    const input = screen.getByRole('textbox', { name: 'Policy reference' });
    const id = input.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id as string)?.textContent).toContain('Placeholder message');
  });

  it('when disabled: not editable and not focusable', async () => {
    render(<TextInput aria-label="Policy reference" defaultValue="F3-MVEOSVDQJQ" disabled />);
    const input = screen.getByRole('textbox', { name: 'Policy reference' }) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    await userEvent.type(input, 'x');
    expect(input.value).toBe('F3-MVEOSVDQJQ');
  });

  it('can take focus from the keyboard', async () => {
    render(<TextInput aria-label="Policy reference" />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Policy reference' }));
  });
});
