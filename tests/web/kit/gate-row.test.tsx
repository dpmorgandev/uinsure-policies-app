import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { GateRow } from '../../../src/web/kit/project/gate-row/GateRow';
import { examples } from '../../../src/web/kit/project/gate-row/gate-row.examples';

afterEach(cleanup);

const byState = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example "${state}"`);
  return found.element;
};

describe('gate-row examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['ok', 'not ok', 'expected-fail', 'waived', 'state event']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('group')).toBeTruthy();
  });
});

describe('GateRow', () => {
  it('ok: a group named by marker, gate and result, with the exit and ok shown', () => {
    render(byState('ok'));
    const row = screen.getByRole('group', { name: '2·3 gate.green: Gate held' });
    expect(row.getAttribute('data-result')).toBe('held');
    expect(within(row).getByText('Gate held')).toBeTruthy();
    expect(within(row).getByText('Exit').nextElementSibling?.textContent).toBe('0');
    expect(within(row).getByText('ok').nextElementSibling?.textContent).toBe('true');
    expect(within(row).getByText('Services GET-1 6/6 pass.')).toBeTruthy();
    expect(within(row).getByRole('link', { name: 'Commit 311ccb6 on GitHub' })).toBeTruthy();
  });

  it('not ok: ok false is shown as a result, with the expected text beside the exit code, and not as an alert', () => {
    render(byState('not ok'));
    const row = screen.getByRole('group', { name: '1·2 gate.stub: Gate failed' });
    expect(row.getAttribute('data-result')).toBe('failed');
    expect(within(row).getByText('Expected').nextElementSibling?.textContent).toBe('every GET-1 test fails');
    expect(within(row).getByText('Exit').nextElementSibling?.textContent).toBe('2');
    expect(within(row).getByText('ok').nextElementSibling?.textContent).toBe('false');
    expect(within(row).getByText(/a result the loop acts on, not an error in this page/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('expected-fail: a failing run the gate wanted reads as held, in words', () => {
    render(byState('expected-fail'));
    const row = screen.getByRole('group', { name: '1·1 gate.red: Failed as expected' });
    expect(row.getAttribute('data-result')).toBe('expected-fail');
    expect(within(row).getByText('Exit').nextElementSibling?.textContent).toBe('2');
    expect(within(row).getByText('ok').nextElementSibling?.textContent).toBe('true');
    expect(within(row).queryByText(/not an error in this page/)).toBeNull();
  });

  it('waived: says so, and shows no exit, ok or head it was not given', () => {
    render(byState('waived'));
    const row = screen.getByRole('group', { name: 'gate.scaffold.waived: Waived' });
    expect(row.getAttribute('data-result')).toBe('waived');
    expect(within(row).queryByText('Exit')).toBeNull();
    expect(within(row).queryByText('ok')).toBeNull();
    expect(within(row).queryByText('Head')).toBeNull();
  });

  it('state event: a state change, not a gate result', () => {
    render(byState('state event'));
    const row = screen.getByRole('group', { name: 'state(investigating): State change' });
    expect(row.getAttribute('data-kind')).toBe('state');
    expect(row.hasAttribute('data-result')).toBe(false);
    expect(within(row).getByText('State change')).toBeTruthy();
    expect(within(row).queryByText('Gate held')).toBeNull();
  });

  it('shows the command in monospace when the event holds one, and omits the field when it does not', () => {
    const { rerender } = render(<GateRow gate="gate.test" command="dotnet test --solution Uinsure.Policies.slnx" exit={0} ok />);
    expect(screen.getByText('Command').nextElementSibling?.textContent).toBe('dotnet test --solution Uinsure.Policies.slnx');
    rerender(<GateRow gate="gate.test" command={null} exit={0} ok />);
    expect(screen.queryByText('Command')).toBeNull();
  });

  it('shows exit 0 rather than treating it as missing', () => {
    render(<GateRow gate="gate.green" exit={0} />);
    expect(screen.getByText('Exit').nextElementSibling?.textContent).toBe('0');
  });

  it('wraps long detail text inside the row', () => {
    const long = 'Policy_sold_to_start_today_reads_back_Active, Status_on_the_start_date_is_Active, Status_at_23_30_UTC_on_an_end_date_in_GMT_is_Active';
    render(<GateRow gate="gate.stub" result="failed" detail={long} />);
    expect(screen.getByText(long)).toBeTruthy();
  });
});
