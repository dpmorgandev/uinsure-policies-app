import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Sink, compTag } from '../../../src/web/kit/sink/Sink';
import { TIERS } from '../../../src/web/kit/sink/catalog';
import type { Tier } from '../../../src/web/kit/sink/catalog';

// The catalog, by tier, in catalog order. The sink must show at least one data-comp for each of these.
const EXPECTED: Record<Tier, string[]> = {
  primitive: [
    'status-tag',
    'tdd-step-tag',
    'agent-badge',
    'rule-chip',
    'sha-link',
    'file-line-link',
    'redaction-token',
    'timestamp',
    'provenance-label',
    'disclosure',
    'tabs',
    'code-block',
    'theme-toggle',
    'button',
    'spinner',
    'text-input',
    'text-area',
    'date-input',
    'money-input',
    'select',
    'radio-group',
    'switch',
    'money',
  ],
  pattern: [
    'page-header',
    'breadcrumbs',
    'search',
    'filter-bar',
    'data-table',
    'key-value-list',
    'markdown-text',
    'json-viewer',
    'diff-viewer',
    'verify-command',
    'empty-state',
    'receipt-figure',
    'field',
    'form-section',
    'repeatable-group',
    'constraint-hint',
    'error-summary',
    'inline-error',
    'problem-banner',
    'request-log',
    'http-exchange',
    'confirm-dialog',
    'document-page',
  ],
  layout: ['app-shell', 'top-bar', 'primary-nav', 'footer', 'compiled-at-stamp', 'inspector-drawer'],
  project: [
    'rung-spine',
    'rule-evidence',
    'completeness-banner',
    'not-built-yet',
    'sources-disagree',
    'gate-row',
    'attempt-ladder',
    'verdict-card',
    'finding-card',
    'agent-lanes',
    'human-decision-row',
    'dag-graph',
    'dag-table',
    'term-timeline',
    'refund-worked-sum',
    'quote-cancel-compare',
    'reference-preview',
    'send-anyway-toggle',
    'recent-policies',
  ],
};

const TIER_ORDER: Tier[] = ['primitive', 'pattern', 'layout', 'project'];

const ICONS = [
  'arrow-left',
  'bot',
  'bug',
  'calendar-range',
  'chart-gantt',
  'check',
  'chevron-down',
  'circle-alert',
  'clock',
  'copy',
  'external-link',
  'file-code',
  'file-plus',
  'flask-conical',
  'gavel',
  'git-branch',
  'git-commit-horizontal',
  'git-merge',
  'git-pull-request',
  'history',
  'info',
  'list-tree',
  'moon',
  'receipt',
  'refresh-cw',
  'search',
  'shield',
  'sun',
  'terminal',
  'toggle-right',
  'triangle-alert',
  'user',
  'x',
];

let container: HTMLElement;
// Every data-comp wrapper, read once: its tag, and the theme of the pane that holds it.
let placed: { tag: string; theme: string | null; pair: string[] }[] = [];

beforeAll(() => {
  container = render(<Sink />).container;
  placed = Array.from(container.querySelectorAll('[data-comp]')).map((el) => {
    const pane = el.parentElement;
    const pair = pane?.parentElement;
    return {
      tag: el.getAttribute('data-comp') ?? '',
      theme: pane?.getAttribute('data-theme') ?? null,
      pair: Array.from(pair?.children ?? []).map((child) => child.getAttribute('data-theme') ?? ''),
    };
  });
}, 120_000);

afterAll(cleanup);

function countOf(tag: string, theme: string): number {
  return placed.filter((p) => p.tag === tag && p.theme === theme).length;
}

describe('the kit catalog the sink renders', () => {
  it('holds every component, by tier, in catalog order', () => {
    expect(TIERS.map((group) => group.tier)).toEqual(TIER_ORDER);
    for (const group of TIERS) {
      expect(group.entries.map((entry) => entry.id)).toEqual(EXPECTED[group.tier]);
    }
  });

  it('gives every component at least one example', () => {
    for (const group of TIERS) {
      for (const entry of group.entries) {
        expect(entry.examples.length, entry.id).toBeGreaterThan(0);
      }
    }
  });
});

