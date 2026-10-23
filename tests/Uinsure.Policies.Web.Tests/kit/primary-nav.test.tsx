import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimaryNav } from '../../../src/Uinsure.Policies.Web/kit/layouts/primary-nav/PrimaryNav';
import { catalogNav, examples, partlyBuiltNav } from '../../../src/Uinsure.Policies.Web/kit/layouts/primary-nav/primary-nav.examples';

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
    expect(bars).toHaveLength(7);
    const currents = bars.slice(0, 6).map((bar) => {
      const marked = within(bar).getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
      expect(marked).toHaveLength(1);
      return marked[0]!.textContent;
    });
    expect(currents).toEqual(LABELS);
  });

  it('ends with a bar whose unbuilt entries say so and are not links', () => {
    render(examples[0]!.element);
    const bar = screen.getByRole('navigation', { name: 'Primary, some entries not built yet' });
    expect(within(bar).getAllByRole('link').map((a) => a.textContent)).toEqual(['Overview', 'How to read this']);
    expect(within(bar).getAllByText('not built yet')).toHaveLength(4);
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

  describe('an entry that is not built', () => {
    const NOT_BUILT = ['Requirements matrix', 'Plan', 'Human decisions', 'Workbench'];

    it('says "not built yet" for each unbuilt entry and draws it as no link', () => {
      render(<PrimaryNav current="overview" items={partlyBuiltNav} />);
      const nav = screen.getByRole('navigation', { name: 'Primary' });
      expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Overview', 'How to read this']);
      expect(within(nav).getAllByText('not built yet')).toHaveLength(NOT_BUILT.length);
      const items = within(nav).getAllByRole('listitem');
      expect(items).toHaveLength(LABELS.length);
      for (const name of NOT_BUILT) {
        const item = items.find((li) => li.textContent?.includes(name))!;
        expect(item.textContent).toContain('not built yet');
        expect(within(item).queryByRole('link')).toBeNull();
        expect(item.querySelector('a')).toBeNull();
        expect(item.getAttribute('data-built')).toBe('false');
      }
    });

    it('keeps the order and the scope divider of the entries it is given', () => {
      render(<PrimaryNav current="overview" items={partlyBuiltNav} />);
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
      expect(items[5]!.textContent).toContain('Workbench');
    });

    it('is never the current page, even when its key is current', () => {
      render(<PrimaryNav current="matrix" items={partlyBuiltNav} />);
      expect(document.querySelector('[aria-current]')).toBeNull();
      expect(document.querySelector('[data-active]')).toBeNull();
    });

    it('is skipped by the keyboard: Tab visits only the built links', async () => {
      render(<PrimaryNav current="overview" items={partlyBuiltNav} />);
      await userEvent.tab();
      expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Overview' }));
      await userEvent.tab();
      expect(document.activeElement).toBe(screen.getByRole('link', { name: 'How to read this' }));
      await userEvent.tab();
      expect(document.activeElement).toBe(document.body);
    });
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
