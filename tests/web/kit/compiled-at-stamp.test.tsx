import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CompiledAtStamp } from '../../../src/web/kit/layouts/compiled-at-stamp/CompiledAtStamp';
import { examples } from '../../../src/web/kit/layouts/compiled-at-stamp/compiled-at-stamp.examples';

afterEach(cleanup);

describe('compiled-at-stamp examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.firstChild).not.toBeNull();
    expect(container.querySelectorAll('time').length).toBeGreaterThan(0);
  });
});

describe('CompiledAtStamp', () => {
  it('shows the SHA as a link to the commit and the time with UTC showing', () => {
    const { container } = render(
      <CompiledAtStamp
        sha="94a7473"
        commitHref="https://github.com/example/repo/commit/94a7473"
        time="2026-10-19T00:07:57Z"
      />,
    );
    const link = screen.getByRole('link', { name: 'Commit 94a7473 on GitHub' });
    expect(link.getAttribute('href')).toBe('https://github.com/example/repo/commit/94a7473');
    expect(screen.getByText('2026-10-19 00:07:57 UTC')).toBeTruthy();
    const utcButton = screen.getByRole('button', { name: 'Show UTC time' });
    expect(utcButton.getAttribute('aria-pressed')).toBe('true');
    const times = Array.from(container.querySelectorAll('time'));
    expect(times.length).toBe(2);
    for (const time of times) expect(time.getAttribute('datetime')).toBe('2026-10-19T00:07:57.000Z');
    expect(container.querySelector('p')?.getAttribute('data-state')).toBe('pop');
  });

  it('says plainly when the SHA is missing, and still shows the time', () => {
    const { container } = render(
      <CompiledAtStamp sha={null} missingShaLabel="snapshot SHA: not in the excerpt" time="2026-10-19T00:07:57Z" />,
    );
    expect(screen.getByText('snapshot SHA: not in the excerpt')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('time')).not.toBeNull();
    expect(container.querySelector('p')?.getAttribute('data-state')).toBe('no-sha');
  });

  it('uses default words for a missing SHA and a missing time', () => {
    render(<CompiledAtStamp />);
    expect(screen.getByText('snapshot SHA not recorded')).toBeTruthy();
    expect(screen.getByText('no time recorded')).toBeTruthy();
  });

  it('names what it states in plain words', () => {
    render(<CompiledAtStamp sha="94a7473" time="2026-10-19T00:07:57Z" />);
    expect(screen.getByText('Snapshot compiled from')).toBeTruthy();
    expect(screen.getByText('at')).toBeTruthy();
  });
});
