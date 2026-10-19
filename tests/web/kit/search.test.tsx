import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from '../../../src/web/kit/patterns/search/Search';
import type { SearchResult } from '../../../src/web/kit/patterns/search/Search';
import { examples } from '../../../src/web/kit/patterns/search/search.examples';

afterEach(cleanup);

const RESULTS: SearchResult[] = [
  { id: 'a', kind: 'node', label: 'build/F2', detail: 'F2 Retrieve', href: '/nodes/build/F2' },
  { id: 'b', kind: 'path', label: 'docs/qa/build-F2.md', href: '/files/docs/qa/build-F2.md' },
  { id: 'c', kind: 'sha', label: '94a7473', href: '/commits/94a7473' },
];

describe('search examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['empty', 'results', 'no results']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
  });

  it('empty: no list and no message', () => {
    const first = examples[0];
    if (!first) throw new Error('no example');
    render(first.element);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('');
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false');
  });

  it('results: the matches are listed, each with its kind in words', () => {
    const second = examples[1];
    if (!second) throw new Error('no example');
    render(second.element);
    const lists = screen.getAllByRole('listbox');
    expect(lists.length).toBe(2);
    expect(screen.getAllByRole('option').length).toBe(5);
    expect(screen.getByText('docs/qa/build-F2.md')).toBeTruthy();
  });

  it('no results: says so in words, naming the query', () => {
    const third = examples[2];
    if (!third) throw new Error('no example');
    render(third.element);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('No rule, node, SHA or path matches “ZZ-99”.');
  });
});

describe('Search', () => {
  it('has a visible label tied to the field, and the keys are written down and described to it', () => {
    render(<Search />);
    const input = screen.getByLabelText('Jump to a rule, node, SHA or path');
    expect(input).toBe(screen.getByRole('combobox'));
    const hint = document.getElementById(input.getAttribute('aria-describedby') ?? '');
    expect(hint?.textContent).toContain('Enter');
    expect(hint?.textContent).toContain('Esc');
    expect(hint?.textContent).toContain('/');
  });

  it('is a search landmark', () => {
    render(<Search />);
    expect(screen.getByRole('search')).toBeTruthy();
  });

  it('opens the list with the typed text, and reports the number of matches', () => {
    render(<Search defaultValue="F2" results={RESULTS} />);
    const input = screen.getByRole('combobox');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id);
    expect(screen.getByRole('status').textContent).toBe('3 matches');
  });

  it('calls onValueChange as the reader types', async () => {
    const onValueChange = vi.fn();
    render(<Search onValueChange={onValueChange} />);
    await userEvent.type(screen.getByRole('combobox'), 'F2');
    expect(onValueChange).toHaveBeenLastCalledWith('F2');
  });

  it('moves through the matches with the arrow keys and wraps', async () => {
    render(<Search defaultValue="F2" results={RESULTS} />);
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    const options = screen.getAllByRole('option');

    await userEvent.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]?.id);
    expect(options[0]?.getAttribute('aria-selected')).toBe('true');

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[2]?.id);

    await userEvent.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]?.id);

    await userEvent.keyboard('{ArrowUp}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[2]?.id);
  });

  it('opens the chosen match with Enter, and does nothing when none is chosen', async () => {
    const onSelect = vi.fn();
    render(<Search defaultValue="F2" results={RESULTS} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(RESULTS[1]);
  });

  it('opens a match when it is clicked', async () => {
    const onSelect = vi.fn();
    render(<Search defaultValue="F2" results={RESULTS} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('option', { name: /94a7473/ }));
    expect(onSelect).toHaveBeenCalledWith(RESULTS[2]);
  });

  it('Escape closes the list first, then clears the text', async () => {
    const onValueChange = vi.fn();
    render(<Search defaultValue="F2" results={RESULTS} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.value).toBe('F2');
    await userEvent.keyboard('{Escape}');
    expect(input.value).toBe('');
    expect(onValueChange).toHaveBeenLastCalledWith('');
  });

  it('the shortcut key moves focus to the field from elsewhere, and not while typing in another field', async () => {
    render(
      <div>
        <button type="button">Elsewhere</button>
        <input aria-label="Another field" />
        <Search />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    await userEvent.keyboard('/');
    expect(document.activeElement).toBe(screen.getByRole('combobox'));

    await userEvent.click(screen.getByLabelText('Another field'));
    await userEvent.keyboard('/');
    expect(document.activeElement).toBe(screen.getByLabelText('Another field'));
  });

  it('the shortcut can be turned off, and is then not written in the hint', () => {
    render(<Search shortcut={null} />);
    fireEvent.keyDown(document.body, { key: '/' });
    expect(document.activeElement).not.toBe(screen.getByRole('combobox'));
    expect(screen.getByRole('search').textContent).not.toContain('jump to search');
  });

  it('keeps the glyphs decorative', () => {
    const { container } = render(<Search defaultValue="ZZ-99" results={[]} />);
    const glyphs = container.querySelectorAll('svg');
    expect(glyphs.length).toBeGreaterThan(0);
    for (const glyph of glyphs) expect(glyph.getAttribute('aria-hidden')).toBe('true');
  });
});
