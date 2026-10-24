import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestLog } from '../../../src/Uinsure.Policies.Web/kit/patterns/request-log/RequestLog';
import type { RequestLogEntry } from '../../../src/Uinsure.Policies.Web/kit/patterns/request-log/RequestLog';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/request-log/request-log.examples';

afterEach(cleanup);

const ENTRIES: RequestLogEntry[] = [
  { n: 2, method: 'POST', path: '/policies/F3-MVEOSVDQJQ/cancellation', status: 201, durationMs: 87 },
  { n: 1, method: 'GET', path: '/policies/F3-MVEOSVDQJQ/cancellation-quote?cancellationDate=2027-01-27', status: 200 },
];

function rows() {
  return screen.getAllByRole('row').slice(1);
}

describe('RequestLog', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'empty', 'filtered']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('region', { name: 'Requests this browser sent' })).toBeTruthy();
  });

  it('pop: a table with a caption, column headers and a row header per request, in the order given', () => {
    render(examples[0]!.element);
    const table = screen.getByRole('table', { name: 'Requests this browser sent, newest first' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      '#',
      'Method',
      'Path',
      'Status',
      'Duration',
    ]);
    const heads = rows().map((row) => within(row).getByRole('rowheader').textContent);
    expect(heads).toEqual(['#5', '#4', '#3', '#2', '#1']);
  });

  it('pop: the rejected fetch reads Failed, and the unanswered one still reads Pending', () => {
    render(examples[0]!.element);
    const [rejected, waiting] = rows();
    const failedTag = within(rejected!).getByText('Failed').closest('[data-status]');
    expect(failedTag?.getAttribute('data-status')).toBe('fail');
    expect(within(rejected!).queryByText(/pending/i)).toBeNull();
    expect(within(waiting!).getByText('Pending').closest('[data-status]')?.getAttribute('data-status')).toBe('pending');
  });

  it('shows method, path, status as a word, a glyph and a colour, and duration', () => {
    render(<RequestLog entries={ENTRIES} />);
    const [post, get] = rows();
    expect(within(post!).getByText('POST')).toBeTruthy();
    expect(within(post!).getByText('/policies/F3-MVEOSVDQJQ/cancellation')).toBeTruthy();
    expect(within(post!).getByText('201')).toBeTruthy();
    expect(within(post!).getByText('87 ms')).toBeTruthy();
    expect(within(post!).getByText('201').closest('[data-status]')?.getAttribute('data-status')).toBe('pass');
    expect(within(get!).getByText('not recorded')).toBeTruthy();
  });

  it('marks a 4xx as a failure', () => {
    render(<RequestLog entries={[{ n: 1, method: 'GET', path: '/x', status: 422 }]} />);
    expect(screen.getByText('422').closest('[data-status]')?.getAttribute('data-status')).toBe('fail');
  });

  it('draws a request with no answer yet as pending, never as 0 (WB-7, HONEST-1)', () => {
    render(
      <RequestLog
        entries={[
          { n: 3, method: 'GET', path: '/a', status: null },
          { n: 2, method: 'GET', path: '/b' },
          { n: 1, method: 'GET', path: '/c', status: 0 },
        ]}
      />,
    );
    const tags = rows().map((row) => within(row).getByText(/pending/i).closest('[data-status]'));
    expect(tags).toHaveLength(3);
    for (const tag of tags) {
      expect(tag?.getAttribute('data-status')).toBe('pending');
      expect(tag?.textContent).toMatch(/pending/i);
      expect(tag?.textContent).not.toMatch(/^\s*0\s*$/);
    }
    expect(screen.queryByText('0')).toBeNull();
  });

  it('draws a rejected fetch as failed, never pending, even when it also carries a status or none (HONEST-1)', () => {
    render(
      <RequestLog
        entries={[
          { n: 3, method: 'GET', path: '/a', failed: true },
          { n: 2, method: 'GET', path: '/b', status: null, failed: true },
          { n: 1, method: 'GET', path: '/c', status: 0, failed: true, durationMs: 12 },
        ]}
      />,
    );
    expect(screen.queryByText(/pending/i)).toBeNull();
    for (const row of rows()) {
      const tag = within(row).getByText('Failed').closest('[data-status]');
      expect(tag?.getAttribute('data-status')).toBe('fail');
    }
    expect(screen.queryByText('0')).toBeNull();
  });

  it('the filter finds a rejected fetch by the word failed', async () => {
    render(
      <RequestLog
        entries={[
          { n: 2, method: 'GET', path: '/down', failed: true },
          { n: 1, method: 'GET', path: '/done', status: 200 },
        ]}
      />,
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter requests' }), 'failed');
    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]!).getByRole('rowheader').textContent).toBe('#2');
  });

  it('the filter matches a pending request by the word pending, and not an answered one', async () => {
    render(
      <RequestLog
        entries={[
          { n: 2, method: 'GET', path: '/waiting', status: null },
          { n: 1, method: 'GET', path: '/done', status: 200 },
        ]}
      />,
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter requests' }), 'pending');
    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]!).getByRole('rowheader').textContent).toBe('#2');
    expect(screen.getByRole('status').textContent).toBe('Showing 1 of 2');
  });

  it('empty: says so, and offers no filter and no table', () => {
    render(examples[1]!.element);
    expect(screen.getByText(/No requests sent yet/)).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('filtered: only the matching request, and the count says how many are hidden', () => {
    render(examples[2]!.element);
    expect((screen.getByRole('textbox', { name: 'Filter requests' }) as HTMLInputElement).value).toBe('POST');
    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]!).getByRole('rowheader').textContent).toBe('#2');
    expect(screen.getByRole('status').textContent).toBe('Showing 1 of 5');
  });

  it('typing narrows the list and the count follows', async () => {
    render(<RequestLog entries={ENTRIES} />);
    expect(screen.getByRole('status').textContent).toBe('Showing 2 of 2');
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter requests' }), 'quote');
    expect(rows()).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe('Showing 1 of 2');
  });

  it('matches on status too', async () => {
    render(<RequestLog entries={ENTRIES} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter requests' }), '201');
    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]!).getByRole('rowheader').textContent).toBe('#2');
  });

  it('when nothing matches: says so and clearing the filter brings the requests back', async () => {
    render(<RequestLog entries={ENTRIES} defaultFilter="zzz" />);
    expect(screen.getByText('No request matches "zzz".')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(rows()).toHaveLength(2);
    expect((screen.getByRole('textbox', { name: 'Filter requests' }) as HTMLInputElement).value).toBe('');
  });

  it('can be controlled: shows the filter it is given and reports changes', async () => {
    const onFilterChange = vi.fn();
    render(<RequestLog entries={ENTRIES} filter="GET" onFilterChange={onFilterChange} />);
    expect(rows()).toHaveLength(1);
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter requests' }), 'x');
    expect(onFilterChange).toHaveBeenCalledWith('GETx');
    expect(rows()).toHaveLength(1);
  });

  it('makes each path a button when it can open the exchange', async () => {
    const onSelect = vi.fn();
    render(<RequestLog entries={ENTRIES} onSelect={onSelect} />);
    const open = screen.getByRole('button', { name: 'Open request #2, POST /policies/F3-MVEOSVDQJQ/cancellation' });
    await userEvent.click(open);
    expect(onSelect).toHaveBeenCalledWith(ENTRIES[0]);
  });

  it('leaves paths as plain text when nothing can open them', () => {
    render(<RequestLog entries={ENTRIES} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('the scroll region can be reached by keyboard', async () => {
    render(<RequestLog entries={ENTRIES} />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Filter requests' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Requests, newest first' }));
  });
});