describe('Sink', () => {
  it.each(TIER_ORDER.flatMap((tier) => EXPECTED[tier].map((id) => [id, tier] as const)))(
    'shows %s (%s) at least once, in both themes',
    (id, tier) => {
      const prefix = `${id} · ${tier} · `;
      const inLight = placed.filter((p) => p.tag.startsWith(prefix) && p.theme === 'light');
      const inDark = placed.filter((p) => p.tag.startsWith(prefix) && p.theme === 'dark');
      expect(inLight.length).toBeGreaterThan(0);
      expect(inDark.length).toBe(inLight.length);
    },
  );

  it('tags every example of every component with its state, once per theme', () => {
    for (const group of TIERS) {
      for (const entry of group.entries) {
        for (const example of entry.examples) {
          const tag = compTag(entry.id, group.tier, example.state);
          expect(countOf(tag, 'light'), `${tag} in light`).toBe(1);
          expect(countOf(tag, 'dark'), `${tag} in dark`).toBe(1);
        }
      }
    }
  });

  it('writes the tag as id, tier and state joined by a middle dot', () => {
    expect(compTag('status-tag', 'primitive', 'all five values')).toBe('status-tag · primitive · all five values');
  });

  it('carries no data-comp tag that is not in the catalog', () => {
    const known = new Set(
      TIERS.flatMap((group) => group.entries.flatMap((entry) => entry.examples.map((e) => compTag(entry.id, group.tier, e.state)))),
    );
    expect(placed.length).toBeGreaterThan(0);
    for (const { tag } of placed) {
      expect(known.has(tag), tag).toBe(true);
    }
  });

  it('puts a light pane and a dark pane side by side for each example, light first', () => {
    for (const { tag, pair } of placed) {
      expect(pair, tag).toEqual(['light', 'dark']);
    }
  });

  it('has a skip list with a link to every component id', () => {
    const nav = container.querySelector('nav[aria-label="Skip list"]');
    expect(nav).not.toBeNull();
    const links = Array.from(nav!.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    for (const tier of TIER_ORDER) {
      for (const id of EXPECTED[tier]) {
        expect(links, id).toContain(`#comp-${id}`);
        expect(container.querySelector(`section#comp-${id}`), id).not.toBeNull();
      }
    }
  });

  it('heads each component with its id, in catalog order', () => {
    const headings = Array.from(container.querySelectorAll('h3[id^="heading-"]')).map((h) => h.textContent);
    expect(headings).toEqual(TIER_ORDER.flatMap((tier) => EXPECTED[tier]));
  });

  it('lists the tiers as sections in catalog order', () => {
    const tierHeadings = Array.from(container.querySelectorAll('h2[id^="heading-tier-"]')).map((h) => h.textContent);
    expect(tierHeadings).toEqual(['Primitives', 'Patterns', 'Layout', 'Project']);
  });
});

describe('the type specimen', () => {
  it('is present and shows every size in the scale in both families', () => {
    const specimen = container.querySelector('[data-specimen="type"]');
    expect(specimen).not.toBeNull();
    const text = specimen!.textContent ?? '';
    for (const token of ['--text-12', '--text-14', '--text-16', '--text-18', '--text-24', '--text-32']) {
      expect(text).toContain(token);
    }
    expect(text).toContain('Quote, cancel, agree. 0O 1lI 445.11');
    expect(text).toContain('94a7473 GET-1 CANCEL-1c 0O 1lI 445.11');
  });

  it('has a column of SHAs, a column of counts and a column of money', () => {
    const specimen = container.querySelector('[data-specimen="type"]')!;
    const shas = specimen.querySelector('ul[aria-label="SHAs (mono)"]');
    const counts = specimen.querySelector('ul[aria-label="Counts (sans)"]');
    const money = specimen.querySelector('ul[aria-label="Money (sans)"]');
    expect(shas?.querySelectorAll('li').length).toBeGreaterThan(1);
    expect(counts?.querySelectorAll('li').length).toBeGreaterThan(1);
    expect(money?.querySelectorAll('li').length).toBeGreaterThan(1);
    expect(shas?.textContent).toContain('94a7473');
    expect(counts?.textContent).toContain('365');
    expect(money?.textContent).toContain('445.11');
  });
});

describe('the icon catalogue', () => {
  it('shows every named icon as an svg with its name as text', () => {
    const catalogue = container.querySelector('[data-specimen="icons"]');
    expect(catalogue).not.toBeNull();
    for (const name of ICONS) {
      const found = catalogue!.querySelectorAll(`[data-icon="${name}"]`);
      expect(found.length, name).toBeGreaterThan(0);
      for (const item of Array.from(found)) {
        expect(item.querySelector('svg'), name).not.toBeNull();
        expect(item.textContent).toBe(name);
      }
    }
  });

  it('lists no icon as missing, because lucide-react exports them all', () => {
    expect(container.querySelectorAll('[data-icon-missing]').length).toBe(0);
  });
});
