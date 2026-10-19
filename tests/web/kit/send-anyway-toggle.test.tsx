import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SendAnywayToggle } from '../../../src/web/kit/project/send-anyway-toggle/SendAnywayToggle';
import { examples } from '../../../src/web/kit/project/send-anyway-toggle/send-anyway-toggle.examples';

afterEach(cleanup);

const exampleFor = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example named ${state}`);
  return found.element;
};

describe('send-anyway-toggle examples', () => {
  it('has exactly the catalogued states, in order', () => {
    expect(examples.map((e) => e.state)).toEqual(['off', 'on', 'on with a response']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('switch', { name: 'Send anyway' })).toBeTruthy();
  });
});

describe('SendAnywayToggle', () => {
  it('off: a switch that is not checked, with no notice and no table', () => {
    const { container } = render(exampleFor('off'));
    const toggle = screen.getByRole('switch', { name: 'Send anyway' }) as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect(container.querySelector('[data-state="off"]')).not.toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('the switch is described by what it does', () => {
    render(exampleFor('off'));
    const toggle = screen.getByRole('switch', { name: 'Send anyway' });
    expect(toggle.getAttribute('aria-describedby')).not.toBeNull();
    expect(document.getElementById(toggle.getAttribute('aria-describedby') ?? '')?.textContent).toMatch(
      /Turns off this form.s own checks/,
    );
  });

  it('on: a persistent notice says so, in words, with a glyph', () => {
    const { container } = render(exampleFor('on'));
    const notice = screen.getByRole('status');
    expect(notice.textContent).toContain('Send anyway is on.');
    expect(notice.textContent).toContain('checks are off');
    expect(notice.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('[data-state="on"]')).not.toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('toggles from the keyboard, and the notice follows', async () => {
    render(exampleFor('off'));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('switch', { name: 'Send anyway' }));
    await userEvent.keyboard(' ');
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('status')).toBeTruthy();
    await userEvent.keyboard(' ');
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('reports each change', async () => {
    const onChange = vi.fn();
    render(<SendAnywayToggle onChange={onChange} />);
    await userEvent.click(screen.getByRole('switch'));
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange.mock.calls).toEqual([[true], [false]]);
  });

  it('can be controlled', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<SendAnywayToggle checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(false);
    rerender(<SendAnywayToggle checked onChange={onChange} />);
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('on with a response: lines each violation up with the client check that would have caught it', () => {
    const { container } = render(exampleFor('on with a response'));
    expect(container.querySelector('[data-state="response"]')).not.toBeNull();
    expect(screen.getByText(/The API answered/).textContent).toContain('422');
    expect(screen.getByText(/The API answered/).textContent).toContain('2 violations');
    const table = screen.getByRole('table', { name: 'Each violation, beside the client check that would have caught it' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Rule',
      'What the API said',
      'Client check',
    ]);
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.length).toBe(2);
    expect(within(rows[0]!).getByRole('link', { name: 'COULD-2a' })).toBeTruthy();
    expect(rows[0]?.textContent).toContain('Claim date is not after today');
    expect(within(rows[1]!).getByRole('link', { name: 'COULD-2b' })).toBeTruthy();
  });

  it('says plainly when no client check covers a violation', () => {
    render(exampleFor('on with a response'));
    const none = screen.getByText('None: only the API decides this');
    expect(none.parentElement?.querySelector('svg')).not.toBeNull();
  });

  it('shows the response only while the toggle is on', async () => {
    render(exampleFor('on with a response'));
    expect(screen.getByRole('table')).toBeTruthy();
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says 1 violation, not 1 violations', () => {
    render(
      <SendAnywayToggle
        defaultChecked
        response={{ status: 422, violations: [{ ruleId: 'COULD-2a', detail: 'Placeholder detail' }] }}
      />,
    );
    expect(screen.getByText(/The API answered/).textContent).toContain('1 violation.');
  });

  it('scrolls the table inside its own labelled, focusable region', () => {
    render(exampleFor('on with a response'));
    const region = screen.getByRole('region', { name: /Each violation/ });
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('starts no process, so it carries no busy state', () => {
    render(exampleFor('on'));
    expect(screen.queryAllByRole('button').length).toBe(0);
    expect(document.querySelector('[aria-busy]')).toBeNull();
  });
});
