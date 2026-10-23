import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { TermTimeline } from '../../../src/Uinsure.Policies.Web/kit/project/term-timeline/TermTimeline';
import type { TimelineTerm } from '../../../src/Uinsure.Policies.Web/kit/project/term-timeline/TermTimeline';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/project/term-timeline/term-timeline.examples';

afterEach(cleanup);

const exampleFor = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example named ${state}`);
  return found.element;
};

const term1: TimelineTerm = {
  termNumber: 1,
  startDate: '2026-11-18',
  endDate: '2027-11-17',
  amount: '412.34',
  payment: { type: 'Card', amount: '412.34' },
};
const term2: TimelineTerm = {
  termNumber: 2,
  startDate: '2027-11-18',
  endDate: '2028-11-17',
  amount: '500.00',
  payment: null,
};

const steps = (container: HTMLElement) =>
  within(container)
    .getAllByRole('listitem')
    .map((item) => item.querySelector('svg + span')?.textContent ?? item.textContent?.trim());

describe('term-timeline examples', () => {
  it('has exactly the catalogued states, in order', () => {
    expect(examples.map((e) => e.state)).toEqual([
      'one term',
      'several',
      'unpaid term',
      'cancelled (gap after the date)',
      'with claims',
    ]);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('list')).toBeTruthy();
    expect(screen.getByRole('figure')).toBeTruthy();
  });
});

describe('TermTimeline', () => {
  it('reads as an ordered list of dates, oldest first, named for the policy', () => {
    render(<TermTimeline terms={[term1]} policyReference="F2-PLACEHOLDER" />);
    const list = screen.getByRole('list', { name: 'Dates for F2-PLACEHOLDER' });
    expect(list.tagName).toBe('OL');
    expect(steps(list)).toEqual(['Term 1 starts', 'Term 1 ends']);
  });

  it('numbers the rungs in date order and hides the numbers from assistive technology', () => {
    render(<TermTimeline terms={[term2, term1]} />);
    const markers = ['#1', '#2', '#3', '#4'].map((mark) => screen.getByText(mark));
    for (const marker of markers) expect(marker.getAttribute('aria-hidden')).toBe('true');
    const list = screen.getByRole('list');
    expect(steps(list)).toEqual(['Term 1 starts', 'Term 1 ends', 'Term 2 starts', 'Term 2 ends']);
  });

  it('shows dates as time elements, exactly as the API returned them', () => {
    const { container } = render(<TermTimeline terms={[term1]} />);
    const times = Array.from(container.querySelectorAll('time')).map((t) => t.getAttribute('datetime'));
    expect(times).toEqual(['2026-11-18', '2027-11-17']);
  });

  it('says Paid with a glyph for a paid term, and shows the payment type', () => {
    const { container } = render(<TermTimeline terms={[term1]} />);
    const tag = container.querySelector('[data-status="pass"]');
    expect(tag?.textContent).toBe('Paid');
    expect(tag?.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('Card')).toBeTruthy();
    expect(screen.getByText('payment reference not shown in the source')).toBeTruthy();
  });

  it('says Unpaid with a glyph when no payment is linked, and why', () => {
    const { container } = render(<TermTimeline terms={[term1, term2]} />);
    const unpaid = container.querySelector('[data-status="warn"]');
    expect(unpaid?.textContent).toBe('Unpaid');
    expect(unpaid?.querySelector('svg')).not.toBeNull();
    expect(screen.getByText(/paymentReference is null/)).toBeTruthy();
    expect(container.querySelectorAll('[data-status="pass"]').length).toBe(1);
  });

  it('draws the rail of a paid term and an unpaid term differently', () => {
    const { container } = render(<TermTimeline terms={[term1, term2]} />);
    const segments = Array.from(container.querySelectorAll('li')).map((li) => li.getAttribute('data-segment'));
    expect(segments).toEqual(['paid', 'none', 'unpaid', 'none']);
  });

  it('draws a gap after the cancellation date and keeps it dashed to the end of cover', () => {
    const { container } = render(
      <TermTimeline
        terms={[term1]}
        cancellation={{ cancellationDate: '2027-01-27', ruleApplied: 'CANCEL-1c', totalRefund: '445.11' }}
      />,
    );
    const items = Array.from(container.querySelectorAll('li'));
    expect(items.map((li) => li.getAttribute('data-kind'))).toEqual(['start', 'cancel', 'gap', 'end']);
    expect(items.map((li) => li.getAttribute('data-segment'))).toEqual(['paid', 'gap', 'gap', 'gap']);
    expect(screen.getByText('No cover after the cancellation date')).toBeTruthy();
    const tag = container.querySelector('[data-status="fail"]');
    expect(tag?.textContent).toBe('Cancelled');
    expect(tag?.querySelector('svg')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'CANCEL-1c' })).toBeTruthy();
    expect(screen.getByText('445.11')).toBeTruthy();
  });

  it('keeps the rule chip default link when the caller sets none', () => {
    render(<TermTimeline terms={[term1]} cancellation={{ cancellationDate: '2027-01-27', ruleApplied: 'CANCEL-1c' }} />);
    expect(screen.getByRole('link', { name: 'CANCEL-1c' }).getAttribute('href')).toBe('/rules/CANCEL-1c');
  });

  it('passes a caller-set link through to the cancellation rule chip', () => {
    const { rerender } = render(
      <TermTimeline
        terms={[term1]}
        cancellation={{ cancellationDate: '2027-01-27', ruleApplied: 'CANCEL-1c' }}
        ruleHref={(ruleId) => `#/rules/${ruleId}`}
      />,
    );
    expect(screen.getByRole('link', { name: 'CANCEL-1c' }).getAttribute('href')).toBe('#/rules/CANCEL-1c');
    rerender(
      <TermTimeline
        terms={[term1]}
        cancellation={{ cancellationDate: '2027-01-27', ruleApplied: 'CANCEL-1c' }}
        ruleHref={(ruleId) => `/other/${ruleId}`}
      />,
    );
    expect(screen.getByRole('link', { name: 'CANCEL-1c' }).getAttribute('href')).toBe('/other/CANCEL-1c');
  });

  it('keeps the default when the caller returns no link for the rule', () => {
    render(
      <TermTimeline
        terms={[term1]}
        cancellation={{ cancellationDate: '2027-01-27', ruleApplied: 'CANCEL-1c' }}
        ruleHref={() => undefined}
      />,
    );
    expect(screen.getByRole('link', { name: 'CANCEL-1c' }).getAttribute('href')).toBe('/rules/CANCEL-1c');
  });

  it('draws no gap when cover ends on the cancellation date', () => {
    const { container } = render(
      <TermTimeline
        terms={[{ ...term1, endDate: '2027-01-27' }]}
        cancellation={{ cancellationDate: '2027-01-27' }}
      />,
    );
    const kinds = Array.from(container.querySelectorAll('li')).map((li) => li.getAttribute('data-kind'));
    expect(kinds).toEqual(['start', 'cancel', 'end']);
    expect(screen.queryByText('No cover after the cancellation date')).toBeNull();
  });

  it('puts a claim at its date, with its reference and description', () => {
    render(
      <TermTimeline
        terms={[term1]}
        claims={[{ reference: 'CLM-PLACEHOLDER-1', claimDate: '2027-03-01', description: 'Placeholder description' }]}
      />,
    );
    const list = screen.getByRole('list');
    expect(steps(list)).toEqual(['Term 1 starts', 'Claim recorded', 'Term 1 ends']);
    expect(screen.getByText('CLM-PLACEHOLDER-1')).toBeTruthy();
    expect(screen.getByText('Placeholder description')).toBeTruthy();
  });

  it('says so when a claim has no description', () => {
    render(<TermTimeline terms={[term1]} claims={[{ reference: 'CLM-PLACEHOLDER-2', claimDate: '2027-03-01' }]} />);
    expect(screen.getByText('no description')).toBeTruthy();
  });

  it('draws no cooling-off or renewal window, and says the rungs are not to scale', () => {
    const { container } = render(<TermTimeline terms={[term1]} />);
    expect(container.textContent).not.toMatch(/cooling-off|renewal window/i);
    expect(container.textContent).toMatch(/not drawn to scale/);
  });

  it('has nothing to press', () => {
    render(exampleFor('several'));
    // The Timestamp's UTC toggle only appears for instants; dates alone add no buttons.
    expect(screen.queryAllByRole('button').length).toBe(0);
  });
});
