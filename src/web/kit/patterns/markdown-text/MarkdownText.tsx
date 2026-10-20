import { Fragment } from 'react';
import type { ReactNode } from 'react';
import styles from './MarkdownText.module.css';

/*
 * SEC-1: agent- and David-written markdown is turned into React elements, never into an HTML string.
 * Nothing here uses dangerouslySetInnerHTML, so any HTML in the source is shown as text. The only
 * elements this file can create are the ones named below, and a link keeps its href only when the
 * address is http, https, mailto, or a relative path. Images are never fetched: they show their alt text.
 */

export interface MarkdownTextProps {
  /** The markdown as written. */
  source: string;
  /** The heading level a single "#" becomes. Defaults to 3, so the page's own h1 and h2 stay on top. */
  headingStart?: 2 | 3 | 4 | 5 | 6;
}

type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; level: number; text: string }
  | { t: 'code'; text: string }
  | { t: 'list'; ordered: boolean; items: Block[][] }
  | { t: 'quote'; blocks: Block[] }
  | { t: 'hr' };

/** An address a link may keep. Everything with another scheme (javascript:, data:, vbscript:, file:) is refused. */
export function safeHref(raw: string): string | null {
  const url = raw.trim();
  // Browsers ignore whitespace and control characters inside a scheme, so the test ignores them too.
  const probe = url.replace(/[\u0000- \u007f-\u009f]/g, '');
  if (probe === '') return null;
  if (/^(https?|mailto):/i.test(probe)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(probe)) return null;
  if (probe.startsWith('//')) return null;
  return url;
}

const FENCE = /^\s{0,3}(`{3,}|~{3,})[^`]*$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

function startsBlock(line: string): boolean {
  return line.trim() === '' || FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || ITEM.test(line);
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const marker = (fence[1] ?? '`'.repeat(3)).slice(0, 3);
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith(marker)) {
        body.push(lines[i] ?? '');
        i += 1;
      }
      i += 1;
      blocks.push({ t: 'code', text: body.join('\n') });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ t: 'h', level: (heading[1] ?? '#').length, text: heading[2] ?? '' });
      i += 1;
      continue;
    }

    if (RULE.test(line)) {
      blocks.push({ t: 'hr' });
      i += 1;
      continue;
    }

    if (QUOTE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i] ?? '')) {
        inner.push(QUOTE.exec(lines[i] ?? '')?.[1] ?? '');
        i += 1;
      }
      blocks.push({ t: 'quote', blocks: parseBlocks(inner) });
      continue;
    }

    const first = ITEM.exec(line);
    if (first) {
      const ordered = /\d/.test(first[2] ?? '');
      const base = (first[1] ?? '').length;
      const items: string[][] = [];
      const sameList = (candidate: string): boolean => {
        const item = ITEM.exec(candidate);
        return item !== null && (item[1] ?? '').length <= base && /\d/.test(item[2] ?? '') === ordered && !RULE.test(candidate);
      };
      while (i < lines.length) {
        const current = lines[i] ?? '';
        const item = ITEM.exec(current);
        if (current.trim() === '') {
          // A blank line keeps the list going only when the next line is another item or indented content.
          let next = i + 1;
          while (next < lines.length && (lines[next] ?? '').trim() === '') next += 1;
          const ahead = lines[next] ?? '';
          if (next < lines.length && (sameList(ahead) || indentOf(ahead) > base)) {
            if (indentOf(ahead) > base && !sameList(ahead)) items[items.length - 1]?.push('');
            i = next;
          } else break;
        } else if (item && sameList(current)) {
          items.push([item[3] ?? '']);
          i += 1;
        } else if (current.trim() !== '' && indentOf(current) > base && items.length > 0) {
          items[items.length - 1]?.push(current.slice(Math.min(indentOf(current), base + 2)));
          i += 1;
        } else break;
      }
      blocks.push({ t: 'list', ordered, items: items.map(parseBlocks) });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && (paragraph.length === 0 || !startsBlock(lines[i] ?? ''))) {
      paragraph.push((lines[i] ?? '').trim());
      i += 1;
    }
    blocks.push({ t: 'p', text: paragraph.join(' ') });
  }
  return blocks;
}

// 1 code span, 2-3 image, 4-5 link, 6 and 7 bold, 8 and 9 italic. An underscore only marks emphasis at the
// edge of a word, so identifiers such as Status_on_the_start_date_is_Active stay whole.
const INLINE =
  /`([^`]+)`|!\[([^\]]*)\]\(([^)]*)\)|\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\)|\*\*([^*]+)\*\*|(?<![A-Za-z0-9_])__([^_]+)__(?![A-Za-z0-9_])|\*([^*\s][^*]*)\*|(?<![A-Za-z0-9_])_([^_\s][^_]*)_(?![A-Za-z0-9_])/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    if (at > last) nodes.push(text.slice(last, at));
    const key = `${keyBase}-${n}`;
    n += 1;
    if (match[1] !== undefined) {
      nodes.push(<code key={key}>{match[1]}</code>);
    } else if (match[3] !== undefined) {
      nodes.push(<Fragment key={key}>{match[2]}</Fragment>);
    } else if (match[4] !== undefined) {
      const href = safeHref(match[5] ?? '');
      nodes.push(
        href === null ? (
          <Fragment key={key}>{renderInline(match[4], key)}</Fragment>
        ) : (
          <a key={key} href={href} rel="noopener noreferrer">
            {renderInline(match[4], key)}
          </a>
        ),
      );
    } else if (match[6] !== undefined || match[7] !== undefined) {
      nodes.push(<strong key={key}>{renderInline(match[6] ?? match[7] ?? '', key)}</strong>);
    } else {
      nodes.push(<em key={key}>{renderInline(match[8] ?? match[9] ?? '', key)}</em>);
    }
    last = at + (match[0]?.length ?? 0);
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderBlocks(blocks: Block[], keyBase: string, headingStart: number): ReactNode[] {
  return blocks.map((block, index) => {
    const key = `${keyBase}-${index}`;
    switch (block.t) {
      case 'p':
        return <p key={key}>{renderInline(block.text, key)}</p>;
      case 'h': {
        const Tag = `h${Math.min(6, headingStart + block.level - 1)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        return <Tag key={key}>{renderInline(block.text, key)}</Tag>;
      }
      case 'code':
        // Code is the widest thing markdown makes. It scrolls inside this frame, which the keyboard can reach, and
        // never widens the page.
        return (
          <div key={key} className={styles.codeFrame} role="region" aria-label="Code, scrolls sideways" tabIndex={0}>
            <pre>
              <code>{block.text}</code>
            </pre>
          </div>
        );
      case 'list': {
        const List = block.ordered ? 'ol' : 'ul';
        return (
          <List key={key}>
            {block.items.map((item, j) => {
              const itemKey = `${key}-${j}`;
              // A list item that opens with a paragraph shows its words directly, so the list stays tight.
              const [head, ...rest] = item;
              return (
                <li key={itemKey}>
                  {head?.t === 'p' ? renderInline(head.text, itemKey) : null}
                  {renderBlocks(head?.t === 'p' ? rest : item, itemKey, headingStart)}
                </li>
              );
            })}
          </List>
        );
      }
      case 'quote':
        return <blockquote key={key}>{renderBlocks(block.blocks, key, headingStart)}</blockquote>;
      case 'hr':
        return <hr key={key} />;
    }
  });
}

export function MarkdownText({ source, headingStart = 3 }: MarkdownTextProps) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  return (
    <div className={styles.root} data-markdown="rendered">
      {renderBlocks(parseBlocks(lines), 'md', headingStart)}
    </div>
  );
}
