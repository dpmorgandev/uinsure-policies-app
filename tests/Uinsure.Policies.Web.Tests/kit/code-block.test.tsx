import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CodeBlock } from '../../../src/Uinsure.Policies.Web/kit/primitives/code-block/CodeBlock';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/primitives/code-block/code-block.examples';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const COMMAND = 'git log --reverse --format="%h %(trailers:key=TDD,valueonly) %s" 94a7473^..92ede9e';

/** A copy the test finishes by hand, so the busy state can be inspected. */
function pending() {
  let resolve: () => void = () => {};
  let reject: (reason: Error) => void = () => {};
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('code-block examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'long']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }
});

describe('CodeBlock', () => {
  it('shows the text in mono inside a named group', () => {
    render(<CodeBlock label="Command to re-check the order">{COMMAND}</CodeBlock>);
    const group = screen.getByRole('group', { name: 'Command to re-check the order' });
    expect(group.querySelector('pre code')?.textContent).toBe(COMMAND);
  });

  it('offers a copy button with the caller\'s words', () => {
    render(
      <CodeBlock label="Command" copyLabel="Copy command">
        {COMMAND}
      </CodeBlock>,
    );
    const button = screen.getByRole('button', { name: 'Copy command' });
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('aria-busy')).toBeNull();
  });

  it('copies the text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<CodeBlock label="Command">{COMMAND}</CodeBlock>);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(COMMAND);
  });

  it('BUSY-1: while copying it is disabled, busy, labelled, and cannot be fired twice', async () => {
    const copy = pending();
    const onCopy = vi.fn(() => copy.promise);
    render(
      <CodeBlock label="Command" onCopy={onCopy}>
        {COMMAND}
      </CodeBlock>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    const busy = screen.getByRole('button', { name: 'Copying…' }) as HTMLButtonElement;
    expect(busy.disabled).toBe(true);
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect(busy.getAttribute('aria-disabled')).toBe('true');
    expect(busy.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');

    fireEvent.click(busy);
    fireEvent.keyDown(busy, { key: 'Enter' });
    expect(onCopy).toHaveBeenCalledTimes(1);

    await act(async () => {
      copy.resolve();
      await copy.promise;
    });
    const done = screen.getByRole('button', { name: 'Copied' }) as HTMLButtonElement;
    expect(done.disabled).toBe(false);
    expect(done.getAttribute('aria-busy')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Copied');
  });

  it('says in words when the copy failed, and can be tried again', async () => {
    const copy = pending();
    const onCopy = vi.fn(() => copy.promise);
    render(
      <CodeBlock label="Command" onCopy={onCopy}>
        {COMMAND}
      </CodeBlock>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await act(async () => {
      copy.reject(new Error('denied'));
      await copy.promise.catch(() => undefined);
    });
    const failed = screen.getByRole('button', { name: 'Copy failed' }) as HTMLButtonElement;
    expect(failed.disabled).toBe(false);
    expect(screen.getByRole('status').textContent).toBe('Copy failed');
  });

  it('fails in words, not silently, when there is no clipboard', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    render(<CodeBlock label="Command">{COMMAND}</CodeBlock>);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByRole('button', { name: 'Copy failed' })).toBeTruthy();
  });

  it('lets the caller word the busy state', async () => {
    const copy = pending();
    render(
      <CodeBlock label="Command" busyLabel={'Copying the command…'} onCopy={() => copy.promise}>
        {COMMAND}
      </CodeBlock>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('button', { name: 'Copying the command…' })).toBeTruthy();
    await act(async () => {
      copy.resolve();
      await copy.promise;
    });
  });
});
