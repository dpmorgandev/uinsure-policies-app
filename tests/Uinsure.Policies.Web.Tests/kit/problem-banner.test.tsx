import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProblemBanner } from '../../../src/Uinsure.Policies.Web/kit/patterns/problem-banner/ProblemBanner';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/problem-banner/problem-banner.examples';

afterEach(cleanup);

describe('ProblemBanner', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['each status', 'unreachable']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('each status: one alert per status, named by its title', () => {
    render(examples[0]!.element);
    expect(screen.getAllByRole('alert')).toHaveLength(5);
    const conflict = screen.getByRole('alert', { name: 'Policy already cancelled' });
    expect(conflict.getAttribute('data-status')).toBe('409');
    expect(within(conflict).getByText('409')).toBeTruthy();
    expect(within(conflict).getByRole('link', { name: 'CANCEL-4' })).toBeTruthy();
    expect(within(conflict).getByText('The policy was already cancelled on 2026-11-18.')).toBeTruthy();
  });

  it('shows the extension values as sent, as term and value, not read out of the detail', () => {
    render(examples[0]!.element);
    const conflict = screen.getByRole('alert', { name: 'Policy already cancelled' });
    const term = within(conflict).getByText('cancellationDate');
    expect(term.tagName).toBe('DT');
    expect(term.nextElementSibling?.tagName).toBe('DD');
    expect(term.nextElementSibling?.textContent).toBe('2026-11-18');
    expect(within(conflict).getByText('/policies/F3-MVEOTAWL4W/cancellation').tagName).toBe('DD');
  });

  it('a problem is a word, a glyph and a colour: the status and a hidden glyph', () => {
    render(<ProblemBanner status={429} title="Too many requests" />);
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('429')).toBeTruthy();
    for (const svg of Array.from(alert.querySelectorAll('svg'))) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('unreachable: says there was no response, and carries no status', () => {
    render(examples[1]!.element);
    const alert = screen.getByRole('alert', { name: 'The API did not answer' });
    expect(alert.getAttribute('data-kind')).toBe('unreachable');
    expect(alert.getAttribute('data-status')).toBeNull();
    expect(within(alert).getByText('No response')).toBeTruthy();
  });

  it('the rule chip keeps its default link when the caller sets none', () => {
    render(<ProblemBanner status={409} title="Policy already cancelled" ruleId="CANCEL-4" />);
    expect(screen.getByRole('link', { name: 'CANCEL-4' }).getAttribute('href')).toBe('/rules/CANCEL-4');
  });

  it('a caller-set ruleHref reaches the rule chip, and follows a re-render', () => {
    const { rerender } = render(
      <ProblemBanner status={409} title="Policy already cancelled" ruleId="CANCEL-4" ruleHref="#/rules/CANCEL-4" />,
    );
    expect(screen.getByRole('link', { name: 'CANCEL-4' }).getAttribute('href')).toBe('#/rules/CANCEL-4');
    rerender(
      <ProblemBanner status={409} title="Policy already cancelled" ruleId="CANCEL-4" ruleHref="#/plans/p/rules/CANCEL-4" />,
    );
    expect(screen.getByRole('link', { name: 'CANCEL-4' }).getAttribute('href')).toBe('#/plans/p/rules/CANCEL-4');
  });

  it('uses the heading level it is given', () => {
    render(<ProblemBanner title="Not found" status={404} headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Not found' })).toBeTruthy();
  });

  it('offers no retry unless asked', () => {
    render(<ProblemBanner title="Not found" status={404} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('retry calls the handler', async () => {
    const onRetry = vi.fn();
    render(<ProblemBanner unreachable title="The API did not answer" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  describe('BUSY-1', () => {
    it('while retrying: disabled, aria-busy, says what is happening, and cannot be fired twice', async () => {
      const onRetry = vi.fn();
      render(<ProblemBanner unreachable title="The API did not answer" onRetry={onRetry} retrying />);
      const button = screen.getByRole('button', { name: 'Trying again…' }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      await userEvent.click(button);
      fireEvent.click(button);
      expect(onRetry).not.toHaveBeenCalled();
    });

    it('takes the caller\'s words for the busy state', () => {
      render(<ProblemBanner unreachable title="x" onRetry={() => undefined} retrying retryingLabel="Asking the API again…" />);
      expect(screen.getByRole('button', { name: 'Asking the API again…' })).toBeTruthy();
    });
  });
});
