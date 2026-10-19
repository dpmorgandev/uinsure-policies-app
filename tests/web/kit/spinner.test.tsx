import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Spinner } from '../../../src/web/kit/primitives/spinner/Spinner';
import { examples } from '../../../src/web/kit/primitives/spinner/spinner.examples';

afterEach(cleanup);

describe('Spinner', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.firstChild).not.toBeNull();
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['inline in a button', 'reduced motion', 'both themes']);
  });

  it('is decorative: hidden from assistive technology, with a rotating and a static glyph', () => {
    const { container } = render(<Spinner />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelectorAll('svg')).toHaveLength(2);
    expect(root.getAttribute('data-still')).toBeNull();
  });

  it('marks itself still when asked, so the static glyph replaces the rotation', () => {
    const { container } = render(<Spinner still />);
    expect((container.firstElementChild as HTMLElement).getAttribute('data-still')).toBe('true');
  });

  it('is never the only signal: in a button the label says what is happening', () => {
    render(examples[0]!.element);
    const button = screen.getByRole('button', { name: 'Quoting…' });
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});
