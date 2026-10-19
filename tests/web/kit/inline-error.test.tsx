import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { InlineError } from '../../../src/web/kit/patterns/inline-error/InlineError';
import { examples } from '../../../src/web/kit/patterns/inline-error/inline-error.examples';

afterEach(cleanup);

describe('InlineError', () => {
  it('has an example for each state in the catalog row', () => {
    expect(examples.map((e) => e.state)).toEqual(['one', 'several on one field']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelector('[id^="inline-error-"]')).not.toBeNull();
    expect(container.textContent).toContain('yyyy-MM-dd');
  });

  it('carries the id a field names in aria-describedby', () => {
    render(<InlineError id="date-error" messages={['Cancellation date in the past']} />);
    const el = document.getElementById('date-error');
    expect(el).not.toBeNull();
    expect(el?.textContent).toContain('Cancellation date in the past');
  });

  it('says it is an error in words, not by colour alone: a hidden word and a glyph', () => {
    render(<InlineError id="e1" messages={['The cancellationDate field is required.']} />);
    const el = document.getElementById('e1') as HTMLElement;
    expect(el.textContent).toContain('Error: ');
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('one message is a paragraph', () => {
    render(<InlineError id="e1" messages={['One problem']} />);
    expect(screen.getByText('One problem').tagName).toBe('P');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('several messages are a list, each its own item, none folded into a count', () => {
    render(<InlineError id="e2" messages={['First problem', 'Second problem']} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['First problem', 'Second problem']);
  });

  it('several messages carry one icon, not one per item, and stay a list for assistive technology', () => {
    render(<InlineError id="e4" messages={['First problem', 'Second problem']} />);
    const el = document.getElementById('e4') as HTMLElement;
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(screen.getByRole('list')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('draws nothing when there are no messages', () => {
    const { container } = render(<InlineError id="e3" messages={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
