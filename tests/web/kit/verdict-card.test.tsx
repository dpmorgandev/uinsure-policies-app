import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { VerdictCard } from '../../../src/web/kit/project/verdict-card/VerdictCard';
import { examples } from '../../../src/web/kit/project/verdict-card/verdict-card.examples';

afterEach(cleanup);

const byState = (state: string) => {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example "${state}"`);
  return found.element;
};

describe('verdict-card examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual([
      'PASS',
      'FAIL',
      'no findings',
      'lost (F0b A1, reconciled)',
      'a P0 finding',
    ]);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getByRole('article')).toBeTruthy();
  });
});

describe('VerdictCard', () => {
  it('PASS: an article named by agent and round, with the verdict as a word', () => {
    render(byState('PASS'));
    const card = screen.getByRole('article', { name: /reviewer verdict A3/ });
    expect(card.getAttribute('data-verdict')).toBe('PASS');
    expect(within(card).getByText('PASS')).toBeTruthy();
    expect(within(card).queryByText('FAIL')).toBeNull();
    expect(within(card).getByText('A2 R1-R6 resolved; inv-001 approach followed.')).toBeTruthy();
  });

  it('PASS can still carry a P2 finding, with its severity as a word', () => {
    render(byState('PASS'));
    const list = screen.getByRole('list', { name: 'Findings of the reviewer verdict A3' });
    const [item] = within(list).getAllByRole('listitem');
    expect(within(item!).getByText('R1')).toBeTruthy();
    expect(within(item!).getByText('P2')).toBeTruthy();
  });

  it('says what the trail does not: rules, head and route are "not in the excerpt" or "not recorded", never invented', () => {
    render(byState('PASS'));
    expect(screen.getAllByText('not in the excerpt')).toHaveLength(2);
    expect(screen.getByText('no SHA in the excerpt')).toBeTruthy();
    expect(screen.getByText('Route: not recorded')).toBeTruthy();
  });

  it('FAIL: the verdict word, the head SHA as a link, and every finding on its own item in the order given', () => {
    render(byState('FAIL'));
    const card = screen.getByRole('article', { name: /reviewer verdict A2/ });
    expect(card.getAttribute('data-verdict')).toBe('FAIL');
    expect(within(card).getByText('FAIL')).toBeTruthy();
    expect(within(card).getByRole('link', { name: 'Commit 8ea8f60 on GitHub' })).toBeTruthy();
    const items = within(screen.getByRole('list', { name: 'Findings of the reviewer verdict A2' })).getAllByRole('listitem');
    expect(items.map((li) => li.querySelector('span')?.textContent)).toEqual(['R1', 'R2', 'R3', 'R4', 'R5', 'R6']);
    expect(within(items[0]!).getByText('P1')).toBeTruthy();
    expect(within(items[0]!).getByText('hasClaims hard-coded false though stored, no test seeds true.')).toBeTruthy();
    expect(within(items[1]!).getByText('P2')).toBeTruthy();
  });

  it('a P0 finding: its tag reads P0 with the fail tone, as P1 does, and P2 keeps the warn tone', () => {
    render(byState('a P0 finding'));
    const list = screen.getByRole('list', { name: 'Findings of the reviewer verdict A1' });
    const [item] = within(list).getAllByRole('listitem');
    const tag = within(item!).getByText('P0').closest('[data-status]');
    expect(tag?.getAttribute('data-status')).toBe('fail');
    cleanup();
    render(
      <VerdictCard
        agent="reviewer"
        round="A2"
        verdict="FAIL"
        findings={[
          { id: 'R1', severity: 'P1', summary: 'x' },
          { id: 'R2', severity: 'P2', summary: 'y' },
        ]}
      />,
    );
    expect(screen.getByText('P1').closest('[data-status]')?.getAttribute('data-status')).toBe('fail');
    expect(screen.getByText('P2').closest('[data-status]')?.getAttribute('data-status')).toBe('warn');
  });

  it('shows the route when the verdict records one', () => {
    render(
      <VerdictCard
        agent="reviewer"
        round="A2"
        verdict="FAIL"
        findings={[{ id: 'R1', severity: 'P1', summary: 'x', route: 'tester' }]}
      />,
    );
    expect(screen.getByText('Route: tester')).toBeTruthy();
  });

  it('no findings: says so, with no findings list', () => {
    render(byState('no findings'));
    expect(screen.getByText('No findings.')).toBeTruthy();
    expect(screen.queryByRole('list', { name: /Findings/ })).toBeNull();
    expect(screen.getByRole('article', { name: /security verdict A3.2/ })).toBeTruthy();
  });

  it('findings not in the excerpt are different from no findings', () => {
    render(<VerdictCard agent="reviewer" round="A1" verdict="PASS" />);
    expect(screen.getByText('Findings: not in the excerpt.')).toBeTruthy();
    expect(screen.queryByText('No findings.')).toBeNull();
  });

  it('rules covered and missing: chips when given, "none" when the list is empty', () => {
    render(<VerdictCard agent="reviewer" round="A1" verdict="PASS" rulesCovered={['GET-1', 'SELL-7']} rulesMissing={[]} />);
    expect(screen.getByRole('link', { name: 'GET-1' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'SELL-7' })).toBeTruthy();
    expect(screen.getByText('Rules missing').nextElementSibling?.textContent).toBe('none');
  });

  it('sends a caller-set link to the rule chips, covered and missing, and keeps the default when it sets none', () => {
    const { rerender } = render(
      <VerdictCard agent="reviewer" round="A1" verdict="PASS" rulesCovered={['GET-1']} rulesMissing={['SELL-7']} />,
    );
    expect(screen.getByRole('link', { name: 'GET-1' }).getAttribute('href')).toBe('/rules/GET-1');
    rerender(
      <VerdictCard
        agent="reviewer"
        round="A1"
        verdict="PASS"
        rulesCovered={['GET-1']}
        rulesMissing={['SELL-7']}
        ruleHref={(id) => `#/rules/${id}`}
      />,
    );
    expect(screen.getByRole('link', { name: 'GET-1' }).getAttribute('href')).toBe('#/rules/GET-1');
    expect(screen.getByRole('link', { name: 'SELL-7' }).getAttribute('href')).toBe('#/rules/SELL-7');
    rerender(
      <VerdictCard
        agent="reviewer"
        round="A1"
        verdict="PASS"
        rulesCovered={['GET-1']}
        rulesMissing={['SELL-7']}
        ruleHref={() => undefined}
      />,
    );
    expect(screen.getByRole('link', { name: 'SELL-7' }).getAttribute('href')).toBe('/rules/SELL-7');
  });

  it('lost: no verdict word, no findings, and the reconciliation in words', () => {
    render(byState('lost (F0b A1, reconciled)'));
    const card = screen.getByRole('article', { name: /reviewer verdict A1/ });
    expect(card.getAttribute('data-verdict')).toBe('lost');
    expect(within(card).getByText('Lost')).toBeTruthy();
    expect(within(card).queryByText('PASS')).toBeNull();
    expect(within(card).queryByText('FAIL')).toBeNull();
    expect(within(card).queryByRole('list', { name: /Findings/ })).toBeNull();
    expect(card.textContent).toContain('A1-reviewer.json was overwritten and lost');
    expect(card.textContent).toContain('reconciled(A1-reviewer.json)');
    expect(card.textContent).toContain('reconciliation.md');
    expect(within(card).getByText('F0b')).toBeTruthy();
  });

  it('lost and not reconciled says that too', () => {
    render(<VerdictCard agent="reviewer" round="A1" lost={{ file: 'A1-reviewer.json', reconciled: false }} />);
    expect(screen.getByText('No reconciliation is recorded for it.')).toBeTruthy();
  });

  it('takes the heading level it is given', () => {
    render(<VerdictCard agent="security" round="A3" verdict="PASS" headingLevel={4} findings={[]} />);
    expect(screen.getByRole('heading', { level: 4, name: /security verdict A3/ })).toBeTruthy();
  });
});
