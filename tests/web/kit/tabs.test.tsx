import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { Tabs } from '../../../src/web/kit/primitives/tabs/Tabs';
import type { TabItem } from '../../../src/web/kit/primitives/tabs/Tabs';
import { examples } from '../../../src/web/kit/primitives/tabs/tabs.examples';

afterEach(cleanup);

const ITEMS: TabItem[] = [
  { key: 'node', label: 'Node', href: '#node' },
  { key: 'walkthrough', label: 'Walkthrough', href: '#walkthrough' },
  { key: 'loop', label: 'Loop', href: '#loop', empty: true },
  { key: 'activity', label: 'Activity', href: '#activity', empty: true },
];

describe('tabs examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['each tab', 'git-only (some tabs empty)']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }

  it('"each tab" marks each of the four views current once', () => {
    const { container } = render(examples[0]!.element);
    const navs = container.querySelectorAll('nav');
    expect(navs.length).toBe(4);
    const current = [...navs].map((nav) => nav.querySelector('[aria-current="page"]')?.textContent);
    expect(current).toEqual(['Node', 'Walkthrough', 'Loop', 'Activity']);
  });

  it('"git-only" shows empty views as links that say they are empty', () => {
    const { container } = render(examples[1]!.element);
    expect(container.querySelectorAll('a[data-empty="true"]').length).toBe(2);
  });
});

describe('Tabs', () => {
  it('is a navigation landmark of links, not an ARIA tablist', () => {
    render(<Tabs items={ITEMS} current="node" />);
    const nav = screen.getByRole('navigation', { name: 'Views of this node' });
    expect(within(nav).getAllByRole('link').length).toBe(4);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('links each view to its route', () => {
    render(<Tabs items={ITEMS} current="node" />);
    expect(screen.getByRole('link', { name: 'Walkthrough' }).getAttribute('href')).toBe('#walkthrough');
  });

  it('marks only the current view with aria-current="page"', () => {
    render(<Tabs items={ITEMS} current="walkthrough" />);
    const links = screen.getAllByRole('link');
    const current = links.filter((l) => l.getAttribute('aria-current') === 'page');
    expect(current.length).toBe(1);
    expect(current[0]?.getAttribute('href')).toBe('#walkthrough');
  });

  it('marks nothing current when the key matches no view', () => {
    render(<Tabs items={ITEMS} current="none" />);
    expect(document.querySelector('[aria-current]')).toBeNull();
  });

  it('keeps an empty view reachable and says it is empty in words', () => {
    render(<Tabs items={ITEMS} current="node" />);
    const loop = screen.getByRole('link', { name: /Loop/ });
    expect(loop.getAttribute('href')).toBe('#loop');
    expect(loop.getAttribute('data-empty')).toBe('true');
    expect(within(loop).getByText('empty')).toBeTruthy();
    expect(within(screen.getByRole('link', { name: 'Node' })).queryByText('empty')).toBeNull();
  });

  it('lets the caller name the landmark', () => {
    render(<Tabs items={ITEMS} current="node" label="Views of build/F2" />);
    expect(screen.getByRole('navigation', { name: 'Views of build/F2' })).toBeTruthy();
  });
});
