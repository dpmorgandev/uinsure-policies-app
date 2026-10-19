import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { FileLineLink } from '../../../src/web/kit/primitives/file-line-link/FileLineLink';
import { examples } from '../../../src/web/kit/primitives/file-line-link/file-line-link.examples';

afterEach(cleanup);

const PATH = 'src/Uinsure.Policies.Api/Contracts/PolicyMappings.cs';
const URL = `https://github.com/dpmorgandev/uinsure-policies-api/blob/8ea8f604d6be272a478d5938d0a05f3c31d6f874/${PATH}#L37`;

describe('file-line-link examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'line absent']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }
});

describe('FileLineLink', () => {
  it('shows path:line and links to the file at the SHA on GitHub', () => {
    render(<FileLineLink path={PATH} line={37} href={URL} />);
    const link = screen.getByRole('link', { name: `${PATH}:37 on GitHub` });
    expect(link.getAttribute('href')).toBe(URL);
    expect(link.getAttribute('data-line')).toBe('present');
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows only the path when the line is absent', () => {
    render(<FileLineLink path="docs/qa/build-F2.md" href="https://example.invalid/f" />);
    const link = screen.getByRole('link', { name: 'docs/qa/build-F2.md on GitHub' });
    expect(link.getAttribute('data-line')).toBe('absent');
    expect(link.textContent).not.toContain(':');
  });

  it('treats line 0 as a line, not as absent', () => {
    render(<FileLineLink path="a.cs" line={0} href="https://example.invalid/f" />);
    expect(screen.getByRole('link').getAttribute('data-line')).toBe('present');
  });
});
