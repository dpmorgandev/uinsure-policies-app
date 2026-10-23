import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from '../../../src/Uinsure.Policies.Web/kit/layouts/footer/Footer';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/layouts/footer/footer.examples';

afterEach(cleanup);

describe('footer examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'no snapshot']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelector('footer')).not.toBeNull();
  });
});

describe('Footer', () => {
  const props = {
    compiledAt: { sha: '94a7473', commitHref: 'https://github.com/example/repo/commit/94a7473', time: '2026-10-19T00:07:57Z' },
    provenanceHref: '/about',
    repoHref: 'https://github.com/example/repo',
  };

  it('is a footer element holding the stamp, the provenance link and the repo link', () => {
    const { container } = render(<Footer {...props} />);
    expect(container.querySelector('footer')).not.toBeNull();
    expect(screen.getByText('Snapshot compiled from')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Commit 94a7473 on GitHub' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sources and provenance' }).getAttribute('href')).toBe('/about');
    expect(screen.getByRole('link', { name: 'Repository on GitHub' }).getAttribute('href')).toBe(
      'https://github.com/example/repo',
    );
  });

  it('draws the repository link with rel="noreferrer" and leaves the in-app provenance link without it', () => {
    render(<Footer {...props} />);
    expect(screen.getByRole('link', { name: 'Repository on GitHub' }).getAttribute('rel')).toBe('noreferrer');
    expect(screen.getByRole('link', { name: 'Commit 94a7473 on GitHub' }).getAttribute('rel')).toBe('noreferrer');
    expect(screen.getByRole('link', { name: 'Sources and provenance' }).getAttribute('rel')).toBeNull();
  });

  it('accepts its own words for the two links', () => {
    render(<Footer {...props} provenanceLabel="How this was compiled" repoLabel="Source" />);
    expect(screen.getByRole('link', { name: 'How this was compiled' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Source' })).toBeTruthy();
  });

  it('shows a missing SHA in words and still shows the time', () => {
    const { container } = render(
      <Footer {...props} compiledAt={{ sha: null, missingShaLabel: 'snapshot SHA: not in the excerpt', time: props.compiledAt.time }} />,
    );
    expect(screen.getByText('snapshot SHA: not in the excerpt')).toBeTruthy();
    expect(container.querySelector('time')).not.toBeNull();
  });

  it('states no snapshot in words, with no commit link, no time and no stamp wording', () => {
    const { container } = render(
      <Footer noSnapshot provenanceHref={props.provenanceHref} repoHref={props.repoHref} />,
    );
    expect(container.querySelector('footer')).not.toBeNull();
    expect(screen.getByText("No snapshot: trace.json hasn't been read.")).toBeTruthy();
    expect(container.querySelector('time')).toBeNull();
    expect(screen.queryByText(/Snapshot compiled from/)).toBeNull();
    expect(screen.queryByRole('button', { name: /UTC|local/i })).toBeNull();
    expect(container.querySelector('a[href*="/commit/"]')).toBeNull();
    expect(screen.getByRole('link', { name: 'Sources and provenance' }).getAttribute('href')).toBe('/about');
    expect(screen.getByRole('link', { name: 'Repository on GitHub' })).toBeTruthy();
  });

  it('wins over a stamp it is also given, and falls back to no snapshot when none is given', () => {
    const { container, rerender } = render(<Footer {...props} noSnapshot />);
    expect(container.querySelector('time')).toBeNull();
    expect(screen.queryByText(/Snapshot compiled from/)).toBeNull();
    rerender(<Footer provenanceHref={props.provenanceHref} repoHref={props.repoHref} />);
    expect(screen.getByText("No snapshot: trace.json hasn't been read.")).toBeTruthy();
    expect(container.querySelector('time')).toBeNull();
  });

  it('accepts its own words for the no-snapshot line', () => {
    render(<Footer noSnapshot noSnapshotLabel="No snapshot (placeholder)" provenanceHref="/about" repoHref="/repo" />);
    expect(screen.getByText('No snapshot (placeholder)')).toBeTruthy();
  });

  it('can be reached from the keyboard with no snapshot: the two links only', async () => {
    render(<Footer noSnapshot provenanceHref="/about" repoHref="/repo" />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Sources and provenance' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Repository on GitHub' }));
  });

  it('can be reached from the keyboard, link to link', async () => {
    render(<Footer {...props} />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Commit 94a7473 on GitHub' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Show UTC time' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Sources and provenance' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Repository on GitHub' }));
  });
});
