import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextArea } from '../../../src/web/kit/primitives/text-area/TextArea';
import { examples } from '../../../src/web/kit/primitives/text-area/text-area.examples';

afterEach(cleanup);

describe('TextArea', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('textbox', { name: 'Claim description' })).toBeTruthy();
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['empty', 'filled', 'at limit', 'invalid']);
  });

  it('shows the count against the maximum and links it with aria-describedby', () => {
    render(examples[1]!.element);
    const box = screen.getByRole('textbox', { name: 'Claim description' });
    const countId = box.getAttribute('aria-describedby') as string;
    expect(document.getElementById(countId)?.textContent).toBe('30 of 500 characters');
  });

  it('the empty example counts 0 of 500 and shows no limit message', () => {
    render(examples[0]!.element);
    expect(screen.getByText('0 of 500 characters')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('the count follows what is typed', async () => {
    render(<TextArea aria-label="Claim description" maxLength={500} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Claim description' }), 'abc');
    expect(screen.getByText('3 of 500 characters')).toBeTruthy();
  });

  it('at the limit it says so in words and stops accepting text', async () => {
    render(examples[2]!.element);
    const box = screen.getByRole('textbox', { name: 'Claim description' }) as HTMLTextAreaElement;
    expect(box.getAttribute('maxlength')).toBe('500');
    expect(box.value).toHaveLength(500);
    expect(screen.getByText('500 of 500 characters')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Limit reached');
    await userEvent.type(box, 'more');
    expect(box.value).toHaveLength(500);
  });

  it('when invalid: aria-invalid is true and the field message is also described', () => {
    render(examples[3]!.element);
    const box = screen.getByRole('textbox', { name: 'Claim description' });
    expect(box.getAttribute('aria-invalid')).toBe('true');
    const ids = (box.getAttribute('aria-describedby') as string).split(' ');
    expect(ids).toHaveLength(2);
    const texts = ids.map((id) => document.getElementById(id)?.textContent ?? '');
    expect(texts.some((t) => t.includes('Placeholder message'))).toBe(true);
    expect(texts.some((t) => t.includes('of 500 characters'))).toBe(true);
  });

  it('when invalid: draws no icon of its own, so the field message carries the only error icon', () => {
    const { container } = render(examples[3]!.element);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    const box = screen.getByRole('textbox', { name: 'Claim description' });
    expect(box.parentElement?.querySelector('svg')).toBeNull();
  });

  it('is not marked invalid by default', () => {
    render(<TextArea aria-label="Claim description" maxLength={500} />);
    expect(screen.getByRole('textbox', { name: 'Claim description' }).getAttribute('aria-invalid')).toBeNull();
  });
});
