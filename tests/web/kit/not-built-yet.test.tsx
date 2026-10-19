import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { NotBuiltYet } from '../../../src/web/kit/project/not-built-yet/NotBuiltYet';
import { examples } from '../../../src/web/kit/project/not-built-yet/not-built-yet.examples';

afterEach(cleanup);

describe('not-built-yet examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['rule', 'node', 'region', 'nav entry']);
  });

  it.each(examples)('renders the example: $state, with the words "not built yet"', ({ element }) => {
    render(element);
    expect(screen.getByText('not built yet')).toBeTruthy();
  });
});

describe('NotBuiltYet', () => {
  it('rule: says which rule has nothing to show, and offers the way back as a link', () => {
    const { container } = render(
      <NotBuiltYet kind="rule" name="GET-1" back={{ href: '/matrix', label: 'Back to the requirements matrix' }} />,
    );
    expect(container.textContent).toContain('Rule GET-1 has no red, green, refactor, QA step or sign-off to show.');
    expect(screen.getByRole('link', { name: 'Back to the requirements matrix' }).getAttribute('href')).toBe('/matrix');
    expect(container.firstElementChild?.getAttribute('data-kind')).toBe('rule');
  });

  it('node: names the node', () => {
    const { container } = render(<NotBuiltYet kind="node" name="F9" />);
    expect(container.textContent).toContain('Node F9 has no commits, gates or verdicts to show.');
  });

  it('region: names the region', () => {
    const { container } = render(<NotBuiltYet kind="region" name="Red and green diffs" />);
    expect(container.textContent).toContain('Red and green diffs has nothing to show yet.');
  });

  it('lets the caller word the sentence', () => {
    render(
      <NotBuiltYet kind="region" name="Tests">
        The tests region waits for the first run.
      </NotBuiltYet>,
    );
    expect(screen.getByText('The tests region waits for the first run.')).toBeTruthy();
  });

  it('nav entry: its name and the words, and never a link or a button', () => {
    const { container } = render(<NotBuiltYet kind="nav entry" name="Agents" />);
    expect(container.textContent).toBe('Agentsnot built yet');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.firstElementChild?.getAttribute('data-kind')).toBe('nav entry');
  });

  it('draws a glyph that screen readers skip', () => {
    const { container } = render(<NotBuiltYet kind="rule" name="GET-1" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
