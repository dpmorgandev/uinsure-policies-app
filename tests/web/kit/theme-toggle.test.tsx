import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../../../src/web/kit/primitives/theme-toggle/ThemeToggle';
import { examples } from '../../../src/web/kit/primitives/theme-toggle/theme-toggle.examples';

afterEach(cleanup);

describe('ThemeToggle', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByRole('radiogroup', { name: 'Theme' }).length).toBeGreaterThan(0);
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['each']);
  });

  it('offers light, dark and system as radios, named in words', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('radio', { name: 'Light' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'System' })).toBeTruthy();
  });

  it('the "each" example shows light, dark and system selected, one per toggle', () => {
    render(examples[0]!.element);
    const groups = screen.getAllByRole('radiogroup', { name: 'Theme' });
    const checked = groups.map((g) =>
      (Array.from(g.querySelectorAll('input')) as HTMLInputElement[]).filter((r) => r.checked).map((r) => r.value),
    );
    expect(checked).toEqual([['light'], ['dark'], ['system']]);
  });

  it('defaults to system', () => {
    render(<ThemeToggle />);
    expect((screen.getByRole('radio', { name: 'System' }) as HTMLInputElement).checked).toBe(true);
  });

  it('choosing one selects it alone and reports it; the toggle does not apply the theme itself', async () => {
    const onChange = vi.fn();
    render(<ThemeToggle onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect((screen.getByRole('radio', { name: 'Dark' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('radio', { name: 'System' }) as HTMLInputElement).checked).toBe(false);
    expect(onChange).toHaveBeenCalledWith('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('a controlled value wins over what was clicked until the parent changes it', async () => {
    const { rerender } = render(<ThemeToggle value="light" onChange={() => {}} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    rerender(<ThemeToggle value="light" onChange={() => {}} />);
    expect((screen.getByRole('radio', { name: 'Light' }) as HTMLInputElement).checked).toBe(true);
    rerender(<ThemeToggle value="dark" onChange={() => {}} />);
    expect((screen.getByRole('radio', { name: 'Dark' }) as HTMLInputElement).checked).toBe(true);
  });
});
