import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { HumanDecisionRow } from '../../../src/web/kit/project/human-decision-row/HumanDecisionRow';
import { examples } from '../../../src/web/kit/project/human-decision-row/human-decision-row.examples';

afterEach(cleanup);

describe('human-decision-row examples', () => {
  it('has exactly the catalogued states, in order', () => {
    expect(examples.map((e) => e.state)).toEqual(['pause 1', 'pause 2', 'steer', 'ruling', 'sign-off', 'merge']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.firstChild).not.toBeNull();
  });
});

describe('HumanDecisionRow', () => {
  it('is a labelled group naming the step and who decided', () => {
    render(examples[4]!.element);
    expect(screen.getByRole('group', { name: 'Sign off, David Morgan' })).toBeTruthy();
  });

  it('answers who, what, when and where for every kind', () => {
    for (const example of examples) {
      const { container, unmount } = render(example.element);
      const facts = Array.from(container.querySelectorAll('dt')).map((dt) => dt.textContent);
      expect(facts).toEqual(['When', 'Where']);
      expect(container.querySelector('[data-kind]')).not.toBeNull();
      expect(screen.getByText('David Morgan')).toBeTruthy();
      unmount();
    }
  });

  it('gives each kind its own step word', () => {
    const words = ['Pause 1', 'Pause 2', 'Steer', 'Rule on it', 'Sign off', 'Merge the PR'];
    examples.forEach((example, position) => {
      const { unmount } = render(example.element);
      expect(screen.getAllByText(words[position]!).length).toBeGreaterThan(0);
      unmount();
    });
  });

  it('hides the ordinal marker from assistive technology', () => {
    render(examples[0]!.element);
    expect(screen.getByText('P1').getAttribute('aria-hidden')).toBe('true');
  });

  it('says so when no time was recorded, rather than leaving a gap', () => {
    render(examples[0]!.element);
    expect(screen.getByText('no time recorded')).toBeTruthy();
  });

  it('shows a recorded time when there is one', () => {
    const { container } = render(examples[4]!.element);
    const time = container.querySelector('time');
    expect(time).not.toBeNull();
    expect(time?.textContent).toMatch(/2026-10-19 01:05/);
  });

  it('shows both SHAs when two sources disagree on the sign-off commit', () => {
    render(examples[4]!.element);
    expect(screen.getByText('223102a')).toBeTruthy();
    expect(screen.getByText(/Sources differ/)).toBeTruthy();
    expect(screen.getByText('beba48e')).toBeTruthy();
  });

  it('shows the outcome as a word with a glyph', () => {
    const { container } = render(examples[2]!.element);
    const tag = container.querySelector('[data-status="fail"]');
    expect(tag?.textContent).toContain('Gate failed');
    expect(tag?.querySelector('svg')).not.toBeNull();
  });

  it('links to its evidence in a labelled list, and marks the external ones', () => {
    render(examples[5]!.element);
    const list = screen.getByRole('list', { name: 'Evidence' });
    const link = within(list).getByRole('link', { name: /PR #17/ });
    expect(link.getAttribute('href')).toBe('https://github.com/dpmorgandev/uinsure-policies-api/pull/17');
    expect(link.textContent).toContain('opens GitHub');
  });

  it('gives every external evidence link rel="noreferrer"', () => {
    render(
      <HumanDecisionRow
        kind="merge"
        who="david"
        what="Placeholder merge for this test"
        evidence={[
          { label: 'Placeholder external', href: 'https://github.com/example/repo/pull/1', external: true },
          { label: 'Placeholder internal', href: '/decisions' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: /Placeholder external/ }).getAttribute('rel')).toContain('noreferrer');
    expect(screen.getByRole('link', { name: /Placeholder internal/ }).getAttribute('rel')).toBeNull();
  });

  it('says where it happened, and says so when that is not recorded', () => {
    render(<HumanDecisionRow kind="ruling" who="david" what="Placeholder ruling for this test" />);
    expect(screen.getByText('not recorded')).toBeTruthy();
  });

  it('can sit in an ordered list as a list item', () => {
    render(
      <ol aria-label="Decisions">
        <HumanDecisionRow as="li" kind="pause-1" who="david" what="First" />
        <HumanDecisionRow as="li" kind="merge" who="david" what="Last" />
      </ol>,
    );
    expect(within(screen.getByRole('list', { name: 'Decisions' })).getAllByRole('listitem').length).toBe(2);
  });

  it('takes a marker override', () => {
    const { container } = render(<HumanDecisionRow kind="steer" who="david" what="Steered" marker="#7" />);
    expect(container.textContent).toContain('#7');
  });
});
