import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimaryNav } from '../../../src/web/kit/layouts/primary-nav/PrimaryNav';
import { catalogNav, examples } from '../../../src/web/kit/layouts/primary-nav/primary-nav.examples';

afterEach(cleanup);

const LABELS = ['Overview', 'Requirements matrix', 'Plan', 'Human decisions', 'How to read this', 'Workbench'];

describe('primary-nav examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['each active item']);
  });

  it('shows the catalog nav: the five explorer entries, then the workbench, as given in screens.json', () => {
    expect(catalogNav.map((item) => item.label)).toEqual(LABELS);
    expect(catalogNav.map((item) => item.scope)).toEqual([
      'explorer',
      'explorer',
      'explorer',
      'explorer',
      'explorer',
      'workbench',
    ]);
    expect(catalogNav.map((item) => item.href)).toEqual([
      '/',
      '/rules',
      '/plans/build',
      '/decisions',
      '/about',
      '/workbench',
    ]);
  });

  it('shows one bar per item, each with a different single item current', () => {
    render(examples[0]!.element);
    const bars = screen.getAllByRole('navigation');
    expect(bars).toHaveLength(6);
    const currents = bars.map((bar) => {
      const marked = within(bar).getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
      expect(marked).toHaveLength(1);
      return marked[0]!.textContent;
    });
    expect(currents).toEqual(LABELS);
  });
});

describe('PrimaryNav', () => {
  it('is a navigation landmark of real links, in the order given', () => {
    render(<PrimaryNav current="overview" items={catalogNav} />);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(LABELS);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(catalogNav.map((i) => i.href));
    expect(nav.querySelector('ul')).not.toBeNull();
  });

  it('holds no routes of its own: the links are the ones it is given', () => {
    render(
      <PrimaryNav
        current="a"
        items={[
          { key: 'a', label: 'Alpha (placeholder)', href: '/alpha-placeholder' },
          { key: 'b', label: 'Beta (placeholder)', href: '/beta-placeholder' },
        ]}
      />,
    );
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/alpha-placeholder',
      '/beta-placeholder',
    ]);
    expect(document.querySelector('a[href="/plans/build"]')).toBeNull();
  });

  it.each(catalogNav)('marks only $label as the current page when it is current', (item) => {
    render(<PrimaryNav current={item.key} items={catalogNav} />);
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent)).toEqual([item.label]);
    expect(screen.getByRole('link', { name: item.label }).getAttribute('data-active')).toBe('true');
  });

  it('marks nothing current when `current` names no item', () => {
    render(<PrimaryNav current="nothing-here" items={catalogNav} />);
    expect(screen.getAllByRole('link').some((a) => a.hasAttribute('aria-current'))).toBe(false);
  });

  it('sets the workbench apart from the explorer links by scope, and only there', () => {
    render(<PrimaryNav current="overview" items={catalogNav} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-scope'))).toEqual([
      'explorer',
      'explorer',
      'explorer',
      'explorer',
      'explorer',
      'workbench',
    ]);
    expect(items.map((li) => li.getAttribute('data-scope-start'))).toEqual([null, null, null, null, null, 'true']);
  });

  it('draws no divider when every item has the same scope', () => {
    render(
      <PrimaryNav
        current="a"
        items={[
          { key: 'a', label: 'Alpha (placeholder)', href: '/a' },
          { key: 'b', label: 'Beta (placeholder)', href: '/b' },
        ]}
      />,
    );
    expect(document.querySelector('[data-scope-start]')).toBeNull();
  });

  it('takes its own landmark name', () => {
    render(<PrimaryNav current="a" label="Sections" items={[{ key: 'a', label: 'Alpha (placeholder)', href: '/a' }]} />);
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('moves from link to link with Tab, in order', async () => {
    render(<PrimaryNav current="plan" items={catalogNav} />);
    for (const label of LABELS) {
      await userEvent.tab();
      expect(document.activeElement).toBe(screen.getByRole('link', { name: label }));
    }
  });
});
