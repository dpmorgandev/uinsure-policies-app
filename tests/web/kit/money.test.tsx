import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Money } from '../../../src/web/kit/primitives/money/Money';
import { examples } from '../../../src/web/kit/primitives/money/money.examples';

afterEach(cleanup);

describe('Money', () => {
  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.textContent).not.toBe('');
  });

  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'zero', 'negative never shown']);
  });

  it('writes the value exactly as given', () => {
    render(<Money value="445.11" />);
    expect(screen.getByText('445.11')).toBeTruthy();
  });

  it('keeps a trailing zero: 615.40 is not shortened to 615.4', () => {
    render(<Money value="615.40" />);
    expect(screen.getByText('615.40').textContent).toBe('615.40');
  });

  it('keeps all the places it is given: nothing is re-rounded', () => {
    render(<Money value="445.1112" />);
    expect(screen.getByText('445.1112')).toBeTruthy();
  });

  it('shows zero as 0.00', () => {
    render(examples[1]!.element);
    expect(screen.getByText('0.00')).toBeTruthy();
  });

  it('the negative example draws no amount and no minus sign', () => {
    const { container } = render(examples[2]!.element);
    expect(container.textContent).toContain('No negative amount is drawn');
    expect(container.textContent).not.toMatch(/-\d/);
  });
});
