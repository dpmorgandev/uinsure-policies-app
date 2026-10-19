import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ProvenanceLabel } from '../../../src/web/kit/primitives/provenance-label/ProvenanceLabel';
import type { Provenance } from '../../../src/web/kit/primitives/provenance-label/ProvenanceLabel';
import { examples } from '../../../src/web/kit/primitives/provenance-label/provenance-label.examples';

afterEach(cleanup);

const VALUES: Provenance[] = ['generated', 'recorded', 'written'];

describe('provenance-label examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['each value']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }

  it('shows all three values', () => {
    const { container } = render(examples[0]!.element);
    const seen = [...container.querySelectorAll('[data-provenance]')].map((el) => el.getAttribute('data-provenance'));
    expect(seen).toEqual(VALUES);
  });
});

describe('ProvenanceLabel', () => {
  for (const value of VALUES) {
    it(`${value} has its word and a glyph`, () => {
      const { container } = render(<ProvenanceLabel provenance={value} />);
      expect(screen.getByText(value)).toBeTruthy();
      expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    });
  }

  it('gives each value a one-line meaning', () => {
    render(
      <>
        <ProvenanceLabel provenance="generated" />
        <ProvenanceLabel provenance="recorded" />
        <ProvenanceLabel provenance="written" />
      </>,
    );
    expect(screen.getByText(/a hook or render-trace\.mjs wrote it/)).toBeTruthy();
    expect(screen.getByText(/a hook stored an agent's judgement verbatim/)).toBeTruthy();
    expect(screen.getByText('by David or the main session')).toBeTruthy();
  });

  it('keeps the meaning for assistive technology when it is not shown', () => {
    render(<ProvenanceLabel provenance="written" showMeaning={false} />);
    expect(screen.getByText('written')).toBeTruthy();
    expect(screen.getByText(/by David or the main session/)).toBeTruthy();
    expect(screen.queryByText('by David or the main session')).toBeNull();
  });

  it('is not interactive', () => {
    const { container } = render(<ProvenanceLabel provenance="generated" />);
    expect(container.querySelector('a, button')).toBeNull();
  });
});
