import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../../src/Uinsure.Policies.Web/kit/primitives/button/Button';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/primitives/button/button.examples';

afterEach(cleanup);

describe('Button', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual([
      'primary',
      'secondary',
      'destructive',
      'disabled',
      'busy (each variant)',
      'focus',
    ]);
  });

  it('is a real button that defaults to type button, with its label as its name', () => {
    render(<Button variant="primary">Quote this date</Button>);
    const button = screen.getByRole('button', { name: 'Quote this date' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(button.getAttribute('aria-disabled')).toBeNull();
  });

  it('fires onClick when idle', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go back</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be reached and pressed from the keyboard', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go back</Button>);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Go back' }));
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('when disabled, is disabled with aria-disabled and does not fire', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Cancel on a quoted date
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Cancel on a quoted date' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  describe('BUSY-1', () => {
    it('while busy: disabled, aria-busy, aria-disabled, and the label says what is happening', () => {
      render(
        <Button variant="destructive" busy busyLabel="Cancelling…">
          Cancel on 2027-01-27
        </Button>,
      );
      const button = screen.getByRole('button', { name: 'Cancelling…' });
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.querySelector('svg')).not.toBeNull();
      expect(screen.queryByText('Cancel on 2027-01-27')).toBeNull();
    });

    it('cannot be fired twice while busy', async () => {
      const onClick = vi.fn();
      render(
        <Button busy busyLabel="Quoting…" onClick={onClick}>
          Quote this date
        </Button>,
      );
      const button = screen.getByRole('button', { name: 'Quoting…' });
      await userEvent.click(button);
      await userEvent.dblClick(button);
      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('re-enables when the process ends', async () => {
      const onClick = vi.fn();
      const { rerender } = render(
        <Button busy busyLabel="Quoting…" onClick={onClick}>
          Quote this date
        </Button>,
      );
      rerender(
        <Button busy={false} busyLabel="Quoting…" onClick={onClick}>
          Quote this date
        </Button>,
      );
      const button = screen.getByRole('button', { name: 'Quote this date' });
      expect(button.hasAttribute('disabled')).toBe(false);
      expect(button.getAttribute('aria-busy')).toBeNull();
      await userEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
