import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageHeader } from '../../../src/web/kit/patterns/page-header/PageHeader';
import { examples } from '../../../src/web/kit/patterns/page-header/page-header.examples';

afterEach(cleanup);

function example(state: string) {
  const found = examples.find((e) => e.state === state);
  if (!found) throw new Error(`no example for ${state}`);
  return found.element;
}

/** The text of the field whose term is `term`. */
function field(term: string): HTMLElement {
  const dt = screen.getByText(term, { selector: 'dt' });
  return dt.nextElementSibling as HTMLElement;
}

describe('page-header examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'nb', 'live']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    render(element);
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBe(1);
  });

  it('pop: the title, the question and the answer come first, then the status, IDs and stamp', () => {
    render(example('pop'));
    expect(screen.getByRole('heading', { level: 1, name: 'GET-1 Retrieve a policy' })).toBeTruthy();
    expect(screen.getByText(/Did this rule's test fail before its code made it pass/)).toBeTruthy();
    expect(screen.getByText(/Red is rung #5, green is rung #17/)).toBeTruthy();
    expect(within(field('Status')).getByText('Pass 59 of 59')).toBeTruthy();
    expect(within(field('Rule')).getByRole('link', { name: 'GET-1' })).toBeTruthy();
    expect(within(field('PR')).getByRole('link', { name: '#17' }).getAttribute('href')).toBe(
      'https://github.com/dpmorgandev/uinsure-policies-api/pull/17',
    );
  });

  it('pop: an ID the source does not hold says so in words, with its own words', () => {
    render(example('pop'));
    expect(field('Snapshot SHA').textContent).toBe('not in the excerpt');
  });

  it('pop: the compiled-at stamp is a time, marked generated, with the script that wrote it', () => {
    const { container } = render(example('pop'));
    const stamp = field('Compiled at');
    const time = stamp.querySelector('time');
    expect(time?.getAttribute('datetime')).toBe('2026-10-19T00:07:57.000Z');
    expect(stamp.textContent).toContain('generated');
    expect(within(stamp).getByText('.claude/scripts/render-trace.mjs')).toBeTruthy();
    expect(container.querySelector('[data-mode="compiled"]')).not.toBeNull();
  });

  it('nb: the status is a word with a glyph, the stamp is a gap, and the placeholder is labelled', () => {
    render(example('nb'));
    expect(within(field('Status')).getByText('Not built yet')).toBeTruthy();
    expect(field('Compiled at').textContent).toBe('nothing compiled: not built yet');
    expect(screen.getByText(/Placeholder: no unbuilt rule ID/)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Rule ‹ruleId›');
  });

  it('live: no compiled-at stamp, a Live marker in words, and the status gap', () => {
    const { container } = render(example('live'));
    expect(container.querySelector('[data-mode="live"]')).not.toBeNull();
    expect(screen.queryByText('Compiled at', { selector: 'dt' })).toBeNull();
    expect(within(field('Data')).getByText('Live')).toBeTruthy();
    expect(field('Status').textContent).toBe("not in this screen's data");
    expect(field('Policy').textContent).toBe('F3-MVEOSVDQJQ');
  });
});

describe('PageHeader', () => {
  it('has exactly one h1, holding the title', () => {
    render(<PageHeader title="Quote and cancel" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Quote and cancel' })).toBeTruthy();
  });

  it('always shows a Status field and a stamp field, drawing a gap when the data holds neither', () => {
    render(<PageHeader title="Anything" />);
    expect(field('Status').textContent).toBe("not in this screen's data");
    expect(field('Compiled at').textContent).toBe("not in this screen's data");
  });

  it('uses the words given for what is missing', () => {
    render(<PageHeader title="Anything" missingLabel="not recorded" />);
    expect(field('Status').textContent).toBe('not recorded');
    expect(field('Compiled at').textContent).toBe('not recorded');
  });

  it('shows an ID with no link as text, and one with a link as a link', () => {
    render(
      <PageHeader
        title="Anything"
        ids={[
          { label: 'Policy', value: 'F3-MVEOSVDQJQ' },
          { label: 'Rule', value: 'GET-1', href: '/rules/GET-1' },
        ]}
      />,
    );
    expect(within(field('Policy')).queryByRole('link')).toBeNull();
    expect(within(field('Rule')).getByRole('link', { name: 'GET-1' }).getAttribute('href')).toBe('/rules/GET-1');
  });

  it('treats an empty string as a missing ID', () => {
    render(<PageHeader title="Anything" ids={[{ label: 'Policy', value: '' }]} />);
    expect(field('Policy').textContent).toBe("not in this screen's data");
  });

  it('keeps every gap and glyph decorative, so the words carry the meaning', () => {
    const { container } = render(<PageHeader title="Anything" mode="live" />);
    const glyphs = container.querySelectorAll('svg');
    expect(glyphs.length).toBeGreaterThan(0);
    for (const glyph of glyphs) expect(glyph.getAttribute('aria-hidden')).toBe('true');
  });

  it('lets the reader switch the stamp to UTC from the keyboard', async () => {
    render(<PageHeader title="Anything" compiledAt="2026-10-19T00:07:57Z" />);
    const toggle = screen.getByRole('button', { name: 'Show UTC time' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('puts the live note beside the Live marker', () => {
    render(<PageHeader title="Anything" mode="live" liveNote="answered 200 by the API" />);
    expect(field('Data').textContent).toContain('answered 200 by the API');
  });
});
