import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../../src/Uinsure.Policies.Web/kit/primitives/button/Button';
import { RungSpine } from '../../../src/Uinsure.Policies.Web/kit/project/rung-spine/RungSpine';
import type { RungSpineItem } from '../../../src/Uinsure.Policies.Web/kit/project/rung-spine/RungSpine';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/project/rung-spine/rung-spine.examples';

afterEach(cleanup);

const byState = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example "${state}"`);
  return found.element;
};

function markers(list: HTMLElement): string[] {
  return within(list)
    .getAllByRole('listitem')
    .filter((li) => li.getAttribute('data-kind') === 'rung')
    .map((li) => (li.querySelector('[data-marker]')?.textContent ?? '').replace(/^Rung /, ''));
}

describe('rung-spine examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual([
      'one rung',
      'many',
      'a branch that rejoins',
      'a marked branch (investigation)',
      'a carried value (the quoted date)',
      'a rung in progress (BUSY-1)',
    ]);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelector('ol')).not.toBeNull();
  });
});

describe('RungSpine', () => {
  it('is a real ordered list with an accessible name', () => {
    render(byState('many'));
    const list = screen.getByRole('list', { name: 'Commits, then QA step, sign-off and PR' });
    expect(list.tagName).toBe('OL');
  });

  it('one rung: a single rung with its ordinal, label, agent and receipt', () => {
    render(byState('one rung'));
    const list = screen.getByRole('list', { name: 'Commits, one rung' });
    expect(markers(list)).toEqual(['#5']);
    expect(within(list).getByText('Write the failing test')).toBeTruthy();
    expect(within(list).getByText('tester')).toBeTruthy();
    expect(within(list).getByRole('link', { name: 'Commit 94a7473 on GitHub' })).toBeTruthy();
    expect(within(list).getByText('Red')).toBeTruthy();
  });

  it('many: rungs keep the order they were given, and gaps are said in words', () => {
    render(byState('many'));
    const list = screen.getByRole('list', { name: 'Commits, then QA step, sign-off and PR' });
    expect(markers(list)).toEqual(['#5', '#7', '#17', '#19', 'QA', 'OK', 'PR']);
    expect(within(list).getByText('Rows 1 to 4 are not in this view')).toBeTruthy();
    expect(within(list).getByText('Red at #5 sits above green at #17.')).toBeTruthy();
  });

  it('names each rung by its label', () => {
    render(byState('many'));
    const rung = screen.getByRole('listitem', { name: 'Make it pass' });
    expect(rung.getAttribute('data-rung')).toBe('true');
  });

  it('a branch that rejoins: it is a labelled region with its own ordered list, and the rejoin link reaches the rung', () => {
    render(byState('a branch that rejoins'));
    const branch = screen.getByRole('region', { name: 'Retry branch: attempts 1, 2, 3' });
    expect(branch.hasAttribute('data-marked')).toBe(false);
    const steps = within(branch).getByRole('list', { name: 'Retry branch: attempts 1, 2, 3' });
    expect(steps.tagName).toBe('OL');
    expect(within(steps).getByText('1·2')).toBeTruthy();
    expect(within(steps).getByText('Gate failed')).toBeTruthy();
    expect(within(branch).getByText(/Steps off the spine at the first red gate/)).toBeTruthy();

    const rejoin = within(branch).getByRole('link', { name: '#26' });
    const target = document.getElementById((rejoin.getAttribute('href') ?? '').slice(1));
    expect(target).not.toBeNull();
    expect(target?.getAttribute('data-rung')).toBe('true');
    expect(within(target as HTMLElement).getByText('Fail first: A2/I1')).toBeTruthy();
  });

  it('a branch keeps every attempt on its own step and shows a missing commit as a dashed step', () => {
    render(byState('a branch that rejoins'));
    const branch = screen.getByRole('region', { name: 'Retry branch: attempts 1, 2, 3' });
    expect(within(branch).getByText('no SHA')).toBeTruthy();
    expect(within(branch).getByText(/is not in the excerpt, so no rung is drawn for it/)).toBeTruthy();
    expect(within(branch).getByText(/Attempt 1 → 2 on gate.stub FAIL/)).toBeTruthy();
    expect(within(branch).getByText(/Attempt 2 → 3 on reviewer FAIL/)).toBeTruthy();
  });

  it('a rejoin with no matching rung is text, not a dead link', () => {
    const items: RungSpineItem[] = [
      {
        kind: 'branch',
        id: 'b',
        title: 'A branch',
        leaves: 'Leaves here.',
        entries: [{ marker: '1·1', title: 'gate.red' }],
        rejoin: { toId: 'nowhere', text: '#99' },
      },
    ];
    render(<RungSpine label="Orphan" items={items} />);
    expect(screen.queryByRole('link', { name: '#99' })).toBeNull();
    expect(screen.getByText('#99')).toBeTruthy();
  });

  it('a marked branch: the investigation is flagged in words and in the markup', () => {
    render(byState('a marked branch (investigation)'));
    const branch = screen.getByRole('region', { name: 'Investigation inv-001' });
    expect(branch.getAttribute('data-marked')).toBe('true');
    expect(within(branch).getByText(/Marked branch: investigation/)).toBeTruthy();
    expect(within(branch).getByText('investigation.opened(inv-001)')).toBeTruthy();
    expect(within(branch).getByRole('link', { name: '#26' })).toBeTruthy();
  });

  it('a carried value: the date is shown as a value under its label, not as an input', () => {
    render(byState('a carried value (the quoted date)'));
    const term = screen.getByText('Cancellation date');
    expect(term.tagName).toBe('DT');
    const value = screen.getAllByText('2027-01-27').find((el) => el.tagName === 'DD');
    expect(value).toBeDefined();
    expect(value?.closest('dl')).toBe(term.closest('dl'));
    expect(screen.getByText('carried from rung 1. To change it, quote again.')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('uses headings for the rung labels when asked', () => {
    render(byState('a carried value (the quoted date)'));
    expect(screen.getByRole('heading', { level: 3, name: 'Quote the date' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Cancel on that date' })).toBeTruthy();
  });

  it('a rung in progress (BUSY-1): the rung says what is happening and the control is disabled, busy and labelled', () => {
    render(byState('a rung in progress (BUSY-1)'));
    const rung = screen.getByRole('listitem', { name: 'Cancel on that date' });
    expect(rung.getAttribute('aria-busy')).toBe('true');
    expect(rung.getAttribute('data-state')).toBe('busy');
    expect(within(rung).getByRole('status').textContent).toBe('Sending the cancel for 2027-01-27');
    const button = within(rung).getByRole('button', { name: 'Cancelling…' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('a rung in progress: the control cannot be fired twice', async () => {
    const fired = vi.fn();
    const items: RungSpineItem[] = [
      {
        id: 'cancel',
        marker: '2',
        label: 'Cancel on that date',
        busy: true,
        busyLabel: 'Sending the cancel',
        receipt: (
          <Button busy busyLabel="Cancelling…" onClick={fired}>
            Cancel
          </Button>
        ),
      },
    ];
    render(<RungSpine label="Busy" items={items} />);
    const button = screen.getByRole('button', { name: 'Cancelling…' });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(fired).not.toHaveBeenCalled();
  });

  it('a rung that is not busy has no status line and no aria-busy', () => {
    render(byState('one rung'));
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('listitem', { name: 'Write the failing test' }).hasAttribute('aria-busy')).toBe(false);
  });

  it('a stopped key rung is marked as stopped and keeps its ordinal and emphasis', () => {
    const items: RungSpineItem[] = [
      { id: 'red', marker: '#17', label: 'Make it pass', tone: 'red', state: 'stopped', emphasis: true },
    ];
    render(<RungSpine label="Stopped" items={items} />);
    const rung = screen.getByRole('listitem', { name: 'Make it pass' });
    expect(rung.getAttribute('data-state')).toBe('stopped');
    expect(rung.querySelector('[data-marker]')?.textContent).toBe('Rung #17');
  });

  it('waiting rungs say so in words, not only in style', () => {
    render(byState('a rung in progress (BUSY-1)'));
    const rung = screen.getByRole('listitem', { name: 'Check they agree' });
    expect(rung.getAttribute('data-state')).toBe('waiting');
    expect(within(rung).getByText('Waiting for rung 2')).toBeTruthy();
  });

  describe('keyboard', () => {
    it('shows the keys it answers to', () => {
      render(byState('many'));
      const keys = screen.getByRole('group', { name: 'Keyboard' });
      expect(within(keys).getByText('J')).toBeTruthy();
      expect(within(keys).getByText('K')).toBeTruthy();
    });

    it('Tab enters the spine at the first rung', async () => {
      render(byState('many'));
      await userEvent.tab();
      expect(document.activeElement).toBe(screen.getByRole('listitem', { name: 'Write the failing test' }));
    });

    it('J moves to the next rung and K to the previous, skipping gaps and branches', async () => {
      render(byState('a branch that rejoins'));
      await userEvent.tab();
      const first = screen.getByRole('listitem', { name: 'Write the failing test' });
      const second = screen.getByRole('listitem', { name: 'Fail first: A2/I1' });
      expect(document.activeElement).toBe(first);
      await userEvent.keyboard('j');
      expect(document.activeElement).toBe(second);
      await userEvent.keyboard('k');
      expect(document.activeElement).toBe(first);
    });

    it('J on the last rung stays where it is, and K on the first does too', async () => {
      render(byState('many'));
      await userEvent.tab();
      const first = document.activeElement;
      await userEvent.keyboard('k');
      expect(document.activeElement).toBe(first);
      for (let i = 0; i < 12; i += 1) await userEvent.keyboard('j');
      expect(document.activeElement).toBe(screen.getByRole('listitem', { name: 'Merge the PR' }));
    });

    it('only one rung is a tab stop at a time', async () => {
      render(byState('many'));
      await userEvent.tab();
      await userEvent.keyboard('j');
      const stops = screen.getAllByRole('listitem').filter((li) => li.getAttribute('data-rung') === 'true' && li.tabIndex === 0);
      expect(stops).toHaveLength(1);
      expect(stops[0]).toBe(document.activeElement);
    });

    it('does not steal J or K while someone types in a field inside a rung', async () => {
      const items: RungSpineItem[] = [
        { id: 'one', marker: '1', label: 'Quote the date', receipt: <input aria-label="Cancellation date" /> },
        { id: 'two', marker: '2', label: 'Cancel on that date' },
      ];
      render(<RungSpine label="Typing" items={items} />);
      const input = screen.getByRole('textbox', { name: 'Cancellation date' });
      await userEvent.click(input);
      await userEvent.keyboard('jk');
      expect(document.activeElement).toBe(input);
      expect((input as HTMLInputElement).value).toBe('jk');
    });

    it('can be switched off: no legend, no tab stop on the rungs', () => {
      render(<RungSpine label="Plain" keyboard={false} items={[{ id: 'a', marker: '1', label: 'Only rung' }]} />);
      expect(screen.queryByRole('group', { name: 'Keyboard' })).toBeNull();
      expect(screen.getByRole('listitem', { name: 'Only rung' }).hasAttribute('tabindex')).toBe(false);
    });
  });
});
