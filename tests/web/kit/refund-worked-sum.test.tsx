import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { RefundWorkedSum } from '../../../src/web/kit/project/refund-worked-sum/RefundWorkedSum';
import { examples } from '../../../src/web/kit/project/refund-worked-sum/refund-worked-sum.examples';

afterEach(cleanup);

const exampleFor = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example named ${state}`);
  return found.element;
};

describe('refund-worked-sum examples', () => {
  it('has exactly the catalogued states, in order', () => {
    expect(examples.map((e) => e.state)).toEqual([
      'CANCEL-1a',
      '1b',
      '1c',
      'COULD-2',
      'UNPAID-TERM',
      'several terms',
      'total',
    ]);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getAllByRole('group').length).toBeGreaterThan(0);
  });
});

describe('RefundWorkedSum', () => {
  it('writes the sum from the API fields and reads it out in words', () => {
    render(exampleFor('1c'));
    const sum = screen.getByRole('group', {
      name: 'Term 1: 615.40 times 264 divided by 365 equals 445.11.',
    });
    const labels = Array.from(sum.querySelectorAll('small')).map((s) => s.textContent);
    expect(labels).toEqual(['amount', 'unusedDays', 'daysInTerm', 'refundAmount']);
    expect(sum.textContent).toContain('615.40');
    expect(sum.textContent).toContain('264');
    expect(sum.textContent).toContain('365');
    expect(sum.textContent).toContain('445.11');
  });

  it('shows the refund exactly as written and does no arithmetic', () => {
    render(
      <RefundWorkedSum
        terms={[
          { termNumber: 1, ruleApplied: 'CANCEL-1c', amount: '10.00', unusedDays: 1, daysInTerm: 3, refundAmount: '9.99' },
        ]}
      />,
    );
    const sum = screen.getByRole('group', { name: /equals 9\.99/ });
    expect(sum.textContent).toContain('9.99');
    expect(sum.textContent).not.toContain('3.33');
  });

  it('shows the rule as a chip that links, with the rule in words', () => {
    render(exampleFor('1c'));
    expect(screen.getByRole('link', { name: 'CANCEL-1c' })).toBeTruthy();
    expect(screen.getByText(/pro-rata for the unused days/i)).toBeTruthy();
  });

  it('says CANCEL-1a and CANCEL-1b are refunded in full', () => {
    render(exampleFor('CANCEL-1a'));
    expect(screen.getByText(/Refunded in full: the cancellation date is before the term starts/)).toBeTruthy();
    cleanup();
    render(exampleFor('1b'));
    expect(screen.getByText(/Refunded in full: .*cooling-off/)).toBeTruthy();
  });

  it('says COULD-2 sets the refund to zero, and does not present the sum as the cause', () => {
    render(exampleFor('COULD-2'));
    const sum = screen.getByRole('group', { name: 'Term 1: the sum is not used. The refund is 0.00.' });
    expect(sum.getAttribute('data-used')).toBe('false');
    expect(screen.getByText(/A claim is recorded on this policy, so the refund is zero/)).toBeTruthy();
    expect(screen.getByText(/not what set the refund/)).toBeTruthy();
  });

  it('says UNPAID-TERM is zero because the term was never paid', () => {
    render(exampleFor('UNPAID-TERM'));
    expect(screen.getByText(/never paid, so there is nothing to refund/)).toBeTruthy();
    expect(screen.getByRole('group', { name: /the sum is not used/ }).getAttribute('data-used')).toBe('false');
  });

  it('leaves a missing value blank and says so, in the sum and in the table', () => {
    render(exampleFor('several terms'));
    const first = screen.getAllByRole('group')[0]!;
    expect(first.getAttribute('aria-label')).toBe(
      'Term 1: amount not given times unused days not given divided by days in term not given equals 17.36.',
    );
    expect(within(first).getAllByText('not in this response').length).toBe(3);
    expect(screen.getAllByText('not given').length).toBeGreaterThan(0);
  });

  it('gives one rung per term, in term order, as an ordered list', () => {
    render(exampleFor('several terms'));
    const list = screen.getByRole('list', { name: 'The refund, term by term' });
    expect(list.tagName).toBe('OL');
    const rungs = within(list).getAllByRole('listitem');
    expect(rungs.map((r) => r.getAttribute('data-rule'))).toEqual(['CANCEL-1c', 'CANCEL-1a']);
    expect(rungs[0]?.textContent).toContain('Term 1');
    expect(rungs[1]?.textContent).toContain('Term 2');
  });

  it('has a table with a caption, scoped headers, and a total row only when given a total', () => {
    const { rerender } = render(exampleFor('1c'));
    const table = screen.getByRole('table', { name: "Refund per term, from the quote's own fields" });
    for (const header of within(table).getAllByRole('columnheader')) {
      expect(header.getAttribute('scope')).toBe('col');
    }
    expect(within(table).queryByRole('rowheader', { name: 'Total refund' })).toBeNull();
    rerender(exampleFor('total'));
    const withTotal = screen.getByRole('table');
    const total = within(withTotal).getByRole('rowheader', { name: 'Total refund' });
    expect(total.getAttribute('scope')).toBe('row');
    expect(total.parentElement?.textContent).toContain('445.11');
  });

  it('scrolls the table inside its own labelled, focusable region', () => {
    render(exampleFor('total'));
    const region = screen.getByRole('region', { name: "Refund per term, from the quote's own fields" });
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('shows an unknown rule as given, with an unknown-rule chip', () => {
    render(<RefundWorkedSum terms={[{ termNumber: 1, ruleApplied: 'PLACEHOLDER-9', refundAmount: '1.00' }]} />);
    expect(screen.queryByRole('link', { name: /PLACEHOLDER-9/ })).toBeNull();
    expect(screen.getByText(/unknown rule ID/)).toBeTruthy();
    expect(screen.getByText(/Rule not recognised/)).toBeTruthy();
  });

  it('shows a note under the sums when given one', () => {
    render(exampleFor('1c'));
    expect(screen.getByText(/The unrounded quotient is 445\.1112/)).toBeTruthy();
  });

  it('sends a caller-set link to the rule chip, and keeps the default when it sets none', () => {
    const terms = [{ termNumber: 1, ruleApplied: 'CANCEL-1c', refundAmount: '445.11' }];
    const { rerender } = render(<RefundWorkedSum terms={terms} />);
    expect(screen.getByRole('link', { name: 'CANCEL-1c' }).getAttribute('href')).toBe('/rules/CANCEL-1c');
    rerender(<RefundWorkedSum terms={terms} ruleHref={(id) => `#/rules/${id}`} />);
    expect(screen.getByRole('link', { name: 'CANCEL-1c' }).getAttribute('href')).toBe('#/rules/CANCEL-1c');
    rerender(<RefundWorkedSum terms={terms} ruleHref={() => `#/rules/other`} />);
    expect(screen.getByRole('link', { name: 'CANCEL-1c' }).getAttribute('href')).toBe('#/rules/other');
    rerender(<RefundWorkedSum terms={terms} ruleHref={() => undefined} />);
    expect(screen.getByRole('link', { name: 'CANCEL-1c' }).getAttribute('href')).toBe('/rules/CANCEL-1c');
  });

  it('has nothing to press', () => {
    render(exampleFor('total'));
    expect(screen.queryAllByRole('button').length).toBe(0);
  });
});
