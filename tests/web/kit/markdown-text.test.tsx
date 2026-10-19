import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MarkdownText, safeHref } from '../../../src/web/kit/patterns/markdown-text/MarkdownText';
import { examples } from '../../../src/web/kit/patterns/markdown-text/markdown-text.examples';

afterEach(cleanup);

function html(source: string, headingStart?: 2 | 3 | 4 | 5 | 6): HTMLElement {
  const { container } = render(<MarkdownText source={source} headingStart={headingStart} />);
  return container.firstElementChild as HTMLElement;
}

describe('markdown-text examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['pop', 'long']);
  });

  it.each(examples)('renders the example: $state', ({ element }) => {
    const { container } = render(element);
    expect(container.querySelector('[data-markdown="rendered"]')).not.toBeNull();
  });

  it('pop: renders the list, the code spans and a safe link', () => {
    const first = examples[0];
    if (!first) throw new Error('no example');
    render(first.element);
    expect(screen.getAllByRole('listitem').length).toBe(3);
    expect(screen.getByText('decimal.MinValue').tagName).toBe('CODE');
    expect(screen.getByRole('link', { name: 'PR #17' }).getAttribute('href')).toBe(
      'https://github.com/dpmorgandev/uinsure-policies-api/pull/17',
    );
    expect(screen.getByText('Reviewer verdict A3: Pass.').tagName).toBe('STRONG');
  });

  it('long: keeps every long identifier whole and renders its blocks', () => {
    const second = examples[1];
    if (!second) throw new Error('no example');
    const { container } = render(second.element);
    expect(container.textContent).toContain('Status_at_22_59_UTC_on_an_end_date_in_BST_is_Active');
    expect(container.querySelector('em')).toBeNull();
    expect(container.querySelector('blockquote')?.textContent).toContain('accept (b) as pinned');
    expect(container.querySelector('ol')?.querySelectorAll('li').length).toBe(5);
    expect(container.querySelector('pre code')?.textContent).toContain('94a7473^..92ede9e');
  });
});

describe('MarkdownText: never raw HTML (SEC-1)', () => {
  it('shows HTML tags as text instead of making elements', () => {
    const root = html('Hello <script>alert(1)</script> <img src=x onerror=alert(1)> <b>bold?</b>');
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('b')).toBeNull();
    expect(root.textContent).toContain('<script>alert(1)</script>');
    expect(root.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('shows an HTML block as text', () => {
    const root = html('<div onclick="steal()">click</div>');
    expect(root.querySelector('div')).toBeNull();
    expect(root.textContent).toContain('<div onclick="steal()">click</div>');
  });

  it('refuses link addresses with a script or file scheme and keeps the link text', () => {
    for (const bad of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html;base64,AAAA',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      '//evil.example/x',
    ]) {
      const { container, unmount } = render(<MarkdownText source={`[click me](${bad})`} />);
      expect(container.querySelector('a'), bad).toBeNull();
      expect(container.textContent, bad).toBe('click me');
      unmount();
    }
  });

  it('keeps http, https, mailto, relative and in-page addresses', () => {
    const root = html(
      '[a](https://example.test/x) [b](http://example.test/y) [c](mailto:placeholder-recipient) [d](/rules/GET-1) [e](#r5) [f](docs/qa/build-F2.md)',
    );
    expect(Array.from(root.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual([
      'https://example.test/x',
      'http://example.test/y',
      'mailto:placeholder-recipient',
      '/rules/GET-1',
      '#r5',
      'docs/qa/build-F2.md',
    ]);
  });

  it('gives every link rel noopener noreferrer', () => {
    const root = html('[a](https://example.test/x)');
    expect(root.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('never fetches an image: it shows the alt text', () => {
    const root = html('![the diagram](https://example.test/tracker.png)');
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toBe('the diagram');
  });

  it('safeHref decides the same way', () => {
    expect(safeHref('https://example.test')).toBe('https://example.test');
    expect(safeHref('  /rules/GET-1  ')).toBe('/rules/GET-1');
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref(' JavaScript:alert(1)')).toBeNull();
    expect(safeHref('jav\nascript:alert(1)')).toBeNull();
    expect(safeHref('java\tscript:alert(1)')).toBeNull();
    expect(safeHref('')).toBeNull();
  });
});

describe('MarkdownText: the markdown it understands', () => {
  it('turns paragraphs, emphasis and code spans into the matching elements', () => {
    const root = html('One **bold** and *italic* and _also italic_ with `code`.\n\nSecond paragraph.');
    expect(root.querySelectorAll('p').length).toBe(2);
    expect(root.querySelector('strong')?.textContent).toBe('bold');
    expect(Array.from(root.querySelectorAll('em')).map((e) => e.textContent)).toEqual(['italic', 'also italic']);
    expect(root.querySelector('code')?.textContent).toBe('code');
  });

  it('does not read underscores inside identifiers as emphasis', () => {
    const root = html('Status_on_the_start_date_is_Active and Status_at_23_30_UTC passed.');
    expect(root.querySelector('em')).toBeNull();
    expect(root.textContent).toBe('Status_on_the_start_date_is_Active and Status_at_23_30_UTC passed.');
  });

  it('starts headings at level 3 by default, and at the level asked for', () => {
    render(<MarkdownText source={'# One\n\n## Two'} />);
    expect(screen.getByRole('heading', { level: 3, name: 'One' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'Two' })).toBeTruthy();
    cleanup();
    render(<MarkdownText source={'# One\n\n###### Six'} headingStart={5} />);
    expect(screen.getByRole('heading', { level: 5, name: 'One' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 6, name: 'Six' })).toBeTruthy();
  });

  it('makes bulleted and numbered lists, with nesting', () => {
    const root = html('- one\n- two\n  - inner\n- three\n\n1. first\n2. second');
    const lists = root.querySelectorAll(':scope > ul, :scope > ol');
    expect(lists.length).toBe(2);
    const bullets = lists[0] as HTMLElement;
    expect(within(bullets).getAllByRole('listitem').length).toBe(4);
    expect(bullets.querySelector('ul')?.textContent).toBe('inner');
    expect((lists[1] as HTMLElement).tagName).toBe('OL');
  });

  it('keeps a list together across a blank line', () => {
    const root = html('- one\n\n- two');
    expect(root.querySelectorAll('ul').length).toBe(1);
    expect(root.querySelectorAll('li').length).toBe(2);
  });

  it('keeps fenced code exactly, including markdown-looking text and HTML', () => {
    const fence = '`'.repeat(3);
    const root = html(`${fence}\n**not bold** <b>x</b>\n  indented\n${fence}`);
    const code = root.querySelector('pre code');
    expect(code?.textContent).toBe('**not bold** <b>x</b>\n  indented');
    expect(root.querySelector('strong')).toBeNull();
    expect(root.querySelector('b')).toBeNull();
  });

  it('makes block quotes and rules', () => {
    const root = html('> quoted **text**\n\n---\n\nafter');
    expect(root.querySelector('blockquote strong')?.textContent).toBe('text');
    expect(root.querySelector('hr')).not.toBeNull();
  });

  it('renders nothing for an empty source, and does not throw on stray markers', () => {
    expect(html('').childElementCount).toBe(0);
    expect(() => html('**unclosed [link](  `tick\n- \n> \n#')).not.toThrow();
  });
});
