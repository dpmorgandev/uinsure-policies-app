import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Disclosure } from '../../../src/Uinsure.Policies.Web/kit/primitives/disclosure/Disclosure';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/primitives/disclosure/disclosure.examples';

afterEach(cleanup);

describe('disclosure examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['open', 'closed']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }

  it('"open" starts expanded and "closed" starts collapsed', () => {
    const open = render(examples[0]!.element);
    expect(open.getByRole('button').getAttribute('aria-expanded')).toBe('true');
    open.unmount();
    const closed = render(examples[1]!.element);
    expect(closed.getByRole('button').getAttribute('aria-expanded')).toBe('false');
  });
});

describe('Disclosure', () => {
  it('is closed by default, with the panel hidden', () => {
    render(
      <Disclosure summary="Full detail">
        <p>inside</p>
      </Disclosure>,
    );
    const button = screen.getByRole('button', { name: 'Full detail' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect((panel as HTMLElement).hidden).toBe(true);
  });

  it('opens and closes from the keyboard-reachable button, and reports each change', () => {
    const seen = vi.fn();
    render(
      <Disclosure summary="Full detail" onToggle={seen}>
        <p>inside</p>
      </Disclosure>,
    );
    const button = screen.getByRole('button', { name: 'Full detail' });
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('inside')).toBeTruthy();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(seen.mock.calls).toEqual([[true], [false]]);
  });

  it('can start open, for a failure', () => {
    render(
      <Disclosure summary="Why it failed" defaultOpen>
        <p>the reason</p>
      </Disclosure>,
    );
    expect(screen.getByRole('button', { name: 'Why it failed' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('the reason')).toBeTruthy();
  });

  it('points the button at its panel', () => {
    render(
      <Disclosure summary="Full detail" defaultOpen>
        <p>inside</p>
      </Disclosure>,
    );
    const button = screen.getByRole('button');
    const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toBe('inside');
  });
});
