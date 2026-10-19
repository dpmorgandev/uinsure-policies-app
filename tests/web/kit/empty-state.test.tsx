import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../../../src/web/kit/patterns/empty-state/EmptyState';
import { examples } from '../../../src/web/kit/patterns/empty-state/empty-state.examples';

afterEach(cleanup);

describe('empty-state examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['each context']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelectorAll('[data-context]').length).toBe(5);
  });

  it('shows all five contexts, each with its own word', () => {
    const first = examples[0];
    if (!first) throw new Error('no example');
    render(first.element);
    for (const word of ['Not built yet', 'Not loaded', 'Did not load', 'No matches', 'Nothing here']) {
      expect(screen.getByText(word)).toBeTruthy();
    }
  });
});

describe('EmptyState', () => {
  it('says what is absent, why, and where to go', () => {
    render(
      <EmptyState
        context="not-built"
        title="Rule ‹ruleId› has nothing to show."
        why="Placeholder reason."
        to={{ label: 'Back to the requirements matrix', href: '/matrix' }}
      />,
    );
    expect(screen.getByText('Rule ‹ruleId› has nothing to show.')).toBeTruthy();
    expect(screen.getByText('Placeholder reason.')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Back to the requirements matrix' });
    expect(link.getAttribute('href')).toBe('/matrix');
  });

  it('is not an alert unless it is an error', () => {
    const { rerender } = render(<EmptyState context="empty" title="Nothing recorded" />);
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<EmptyState context="error" title="The trail did not load." />);
    expect(screen.getByRole('alert').textContent).toContain('The trail did not load.');
  });

  it('can make the title a heading of the level asked for', () => {
    render(<EmptyState context="empty" title="Nothing recorded" headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Nothing recorded' })).toBeTruthy();
  });

  it('keeps its glyph decorative so the word carries the status', () => {
    const { container } = render(<EmptyState context="error" title="Failed" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(within(screen.getByRole('alert')).getByText('Did not load')).toBeTruthy();
  });

  describe('BUSY-1 on the retry action', () => {
    it('fires once when idle', async () => {
      const onClick = vi.fn();
      render(<EmptyState context="error" title="Failed" action={{ label: 'Try again', onClick }} />);
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('while busy: disabled, aria-busy, says what is happening, and cannot be fired twice', async () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          context="error"
          title="Failed"
          action={{ label: 'Try again', onClick, busy: true, busyLabel: 'Trying again…' }}
        />,
      );
      const button = screen.getByRole('button', { name: 'Trying again…' });
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      await userEvent.click(button);
      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
