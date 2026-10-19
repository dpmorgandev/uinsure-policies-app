import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { TddStepTag } from '../../../src/web/kit/primitives/tdd-step-tag/TddStepTag';
import { examples } from '../../../src/web/kit/primitives/tdd-step-tag/tdd-step-tag.examples';

afterEach(cleanup);

const VALUES = ['scaffold', 'red', 'stub', 'green', 'refactor', 'plan', 'trace'];

describe('tdd-step-tag examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['each value', 'empty']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }

  it('"each value" shows every trailer value once', () => {
    const each = examples.find((e) => e.state === 'each value');
    const { container } = render(each!.element);
    const seen = [...container.querySelectorAll('[data-step]')].map((el) => el.getAttribute('data-step'));
    expect(seen).toEqual(VALUES);
  });
});

describe('TddStepTag', () => {
  for (const value of VALUES) {
    it(`labels ${value} as a TDD value`, () => {
      const { container } = render(<TddStepTag step={value} />);
      const tag = container.querySelector('[data-step]');
      expect(tag?.textContent).toBe(`TDD ${value}`);
    });
  }

  it('shows an empty trailer as "none", not as a blank', () => {
    const { container } = render(<TddStepTag step="" />);
    const tag = container.querySelector('[data-step]');
    expect(tag?.getAttribute('data-step')).toBe('none');
    expect(tag?.textContent).toBe('TDD none');
    expect(tag?.getAttribute('title')).toBe('This commit has no TDD trailer');
  });

  it('treats a missing step the same as an empty one', () => {
    const { container } = render(<TddStepTag />);
    expect(container.querySelector('[data-step]')?.getAttribute('data-step')).toBe('none');
  });

  it('is not a status tag: no glyph and no interactive role', () => {
    const { container } = render(<TddStepTag step="red" />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('a, button')).toBeNull();
  });
});
