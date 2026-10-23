import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../../../src/Uinsure.Policies.Web/kit/patterns/data-table/DataTable';
import type { DataTableColumn } from '../../../src/Uinsure.Policies.Web/kit/patterns/data-table/DataTable';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/data-table/data-table.examples';

afterEach(cleanup);

function example(state: string) {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example for ${state}`);
  return found.element;
}

interface Row {
  id: string;
  name: string;
  total: string;
}

const COLUMNS: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: (row) => row.name, rowHeader: true, sortable: true },
  { id: 'total', header: 'Total', cell: (row) => row.total, numeric: true, sortable: true },
];

const ROWS: Row[] = [
  { id: 'a', name: 'GET-1', total: '59' },
  { id: 'b', name: 'SELL-7', total: '8' },
];

describe('data-table examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'empty', 'load', 'err', 'long rows']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('pop: a captioned table with a row header and a cell for every gate', () => {
    render(example('pop'));
    const table = screen.getByRole('table', { name: /Gate counts for GET-1, in loop order/ });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Ref',
      'Gate',
      'Scope',
      'Counts',
      'Result',
    ]);
    const rowHeaders = within(table).getAllByRole('rowheader');
    expect(rowHeaders.map((h) => h.textContent)).toEqual(['1·1', '1·2', '2·1', '2·2', '2·3', '2·5', '#33']);
    expect(within(table).getAllByText('Gate held').length).toBe(6);
    expect(within(table).getAllByText('Gate failed').length).toBe(1);
  });

  it('pop: numbers are marked right-aligned, in the header and in the cells', () => {
    render(example('pop'));
    const header = screen.getByRole('columnheader', { name: 'Counts' });
    expect(header.getAttribute('data-numeric')).toBe('true');
    expect(screen.getAllByRole('cell', { name: '21 failed of 25' }).length).toBe(2);
    expect(screen.getAllByRole('cell', { name: '365 of 365 pass' })[0]?.getAttribute('data-numeric')).toBe('true');
    expect(screen.getAllByRole('cell', { name: 'gate.red' })[0]?.getAttribute('data-numeric')).toBeNull();
  });

  it('pop: the sorted column says which way, and only that column does', () => {
    render(example('pop'));
    expect(screen.getByRole('columnheader', { name: 'Ref' }).getAttribute('aria-sort')).toBe('ascending');
    expect(screen.getByRole('columnheader', { name: 'Gate' }).getAttribute('aria-sort')).toBeNull();
  });

  it('empty: says what is absent and where to go, with the table frame and headers still there', () => {
    render(example('empty'));
    expect(screen.getByText('Rule ‹ruleId› has no gate counts to show.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to the requirements matrix' })).toBeTruthy();
    expect(screen.getAllByRole('columnheader').length).toBe(5);
    expect(screen.queryAllByRole('rowheader').length).toBe(0);
  });

  it('load: is busy, says so in words, and shows no data rows', () => {
    render(example('load'));
    expect(screen.getByRole('table').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Loading rows…');
    expect(screen.queryAllByRole('rowheader').length).toBe(0);
  });

  it('err: the failure is an alert with the message, and a Try again button', () => {
    render(example('err'));
    expect(screen.getByRole('alert').textContent).toContain('The trail for GET-1 did not load');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.getByRole('table').getAttribute('aria-busy')).toBeNull();
  });

  it('long rows: the long identifiers are all there, in the cell, not cut', () => {
    render(example('long rows'));
    expect(screen.getByText(/Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active\.$/)).toBeTruthy();
  });
});

describe('DataTable', () => {
  it('names its table from the caption, and its scroll frame from the same caption', () => {
    render(<DataTable caption="Totals by rule" columns={COLUMNS} rows={ROWS} />);
    expect(screen.getByRole('table', { name: 'Totals by rule' })).toBeTruthy();
    const frame = screen.getByRole('region', { name: 'Totals by rule' });
    expect(frame.getAttribute('tabindex')).toBe('0');
  });

  it('puts the ID column in row headers and every other column in cells', () => {
    render(<DataTable caption="Totals" columns={COLUMNS} rows={ROWS} />);
    const first = screen.getAllByRole('row')[1];
    if (!first) throw new Error('no body row');
    expect(within(first).getByRole('rowheader').textContent).toBe('GET-1');
    expect(within(first).getAllByRole('cell').map((c) => c.textContent)).toEqual(['59']);
  });

  it('turns a sortable header into a button that hands back the column id', async () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        caption="Totals"
        columns={COLUMNS}
        rows={ROWS}
        sort={{ columnId: 'total', direction: 'descending' }}
        onSortChange={onSortChange}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Total' }).getAttribute('aria-sort')).toBe('descending');
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(onSortChange).toHaveBeenCalledWith('name');
  });

  it('can be sorted from the keyboard', async () => {
    const onSortChange = vi.fn();
    render(<DataTable caption="Totals" columns={COLUMNS} rows={ROWS} onSortChange={onSortChange} />);
    screen.getByRole('button', { name: 'Total' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSortChange).toHaveBeenCalledWith('total');
  });

  it('leaves a column without sortable as plain header text', () => {
    render(
      <DataTable
        caption="Totals"
        columns={[{ id: 'name', header: 'Name', cell: (row: Row) => row.name }]}
        rows={ROWS}
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keeps the glyphs on the sort buttons decorative', () => {
    const { container } = render(<DataTable caption="Totals" columns={COLUMNS} rows={ROWS} />);
    for (const svg of container.querySelectorAll('svg')) expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses the words given for loading, empty and error', () => {
    const { rerender } = render(
      <DataTable caption="Totals" columns={COLUMNS} rows={[]} loading loadingLabel="Loading the walkthrough…" />,
    );
    expect(screen.getByRole('status').textContent).toBe('Loading the walkthrough…');
    rerender(<DataTable caption="Totals" columns={COLUMNS} rows={[]} empty={{ title: 'No gates recorded.' }} />);
    expect(screen.getByText('No gates recorded.')).toBeTruthy();
    rerender(<DataTable caption="Totals" columns={COLUMNS} rows={ROWS} error="The walkthrough did not load." />);
    expect(screen.getByRole('alert').textContent).toContain('The walkthrough did not load.');
    expect(screen.queryAllByRole('rowheader').length).toBe(0);
  });

  it('shows the error without a retry button when no retry is given', () => {
    render(<DataTable caption="Totals" columns={COLUMNS} rows={[]} error="Did not load." />);
    expect(screen.queryByRole('button', { name: /Try again/ })).toBeNull();
  });

  describe('BUSY-1 on the retry button', () => {
    it('fires once when idle', async () => {
      const onRetry = vi.fn();
      render(<DataTable caption="Totals" columns={COLUMNS} rows={[]} error="Did not load." onRetry={onRetry} />);
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('while retrying: disabled, aria-busy, says what is happening, and cannot be fired twice', async () => {
      const onRetry = vi.fn();
      render(
        <DataTable caption="Totals" columns={COLUMNS} rows={[]} error="Did not load." onRetry={onRetry} retrying />,
      );
      const button = screen.getByRole('button', { name: 'Trying again…' });
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      await userEvent.click(button);
      fireEvent.click(button);
      expect(onRetry).not.toHaveBeenCalled();
    });
  });
});
