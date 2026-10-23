import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ConstraintHint } from '../../../src/Uinsure.Policies.Web/kit/patterns/constraint-hint/ConstraintHint';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/patterns/constraint-hint/constraint-hint.examples';

afterEach(cleanup);

describe('ConstraintHint', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'violated']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelectorAll('code').length).toBeGreaterThan(0);
  });

  it('shows the server constraint exactly as written, in mono', () => {
    render(<ConstraintHint constraint="^[A-Z0-9-]{3,20}$" />);
    const code = screen.getByText('^[A-Z0-9-]{3,20}$');
    expect(code.tagName).toBe('CODE');
    expect(screen.getByText('Server constraint')).toBeTruthy();
  });

  it('can be named by a control through its id', () => {
    render(<ConstraintHint id="amount-constraint" constraint="≤ 2 dp" />);
    expect(document.getElementById('amount-constraint')?.textContent).toContain('≤ 2 dp');
  });

  it('says nothing about a verdict when the value is fine', () => {
    const { container } = render(<ConstraintHint constraint="today … today + 60" />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.firstElementChild?.getAttribute('data-state')).toBe('pop');
  });

  it('when violated: a word and a glyph, not colour alone', () => {
    const { container } = render(<ConstraintHint constraint="≤ 2 dp" violated />);
    expect(screen.getByText('Your value breaks this')).toBeTruthy();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.firstElementChild?.getAttribute('data-state')).toBe('violated');
  });

  it('when the check is off: says the server checks it', () => {
    render(<ConstraintHint constraint="≤ 2 dp" checkOff />);
    expect(screen.getByText('Not checked here, the server checks it')).toBeTruthy();
  });

  it('violated with the check off says it will be sent anyway', () => {
    render(<ConstraintHint constraint="≤ 2 dp" violated checkOff />);
    expect(screen.getByText('Your value breaks this and will be sent anyway')).toBeTruthy();
  });
});
