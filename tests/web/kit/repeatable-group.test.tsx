import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RepeatableGroup } from '../../../src/web/kit/patterns/repeatable-group/RepeatableGroup';
import type { RepeatableMember } from '../../../src/web/kit/patterns/repeatable-group/RepeatableGroup';
import { examples } from '../../../src/web/kit/patterns/repeatable-group/repeatable-group.examples';

afterEach(cleanup);

function people(count: number): RepeatableMember[] {
  return Array.from({ length: count }, (_, position) => ({
    id: `p${position + 1}`,
    children: <input aria-label={`Name ${position + 1}`} />,
  }));
}

describe('RepeatableGroup', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['one', 'two', 'three (add hidden)', 'invalid member']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('group', { name: 'Policyholders' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Policyholder 1' })).toBeTruthy();
  });

  it('one: a single numbered member, nothing to remove, and add is offered', () => {
    render(examples[0]!.element);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /^Remove/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Add another policyholder' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('1 of 3 policyholders');
  });

  it('two: members are numbered from 1 in order, each removable by name', () => {
    render(examples[1]!.element);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByRole('heading', { name: 'Policyholder 1' })).toBeTruthy();
    expect(within(items[1]!).getByRole('heading', { name: 'Policyholder 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove policyholder 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove policyholder 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add another policyholder' })).toBeTruthy();
  });

  it('three: add is hidden, because three is the most', () => {
    render(examples[2]!.element);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /^Add/ })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('3 of 3 policyholders');
  });

  it('invalid member: marked in words and described by its message, and its field is invalid', () => {
    render(examples[3]!.element);
    const second = screen.getByRole('group', { name: 'Policyholder 2' });
    expect(within(second).getByText('Needs fixing')).toBeTruthy();
    const ids = (second.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    expect(ids).toHaveLength(1);
    expect(document.getElementById(ids[0]!)?.textContent).toContain('Placeholder message');
    expect(within(second).getByRole('textbox', { name: 'Name' }).getAttribute('aria-invalid')).toBe('true');
    const first = screen.getByRole('group', { name: 'Policyholder 1' });
    expect(within(first).queryByText('Needs fixing')).toBeNull();
  });

  it('invalid member: the input has no icon beside it, and the member message carries one', () => {
    render(examples[3]!.element);
    const second = screen.getByRole('group', { name: 'Policyholder 2' });
    const input = within(second).getByRole('textbox', { name: 'Name' });
    expect(input.nextElementSibling).toBeNull();
    const id = second.getAttribute('aria-describedby') as string;
    expect(document.getElementById(id)?.querySelectorAll('svg')).toHaveLength(1);
  });

  it('uses the API index when the member carries one', () => {
    render(
      <RepeatableGroup
        legend="Policyholders"
        itemLabel="Policyholder"
        members={[{ id: 'a', index: 2, children: <p>Fields</p> }]}
        min={0}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Policyholder 2' })).toBeTruthy();
  });

  it('add calls onAdd', async () => {
    const onAdd = vi.fn();
    render(<RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={people(1)} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add another policyholder' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('remove calls onRemove with the member id, from the keyboard', async () => {
    const onRemove = vi.fn();
    render(<RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={people(2)} onRemove={onRemove} />);
    screen.getByRole('button', { name: 'Remove policyholder 2' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledWith('p2');
  });

  it('takes the words for add from the caller', () => {
    render(<RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={people(1)} addLabel="Add a joint policyholder" />);
    expect(screen.getByRole('button', { name: 'Add a joint policyholder' })).toBeTruthy();
  });

  it('moves focus to the new member when one is added', () => {
    const { rerender } = render(<RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={people(1)} />);
    rerender(<RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={people(2)} />);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Policyholder 2' }));
  });

  it('moves focus to the group heading when one is removed', () => {
    const { rerender } = render(<RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={people(2)} />);
    rerender(<RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={people(1)} />);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Policyholders' }));
  });

  it('keeps the values already typed in the members that stay', async () => {
    const { rerender } = render(<RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={people(1)} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Name 1' }), 'kept');
    rerender(<RepeatableGroup legend="Policyholders" itemLabel="Policyholder" members={people(2)} />);
    expect((screen.getByRole('textbox', { name: 'Name 1' }) as HTMLInputElement).value).toBe('kept');
  });
});
