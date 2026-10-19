import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceiptFigure } from '../../../src/web/kit/patterns/receipt-figure/ReceiptFigure';
import { examples } from '../../../src/web/kit/patterns/receipt-figure/receipt-figure.examples';

afterEach(cleanup);

function example(state: string) {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example for ${state}`);
  return found.element;
}

describe('receipt-figure examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'nb', 'live']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('figure')).toBeTruthy();
  });

  it('pop: the number, what it counts, and a source link one click away', () => {
    render(example('pop'));
    const figure = screen.getByRole('figure');
    expect(within(figure).getByText('41 of 41')).toBeTruthy();
    expect(within(figure).getByText('steps passed in the QA step for build/F2')).toBeTruthy();
    const link = within(figure).getByRole('link', { name: 'docs/qa/build-F2.md#1' });
    expect(link.getAttribute('href')).toBe('https://github.com/dpmorgandev/uinsure-policies-api/blob/main/docs/qa/build-F2.md');
    expect(figure.textContent).toContain('written');
    expect(figure.getAttribute('data-state')).toBe('pop');
  });

  it('nb: says Not built yet in words instead of a number, and says there is no source yet', () => {
    render(example('nb'));
    const figure = screen.getByRole('figure');
    expect(figure.getAttribute('data-state')).toBe('nb');
    expect(within(figure).getByText('Not built yet')).toBeTruthy();
    expect(within(figure).getByText('Source: none yet')).toBeTruthy();
    expect(within(figure).queryByRole('link')).toBeNull();
    expect(within(figure).getByText(/Placeholder: no unbuilt rule ID/)).toBeTruthy();
  });

  it('live: the figure is marked Live in words and links to the request that answered it', () => {
    render(example('live'));
    const figure = screen.getByRole('figure');
    expect(figure.getAttribute('data-state')).toBe('live');
    expect(within(figure).getByText('445.11')).toBeTruthy();
    expect(within(figure).getByText('Live')).toBeTruthy();
    expect(within(figure).getByText('answered 200 by the API')).toBeTruthy();
    expect(within(figure).getByRole('link').getAttribute('href')).toBe('#insp-h');
  });
});

describe('ReceiptFigure', () => {
  it('names the figure from its caption, so the number is never read alone', () => {
    render(<ReceiptFigure value="59/59" unit="pass / total" source={{ label: 'matrix', href: '/matrix' }} />);
    expect(screen.getByRole('figure').querySelector('figcaption')?.textContent).toContain('pass / total');
  });

  it('never shows a number bare: with no source it says so in words, with a glyph', () => {
    const { container } = render(<ReceiptFigure value="59/59" unit="pass / total" />);
    expect(screen.getByText('No source given, so treat this number as unchecked')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('treats the empty string as no value', () => {
    render(<ReceiptFigure value="" unit="steps" />);
    expect(screen.getByRole('figure').getAttribute('data-state')).toBe('nb');
  });

  it('adds the external glyph only for a source outside the app, and keeps it decorative', () => {
    const { container, rerender } = render(
      <ReceiptFigure value="1" unit="u" source={{ label: 's', href: '/s' }} />,
    );
    expect(container.querySelector('a svg')).toBeNull();
    rerender(<ReceiptFigure value="1" unit="u" source={{ label: 's', href: 'https://example.test/s', external: true }} />);
    expect(container.querySelector('a svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('can be reached and followed from the keyboard', async () => {
    render(<ReceiptFigure value="1" unit="u" source={{ label: 'the source', href: '/s' }} />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'the source' }));
  });

  it('lets the nb words be changed', () => {
    render(<ReceiptFigure value={null} unit="Tests" notBuiltNote="nothing has run" />);
    expect(screen.getByRole('figure').textContent).toContain('Tests: nothing has run');
  });

  it('shows a Live marker only when there is a value', () => {
    render(<ReceiptFigure value={null} unit="Tests" live />);
    expect(screen.queryByText('Live')).toBeNull();
  });
});
