import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { QuoteCancelCompare } from '../../../src/Uinsure.Policies.Web/kit/project/quote-cancel-compare/QuoteCancelCompare';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/project/quote-cancel-compare/quote-cancel-compare.examples';

afterEach(cleanup);

const exampleFor = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example named ${state}`);
  return found.element;
};

describe('quote-cancel-compare examples', () => {
  it('has exactly the catalogued states, in order', () => {
    expect(examples.map((e) => e.state)).toEqual(['agree', 'differ']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(screen.getByRole('table')).toBeTruthy();
    expect(container.querySelector('[data-state]')).not.toBeNull();
  });
});

describe('QuoteCancelCompare', () => {
  it('is a table with a caption, column headers and a row header per field', () => {
    render(exampleFor('agree'));
    const table = screen.getByRole('table', { name: 'Quote against the cancellation it led to' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Field',
      'Quote (rung 1)',
      'Cancellation (rung 2)',
      'Result',
    ]);
    const fields = within(table)
      .getAllByRole('rowheader')
      .map((h) => h.textContent);
    expect(fields).toEqual([
      'cancellationDate',
      'ruleApplied',
      'totalRefund',
      'terms',
      'refunds',
      'quotedOn',
      'refund reference',
    ]);
  });

  it('agree: every compared row says Agrees with a glyph, and the verdict counts them', () => {
    const { container } = render(exampleFor('agree'));
    expect(container.querySelector('[data-state="agree"]')).not.toBeNull();
    expect(screen.getByText('Agree on all 5 compared fields')).toBeTruthy();
    expect(screen.getAllByText('Agrees').length).toBe(5);
    expect(screen.queryByText('Differs')).toBeNull();
    for (const tag of container.querySelectorAll('tbody [data-status="pass"]')) {
      expect(tag.querySelector('svg')).not.toBeNull();
    }
  });

  it('agree: the two rows that exist on one side only are shown, not compared', () => {
    render(exampleFor('agree'));
    expect(screen.getByText('Quote only')).toBeTruthy();
    expect(screen.getByText('Cancellation only')).toBeTruthy();
    expect(screen.getByText('not in a cancellation')).toBeTruthy();
    expect(screen.getByText('none on a quote')).toBeTruthy();
    expect(screen.getByText(/are not compared/)).toBeTruthy();
  });

  it('differ: names the fields that differ and marks them with a word and a glyph', () => {
    const { container } = render(exampleFor('differ'));
    expect(container.querySelector('[data-state="differ"]')).not.toBeNull();
    expect(screen.getByText('Differ on 2 of 5 compared fields: totalRefund, terms')).toBeTruthy();
    expect(screen.getAllByText('Differs').length).toBe(2);
    expect(screen.getAllByText('Agrees').length).toBe(3);
    const fail = container.querySelector('tbody [data-status="fail"]');
    expect(fail?.querySelector('svg')).not.toBeNull();
  });

  it('differ: shows both values side by side so the difference can be read', () => {
    render(exampleFor('differ'));
    const row = screen.getByRole('rowheader', { name: 'totalRefund' }).parentElement as HTMLElement;
    const cells = within(row).getAllByRole('cell');
    expect(cells[0]?.textContent).toBe('445.11');
    expect(cells[1]?.textContent).toBe('445.10');
  });

  it('compares the text the API wrote and does no arithmetic', () => {
    render(
      <QuoteCancelCompare
        rows={[{ field: 'totalRefund', quote: '445.1', cancellation: '445.10' }]}
        caption="Placeholder rows"
      />,
    );
    expect(screen.getByText('Differs')).toBeTruthy();
  });

  it('says nothing was compared when every row is one-sided', () => {
    const { container } = render(
      <QuoteCancelCompare rows={[{ field: 'quotedOn', quote: '2026-10-19', only: 'quote' }]} />,
    );
    expect(container.querySelector('[data-state="empty"]')).not.toBeNull();
    expect(screen.getByText('Nothing compared')).toBeTruthy();
  });

  it('takes its own column headings', () => {
    render(
      <QuoteCancelCompare
        rows={[{ field: 'cancellationDate', quote: '2027-01-27', cancellation: '2027-01-27' }]}
        quoteHeading="Quote"
        cancellationHeading="Cancel"
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Quote' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Cancel' })).toBeTruthy();
  });

  it('scrolls inside its own labelled, focusable region', () => {
    render(exampleFor('agree'));
    const region = screen.getByRole('region', { name: 'Quote against the cancellation it led to' });
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('has nothing to press', () => {
    render(exampleFor('agree'));
    expect(screen.queryAllByRole('button').length).toBe(0);
  });
});
