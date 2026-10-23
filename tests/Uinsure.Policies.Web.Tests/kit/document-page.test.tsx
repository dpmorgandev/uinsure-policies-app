import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import {
  DocumentCallout,
  DocumentFigure,
  DocumentPage,
  DocumentSection,
} from '../../../src/Uinsure.Policies.Web/kit/patterns/document-page/DocumentPage';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/document-page/document-page.examples';

afterEach(cleanup);

describe('DocumentPage', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'long']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('article')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Docket: concept' })).toBeTruthy();
  });

  it('pop: sections are level 2 headings in reading order, with a figure and a callout', () => {
    render(examples[0]!.element);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Concept', 'Type: T5, licence checked']);
    expect(screen.getByRole('figure')).toBeTruthy();
    expect(screen.getByRole('note', { name: 'Still open before G3' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'On this page' })).toBeNull();
  });

  it('long: an "On this page" list links to every section, in order', () => {
    render(examples[1]!.element);
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    const links = within(nav).getAllByRole('link');
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(links.map((l) => l.textContent)).toEqual(headings.map((h) => h.textContent));
    expect(within(nav).getAllByRole('listitem')).toHaveLength(6);
    for (const [position, link] of links.entries()) {
      expect(link.getAttribute('href')).toBe(`#${headings[position]!.id}`);
    }
  });

  it('long: a section is reachable by its id, and the refusals are an ordered list of five', () => {
    render(examples[1]!.element);
    const refuses = screen.getByRole('region', { name: 'What the territory refuses' });
    expect(within(refuses).getAllByRole('listitem')).toHaveLength(5);
    expect(refuses.querySelector('ol')).not.toBeNull();
  });

  it('a section is a region named by its heading, and its rung number is decoration', () => {
    const { container } = render(
      <DocumentPage title="Guide">
        <DocumentSection id="first" heading="First step">
          <p>Prose</p>
        </DocumentSection>
      </DocumentPage>,
    );
    expect(screen.getByRole('region', { name: 'First step' })).toBeTruthy();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'First step' }).id).toBe('first');
  });

  it('a short document has no contents list unless it is given one', () => {
    render(
      <DocumentPage title="Guide" contents={[]}>
        <p>Prose</p>
      </DocumentPage>,
    );
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('shows the eyebrow and the lede when given', () => {
    render(
      <DocumentPage title="Guide" eyebrow="Where it comes from" lede="What it is for">
        <p>Prose</p>
      </DocumentPage>,
    );
    expect(screen.getByText('Where it comes from')).toBeTruthy();
    expect(screen.getByText('What it is for')).toBeTruthy();
  });

  it('a figure is named by its caption, and scrolls inside itself so the page does not', () => {
    render(
      <DocumentFigure caption="A wide table">
        <table>
          <caption>Wide</caption>
          <tbody>
            <tr>
              <th scope="row">a</th>
              <td>b</td>
            </tr>
          </tbody>
        </table>
      </DocumentFigure>,
    );
    const figure = screen.getByRole('figure', { name: 'A wide table' });
    const region = within(figure).getByRole('region', { name: 'A wide table' });
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('a note says "Note" and a warning says "Warning", each with a glyph', () => {
    render(
      <>
        <DocumentCallout>
          <p>Worth knowing</p>
        </DocumentCallout>
        <DocumentCallout tone="warning">
          <p>Can go wrong</p>
        </DocumentCallout>
      </>,
    );
    const note = screen.getByRole('note', { name: 'Note' });
    const warning = screen.getByRole('note', { name: 'Warning' });
    expect(note.getAttribute('data-tone')).toBe('note');
    expect(warning.getAttribute('data-tone')).toBe('warning');
    expect(note.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(warning.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
