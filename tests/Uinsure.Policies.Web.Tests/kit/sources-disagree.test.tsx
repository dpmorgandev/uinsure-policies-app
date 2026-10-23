import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { SourcesDisagree } from '../../../src/Uinsure.Policies.Web/kit/project/sources-disagree/SourcesDisagree';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/project/sources-disagree/sources-disagree.examples';

afterEach(cleanup);

describe('sources-disagree examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('region', { name: /PR #17/ })).toBeTruthy();
  });
});

describe('SourcesDisagree', () => {
  it('names the fact in a heading, with the disagreement as a word and a glyph', () => {
    render(examples[0]!.element);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(within(heading).getByText('PR #17')).toBeTruthy();
    expect(within(heading).getByText('Sources disagree')).toBeTruthy();
  });

  it('shows both sources as an ordered list, the event-derived value first, each with its source', () => {
    render(examples[0]!.element);
    const list = screen.getByRole('list', { name: 'What the sources say about PR #17' });
    expect(list.tagName).toBe('OL');
    const [first, second] = within(list).getAllByRole('listitem');
    expect(within(first!).getByText('Derived from events')).toBeTruthy();
    expect(within(first!).getByText('loop log, merged(…) event')).toBeTruthy();
    expect(within(first!).getByText(/PR #17 merged by David in the GitHub UI/)).toBeTruthy();
    expect(within(second!).getByText('Also stated by')).toBeTruthy();
    expect(within(second!).getByText('README, generated header')).toBeTruthy();
    expect(within(second!).getByText('“merge pending”.')).toBeTruthy();
  });

  it('says that none is picked', () => {
    render(examples[0]!.element);
    expect(screen.getByText(/Both are shown and none is picked/)).toBeTruthy();
  });

  it('takes the heading level it is given', () => {
    render(
      <SourcesDisagree
        headingLevel={4}
        fact="Sign-off time"
        derived={{ source: 'loop log', says: '2026-10-19T00:07:35Z' }}
        other={{ source: 'QA document', says: '19/10/2026 01:05' }}
      />,
    );
    expect(screen.getByRole('heading', { level: 4, name: /Sign-off time/ })).toBeTruthy();
  });

  it('leaves out the time line when a source gives none', () => {
    render(
      <SourcesDisagree
        fact="Sign-off time"
        derived={{ source: 'loop log', says: '2026-10-19T00:07:35Z' }}
        other={{ source: 'QA document', says: '19/10/2026 01:05' }}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText(/compiled/)).toBeNull();
  });
});
