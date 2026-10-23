import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiffViewer } from '../../../src/Uinsure.Policies.Web/kit/patterns/diff-viewer/DiffViewer';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/diff-viewer/diff-viewer.examples';

afterEach(cleanup);

function example(state: string) {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example for ${state}`);
  return found.element;
}

describe('diff-viewer examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['load', 'pop', 'err', 'long']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByRole('region').length).toBeGreaterThan(0);
  });

  it('load: the diff asked for is busy and says what is happening; the one not asked for offers its button', () => {
    render(example('load'));
    const busy = screen.getByRole('button', { name: 'Loading red diff…' });
    expect(busy.hasAttribute('disabled')).toBe(true);
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect(screen.getAllByRole('status').length).toBe(2);
    expect(screen.getByText('Loading the diff chunk for #5 94a7473.')).toBeTruthy();
    const idle = screen.getByRole('button', { name: 'Load green diff, #17 92ede9e' });
    expect(idle.hasAttribute('disabled')).toBe(false);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('pop: a table per file with its path as the caption, and added and removed lines said in words', () => {
    render(example('pop'));
    const table = screen.getByRole('table', { name: 'TwoDecimalPlacesConverter.cs (placeholder lines)' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.length).toBe(4);
    expect(rows.map((r) => r.getAttribute('data-kind'))).toEqual(['ctx', 'del', 'add', 'ctx']);
    expect(within(rows[1] as HTMLElement).getByText('removed')).toBeTruthy();
    expect(within(rows[2] as HTMLElement).getByText('added')).toBeTruthy();
    expect(within(rows[0] as HTMLElement).getByText('unchanged')).toBeTruthy();
  });

  it('pop: the header names the rung, the SHA as a link to GitHub, the TDD step, the layer and the agent', () => {
    render(example('pop'));
    const section = screen.getByRole('region', { name: 'Diff for #19 80d3ee2' });
    expect(within(section).getByText('#19')).toBeTruthy();
    expect(within(section).getByRole('link', { name: 'Commit 80d3ee2 on GitHub' })).toBeTruthy();
    expect(within(section).getByText('refactor')).toBeTruthy();
    expect(within(section).getByText('api')).toBeTruthy();
    expect(within(section).getByText('builder')).toBeTruthy();
  });

  it('err: the failure is an alert, the GitHub link is still there, and there is a way to try again', () => {
    render(example('err'));
    expect(screen.getByRole('alert').textContent).toContain('The diff for #5 94a7473 did not load.');
    expect(screen.getByRole('link', { name: 'Commit 94a7473 on GitHub' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('long: the lines sit in a focusable, named scroll frame and the long names stay whole', () => {
    render(example('long'));
    const frame = screen.getByRole('region', { name: 'Diff lines for #17 92ede9e' });
    expect(frame.getAttribute('tabindex')).toBe('0');
    expect(frame.textContent).toContain('Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active');
  });
});

describe('DiffViewer', () => {
  it('idle: offers a button named for the rung and SHA, and draws no lines', async () => {
    const onLoad = vi.fn();
    render(<DiffViewer status="idle" rung="#5" sha="94a7473" onLoad={onLoad} />);
    await userEvent.click(screen.getByRole('button', { name: 'Load diff, #5 94a7473' }));
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('each loads when asked');
  });

  it('works without a rung number', () => {
    render(<DiffViewer status="idle" sha="94a7473" />);
    expect(screen.getByRole('button', { name: 'Load diff, 94a7473' })).toBeTruthy();
  });

  it('loaded with no files says so rather than showing an empty frame', () => {
    render(<DiffViewer status="loaded" sha="94a7473" files={[]} />);
    expect(screen.getByText('The diff holds no lines.')).toBeTruthy();
  });

  it('error falls back to a message naming the commit', () => {
    render(<DiffViewer status="error" rung="#5" sha="94a7473" />);
    expect(screen.getByRole('alert').textContent).toContain('The diff for #5 94a7473 did not load.');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keeps the added and removed marks out of the accessibility tree, saying the words instead', () => {
    const { container } = render(
      <DiffViewer
        status="loaded"
        sha="94a7473"
        files={[{ path: 'a.cs', lines: [{ kind: 'add', newNo: 1, text: 'x' }] }]}
      />,
    );
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe('+');
    expect(screen.getByText('added')).toBeTruthy();
  });

  describe('BUSY-1 on the load button', () => {
    it('while loading: disabled, aria-busy, aria-disabled, labelled, and cannot be fired twice', async () => {
      const onLoad = vi.fn();
      render(<DiffViewer status="loading" rung="#5" sha="94a7473" busyLabel="Loading red diff…" onLoad={onLoad} />);
      const button = screen.getByRole('button', { name: 'Loading red diff…' });
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      await userEvent.click(button);
      await userEvent.dblClick(button);
      fireEvent.click(button);
      expect(onLoad).not.toHaveBeenCalled();
    });

    it('says what is loading in a status line', () => {
      render(<DiffViewer status="loading" rung="#5" sha="94a7473" />);
      expect(screen.getByRole('status').textContent).toBe('Loading the diff for #5 94a7473.');
    });
  });

  describe('BUSY-1 on the retry button', () => {
    it('fires once when idle', async () => {
      const onRetry = vi.fn();
      render(<DiffViewer status="error" sha="94a7473" onRetry={onRetry} />);
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('while retrying: disabled, aria-busy, labelled, and cannot be fired twice', async () => {
      const onRetry = vi.fn();
      render(<DiffViewer status="error" sha="94a7473" onRetry={onRetry} retrying />);
      const button = screen.getByRole('button', { name: 'Trying again…' });
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      await userEvent.click(button);
      fireEvent.click(button);
      expect(onRetry).not.toHaveBeenCalled();
    });
  });
});
