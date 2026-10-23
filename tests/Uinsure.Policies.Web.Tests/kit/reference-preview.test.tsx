import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ReferencePreview } from '../../../src/Uinsure.Policies.Web/kit/project/reference-preview/ReferencePreview';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/project/reference-preview/reference-preview.examples';

afterEach(cleanup);

const exampleFor = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example named ${state}`);
  return found.element;
};

describe('reference-preview examples', () => {
  it('has exactly the catalogued states, in order', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'invalid pattern']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

describe('ReferencePreview', () => {
  it('shows the reference as the API will store it: trimmed and upper-cased', () => {
    const { container } = render(<ReferencePreview value="  f3-mveosvdqjq " />);
    expect(container.querySelector('[data-state="pop"]')).not.toBeNull();
    expect(screen.getByText('F3-MVEOSVDQJQ')).toBeTruthy();
    // The typed text keeps its spaces, inside quotes, so the trim is visible.
    const typed = Array.from(container.querySelectorAll('code')).map((code) => code.textContent);
    expect(typed).toEqual(['"  f3-mveosvdqjq "', 'F3-MVEOSVDQJQ']);
  });

  it('pop: says Valid with a glyph, and states the pattern in words', () => {
    const { container } = render(exampleFor('pop'));
    const tag = container.querySelector('[data-status="pass"]');
    expect(tag?.textContent).toBe('Valid');
    expect(tag?.querySelector('svg')).not.toBeNull();
    expect(screen.getByText(/Matches A to Z, 0 to 9 and hyphen, 3 to 20 characters/)).toBeTruthy();
  });

  it('invalid pattern: says so with a word and a glyph, and that the API would answer 400', () => {
    const { container } = render(exampleFor('invalid pattern'));
    expect(container.querySelector('[data-state="invalid"]')).not.toBeNull();
    const tag = container.querySelector('[data-status="fail"]');
    expect(tag?.textContent).toBe('Invalid pattern');
    expect(tag?.querySelector('svg')).not.toBeNull();
    expect(screen.getByText(/would answer 400/)).toBeTruthy();
    expect(screen.getByText('F3_MVEOSVDQJQ')).toBeTruthy();
  });

  it('names the characters that are not allowed', () => {
    render(<ReferencePreview value="f3_mve osv" />);
    expect(screen.getByText('Not allowed: "_", a space.')).toBeTruthy();
  });

  it('says when a reference is too short or too long, with its length', () => {
    const { rerender } = render(<ReferencePreview value="ab" />);
    expect(screen.getByText('Too short: 2 of at least 3 characters.')).toBeTruthy();
    rerender(<ReferencePreview value={'A'.repeat(21)} />);
    expect(screen.getByText('Too long: 21 of at most 20 characters.')).toBeTruthy();
  });

  it('accepts the edges of the pattern: 3 and 20 characters, digits and hyphens', () => {
    const { container, rerender } = render(<ReferencePreview value="a-1" />);
    expect(container.querySelector('[data-state="pop"]')).not.toBeNull();
    rerender(<ReferencePreview value={'9'.repeat(20)} />);
    expect(container.querySelector('[data-state="pop"]')).not.toBeNull();
  });

  it('empty: asks for a reference and is not an error', () => {
    const { container } = render(<ReferencePreview value="" />);
    expect(container.querySelector('[data-state="empty"]')).not.toBeNull();
    expect(screen.getByText('nothing yet')).toBeTruthy();
    expect(screen.getByText('Nothing typed')).toBeTruthy();
    expect(container.querySelector('[data-status="fail"]')).toBeNull();
  });

  it('shows typed spaces as typed, even when they leave nothing', () => {
    const { container } = render(<ReferencePreview value="   " />);
    expect(container.querySelector('[data-state="empty"]')).not.toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('"   "');
  });

  it('follows the input as it changes', () => {
    const { rerender } = render(<ReferencePreview value="f3" />);
    expect(screen.getByText('F3')).toBeTruthy();
    rerender(<ReferencePreview value="f3-x" />);
    expect(screen.getByText('F3-X')).toBeTruthy();
    expect(screen.queryByText('Too short: 2 of at least 3 characters.')).toBeNull();
  });

  it('is an output tied to its input, announced politely as a status', () => {
    const { container } = render(<ReferencePreview value="f3-x" forId="reference" />);
    const output = container.querySelector('output');
    expect(output?.getAttribute('for')).toBe('reference');
    expect(screen.getByRole('status')).toBe(output);
  });

  it('has nothing to press', () => {
    render(exampleFor('pop'));
    expect(screen.queryAllByRole('button').length).toBe(0);
  });
});
