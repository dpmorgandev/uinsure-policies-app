import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { KeyValueList } from '../../../src/Uinsure.Policies.Web/kit/patterns/key-value-list/KeyValueList';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/key-value-list/key-value-list.examples';

afterEach(cleanup);

/** Each term with the value that follows it, read from the definition list's own markup. */
function pairs(container: HTMLElement): [string, string][] {
  return Array.from(container.querySelectorAll('dt')).map((dt) => [
    dt.textContent ?? '',
    dt.nextElementSibling?.textContent ?? '',
  ]);
}

describe('key-value-list examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'missing values']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByRole('term').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('definition').length).toBeGreaterThan(0);
  });

  it('pop: every field has a value and none is drawn as a gap', () => {
    const first = examples[0];
    if (!first) throw new Error('no example');
    const { container } = render(first.element);
    expect(container.querySelectorAll('[data-missing="true"]').length).toBe(0);
    expect(pairs(container).map(([term]) => term)).toEqual([
      'QA step',
      'Steps passed',
      'Tester',
      'Verdict',
      'Signature',
    ]);
  });

  it('missing values: each absent field says so in words, with the words the item gave', () => {
    const second = examples[1];
    if (!second) throw new Error('no example');
    const { container } = render(second.element);
    expect(pairs(container)).toEqual([
      ['Policy', 'F3-MVEOSVDQJQ'],
      ['Status', "not in this screen's data"],
      ['Compiled at', "not in this screen's data"],
      ['Snapshot SHA', 'not in the excerpt'],
    ]);
    expect(container.querySelectorAll('[data-missing="true"]').length).toBe(3);
  });
});

describe('KeyValueList', () => {
  it('is a definition list whose terms and definitions come in pairs', () => {
    const { container } = render(
      <KeyValueList
        items={[
          { label: 'Rule', value: 'GET-1' },
          { label: 'Text', value: 'Retrieve a policy' },
        ]}
      />,
    );
    expect(container.querySelector('dl')).not.toBeNull();
    expect(container.querySelectorAll('dt').length).toBe(2);
    expect(container.querySelectorAll('dd').length).toBe(2);
  });

  it('treats null, undefined and the empty string as missing, and keeps 0 as a value', () => {
    const { container } = render(
      <KeyValueList
        items={[
          { label: 'A', value: null },
          { label: 'B', value: undefined },
          { label: 'C', value: '' },
          { label: 'D', value: 0 },
        ]}
      />,
    );
    expect(pairs(container)).toEqual([
      ['A', 'not in this data'],
      ['B', 'not in this data'],
      ['C', 'not in this data'],
      ['D', '0'],
    ]);
  });

  it('lets the list set the default words for a missing field', () => {
    const { container } = render(
      <KeyValueList missingLabel="not recorded" items={[{ label: 'Status', value: null }]} />,
    );
    expect(pairs(container)).toEqual([['Status', 'not recorded']]);
  });

  it('marks a missing value with a dashed gap and a decorative glyph, never colour alone', () => {
    const { container } = render(<KeyValueList items={[{ label: 'Status', value: null }]} />);
    const svg = container.querySelector('dd svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('dd')?.textContent).toBe('not in this data');
  });

  it('keeps links and tags inside a value reachable', () => {
    render(<KeyValueList items={[{ label: 'QA step', value: <a href="/qa">docs/qa/build-F2.md#1</a> }]} />);
    expect(screen.getByRole('link', { name: 'docs/qa/build-F2.md#1' }).getAttribute('href')).toBe('/qa');
  });
});
