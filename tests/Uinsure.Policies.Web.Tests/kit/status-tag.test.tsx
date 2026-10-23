import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StatusTag } from '../../../src/Uinsure.Policies.Web/kit/primitives/status-tag/StatusTag';
import type { Status } from '../../../src/Uinsure.Policies.Web/kit/primitives/status-tag/StatusTag';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/primitives/status-tag/status-tag.examples';

afterEach(cleanup);

const WORDS: [Status, string][] = [
  ['pass', 'Pass'],
  ['fail', 'Fail'],
  ['warn', 'Warn'],
  ['pending', 'Pending'],
  ['not-built', 'Not built'],
];

describe('status-tag examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['all five values', 'both themes']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }

  it('"both themes" lists all five values once, and sets no theme of its own', () => {
    const both = examples.find((e) => e.state === 'both themes');
    expect(both).toBeDefined();
    const { container } = render(both!.element);
    const tags = [...container.querySelectorAll('[data-status]')];
    expect(tags.map((tag) => tag.getAttribute('data-status'))).toEqual(WORDS.map(([status]) => status));
    // The kitchen sink draws it under each theme; a pane of its own would nest one theme in the other.
    expect(container.querySelector('[data-theme]')).toBeNull();
  });
});

describe('StatusTag', () => {
  for (const [status, word] of WORDS) {
    it(`${status} is a word and a glyph`, () => {
      const { container } = render(<StatusTag status={status} />);
      const tag = container.querySelector('[data-status]');
      expect(tag?.getAttribute('data-status')).toBe(status);
      expect(screen.getByText(word)).toBeTruthy();
      const glyph = tag?.querySelector('svg');
      expect(glyph).not.toBeNull();
      expect(glyph?.getAttribute('aria-hidden')).toBe('true');
    });
  }

  it('uses a different glyph for each value', () => {
    const shapes = WORDS.map(([status]) => {
      const { container, unmount } = render(<StatusTag status={status} />);
      const shape = container.querySelector('svg')?.innerHTML ?? '';
      unmount();
      return shape;
    });
    expect(new Set(shapes).size).toBe(5);
  });

  it('lets the caller replace the word without changing the status', () => {
    const { container } = render(<StatusTag status="fail">Gate failed</StatusTag>);
    expect(screen.getByText('Gate failed')).toBeTruthy();
    expect(container.querySelector('[data-status]')?.getAttribute('data-status')).toBe('fail');
  });

  it('is not interactive', () => {
    render(<StatusTag status="pass" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
