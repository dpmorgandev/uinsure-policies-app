import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { FindingCard } from '../../../src/Uinsure.Policies.Web/kit/project/finding-card/FindingCard';
import { examples } from '../../../src/Uinsure.Policies.Web/kit/project/finding-card/finding-card.examples';

afterEach(cleanup);

const byState = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example "${state}"`);
  return found.element;
};

const value = (term: string) => screen.getByText(term, { selector: 'dt' }).nextElementSibling as HTMLElement;

describe('finding-card examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['testable', 'untestable', 'unfixed', 'long']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('article')).toBeTruthy();
  });
});

describe('FindingCard', () => {
  it('testable: an article named by its ID, with severity, testability and the fix commit', () => {
    render(byState('testable'));
    const card = screen.getByRole('article', { name: /A2\/I1/ });
    expect(card.getAttribute('data-testable')).toBe('true');
    expect(card.getAttribute('data-fixed')).toBe('true');
    expect(within(card).getByText('P1')).toBeTruthy();
    expect(within(card).getByText('Testable')).toBeTruthy();
    expect(value('Symptom').textContent).toBe('hasClaims hard-coded false though stored, no test seeds true.');
    expect(value('Suggested test').textContent).toBe('not recorded in the excerpt');
    const fix = within(value('Fixed by'));
    expect(fix.getByRole('link', { name: 'Commit 8be3aed on GitHub' })).toBeTruthy();
    expect(fix.getByText('Fixes-Finding: A2/I1')).toBeTruthy();
    expect(fix.getByText('map stored HasClaims, make comments true')).toBeTruthy();
  });

  it('shows what the trail does not hold as "not recorded", never as a value', () => {
    render(byState('testable'));
    expect(value('Cause').textContent).toBe('not recorded in the excerpt');
    expect(value('Files').textContent).toBe('not recorded in the excerpt');
    expect(value('Fix direction').textContent).toBe('not recorded in the excerpt');
  });

  it('untestable: says so in words and asks for the reason in place of a suggested test', () => {
    render(byState('untestable'));
    const card = screen.getByRole('article', { name: /A2\/I2/ });
    expect(card.getAttribute('data-testable')).toBe('false');
    expect(within(card).getByText('Untestable')).toBeTruthy();
    expect(within(card).queryByText('Testable')).toBeNull();
    expect(screen.queryByText('Suggested test', { selector: 'dt' })).toBeNull();
    expect(value('Why untestable').textContent).toBe('Placeholder: the excerpt records no reason.');
  });

  it('untestable with no reason says the reason is not recorded', () => {
    render(<FindingCard id="X/1" symptom="s" testable={false} />);
    expect(value('Why untestable').textContent).toBe('reason not recorded');
  });

  it('unfixed: no fix commit is recorded, in words and with a glyph', () => {
    render(byState('unfixed'));
    const card = screen.getByRole('article', { name: /A3\/R1/ });
    expect(card.getAttribute('data-fixed')).toBe('false');
    expect(within(value('Fixed by')).getByText('No fix commit recorded')).toBeTruthy();
    expect(within(value('Fixed by')).queryByRole('link')).toBeNull();
    expect(within(card).getByText('P2')).toBeTruthy();
  });

  it('long: the whole symptom is in the card', () => {
    render(byState('long'));
    const text = value('Symptom').textContent ?? '';
    expect(text.startsWith('(a) 5 pass by the canned status Active coinciding')).toBe(true);
    expect(text.endsWith('David: fix (a), accept (b) as pinned.')).toBe(true);
  });

  it('files: a link when the card has an address, plain text when it does not', () => {
    render(
      <FindingCard
        id="A2/I3"
        symptom="s"
        testable
        files={[
          { path: 'src/Uinsure.Policies.Api/TwoDecimalPlacesConverter.cs', href: 'https://example.invalid/blob' },
          { path: 'tests/RetrieveHasClaimsTests.cs', line: 76 },
        ]}
      />,
    );
    const list = screen.getByRole('list', { name: 'Files of finding A2/I3' });
    const [linked, plain] = within(list).getAllByRole('listitem');
    expect(within(linked!).getByRole('link', { name: 'src/Uinsure.Policies.Api/TwoDecimalPlacesConverter.cs on GitHub' })).toBeTruthy();
    expect(within(plain!).queryByRole('link')).toBeNull();
    expect(within(plain!).getByText('tests/RetrieveHasClaimsTests.cs:76')).toBeTruthy();
  });

  it('takes the heading level it is given', () => {
    render(<FindingCard id="A2/I1" symptom="s" testable headingLevel={4} />);
    expect(screen.getByRole('heading', { level: 4, name: /A2\/I1/ })).toBeTruthy();
  });
});
