import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AttemptLadder } from '../../../src/web/kit/project/attempt-ladder/AttemptLadder';
import { examples } from '../../../src/web/kit/project/attempt-ladder/attempt-ladder.examples';

afterEach(cleanup);

const byState = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example "${state}"`);
  return found.element;
};

const rungs = (list: HTMLElement) =>
  Array.from(list.children).filter((el) => el.getAttribute('data-kind') === 'rung') as HTMLElement[];

describe('attempt-ladder examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual([
      'one attempt',
      'several',
      'same-attempt re-review (A3, A3.2)',
      'escalation (inv-001)',
    ]);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelector('ol')).not.toBeNull();
  });
});

describe('AttemptLadder', () => {
  it('one attempt: one rung with its outcome as a word, and its gate events as steps in order', () => {
    render(byState('one attempt'));
    const list = screen.getByRole('list', { name: 'Attempt 1 of build/F2' });
    expect(list.tagName).toBe('OL');
    const rung = screen.getByRole('listitem', { name: 'Attempt 1' });
    expect(within(rung).getByText('Failed at gate.stub')).toBeTruthy();
    const steps = within(rung).getByRole('list', { name: 'Steps of attempt 1' });
    const items = within(steps).getAllByRole('listitem');
    expect(items.map((li) => li.querySelector('span')?.textContent)).toEqual(['1·1', '1·2']);
    expect(within(steps).getByRole('group', { name: 'gate.red: Failed as expected' })).toBeTruthy();
    expect(within(steps).getByRole('group', { name: 'gate.stub: Gate failed' })).toBeTruthy();
    expect(within(rung).getByText(/Attempt 1 → 2 on gate.stub FAIL at 305789d/)).toBeTruthy();
  });

  it('a failed gate is a rung step, not an alert', () => {
    render(byState('one attempt'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('several: every attempt keeps its own rung, in order, and none is folded into a count', () => {
    render(byState('several'));
    const list = screen.getByRole('list', { name: 'Attempts 1, 2 and 3 of build/F2' });
    const names = rungs(list).map((li) => li.getAttribute('aria-labelledby'));
    expect(names).toHaveLength(3);
    expect(screen.getByRole('listitem', { name: 'Attempt 1' })).toBe(rungs(list)[0]);
    expect(screen.getByRole('listitem', { name: 'Attempt 2' })).toBe(rungs(list)[1]);
    expect(screen.getByRole('listitem', { name: 'Attempt 3' })).toBe(rungs(list)[2]);
    expect(within(rungs(list)[1]!).getByText('Reviewer FAIL at A2')).toBeTruthy();
    expect(within(rungs(list)[2]!).getByText('Reviewer PASS at A3 and A3.2')).toBeTruthy();
  });

  it('aggregated: each attempt says how many steps it holds, and its steps open from a control', () => {
    render(byState('several'));
    expect(screen.getByText('2 steps in this attempt.')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Steps of attempt 2' })).toBeNull();
    const button = screen.getByRole('button', { name: 'Show the steps of attempt 2' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const steps = screen.getByRole('list', { name: 'Steps of attempt 2' });
    expect(within(steps).getByText('Finding round A1, opened by the gate.stub FAIL at 305789d.')).toBeTruthy();
    expect(within(steps).getByText('no SHA')).toBeTruthy();
    expect(within(steps).getByRole('article', { name: /reviewer verdict A2/ })).toBeTruthy();
  });

  it('the chain runs findings, red test, fix commit, gate, verdict, in the order given', () => {
    render(byState('same-attempt re-review (A3, A3.2)'));
    const steps = screen.getByRole('list', { name: 'Steps of attempt 3' });
    const stages = within(steps)
      .getAllByRole('listitem')
      .filter((li) => li.hasAttribute('data-stage'))
      .map((li) => li.getAttribute('data-stage'));
    expect(stages).toEqual([
      'findings',
      'red test',
      'red test',
      'red test',
      'red test',
      'red test',
      'fix commit',
      'fix commit',
      'fix commit',
      'gate',
      'verdict',
      'verdict',
      'red test',
      'verdict',
      'verdict',
    ]);
  });

  it('each red test sits above the fix commit that answers it', () => {
    render(byState('same-attempt re-review (A3, A3.2)'));
    const steps = screen.getByRole('list', { name: 'Steps of attempt 3' });
    const markers = within(steps)
      .getAllByRole('listitem')
      .filter((li) => li.hasAttribute('data-stage'))
      .map((li) => li.querySelector('span')?.textContent);
    expect(markers.indexOf('#26')).toBeLessThan(markers.indexOf('#31'));
    expect(markers.indexOf('#30')).toBeLessThan(markers.indexOf('#31'));
  });

  it('same-attempt re-review: both rounds are named and each verdict keeps its own step', () => {
    render(byState('same-attempt re-review (A3, A3.2)'));
    expect(screen.getByText(/rounds A3, A3.2/)).toBeTruthy();
    expect(screen.getByRole('article', { name: /security verdict A3(?!\.)/ })).toBeTruthy();
    expect(screen.getByRole('article', { name: /reviewer verdict A3(?!\.)/ })).toBeTruthy();
    expect(screen.getByRole('article', { name: /security verdict A3\.2/ })).toBeTruthy();
    expect(screen.getByRole('article', { name: /reviewer verdict A3\.2/ })).toBeTruthy();
    expect(screen.getAllByText('Round A3')).toHaveLength(2);
    expect(screen.getAllByText('Round A3.2')).toHaveLength(2);
  });

  it('a single review round does not claim a re-review', () => {
    render(byState('one attempt'));
    expect(screen.queryByText(/Reviewed more than once/)).toBeNull();
  });

  it('escalation: the investigation is a marked branch between attempt 2 and attempt 3, and it rejoins at attempt 3', () => {
    render(byState('escalation (inv-001)'));
    const list = screen.getByRole('list', { name: 'Attempts 2 and 3 of build/F2, with investigation inv-001' });
    expect(Array.from(list.children).map((li) => li.getAttribute('data-kind'))).toEqual(['rung', 'branch', 'rung']);
    const branch = screen.getByRole('region', { name: 'Investigation inv-001' });
    expect(branch.getAttribute('data-marked')).toBe('true');
    expect(within(branch).getByText('investigation.opened(inv-001)')).toBeTruthy();
    const rejoin = within(branch).getByRole('link', { name: 'attempt 3' });
    const target = document.getElementById((rejoin.getAttribute('href') ?? '').slice(1));
    expect(target).toBe(screen.getByRole('listitem', { name: 'Attempt 3' }));
  });

  it('without an escalation there is no branch', () => {
    render(byState('several'));
    expect(screen.queryByRole('region', { name: /Investigation/ })).toBeNull();
  });

  it('an escalation before an attempt that is not shown draws no branch', () => {
    render(
      <AttemptLadder
        attempts={[{ n: 1, outcome: { status: 'pass', label: 'Passed' }, steps: [] }]}
        escalation={{ id: 'inv-009', beforeAttempt: 4, leaves: 'x', entries: [] }}
      />,
    );
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByRole('list', { name: 'Attempts, oldest first' })).toBeTruthy();
  });

  it('the spine keys work across attempts: Tab enters, J moves to the next attempt', () => {
    render(byState('several'));
    const first = screen.getByRole('listitem', { name: 'Attempt 1' });
    first.focus();
    fireEvent.keyDown(first, { key: 'j' });
    expect(document.activeElement).toBe(screen.getByRole('listitem', { name: 'Attempt 2' }));
  });
});
