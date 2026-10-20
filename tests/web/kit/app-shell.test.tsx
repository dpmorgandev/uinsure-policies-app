import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '../../../src/web/kit/layouts/app-shell/AppShell';
import { examples } from '../../../src/web/kit/layouts/app-shell/app-shell.examples';
import { catalogNav } from '../../../src/web/kit/layouts/primary-nav/primary-nav.examples';

afterEach(cleanup);

const footer = {
  compiledAt: { sha: '94a7473', time: '2026-10-19T00:07:57Z' },
  provenanceHref: '/about',
  repoHref: 'https://github.com/example/repo',
};

describe('app-shell examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['1440', '1280', '390']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelector('header')).not.toBeNull();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
    expect(container.querySelector('footer')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Page title (placeholder)' })).toBeTruthy();
  });

  it.each(examples)('shows the catalog nav inside the frame: $state', ({ element }) => {
    render(element);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(catalogNav.map((item) => item.label));
    expect(within(nav).getByRole('link', { name: 'Workbench' }).getAttribute('href')).toBe('/workbench');
  });

  it('names its frame by the width it shows', () => {
    const labels = examples.map((example) => {
      const { container, unmount } = render(example.element);
      const text = container.querySelector('p')?.textContent ?? '';
      unmount();
      return text;
    });
    expect(labels[0]).toMatch(/^1440 wide/);
    expect(labels[1]).toMatch(/^1280 wide/);
    expect(labels[2]).toMatch(/^390 wide/);
  });
});

describe('AppShell', () => {
  it('has the four regions in reading order: top bar, navigation, main, footer', () => {
    const { container } = render(
      <AppShell topBar={{ appName: 'Docket' }} nav={{ current: 'overview', items: catalogNav }} footer={footer}>
        <p>Screen</p>
      </AppShell>,
    );
    const header = container.querySelector('header')!;
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const main = screen.getByRole('main');
    const foot = container.querySelector('footer')!;
    const before = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(before(header, nav)).toBe(true);
    expect(before(nav, main)).toBe(true);
    expect(before(main, foot)).toBe(true);
    expect(within(main).getByText('Screen')).toBeTruthy();
    expect(within(header).getByRole('link', { name: 'Docket' })).toBeTruthy();
    expect(within(foot).getByText('Snapshot compiled from')).toBeTruthy();
  });

  it('marks the current section in the navigation', () => {
    render(
      <AppShell topBar={{ appName: 'Docket' }} nav={{ current: 'decisions', items: catalogNav }} footer={footer}>
        <p>Screen</p>
      </AppShell>,
    );
    expect(screen.getByRole('link', { name: 'Human decisions' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Overview' }).hasAttribute('aria-current')).toBe(false);
  });

  it('offers the links it is given and none of its own', () => {
    render(
      <AppShell
        topBar={{ appName: 'Docket' }}
        nav={{ current: 'a', items: [{ key: 'a', label: 'Alpha (placeholder)', href: '/alpha-placeholder' }] }}
        footer={footer}
      >
        <p>Screen</p>
      </AppShell>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/alpha-placeholder']);
  });

  it('starts with a skip link that points at main, and main can take focus', async () => {
    render(
      <AppShell
        topBar={{ appName: 'Docket' }}
        nav={{ current: 'overview', items: catalogNav }}
        footer={footer}
        skipLabel="Skip to the rule"
      >
        <p>Screen</p>
      </AppShell>,
    );
    await userEvent.tab();
    const skip = screen.getByRole('link', { name: 'Skip to the rule' });
    expect(document.activeElement).toBe(skip);
    const main = screen.getByRole('main');
    expect(skip.getAttribute('href')).toBe(`#${main.id}`);
    expect(main.id).not.toBe('');
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  it('gives each shell its own main id, so two on a page do not clash', () => {
    render(
      <>
        <AppShell topBar={{ appName: 'Docket' }} nav={{ current: 'overview', items: catalogNav }} footer={footer}>
          <p>One</p>
        </AppShell>
        <AppShell topBar={{ appName: 'Docket' }} nav={{ current: 'about', items: catalogNav }} footer={footer}>
          <p>Two</p>
        </AppShell>
      </>,
    );
    const [a, b] = screen.getAllByRole('main');
    expect(a!.id).not.toBe(b!.id);
  });

  it('passes the search and theme props to the top bar', async () => {
    const onSearch = vi.fn();
    const onThemeChange = vi.fn();
    render(
      <AppShell
        topBar={{ appName: 'Docket', defaultQuery: 'GET-1', onSearch, onThemeChange, defaultTheme: 'light' }}
        nav={{ current: 'overview', items: catalogNav }}
        footer={footer}
      >
        <p>Screen</p>
      </AppShell>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).toHaveBeenCalledWith('GET-1');
    await userEvent.click(screen.getByRole('radio', { name: /Dark/ }));
    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });

  it('tabs through the frame in order: skip, name, search, theme, navigation, then the screen, then the footer', async () => {
    render(
      <AppShell
        topBar={{ appName: 'Docket' }}
        nav={{ current: 'overview', items: catalogNav }}
        footer={footer}
        skipLabel="Skip"
      >
        <a href="#x">In the screen</a>
      </AppShell>,
    );
    const order = [
      screen.getByRole('link', { name: 'Skip' }),
      screen.getByRole('link', { name: 'Docket' }),
      screen.getByRole('searchbox'),
      screen.getByRole('button', { name: 'Search' }),
      screen.getAllByRole('radio').find((r) => (r as HTMLInputElement).checked)!,
      screen.getByRole('link', { name: 'Overview' }),
    ];
    for (const stop of order) {
      await userEvent.tab();
      expect(document.activeElement).toBe(stop);
    }
    for (const name of ['Requirements matrix', 'Plan', 'Human decisions', 'How to read this', 'Workbench', 'In the screen']) {
      await userEvent.tab();
      expect(document.activeElement).toBe(screen.getByRole('link', { name }));
    }
  });
});
