import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from '../../../src/web/kit/layouts/footer/Footer';
import { examples } from '../../../src/web/kit/layouts/footer/footer.examples';

afterEach(cleanup);

describe('footer examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop']);
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
