import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ShaLink } from '../../../src/Uinsure.Policies.Web/kit/primitives/sha-link/ShaLink';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/primitives/sha-link/sha-link.examples';

afterEach(cleanup);

const FULL = 'af38b4b6f0ca2910a007c52cc8f622b88fa64fb1';
const GITHUB = `https://github.com/dpmorgandev/uinsure-policies-api/commit/${FULL}`;

describe('sha-link examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'rewritten SHA (dis)', 'missing']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }
});

describe('ShaLink', () => {
  it('links the short SHA to the commit page and offers GitHub as a second link', () => {
    render(<ShaLink sha="af38b4b" fullSha={FULL} href="#r33" githubHref={GITHUB} />);
    expect(screen.getByRole('link', { name: 'af38b4b' }).getAttribute('href')).toBe('#r33');
    expect(screen.getByRole('link', { name: 'Commit af38b4b on GitHub' }).getAttribute('href')).toBe(GITHUB);
  });

  it('marks every GitHub link rel="noreferrer", and leaves the in-app link alone', () => {
    render(<ShaLink sha="af38b4b" fullSha={FULL} href="#r33" githubHref={GITHUB} />);
    expect(screen.getByRole('link', { name: 'Commit af38b4b on GitHub' }).getAttribute('rel')).toBe('noreferrer');
    expect(screen.getByRole('link', { name: 'af38b4b' }).getAttribute('rel')).toBeNull();
  });

  it('marks the single GitHub link rel="noreferrer" when no commit page is given', () => {
    render(<ShaLink sha="94a7473" githubHref="https://github.com/dpmorgandev/uinsure-policies-api/commit/94a7473" />);
    expect(screen.getByRole('link').getAttribute('rel')).toBe('noreferrer');
  });

  it('makes the full SHA available on hover and to assistive technology', () => {
    render(<ShaLink sha="af38b4b" fullSha={FULL} href="#r33" githubHref={GITHUB} />);
    const link = screen.getByRole('link', { name: 'af38b4b' });
    expect(link.getAttribute('title')).toBe(FULL);
    const describedBy = link.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? '')?.textContent).toBe(`Full SHA ${FULL}`);
  });

  it('with only a GitHub address, one link names the commit and the destination', () => {
    render(<ShaLink sha="94a7473" githubHref="https://github.com/dpmorgandev/uinsure-policies-api/commit/94a7473" />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(1);
    expect(links[0]?.getAttribute('aria-label')).toBe('Commit 94a7473 on GitHub');
    expect(links[0]?.textContent).toBe('94a7473');
  });

  it('shows both SHAs, in words, when two sources disagree', () => {
    render(
      <ShaLink sha="143e5ba" githubHref="https://example.invalid/c" disagreement={{ sha: 'd131efb', source: 'the verdict detail' }} />,
    );
    expect(screen.getByText(/Sources differ: the verdict detail names/)).toBeTruthy();
    expect(screen.getByText('d131efb')).toBeTruthy();
    expect(screen.getByRole('link', { name: /143e5ba/ })).toBeTruthy();
  });

  it('shows a missing SHA as words, not a link', () => {
    render(<ShaLink sha={null} />);
    expect(screen.getByText('no SHA')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('lets the caller word the missing case', () => {
    render(<ShaLink sha={undefined} missingLabel="not in the excerpt" />);
    expect(screen.getByText('not in the excerpt')).toBeTruthy();
  });

  it('shows a plain SHA when no address is given', () => {
    render(<ShaLink sha="2f81a40" />);
    expect(screen.getByText('2f81a40')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
