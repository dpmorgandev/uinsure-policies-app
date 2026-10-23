import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../../../src/Uinsure.Policies.Web/kit/patterns/confirm-dialog/ConfirmDialog';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/confirm-dialog/confirm-dialog.examples';

afterEach(cleanup);

function dialog(props: Partial<ComponentProps<typeof ConfirmDialog>> = {}) {
  return (
    <ConfirmDialog
      title="Cancel policy F3-MVEOSVDQJQ?"
      confirmLabel="Cancel policy on 2027-01-27"
      busyLabel="Cancelling…"
      {...props}
    >
      <p>This cancels the policy on 2027-01-27 and refunds 445.11 to DirectDebit.</p>
    </ConfirmDialog>
  );
}

describe('ConfirmDialog', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['open', 'submitting']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('dialog', { name: 'Cancel policy F3-MVEOSVDQJQ?' })).toBeTruthy();
  });

  it('open: a modal dialog named by its question and described by what will happen', () => {
    render(examples[0]!.element);
    const el = screen.getByRole('dialog', { name: 'Cancel policy F3-MVEOSVDQJQ?' });
    expect(el.getAttribute('aria-modal')).toBe('true');
    const described = document.getElementById(el.getAttribute('aria-describedby') as string);
    expect(described?.textContent).toContain('2027-01-27');
    expect(described?.textContent).toContain('445.11');
    expect(screen.getByRole('link', { name: 'CANCEL-4' })).toBeTruthy();
  });

  it('open: the confirm button is in the action\'s own words, and going back is offered', () => {
    render(examples[0]!.element);
    const confirm = screen.getByRole('button', { name: 'Cancel policy on 2027-01-27' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);
    expect(confirm.getAttribute('aria-busy')).toBeNull();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
  });

  it('confirm and go back call their handlers', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(dialog({ onConfirm, onCancel, focusOnOpen: false }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel policy on 2027-01-27' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('takes focus on the safe choice when it opens', () => {
    render(dialog());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Go back' }));
  });

  it('gives focus back to where it came from when it closes', () => {
    function Opener({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">Cancel on 2027-01-27</button>
          {open ? dialog() : null}
        </>
      );
    }
    const { rerender } = render(<Opener open={false} />);
    const opener = screen.getByRole('button', { name: 'Cancel on 2027-01-27' });
    opener.focus();
    rerender(<Opener open />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Go back' }));
    rerender(<Opener open={false} />);
    expect(document.activeElement).toBe(opener);
  });

  it('Escape goes back', async () => {
    const onCancel = vi.fn();
    render(dialog({ onCancel }));
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab inside the dialog, both ways', async () => {
    render(dialog());
    const confirm = screen.getByRole('button', { name: 'Cancel policy on 2027-01-27' });
    const back = screen.getByRole('button', { name: 'Go back' });
    expect(document.activeElement).toBe(back);
    await userEvent.tab();
    expect(document.activeElement).toBe(confirm);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(back);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(confirm);
  });

  describe('BUSY-1', () => {
    it('submitting: confirm is disabled, busy, and says what is happening', () => {
      render(examples[1]!.element);
      const busy = screen.getByRole('button', { name: 'Cancelling…' }) as HTMLButtonElement;
      expect(busy.disabled).toBe(true);
      expect(busy.getAttribute('aria-busy')).toBe('true');
      expect(busy.getAttribute('aria-disabled')).toBe('true');
      expect(busy.querySelector('svg')).not.toBeNull();
      expect(screen.queryByRole('button', { name: 'Cancel policy on 2027-01-27' })).toBeNull();
    });

    it('submitting: going back is disabled too, so the request is not abandoned half way', () => {
      render(examples[1]!.element);
      const back = screen.getByRole('button', { name: 'Go back' }) as HTMLButtonElement;
      expect(back.disabled).toBe(true);
    });

    it('cannot be fired twice, and Escape does nothing while it runs', async () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(dialog({ busy: true, onConfirm, onCancel }));
      const busy = screen.getByRole('button', { name: 'Cancelling…' });
      await userEvent.click(busy);
      await userEvent.dblClick(busy);
      fireEvent.click(busy);
      await userEvent.keyboard('{Escape}');
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('the dialog holds focus while the request runs', () => {
      render(dialog({ busy: true }));
      expect(document.activeElement).toBe(screen.getByRole('dialog'));
    });
  });
});
