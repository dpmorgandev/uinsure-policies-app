import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RedactionToken } from '../../../src/Uinsure.Policies.Web/kit/primitives/redaction-token/RedactionToken';
import type { Redaction } from '../../../src/Uinsure.Policies.Web/kit/primitives/redaction-token/RedactionToken';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/primitives/redaction-token/redaction-token.examples';

afterEach(cleanup);

const TOKENS: Redaction[] = ['user', 'outside-repo', 'root'];

describe('redaction-token examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['each token']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }

  it('shows all three tokens', () => {
    const { container } = render(examples[0]!.element);
    const seen = [...container.querySelectorAll('[data-token]')].map((el) => el.getAttribute('data-token'));
    expect(seen).toEqual(TOKENS);
  });
});

describe('RedactionToken', () => {
  for (const token of TOKENS) {
    it(`shows <${token}> as written, labelled as redacted`, () => {
      const { container } = render(<RedactionToken token={token} />);
      expect(screen.getByText(`<${token}>`)).toBeTruthy();
      expect(screen.getByText('redacted')).toBeTruthy();
      expect(container.querySelector('code')?.textContent).toBe(`<${token}>`);
      expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    });
  }

  it('explains what was removed, for assistive technology', () => {
    render(<RedactionToken token="outside-repo" />);
    expect(screen.getByText(/a path outside the repo, removed before the trail was stored/)).toBeTruthy();
  });

  it('is not interactive', () => {
    const { container } = render(<RedactionToken token="user" />);
    expect(container.querySelector('a, button')).toBeNull();
  });
});
