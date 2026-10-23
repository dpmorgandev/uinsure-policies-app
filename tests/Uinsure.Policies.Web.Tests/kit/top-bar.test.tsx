import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopBar } from '../../../src/Uinsure.Policies.Web/kit/layouts/top-bar/TopBar';
import { Search } from '../../../src/Uinsure.Policies.Web/kit/patterns/search/Search';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/layouts/top-bar/top-bar.examples';

afterEach(cleanup);

describe('top-bar examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelector('header')).not.toBeNull();
    expect(screen.getAllByRole('link', { name: 'Docket' }).length).toBeGreaterThan(0);
  });

  it('pop shows the bar with the Search combobox in the slot and the bar with its own plain input', () => {
    const pop = examples.find((e) => e.state === 'pop');
    if (pop === undefined) throw new Error('top-bar has no pop example');
    const { container } = render(pop.element);
    expect(container.querySelectorAll('header')).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: 'Jump to a rule, node, SHA or path' })).toBeTruthy();
    expect(screen.getByRole('searchbox')).toBeTruthy();
  });
});

describe('TopBar', () => {
  it('holds the app name as a link home, a labelled search and the theme toggle', () => {
    render(<TopBar appName="Docket" homeHref="/" />);
    expect(screen.getByRole('link', { name: 'Docket' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('search')).toBeTruthy();
    const box = screen.getByRole('searchbox', { name: 'Search rules, nodes, SHAs and file paths' });
    expect(box.getAttribute('placeholder')).toBe('Rule ID, node, SHA or path');
    expect(screen.getByRole('button', { name: 'Search' }).getAttribute('type')).toBe('submit');
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('draws a search given in the slot where its own box sits, and drops the plain one', () => {
    render(<TopBar appName="Docket" search={<Search shortcut={null} defaultValue="F2" results={[]} />} />);
    expect(screen.getByRole('combobox', { name: 'Jump to a rule, node, SHA or path' })).toBeTruthy();
    expect(screen.getAllByRole('search')).toHaveLength(1);
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Search' })).toBeNull();
    expect(screen.getByRole('radiogroup')).toBeTruthy();
  });

  it('shows the slotted combobox results and keeps the name, then the search, then the theme in tab order', async () => {
    render(
      <TopBar
        appName="Docket"
        defaultTheme="light"
        search={
          <Search
            shortcut={null}
            defaultValue="F2"
            results={[{ id: 'node-build-f2', kind: 'node', label: 'build/F2', href: '#' }]}
          />
        }
      />,
    );
    expect(screen.getByRole('option', { name: /build\/F2/ })).toBeTruthy();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Docket' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: /Light/ }));
  });

  it('starts the box with the given query and reports what was typed on submit', async () => {
    const onSearch = vi.fn();
    render(<TopBar appName="Docket" defaultQuery="GET-1" onSearch={onSearch} />);
    const box = screen.getByRole('searchbox') as HTMLInputElement;
    expect(box.value).toBe('GET-1');
    await userEvent.clear(box);
    await userEvent.type(box, 'CANCEL-1c{Enter}');
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('CANCEL-1c');
  });

  it('submits from the Search button too', async () => {
    const onSearch = vi.fn();
    render(<TopBar appName="Docket" defaultQuery="94a7473" onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).toHaveBeenCalledWith('94a7473');
  });

  it('reports a theme choice and does not apply it', async () => {
    const onThemeChange = vi.fn();
    render(<TopBar appName="Docket" defaultTheme="light" onThemeChange={onThemeChange} />);
    await userEvent.click(screen.getByRole('radio', { name: /Dark/ }));
    expect(onThemeChange).toHaveBeenCalledWith('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('is reached in order from the keyboard: name, search box, Search, theme', async () => {
    render(<TopBar appName="Docket" defaultTheme="light" />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Docket' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('searchbox'));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Search' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: /Light/ }));
  });

  describe('BUSY-1', () => {
    it('while searching: disabled, aria-busy, aria-disabled, and the label says what is happening', () => {
      render(<TopBar appName="Docket" defaultQuery="GET-1" searching />);
      const button = screen.getByRole('button', { name: 'Searching…' });
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.querySelector('svg')).not.toBeNull();
    });

    it('keeps the query while searching', () => {
      render(<TopBar appName="Docket" defaultQuery="GET-1" searching />);
      expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('GET-1');
    });

    it('cannot be fired twice while searching', async () => {
      const onSearch = vi.fn();
      render(<TopBar appName="Docket" defaultQuery="GET-1" searching onSearch={onSearch} />);
      const button = screen.getByRole('button', { name: 'Searching…' });
      await userEvent.click(button);
      await userEvent.dblClick(button);
      fireEvent.submit(screen.getByRole('search'));
      expect(onSearch).not.toHaveBeenCalled();
    });

    it('re-enables when the search ends', async () => {
      const onSearch = vi.fn();
      const { rerender } = render(<TopBar appName="Docket" defaultQuery="GET-1" searching onSearch={onSearch} />);
      rerender(<TopBar appName="Docket" defaultQuery="GET-1" searching={false} onSearch={onSearch} />);
      const button = screen.getByRole('button', { name: 'Search' });
      expect(button.hasAttribute('disabled')).toBe(false);
      await userEvent.click(button);
      expect(onSearch).toHaveBeenCalledWith('GET-1');
    });
  });
});
