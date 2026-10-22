import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DagGraph } from '../../../src/web/kit/project/dag-graph/DagGraph';
import type { DagNode } from '../../../src/web/kit/project/dag-table';
import { examples } from '../../../src/web/kit/project/dag-graph/dag-graph.examples';

afterEach(cleanup);

const fork: DagNode[] = [
  { id: 'A', title: 'Placeholder root', status: 'done', dependsOn: [], rules: [] },
  { id: 'B', title: 'Placeholder left', status: 'done', dependsOn: ['A'], rules: ['GET-1'] },
  { id: 'C', title: 'Placeholder right', status: 'not-built', dependsOn: ['A'], rules: ['CANCEL-1a'] },
  { id: 'D', title: 'Placeholder join', status: 'pending', dependsOn: ['B', 'C'], rules: [] },
];

describe('dag-graph examples', () => {
  it('has exactly the catalogued states, in order', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'live', 'nb nodes']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelector('figure')).not.toBeNull();
  });

  it('marks the live example as live, and the others not', () => {
    const states = examples.map((example) => {
      const { container, unmount } = render(example.element);
      const state = container.querySelector('figure')?.getAttribute('data-state');
      unmount();
      return state;
    });
    expect(states).toEqual(['pop', 'live', 'nb']);
  });
});

describe('DagGraph', () => {
  it('is a figure named by its caption', () => {
    render(<DagGraph nodes={fork} caption="Plan build as a graph" />);
    expect(screen.getByRole('figure', { name: 'Plan build as a graph' })).toBeTruthy();
  });

  it('carries the dag-table as its text equivalent, open by default', () => {
    render(<DagGraph nodes={fork} />);
    const figure = screen.getByRole('figure');
    const table = within(figure).getByRole('table');
    expect(within(table).getAllByRole('rowheader').length).toBe(4);
    const toggle = within(figure).getByRole('button', { name: /Text equivalent/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('sends a caller-set link to the rule chips in its text equivalent, and keeps the default when it sets none', () => {
    const { rerender } = render(<DagGraph nodes={fork} />);
    const table = () => within(screen.getByRole('figure')).getByRole('table');
    expect(within(table()).getByRole('link', { name: 'GET-1' }).getAttribute('href')).toBe('/rules/GET-1');
    rerender(<DagGraph nodes={fork} ruleHref={(id) => `#/rules/${id}`} />);
    expect(within(table()).getByRole('link', { name: 'GET-1' }).getAttribute('href')).toBe('#/rules/GET-1');
    expect(within(table()).getByRole('link', { name: /CANCEL-1a/ }).getAttribute('href')).toBe('#/rules/CANCEL-1a');
    rerender(<DagGraph nodes={fork} ruleHref={() => undefined} />);
    expect(within(table()).getByRole('link', { name: 'GET-1' }).getAttribute('href')).toBe('/rules/GET-1');
  });

  it('can start with the table closed, and opens it from the keyboard', async () => {
    render(<DagGraph nodes={fork} tableOpen={false} />);
    const toggle = screen.getByRole('button', { name: /Text equivalent/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('lists every node once, in layers from the top', () => {
    render(<DagGraph nodes={fork} />);
    const list = screen.getByRole('list', { name: /Plan nodes/ });
    const items = within(list).getAllByRole('listitem');
    expect(items.length).toBe(4);
    expect(items.map((item) => item.getAttribute('data-layer'))).toEqual(['1', '2', '2', '3']);
  });

  it('puts a node below every node it waits for, and draws one line per dependency', () => {
    const { container } = render(<DagGraph nodes={fork} />);
    expect(container.querySelectorAll('svg line').length).toBe(4);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('puts two nodes of one layer in different columns', () => {
    render(<DagGraph nodes={fork} />);
    const list = screen.getByRole('list', { name: /Plan nodes/ });
    const [, left, right] = within(list).getAllByRole('listitem');
    expect(left?.getAttribute('data-column')).toBe('1');
    expect(right?.getAttribute('data-column')).toBe('2');
  });

  it('shows each status as a word with a glyph, not colour alone', () => {
    render(<DagGraph nodes={fork} />);
    const list = screen.getByRole('list', { name: /Plan nodes/ });
    for (const word of ['Done', 'Not built', 'Pending']) {
      expect(within(list).getAllByText(word).length).toBeGreaterThan(0);
    }
    for (const item of within(list).getAllByRole('listitem')) {
      expect(item.querySelector('[data-status] svg')).not.toBeNull();
    }
  });

  it('marks the focal node with aria-current and the word focal', () => {
    render(<DagGraph nodes={fork} focalId="B" />);
    const list = screen.getByRole('list', { name: /Plan nodes/ });
    const current = list.querySelectorAll('[aria-current="step"]');
    expect(current.length).toBe(1);
    expect(current[0]?.textContent).toContain('B');
    expect(within(current[0] as HTMLElement).getByText('focal')).toBeTruthy();
  });

  it('says Live in a status region, with its note, only when live', () => {
    const { rerender } = render(<DagGraph nodes={fork} />);
    expect(screen.queryByRole('status')).toBeNull();
    rerender(<DagGraph nodes={fork} live liveNote="D in progress" />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Live');
    expect(status.textContent).toContain('D in progress');
  });

  it('scrolls inside its own labelled, focusable region', () => {
    render(<DagGraph nodes={fork} />);
    const region = screen.getByRole('region', { name: 'Plan graph, scrolls sideways' });
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('does not loop on a dependency cycle', () => {
    const cycle: DagNode[] = [
      { id: 'X', title: 'Placeholder', status: 'pending', dependsOn: ['Y'], rules: [] },
      { id: 'Y', title: 'Placeholder', status: 'pending', dependsOn: ['X'], rules: [] },
    ];
    render(<DagGraph nodes={cycle} />);
    expect(screen.getByRole('list', { name: /Plan nodes/ })).toBeTruthy();
  });

  it('ignores a dependency on a node that is not in the plan', () => {
    const lone: DagNode[] = [{ id: 'Z', title: 'Placeholder', status: 'pending', dependsOn: ['missing'], rules: [] }];
    const { container } = render(<DagGraph nodes={lone} />);
    expect(container.querySelectorAll('svg line').length).toBe(0);
  });
});
