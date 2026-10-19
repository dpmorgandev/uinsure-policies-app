import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../../../src/web/kit/primitives/switch/Switch';
import { examples } from '../../../src/web/kit/primitives/switch/switch.examples';

afterEach(cleanup);

describe('Switch', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('switch', { name: 'Auto-renew' })).toBeTruthy();
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['on', 'off', 'focus']);
  });

  it('on: a switch that is checked, with the word On visible', () => {
    render(examples[0]!.element);
    expect((screen.getByRole('switch', { name: 'Auto-renew' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText('On')).toBeTruthy();
  });

  it('off: a switch that is not checked, with the word Off visible', () => {
    render(examples[1]!.element);
    expect((screen.getByRole('switch', { name: 'Auto-renew' }) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText('Off')).toBeTruthy();
  });

  it('toggles from the keyboard with Space, and the visible word follows', async () => {
    const onChange = vi.fn();
    render(<Switch label="Auto-renew" onChange={onChange} />);
    await userEvent.tab();
    const control = screen.getByRole('switch', { name: 'Auto-renew' }) as HTMLInputElement;
    expect(document.activeElement).toBe(control);
    await userEvent.keyboard(' ');
    expect(control.checked).toBe(true);
    expect(screen.getByText('On')).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('clicking the label toggles it', async () => {
    render(<Switch label="Auto-renew" defaultChecked />);
    await userEvent.click(screen.getByText('Auto-renew'));
    expect((screen.getByRole('switch', { name: 'Auto-renew' }) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText('Off')).toBeTruthy();
  });

  it('uses the words it is given for both states', () => {
    const { rerender } = render(<Switch label="Auto-renew" onText="Renews" offText="Does not renew" checked onChange={() => {}} />);
    expect(screen.getByText('Renews')).toBeTruthy();
    rerender(<Switch label="Auto-renew" onText="Renews" offText="Does not renew" checked={false} onChange={() => {}} />);
    expect(screen.getByText('Does not renew')).toBeTruthy();
  });
});
