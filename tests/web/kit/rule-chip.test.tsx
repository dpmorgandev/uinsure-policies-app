import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RuleChip } from '../../../src/web/kit/primitives/rule-chip/RuleChip';
import { examples } from '../../../src/web/kit/primitives/rule-chip/rule-chip.examples';

afterEach(cleanup);

describe('rule-chip examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['built', 'nb', 'unknown ID']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }
});

describe('RuleChip', () => {
  it('links a built rule to its page', () => {
    render(<RuleChip ruleId="GET-1" status="built" />);
    const link = screen.getByRole('link', { name: 'GET-1' });
    expect(link.getAttribute('href')).toBe('/rules/GET-1');
  });

  it('takes the page address from the caller when given', () => {
    render(<RuleChip ruleId="CANCEL-1c" href="#rule-CANCEL-1c" />);
    expect(screen.getByRole('link', { name: 'CANCEL-1c' }).getAttribute('href')).toBe('#rule-CANCEL-1c');
  });

  it('defaults to built', () => {
    render(<RuleChip ruleId="GET-1" />);
    expect(screen.getByRole('link', { name: 'GET-1' }).getAttribute('data-status')).toBe('built');
  });

  it('keeps an unbuilt rule a link and says it is not built', () => {
    render(<RuleChip ruleId="PLACEHOLDER-1" status="nb" />);
    const link = screen.getByRole('link', { name: /PLACEHOLDER-1.*not built yet/ });
    expect(link.getAttribute('href')).toBe('/rules/PLACEHOLDER-1');
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not link an unknown ID, and says so', () => {
    render(<RuleChip ruleId="NOT-A-RULE" status="unknown" />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/unknown rule ID, no page/)).toBeTruthy();
    expect(screen.getByText('NOT-A-RULE')).toBeTruthy();
  });

  it('keeps the rule ID text in the chip', () => {
    render(<RuleChip ruleId="COULD-2" />);
    expect(screen.getByText('COULD-2')).toBeTruthy();
  });
});
