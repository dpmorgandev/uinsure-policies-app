import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs } from '../../../src/Uinsure.Policies.Web/kit/patterns/breadcrumbs/Breadcrumbs';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/breadcrumbs/breadcrumbs.examples';

afterEach(cleanup);

describe('breadcrumbs examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
  });
});

describe('Breadcrumbs', () => {
  it('is a named navigation landmark holding an ordered list of levels', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Overview', href: '/' },
          { label: 'build', href: '/build' },
          { label: 'GET-1', href: '/rules/GET-1', mono: true },
        ]}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem').length).toBe(3);
  });

  it('makes every level a link and marks only the last as the current page', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Overview', href: '/' },
          { label: 'build', href: '/build' },
          { label: 'F2 Retrieve', href: '/build/F2' },
          { label: 'GET-1', href: '/rules/GET-1' },
        ]}
      />,
    );
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(['Overview', 'build', 'F2 Retrieve', 'GET-1']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/build', '/build/F2', '/rules/GET-1']);
    expect(links.map((a) => a.getAttribute('aria-current'))).toEqual([null, null, null, 'page']);
  });

  it('shows a last level with no link as plain text that is still the current page', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Overview', href: '/' },
          { label: 'GET-1', mono: true },
        ]}
      />,
    );
    expect(screen.getAllByRole('link').length).toBe(1);
    expect(screen.getByText('GET-1').closest('[aria-current="page"]')).not.toBeNull();
  });

  it('hides the separators from assistive technology', () => {
    const { container } = render(
      <Breadcrumbs
        items={[
          { label: 'Overview', href: '/' },
          { label: 'build', href: '/build' },
        ]}
      />,
    );
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators.length).toBe(1);
    expect(separators[0]?.textContent).toBe('/');
  });

  it('moves between the levels with Tab, in order', async () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Overview', href: '/' },
          { label: 'build', href: '/build' },
          { label: 'GET-1', href: '/rules/GET-1' },
        ]}
      />,
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Overview' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'build' }));
  });

  it('lets the landmark be named for the page it sits on', () => {
    render(<Breadcrumbs label="Path to this rule" items={[{ label: 'Overview', href: '/' }]} />);
    expect(screen.getByRole('navigation', { name: 'Path to this rule' })).toBeTruthy();
  });
});
