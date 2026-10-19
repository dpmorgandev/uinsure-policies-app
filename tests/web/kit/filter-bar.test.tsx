import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../../../src/web/kit/patterns/filter-bar/FilterBar';
import type { FilterDefinition } from '../../../src/web/kit/patterns/filter-bar/FilterBar';
import { examples } from '../../../src/web/kit/patterns/filter-bar/filter-bar.examples';

afterEach(cleanup);

const FILTERS: FilterDefinition[] = [
  {
    id: 'agent',
    label: 'Agent',
    options: [
      { value: 'tester', label: 'tester' },
      { value: 'builder', label: 'builder' },
    ],
    value: '',
  },
  {
    id: 'attempt',
    label: 'Attempt',
    options: [
      { value: '1', label: 'Attempt 1' },
      { value: '2', label: 'Attempt 2' },
    ],
    value: '',
  },
];

describe('filter-bar examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['none set', 'set', 'no matches']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('group', { name: 'Filters' })).toBeTruthy();
    expect(screen.getAllByRole('combobox').length).toBe(4);
  });

  it('none set: every filter reads Any, nothing to clear, and the count says so', () => {
    const first = examples[0];
    if (!first) throw new Error('no example');
    render(first.element);
    for (const select of screen.getAllByRole('combobox') as HTMLSelectElement[]) expect(select.value).toBe('');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Showing 17 of 17 rungs, no filters set.');
  });

  it('set: the chosen filter shows its value, and Clear filters appears', () => {
    const second = examples[1];
    if (!second) throw new Error('no example');
    render(second.element);
    expect((screen.getByLabelText('Agent') as HTMLSelectElement).value).toBe('tester');
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Showing 9 of 17 rungs, 1 filter set.');
  });

  it('no matches: says so in words and still offers Clear filters', () => {
    const third = examples[2];
    if (!third) throw new Error('no example');
    render(third.element);
    expect(screen.getByText('No rungs match these filters.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Showing 0 of 17 rungs');
  });
});

describe('FilterBar', () => {
  it('labels every filter, and each label names its control', () => {
    render(<FilterBar filters={FILTERS} matchCount={4} totalCount={4} />);
    expect(screen.getByLabelText('Agent').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Attempt').tagName).toBe('SELECT');
  });

  it('puts Any first in every filter and then the options in the order given', () => {
    render(<FilterBar filters={FILTERS} matchCount={4} totalCount={4} />);
    const options = within(screen.getByLabelText('Agent')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Any', 'tester', 'builder']);
  });

  it('hands the filter id and the new value to onChange', async () => {
    const onChange = vi.fn();
    render(<FilterBar filters={FILTERS} matchCount={4} totalCount={4} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Attempt'), '2');
    expect(onChange).toHaveBeenCalledWith('attempt', '2');
  });

  it('calls onClear from the Clear filters button, which can be reached from the keyboard', async () => {
    const onClear = vi.fn();
    render(
      <FilterBar
        filters={[{ ...(FILTERS[0] as FilterDefinition), value: 'tester' }]}
        matchCount={2}
        totalCount={4}
        onClear={onClear}
      />,
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Clear filters' }));
    await userEvent.keyboard('{Enter}');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('counts the set filters in the status line, singular and plural', () => {
    const both = FILTERS.map((f, i) => ({ ...f, value: i === 0 ? 'tester' : '1' }));
    const { rerender } = render(<FilterBar filters={both} matchCount={1} totalCount={4} noun="commits" />);
    expect(screen.getByRole('status').textContent).toBe('Showing 1 of 4 commits, 2 filters set.');
    rerender(<FilterBar filters={FILTERS} matchCount={4} totalCount={4} noun="commits" />);
    expect(screen.getByRole('status').textContent).toBe('Showing 4 of 4 commits, no filters set.');
  });

  it('shows no empty message while some rows match', () => {
    render(<FilterBar filters={FILTERS} matchCount={1} totalCount={4} />);
    expect(screen.queryByText(/match these filters/)).toBeNull();
  });
});
