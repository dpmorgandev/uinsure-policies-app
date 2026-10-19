import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentPolicies } from '../../../src/web/kit/project/recent-policies/RecentPolicies';
import { examples } from '../../../src/web/kit/project/recent-policies/recent-policies.examples';

afterEach(cleanup);

const exampleFor = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example named ${state}`);
  return found.element;
};

describe('recent-policies examples', () => {
  it('has exactly the catalogued states, in order', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'empty', 'storage unavailable']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('heading', { name: 'Recent policies in this browser' })).toBeTruthy();
  });

  it('every example says plainly that the list is this browser only', () => {
    for (const example of examples) {
      const { unmount } = render(example.element);
      expect(screen.getByText('This browser only.')).toBeTruthy();
      expect(screen.getByText(/request log in this browser.s local storage/)).toBeTruthy();
      unmount();
    }
  });
});

describe('RecentPolicies', () => {
  it('pop: lists each reference as a link, with a word and a glyph for what was done', () => {
    const { container } = render(exampleFor('pop'));
    const list = screen.getByRole('list', { name: 'References, newest first' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => within(item).getByRole('link').textContent)).toEqual([
      'F3-MVEOSVDQJQ',
      'QA-F3-CLAIM',
      'F2-MVEHF2QGG5',
    ]);
    expect(items.map((item) => within(item).getByRole('link').getAttribute('href'))).toEqual([
      '/workbench/policies/F3-MVEOSVDQJQ',
      '/workbench/policies/QA-F3-CLAIM',
      '/workbench/policies/F2-MVEHF2QGG5',
    ]);
    expect(items.map((item) => item.getAttribute('data-how'))).toEqual(['opened', 'opened', 'sold']);
    expect(within(items[2]!).getByText('Sold')).toBeTruthy();
    expect(within(items[0]!).getByText('Opened')).toBeTruthy();
    expect(items[0]?.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('[data-state="pop"]')).not.toBeNull();
  });

  it('pop: the links are reachable in order from the keyboard', async () => {
    render(exampleFor('pop'));
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('F3-MVEOSVDQJQ');
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('QA-F3-CLAIM');
  });

  it('empty: says nothing has been sold or opened, and shows no list', () => {
    const { container } = render(exampleFor('empty'));
    expect(container.querySelector('[data-state="empty"]')).not.toBeNull();
    expect(screen.getByText('No policy has been sold or opened in this browser yet')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(container.querySelector('[data-context="empty"]')).not.toBeNull();
  });

  it('storage unavailable: says so and where to go instead, and shows no list', () => {
    const { container } = render(exampleFor('storage unavailable'));
    expect(container.querySelector('[data-state="unavailable"]')).not.toBeNull();
    expect(screen.getByText("Recent policies can't be shown")).toBeTruthy();
    expect(screen.getByText(/look a policy up by its reference/)).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(container.querySelector('[data-context="not-loaded"] svg')).not.toBeNull();
  });

  it('storage unavailable wins over a list it could not have read', () => {
    const { container } = render(
      <RecentPolicies
        storage="unavailable"
        policies={[{ reference: 'F3-MVEOSVDQJQ', href: '/workbench/policies/F3-MVEOSVDQJQ', how: 'opened' }]}
      />,
    );
    expect(container.querySelector('[data-state="unavailable"]')).not.toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('takes a heading level', () => {
    render(<RecentPolicies policies={[]} headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Recent policies in this browser' })).toBeTruthy();
  });

  it('is a region named by its heading', () => {
    render(exampleFor('empty'));
    expect(screen.getByRole('region', { name: 'Recent policies in this browser' })).toBeTruthy();
  });

  it('starts nothing, so it has no button and no busy state', () => {
    render(exampleFor('storage unavailable'));
    expect(screen.queryAllByRole('button').length).toBe(0);
    expect(document.querySelector('[aria-busy]')).toBeNull();
  });
});
