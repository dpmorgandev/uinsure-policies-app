import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorSummary } from '../../../src/web/kit/patterns/error-summary/ErrorSummary';
import { examples } from '../../../src/web/kit/patterns/error-summary/error-summary.examples';

afterEach(cleanup);

describe('ErrorSummary', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual([
      'one',
      'several',
      '400 (field keys)',
      '422 single (extensions)',
      '422 multi (no field path: listed, not placed)',
    ]);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    const alert = screen.getByRole('alert', { name: 'There is a problem' });
    expect(within(alert).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('one: a link to its field', () => {
    render(examples[0]!.element);
    const link = screen.getByRole('link', { name: /yyyy-MM-dd/ });
    expect(link.getAttribute('href')).toBe('#cancellationDate');
  });

  it('several: every problem is its own item', () => {
    render(examples[1]!.element);
    expect(within(screen.getByRole('alert')).getAllByRole('listitem')).toHaveLength(2);
  });

  it('400: shows the key the API sent, in mono', () => {
    render(examples[2]!.element);
    const key = within(screen.getByRole('alert')).getByText('cancellationDate');
    expect(key.tagName).toBe('CODE');
  });

  it('422 single: a rule chip linking to the rule, and the extension as sent', () => {
    render(examples[3]!.element);
    const alert = screen.getByRole('alert');
    expect(within(alert).getByRole('link', { name: 'CANCEL-3' }).getAttribute('href')).toBe('/rules/CANCEL-3');
    expect(within(alert).getByText('today').tagName).toBe('DT');
    expect(within(alert).getByText('2026-10-19').tagName).toBe('DD');
  });

  it('422 multi: listed, not placed: no field links, a rule chip each, and it says the problem has no field', () => {
    render(examples[4]!.element);
    const alert = screen.getByRole('alert');
    const items = within(alert).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(alert).queryByRole('link', { name: /Cancellation date/ })).toBeNull();
    expect(within(alert).getByRole('link', { name: 'CANCEL-3' })).toBeTruthy();
    expect(within(alert).getByRole('link', { name: 'CANCEL-7' })).toBeTruthy();
    expect(within(alert).getAllByText('whole request')).toHaveLength(2);
  });

  describe('the rule chip link', () => {
    it('keeps the chip default when the caller sets none', () => {
      render(<ErrorSummary focusOnMount={false} items={[{ message: 'Too late', ruleId: 'CANCEL-3' }]} />);
      expect(screen.getByRole('link', { name: 'CANCEL-3' }).getAttribute('href')).toBe('/rules/CANCEL-3');
    });

    it('an item\'s ruleHref reaches its chip', () => {
      render(
        <ErrorSummary
          focusOnMount={false}
          items={[{ message: 'Too late', ruleId: 'CANCEL-3', ruleHref: '#/rules/CANCEL-3' }]}
        />,
      );
      expect(screen.getByRole('link', { name: 'CANCEL-3' }).getAttribute('href')).toBe('#/rules/CANCEL-3');
    });

    it('the ruleHref function builds each chip\'s link from its rule ID', () => {
      render(
        <ErrorSummary
          focusOnMount={false}
          ruleHref={(id) => `#/rules/${id}`}
          items={[
            { message: 'Too late', ruleId: 'CANCEL-3' },
            { message: 'Not allowed', ruleId: 'CANCEL-7' },
          ]}
        />,
      );
      expect(screen.getByRole('link', { name: 'CANCEL-3' }).getAttribute('href')).toBe('#/rules/CANCEL-3');
      expect(screen.getByRole('link', { name: 'CANCEL-7' }).getAttribute('href')).toBe('#/rules/CANCEL-7');
    });

    it('an item\'s own ruleHref wins over the function', () => {
      render(
        <ErrorSummary
          focusOnMount={false}
          ruleHref={(id) => `#/rules/${id}`}
          items={[{ message: 'Too late', ruleId: 'CANCEL-3', ruleHref: '#/elsewhere' }]}
        />,
      );
      expect(screen.getByRole('link', { name: 'CANCEL-3' }).getAttribute('href')).toBe('#/elsewhere');
    });

    it('follows a changed link when React re-renders the same item', () => {
      const items = [{ message: 'Too late', ruleId: 'CANCEL-3' }];
      const { rerender } = render(<ErrorSummary focusOnMount={false} items={items} ruleHref={(id) => `#/rules/${id}`} />);
      rerender(<ErrorSummary focusOnMount={false} items={items} ruleHref={(id) => `#/plans/p/rules/${id}`} />);
      expect(screen.getByRole('link', { name: 'CANCEL-3' }).getAttribute('href')).toBe('#/plans/p/rules/CANCEL-3');
    });
  });

  it('an item with a field has no "whole request" label', () => {
    render(examples[0]!.element);
    expect(screen.queryByText('whole request')).toBeNull();
  });

  it('takes focus on arrival', () => {
    render(<ErrorSummary items={[{ message: 'Something is wrong' }]} />);
    expect(document.activeElement).toBe(screen.getByRole('alert'));
  });

  it('does not take focus when told not to', () => {
    render(<ErrorSummary focusOnMount={false} items={[{ message: 'Something is wrong' }]} />);
    expect(document.activeElement).toBe(document.body);
  });

  it('takes focus again when its focus key changes', () => {
    const { rerender } = render(<ErrorSummary focusKey={1} items={[{ message: 'Something is wrong' }]} />);
    (document.activeElement as HTMLElement).blur();
    expect(document.activeElement).toBe(document.body);
    rerender(<ErrorSummary focusKey={2} items={[{ message: 'Something is wrong' }]} />);
    expect(document.activeElement).toBe(screen.getByRole('alert'));
  });

  it('a link moves focus to its field', async () => {
    render(
      <>
        <ErrorSummary focusOnMount={false} items={[{ message: 'Date is wrong', fieldId: 'date' }]} />
        <input id="date" aria-label="Date" />
      </>,
    );
    await userEvent.click(screen.getByRole('link', { name: 'Date is wrong' }));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Date' }));
  });

  it('draws nothing when there are no problems', () => {
    const { container } = render(<ErrorSummary items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('can be reached by the keyboard: the field link is a tab stop', async () => {
    render(<ErrorSummary focusOnMount={false} items={[{ message: 'Date is wrong', fieldId: 'date' }]} />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Date is wrong' }));
  });
});
