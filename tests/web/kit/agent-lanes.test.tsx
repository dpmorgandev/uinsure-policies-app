import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AgentLanes } from '../../../src/web/kit/project/agent-lanes/AgentLanes';
import { examples } from '../../../src/web/kit/project/agent-lanes/agent-lanes.examples';

afterEach(cleanup);

const byState = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example "${state}"`);
  return found.element;
};

describe('agent-lanes examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'one agent', 'empty', 'git-only']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('region', { name: 'Agent lanes' })).toBeTruthy();
  });
});

describe('AgentLanes', () => {
  it('pop: one lane per agent, each an ordered list of its rungs in the order given', () => {
    render(byState('pop'));
    const tester = screen.getByRole('list', { name: 'tester rungs' });
    const builder = screen.getByRole('list', { name: 'builder rungs' });
    expect(tester.tagName).toBe('OL');
    expect(within(tester).getAllByRole('listitem').map((li) => li.textContent)).toEqual(
      ['#5', '#12', '#14', '#26', '#27', '#28', '#29', '#30', '#34'].map((n) => `${n}red`),
    );
    expect(within(builder).getAllByRole('listitem').map((li) => li.getAttribute('data-step'))).toEqual([
      'stub',
      'stub',
      'green',
      'refactor',
      'refactor',
      'green',
      'green',
      'green',
    ]);
  });

  it('puts each tick at its rung order, so the two lanes interleave on one axis', () => {
    render(byState('pop'));
    const column = (list: HTMLElement, text: string) =>
      within(list)
        .getAllByRole('listitem')
        .find((li) => li.textContent?.startsWith(text))?.getAttribute('data-column');
    const tester = screen.getByRole('list', { name: 'tester rungs' });
    const builder = screen.getByRole('list', { name: 'builder rungs' });
    expect(column(tester, '#5')).toBe('2');
    expect(column(builder, '#7')).toBe('3');
    expect(column(builder, '#9')).toBe('4');
    expect(column(tester, '#12')).toBe('5');
    expect(Number(column(tester, '#34'))).toBeGreaterThan(Number(column(builder, '#33')));
  });

  it('says that position is rung order and not clock time', () => {
    render(byState('pop'));
    expect(screen.getByText(/Position is rung order, not clock time/)).toBeTruthy();
  });

  it('each tick carries its TDD step as a word and a glyph, not only a colour', () => {
    render(byState('pop'));
    const first = within(screen.getByRole('list', { name: 'tester rungs' })).getAllByRole('listitem')[0]!;
    expect(first.textContent).toContain('red');
    expect(first.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(first.getAttribute('title')).toBe(
      'retrieve answers the full policy response, derived status, the current term and 2 dp money',
    );
  });

  it('the text equivalent is a table with a caption, column headers and a row header per rung, sorted by rung', () => {
    render(byState('pop'));
    const table = screen.getByRole('table', { name: /Activity by agent/ });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Rung',
      'Agent',
      'TDD',
      'SHA',
      'What it did',
    ]);
    const heads = within(table).getAllByRole('rowheader').map((h) => h.textContent);
    expect(heads[0]).toBe('#2');
    expect(heads[1]).toBe('#5');
    expect(heads[2]).toBe('#7');
    expect(heads).toHaveLength(18);
    expect([...heads].map((h) => Number((h ?? '').slice(1)))).toEqual(
      [...heads].map((h) => Number((h ?? '').slice(1))).sort((a, b) => a - b),
    );
  });

  it('the TDD column holds each step as one whole word in its own cell, so it can be kept from breaking', () => {
    render(byState('pop'));
    const table = screen.getByRole('table', { name: /Activity by agent/ });
    expect(within(table).getAllByRole('cell', { name: 'refactor' })).toHaveLength(2);
    expect(within(table).getAllByRole('cell', { name: 'red' })).toHaveLength(9);
  });

  it('pop: a commit with no TDD trailer is a neutral tick beside lanes whose commits carry one', () => {
    render(byState('pop'));
    const main = within(screen.getByRole('list', { name: 'main rungs' })).getByRole('listitem');
    expect(main.getAttribute('data-step')).toBe('none');
    expect(main.textContent).toContain('no TDD trailer');
    expect(main.getAttribute('title')).toBe('f1b-done-merged');
    expect(main.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    const table = screen.getByRole('table', { name: /Activity by agent/ });
    expect(within(table).getAllByRole('cell', { name: 'none' })).toHaveLength(1);
    expect(within(table).getByText('d2a46f5')).toBeTruthy();
  });

  it('says the lanes scroll inside their frame, and puts the frame and the table frame on the keyboard path', () => {
    render(byState('pop'));
    expect(screen.getByText(/scroll sideways inside their frame/)).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Activity by agent, table' }).getAttribute('tabindex')).toBe('0');
  });

  it('the table is behind a disclosure that starts closed unless asked', () => {
    const closed = render(<AgentLanes lanes={[{ agent: 'tester', events: [{ n: 5, tdd: 'red', sha: '94a7473', label: 'x' }] }]} />);
    const button = closed.getByRole('button', { name: 'Text equivalent: the lanes as a table' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(closed.queryByRole('table')).toBeNull();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(closed.getByRole('table')).toBeTruthy();
  });

  it('"pop" shows the table open', () => {
    render(byState('pop'));
    expect(screen.getByRole('button', { name: 'Text equivalent: the lanes as a table' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('one agent: a single lane', () => {
    render(byState('one agent'));
    expect(screen.getByRole('region', { name: 'Agent lanes' }).getAttribute('data-state')).toBe('one agent');
    expect(screen.getByRole('list', { name: 'tester rungs' })).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'builder rungs' })).toBeNull();
  });

  it('empty: says so, with no lanes and no table', () => {
    render(byState('empty'));
    expect(screen.getByRole('region', { name: 'Agent lanes' }).getAttribute('data-state')).toBe('empty');
    expect(screen.getByText(/No agent activity is recorded for this node/)).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('a lane with no events is treated as no activity', () => {
    render(<AgentLanes lanes={[{ agent: 'builder', events: [] }]} />);
    expect(screen.getByText(/No agent activity is recorded for this node/)).toBeTruthy();
  });

  it('git-only: explained as by design, not as an error or an empty trail', () => {
    render(byState('git-only'));
    const region = screen.getByRole('region', { name: 'Agent lanes' });
    expect(region.getAttribute('data-state')).toBe('git-only');
    expect(within(region).getByText(/This node is git-only \(F0a\)/)).toBeTruthy();
    expect(within(region).queryByRole('table')).toBeNull();
  });

  it('a commit with no TDD trailer is a dashed tick that says so', () => {
    render(<AgentLanes lanes={[{ agent: 'main', events: [{ n: 3, tdd: null, label: 'docs only' }] }]} tableOpen />);
    const tick = within(screen.getByRole('list', { name: 'main rungs' })).getByRole('listitem');
    expect(tick.getAttribute('data-step')).toBe('none');
    expect(tick.textContent).toContain('no TDD trailer');
    expect(screen.getByText('no SHA')).toBeTruthy();
  });

  it('the scroll regions can be reached by keyboard', () => {
    render(byState('pop'));
    const region = screen.getByRole('region', { name: 'Agent lanes, by rung' });
    expect(region.getAttribute('tabindex')).toBe('0');
  });
});
