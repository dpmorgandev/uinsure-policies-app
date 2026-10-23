import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { DagTable } from '../../../src/Uinsure.Policies.Web/kit/project/dag-table/DagTable';
import type { DagNode } from '../../../src/Uinsure.Policies.Web/kit/project/dag-table/DagTable';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/project/dag-table/dag-table.examples';

afterEach(cleanup);

const nodes: DagNode[] = [
  { id: 'F2', title: 'Retrieve', status: 'done', dependsOn: ['F1b'], rules: ['GET-1'], pr: 17 },
  { id: 'F3', title: 'Placeholder title', status: 'not-built', dependsOn: ['F2'], rules: ['CANCEL-1a'] },
  { id: 'F4', title: 'Placeholder title', status: 'in-progress', dependsOn: [], rules: [] },
  { id: 'F5', title: 'Placeholder title', status: 'pending', dependsOn: ['F3', 'F4'], rules: [], href: '/plans/build/F5' },
];

describe('dag-table examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('table')).toBeTruthy();
  });
});

describe('DagTable', () => {
  it('is a table with a caption and column headers', () => {
    render(<DagTable nodes={nodes} />);
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Node',
      'Depends on',
      'Status',
      'Rules',
    ]);
    expect(table.querySelector('caption')?.textContent).toMatch(/adjacency table/);
    for (const header of within(table).getAllByRole('columnheader')) {
      expect(header.getAttribute('scope')).toBe('col');
    }
  });

  it('makes each node a row header', () => {
    render(<DagTable nodes={nodes} />);
    const rows = screen.getAllByRole('rowheader');
    expect(rows.map((r) => r.getAttribute('scope'))).toEqual(['row', 'row', 'row', 'row']);
    expect(rows[0]?.textContent).toContain('F2');
    expect(rows[0]?.textContent).toContain('Retrieve');
    expect(rows[0]?.textContent).toContain('PR #17');
  });

  it('lists what a node depends on, and says when it is a root', () => {
    render(<DagTable nodes={nodes} />);
    const deps = screen.getByRole('list', { name: 'F5 depends on' });
    expect(within(deps).getAllByRole('listitem').map((i) => i.textContent)).toEqual(['F3', 'F4']);
    expect(screen.getByText('none, a root')).toBeTruthy();
  });

  it('shows each status as a word with a glyph', () => {
    const { container } = render(<DagTable nodes={nodes} />);
    for (const word of ['Done', 'Not built', 'In progress', 'Pending']) {
      expect(screen.getByText(word)).toBeTruthy();
    }
    expect(container.querySelectorAll('[data-status] svg').length).toBeGreaterThanOrEqual(4);
  });

  it('links rules, and marks the rules of a node that is not built', () => {
    render(<DagTable nodes={nodes} />);
    expect(screen.getByRole('link', { name: 'GET-1' }).getAttribute('data-status')).toBe('built');
    expect(screen.getByRole('link', { name: /CANCEL-1a/ }).getAttribute('data-status')).toBe('nb');
  });

  it('sends a caller-set link to each rule chip, and keeps the default when it sets none', () => {
    const { rerender } = render(<DagTable nodes={nodes} />);
    expect(screen.getByRole('link', { name: 'GET-1' }).getAttribute('href')).toBe('/rules/GET-1');
    rerender(<DagTable nodes={nodes} ruleHref={(id) => `#/rules/${id}`} />);
    expect(screen.getByRole('link', { name: 'GET-1' }).getAttribute('href')).toBe('#/rules/GET-1');
    expect(screen.getByRole('link', { name: /CANCEL-1a/ }).getAttribute('href')).toBe('#/rules/CANCEL-1a');
    rerender(<DagTable nodes={nodes} ruleHref={() => undefined} />);
    expect(screen.getByRole('link', { name: 'GET-1' }).getAttribute('href')).toBe('/rules/GET-1');
  });

  it('links the node id only when the node has a page', () => {
    render(<DagTable nodes={nodes} />);
    expect(screen.getByRole('link', { name: 'F5' }).getAttribute('href')).toBe('/plans/build/F5');
    expect(screen.queryByRole('link', { name: 'F2' })).toBeNull();
  });

  it('scrolls inside its own labelled, focusable region', () => {
    render(<DagTable nodes={nodes} />);
    const region = screen.getByRole('region', { name: /scrolls sideways/ });
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('takes a caption', () => {
    render(<DagTable nodes={nodes} caption="Plan build, as a table" />);
    expect(screen.getByRole('table', { name: 'Plan build, as a table' })).toBeTruthy();
  });
});
