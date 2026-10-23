import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { RuleEvidence } from '../../../src/Uinsure.Policies.Web/kit/project/rule-evidence/RuleEvidence';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/project/rule-evidence/rule-evidence.examples';

afterEach(cleanup);

const byState = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example "${state}"`);
  return found.element;
};

function spine() {
  return screen.getByRole('list', { name: 'Evidence for GET-1, in order' });
}

function markers(list: HTMLElement): string[] {
  return Array.from(list.children)
    .filter((li) => li.getAttribute('data-kind') === 'rung')
    .map((li) => (li.querySelector('[data-marker]')?.textContent ?? '').replace(/^Rung /, ''));
}

function kinds(list: HTMLElement): string[] {
  return Array.from(list.children).map((li) => li.getAttribute('data-kind') ?? '');
}

describe('rule-evidence examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual([
      'pop',
      'nb',
      'partial (no refactor)',
      'order violated (flagged)',
      'pinned tests',
    ]);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('region', { name: /^Evidence for / })).toBeTruthy();
  });
});

describe('RuleEvidence', () => {
  it('pop: the rule, then red, stub, green, refactor, QA step, sign-off and PR, down one ordered list', () => {
    render(byState('pop'));
    const list = spine();
    expect(list.tagName).toBe('OL');
    expect(markers(list)).toEqual([
      'REQ',
      '#5',
      '#7',
      '#9',
      '#12',
      '#14',
      '#17',
      '#19',
      '#20',
      '#26',
      '#27',
      '#28',
      '#29',
      '#30',
      '#31',
      '#32',
      '#33',
      '#34',
      'QA',
      'OK',
      'PR',
    ]);
  });

  it('red before green is read from position, and said in words', () => {
    render(byState('pop'));
    const m = markers(spine());
    expect(m.indexOf('#5')).toBeLessThan(m.indexOf('#17'));
    const order = document.querySelector('[data-order]');
    expect(order?.getAttribute('data-order')).toBe('held');
    expect(order?.textContent).toBe('Red at #5 sits above green at #17.');
  });

  it('lists red, green and refactor at a glance with their SHAs, each with a word', () => {
    render(byState('pop'));
    const glance = screen.getByRole('list', { name: 'The order in one glance: red, then green, then refactor' });
    const items = within(glance).getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-tdd'))).toEqual(['red', 'green', 'refactor']);
    expect(within(items[0]!).getByText('#5')).toBeTruthy();
    expect(within(items[0]!).getByRole('link', { name: 'Commit 94a7473 on GitHub' })).toBeTruthy();
    expect(within(items[0]!).getByText('Red')).toBeTruthy();
    expect(within(items[1]!).getByText('Green')).toBeTruthy();
    expect(within(items[2]!).getByText('Refactor')).toBeTruthy();
  });

  it('each commit rung carries its label, agent, SHA link, TDD word and layer', () => {
    render(byState('pop'));
    const rung = screen.getByRole('listitem', { name: 'Make it pass' });
    expect(within(rung).getByText('builder')).toBeTruthy();
    expect(within(rung).getByRole('link', { name: 'Commit 92ede9e on GitHub' })).toBeTruthy();
    expect(within(rung).getByText('Green')).toBeTruthy();
    expect(within(rung).getByText('api')).toBeTruthy();
    expect(within(rung).getByText('api real status, current term, 2dp money, unknown query filter')).toBeTruthy();
  });

  it('rows the view does not hold are gaps in words, not failures', () => {
    render(byState('pop'));
    const gaps = Array.from(spine().children).filter((li) => li.getAttribute('data-kind') === 'gap');
    expect(gaps.map((li) => li.textContent)).toContain('Rows 1 to 4 are not in this view');
    expect(gaps.map((li) => li.textContent)).toContain('Row 6 is not in this view');
    expect(screen.queryByText('Out of order')).toBeNull();
  });

  it('the retry branch sits after #20 and before #26, and rejoins at #26', () => {
    render(byState('pop'));
    expect(kinds(spine()).filter((k) => k === 'branch')).toHaveLength(1);
    const branch = screen.getByRole('region', { name: 'Retry branch: attempts 1, 2, 3' });
    const r20 = screen.getByRole('listitem', { name: 'Tidy again' });
    const r26 = screen.getByRole('listitem', { name: 'Fail first: A2/I1' });
    expect(r20.compareDocumentPosition(branch) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(branch.compareDocumentPosition(r26) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    const rejoin = within(branch).getByRole('link', { name: '#26' });
    expect(document.getElementById((rejoin.getAttribute('href') ?? '').slice(1))).toBe(r26);
  });

  it('the QA step, sign-off and PR each have a rung with a status word', () => {
    render(byState('pop'));
    const qa = screen.getByRole('listitem', { name: 'Run the QA step' });
    expect(within(qa).getByRole('link', { name: 'docs/qa/build-F2.md#1' })).toBeTruthy();
    expect(within(qa).getByText('Pass')).toBeTruthy();
    const signoff = screen.getByRole('listitem', { name: 'Sign off' });
    expect(within(signoff).getByText('Accepted')).toBeTruthy();
    expect(within(signoff).getByText('2026-10-19')).toBeTruthy();
    const pr = screen.getByRole('listitem', { name: 'Merge the PR' });
    expect(within(pr).getByRole('link', { name: 'PR #17' }).getAttribute('href')).toContain('/pull/17');
    expect(within(pr).getByText('Merged')).toBeTruthy();
  });

  it('the text equivalent is a table of the commit rungs behind a disclosure', () => {
    render(byState('pop'));
    const button = screen.getByRole('button', { name: 'Text equivalent: the commit rungs as a table' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('table')).toBeNull();
    fireEvent.click(button);
    const table = screen.getByRole('table', { name: /Commits for GET-1, sorted by rung number, ascending/ });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Rung',
      'SHA',
      'TDD',
      'Agent',
      'Layer',
      'What it did',
    ]);
    const heads = within(table).getAllByRole('rowheader').map((h) => h.textContent);
    expect(heads).toHaveLength(17);
    expect(heads[0]).toBe('#5');
    expect(heads[16]).toBe('#34');
  });

  it('nb: says "not built yet", names the rule, offers the way back, and draws no spine', () => {
    render(byState('nb'));
    const region = screen.getByRole('region', { name: 'Evidence for ‹ruleId›' });
    expect(region.getAttribute('data-state')).toBe('not-built');
    expect(within(region).getByText('not built yet')).toBeTruthy();
    expect(within(region).getByRole('link', { name: 'Back to the requirements matrix' })).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByText('Out of order')).toBeNull();
  });

  it('partial (no refactor): the missing refactor is a gap in words, and red, green and the rest stay', () => {
    render(byState('partial (no refactor)'));
    const list = spine();
    expect(markers(list)).toEqual(['REQ', '#5', '#7', '#17', 'QA', 'OK', 'PR']);
    const gap = Array.from(list.children).find((li) => li.textContent === 'No refactor commit is recorded for GET-1');
    expect(gap?.getAttribute('data-kind')).toBe('gap');
    expect(screen.queryByText('Refactor')).toBeNull();
    expect(screen.queryByText('Out of order')).toBeNull();
  });

  it('every missing step is its own gap when the trail holds nothing', () => {
    render(<RuleEvidence ruleId="GET-1" commits={[]} />);
    const texts = Array.from(spine().children).map((li) => li.textContent);
    expect(texts).toEqual([
      'No red commit is recorded for GET-1',
      'No green commit is recorded for GET-1',
      'No refactor commit is recorded for GET-1',
      'No QA step is recorded for GET-1',
      'No sign-off is recorded for GET-1',
      'No PR is recorded for GET-1',
    ]);
    expect(screen.queryByRole('button', { name: /Text equivalent/ })).toBeNull();
  });

  it('order violated (flagged): says so in words, flags both rungs, and keeps the order the rows hold', () => {
    render(byState('order violated (flagged)'));
    const region = screen.getByRole('region', { name: 'Evidence for GET-1' });
    expect(region.getAttribute('data-state')).toBe('order-violated');
    const order = document.querySelector('[data-order]');
    expect(order?.getAttribute('data-order')).toBe('violated');
    expect(order?.textContent).toBe('Order violated: green at #5 sits above red at #17. The test did not come first.');
    expect(markers(spine())).toEqual(['REQ', '#5', '#17', '#19', 'QA', 'OK', 'PR']);
    const green = screen.getByRole('listitem', { name: 'Make it pass' });
    const red = screen.getByRole('listitem', { name: 'Write the failing test' });
    expect(green.getAttribute('data-state')).toBe('stopped');
    expect(red.getAttribute('data-state')).toBe('stopped');
    expect(within(green).getByText('Out of order')).toBeTruthy();
    expect(within(red).getByText('Out of order')).toBeTruthy();
    expect(screen.getByRole('listitem', { name: 'Tidy, stay green' }).getAttribute('data-state')).toBe('done');
  });

  it('pinned tests: a labelled note says they were delivered earlier and pinned, not red', () => {
    render(byState('pinned tests'));
    const note = screen.getByRole('complementary', { name: 'Pinned tests' });
    expect(note.textContent).toContain('The 4 RetrieveNotFoundTests 404 rows pass at the red gate.');
    expect(note.textContent).toContain('pinned, not red');
  });

  it('shows no pinned note when there are none', () => {
    render(byState('pop'));
    expect(screen.queryByRole('complementary', { name: 'Pinned tests' })).toBeNull();
  });

  it('the spine inside it answers J and K', () => {
    render(byState('pop'));
    const first = screen.getByRole('listitem', { name: 'Read the rule' });
    first.focus();
    fireEvent.keyDown(first, { key: 'j' });
    expect(document.activeElement).toBe(screen.getByRole('listitem', { name: 'Write the failing test' }));
  });
});
