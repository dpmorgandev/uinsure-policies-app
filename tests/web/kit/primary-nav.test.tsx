import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimaryNav, primaryNavItems } from '../../../src/web/kit/layouts/primary-nav/PrimaryNav';
import { examples } from '../../../src/web/kit/layouts/primary-nav/primary-nav.examples';

afterEach(cleanup);

const LABELS = ['Overview', 'Requirements', 'Plans', 'Decisions', 'About'];

describe('primary-nav examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['each active item']);
  });

  it('shows five bars, each with a different single item current', () => {
    render(examples[0]!.element);
    const bars = screen.getAllByRole('navigation');
    expect(bars).toHaveLength(5);
    const currents = bars.map((bar) => {
      const marked = within(bar).getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
      expect(marked).toHaveLength(1);
      return marked[0]!.textContent;
    });
    expect(currents).toEqual(LABELS);
  });
});

describe('PrimaryNav', () => {
  it('is a navigation landmark of five real links, in the catalogued order', () => {
    render(<PrimaryNav current="overview" />);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(LABELS);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(primaryNavItems.map((i) => i.href));
    expect(nav.querySelector('ul')).not.toBeNull();
  });

  it.each(primaryNavItems)('marks only $label as the current page when it is current', (item) => {
    render(<PrimaryNav current={item.key} />);
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent)).toEqual([item.label]);
    expect(screen.getByRole('link', { name: item.label }).getAttribute('data-active')).toBe('true');
  });

  it('marks nothing current when `current` names no item', () => {
    render(<PrimaryNav current="workbench" />);
    expect(screen.getAllByRole('link').some((a) => a.hasAttribute('aria-current'))).toBe(false);
  });

  it('takes its own items and landmark name', () => {
    render(<PrimaryNav current="a" label="Sections" items={[{ key: 'a', label: 'Alpha (placeholder)', href: '/a' }]} />);
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('moves from link to link with Tab, in order', async () => {
    render(<PrimaryNav current="plans" />);
    for (const label of LABELS) {
      await userEvent.tab();
      expect(document.activeElement).toBe(screen.getByRole('link', { name: label }));
    }
  });
});
