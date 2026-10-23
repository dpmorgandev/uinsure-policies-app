import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CompletenessBanner } from '../../../src/Uinsure.Policies.Web/kit/project/completeness-banner/CompletenessBanner';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/project/completeness-banner/completeness-banner.examples';

afterEach(cleanup);

const INCOMPLETE = 'TRAIL INCOMPLETE: BLOCKED. (1) QA rows use [SELL-n] in the Rule column; …';

describe('completeness-banner examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['each value', 'live']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByLabelText('Trail completeness').length).toBeGreaterThan(0);
  });

  it('"each value" shows all three values, verbatim', () => {
    render(examples[0]!.element);
    expect(screen.getByText('OK')).toBeTruthy();
    expect(screen.getByText('OK (git-only, F0a)')).toBeTruthy();
    expect(screen.getByText(INCOMPLETE)).toBeTruthy();
  });

  it('"live" is a live region', () => {
    render(examples[1]!.element);
    expect(screen.getByRole('alert').getAttribute('data-completeness')).toBe('incomplete');
  });
});

describe('CompletenessBanner', () => {
  it('OK: the value as given, a named region, a glyph screen readers skip', () => {
    const { container } = render(<CompletenessBanner value="OK" />);
    const region = screen.getByRole('region', { name: 'Trail completeness' });
    expect(region.getAttribute('data-completeness')).toBe('ok');
    expect(screen.getByText('OK')).toBeTruthy();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('OK with the nodes listed ("OK: F0b, F1, …") classifies as ok and is shown as given', () => {
    render(<CompletenessBanner value="OK: F0b, F1, F2" />);
    const region = screen.getByRole('region', { name: 'Trail completeness' });
    expect(region.getAttribute('data-completeness')).toBe('ok');
    expect(screen.getByText('OK: F0b, F1, F2')).toBeTruthy();
    expect(screen.queryByText(/not one of the three values/)).toBeNull();
  });

  it('a value that merely begins with the letters OK is not ok', () => {
    render(<CompletenessBanner value="OKAY" />);
    const region = screen.getByRole('region', { name: 'Trail completeness' });
    expect(region.getAttribute('data-completeness')).toBe('unrecognised');
  });

  it('git-only: the value as given, and why there is no loop, by design', () => {
    render(<CompletenessBanner value="OK (git-only, F0a)" />);
    const region = screen.getByRole('region', { name: 'Trail completeness' });
    expect(region.getAttribute('data-completeness')).toBe('git-only');
    expect(screen.getByText('OK (git-only, F0a)')).toBeTruthy();
    expect(screen.getByText(/No loop, activity or verdicts, by design/)).toBeTruthy();
  });

  it('incomplete: the reasons are shown verbatim, not reworded or cut', () => {
    render(<CompletenessBanner value={INCOMPLETE} />);
    const region = screen.getByRole('region', { name: 'Trail completeness' });
    expect(region.getAttribute('data-completeness')).toBe('incomplete');
    expect(region.textContent).toContain(INCOMPLETE);
  });

  it('a value outside the vocabulary is shown as given and flagged as unrecognised', () => {
    render(<CompletenessBanner value="PARTLY OK" />);
    const region = screen.getByRole('region', { name: 'Trail completeness' });
    expect(region.getAttribute('data-completeness')).toBe('unrecognised');
    expect(screen.getByText('PARTLY OK')).toBeTruthy();
    expect(screen.getByText(/not one of the three values/)).toBeTruthy();
  });

  it('live: a status for OK, an alert for an incomplete trail', () => {
    const { rerender } = render(<CompletenessBanner live value="OK" />);
    expect(screen.getByRole('status', { name: 'Trail completeness' })).toBeTruthy();
    rerender(<CompletenessBanner live value={INCOMPLETE} />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('alert', { name: 'Trail completeness' }).textContent).toContain(INCOMPLETE);
  });

  it('not live by default: no live-region role', () => {
    render(<CompletenessBanner value={INCOMPLETE} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
