import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VerifyCommand } from '../../../src/Uinsure.Policies.Web/kit/patterns/verify-command/VerifyCommand';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/verify-command/verify-command.examples';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const COMMAND = 'git log --reverse --format="%h %(trailers:key=TDD,valueonly) %s" 94a7473^..92ede9e';

function pending() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('verify-command examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('group', { name: 'Command to re-check the order' })).toBeTruthy();
  });

  it('pop: the command is filled in with the red and green SHAs, and says what to expect', () => {
    const first = examples[0];
    if (!first) throw new Error('no example');
    render(first.element);
    const group = screen.getByRole('group', { name: 'Command to re-check the order' });
    expect(group.querySelector('pre code')?.textContent).toBe(COMMAND);
    expect(screen.getByText(/Expect/).textContent).toContain('94a7473');
    expect(screen.getByText(/Expect/).textContent).toContain('92ede9e');
    expect(screen.getByText(/the page has no recorded output for it/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy command' })).toBeTruthy();
  });
});

describe('VerifyCommand', () => {
  it('shows the command in the mono face inside a named group', () => {
    render(<VerifyCommand command={COMMAND} label="Command to re-check GET-1" />);
    const group = screen.getByRole('group', { name: 'Command to re-check GET-1' });
    expect(group.querySelector('pre code')?.textContent).toBe(COMMAND);
  });

  it('leaves out the intro, expectation and note when they are not given', () => {
    const { container } = render(<VerifyCommand command={COMMAND} />);
    expect(container.querySelectorAll('p').length).toBe(0);
  });

  it('copies the command exactly as shown', async () => {
    const onCopy = vi.fn().mockResolvedValue(undefined);
    render(<VerifyCommand command={COMMAND} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy command' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledWith(COMMAND);
  });

  it('BUSY-1: while copying it is disabled, busy, says what is happening, and cannot be fired twice', async () => {
    const copy = pending();
    const onCopy = vi.fn(() => copy.promise);
    render(<VerifyCommand command={COMMAND} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy command' }));

    const busy = screen.getByRole('button', { name: 'Copying the command…' }) as HTMLButtonElement;
    expect(busy.disabled).toBe(true);
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect(busy.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(busy);
    fireEvent.click(busy);
    expect(onCopy).toHaveBeenCalledTimes(1);

    await act(async () => {
      copy.resolve();
      await copy.promise;
    });
    expect((screen.getByRole('button', { name: 'Copied' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('says in words when the copy failed', async () => {
    const onCopy = vi.fn().mockRejectedValue(new Error('denied'));
    render(<VerifyCommand command={COMMAND} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy command' }));
    expect(await screen.findByRole('button', { name: 'Copy failed' })).toBeTruthy();
  });

  it('lets the caller word the copy control', () => {
    render(<VerifyCommand command={COMMAND} copyLabel="Copy the log command" />);
    expect(screen.getByRole('button', { name: 'Copy the log command' })).toBeTruthy();
  });
});
