import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { FileText, Gavel, GitBranch, GitCommitHorizontal, Search as SearchGlyph, SearchX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './Search.module.css';

export type SearchKind = 'rule' | 'node' | 'sha' | 'path';

export interface SearchResult {
  id: string;
  kind: SearchKind;
  /** What the result is called: a rule ID, a node, a short SHA or a path. Set in the mono face. */
  label: string;
  /** A line of context beside the label. */
  detail?: string;
  /** Where choosing it goes. */
  href: string;
}

export interface SearchProps {
  /** The visible label above the field. */
  label?: string;
  /** Controlled text. Leave it out to let the field hold its own text. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The matches for the current text. The caller finds them; this component only shows them. */
  results?: SearchResult[];
  /** Called when a match is chosen. Without it the browser goes to the result's `href`. */
  onSelect?: (result: SearchResult) => void;
  /** The key that moves focus to the field from anywhere on the page. `null` turns it off. */
  shortcut?: string | null;
}

const WORDS: Record<SearchKind, string> = { rule: 'Rule', node: 'Node', sha: 'SHA', path: 'Path' };
const GLYPHS: Record<SearchKind, LucideIcon> = {
  rule: Gavel,
  node: GitBranch,
  sha: GitCommitHorizontal,
  path: FileText,
};

const TEXT_FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function Search({
  label = 'Jump to a rule, node, SHA or path',
  value,
  defaultValue = '',
  onValueChange,
  results = [],
  onSelect,
  shortcut = '/',
}: SearchProps) {
  const inputId = useId();
  const listId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const [active, setActive] = useState(-1);
  const [dismissed, setDismissed] = useState(false);

  const query = value ?? inner;
  const asked = query.trim() !== '';
  const open = asked && !dismissed && results.length > 0;
  const none = asked && results.length === 0;
  const state = !asked ? 'empty' : none ? 'no results' : 'results';
  const activeResult = open ? results[active] : undefined;

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== shortcut || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || TEXT_FIELDS.has(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcut]);

  const change = (next: string) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
    setActive(-1);
    setDismissed(false);
  };

  const choose = (result: SearchResult) => {
    setDismissed(true);
    setActive(-1);
    if (onSelect) onSelect(result);
    else window.location.assign(result.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = results.length;
    if (event.key === 'ArrowDown' && count > 0 && asked) {
      event.preventDefault();
      if (!open) {
        setDismissed(false);
        setActive(0);
      } else setActive((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp' && count > 0 && asked) {
      event.preventDefault();
      if (!open) {
        setDismissed(false);
        setActive(count - 1);
      } else setActive((i) => (i <= 0 ? count - 1 : i - 1));
    } else if (event.key === 'Enter' && activeResult) {
      event.preventDefault();
      choose(activeResult);
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        setDismissed(true);
        setActive(-1);
      } else if (asked) {
        event.preventDefault();
        change('');
      }
    }
  };

  return (
    <div className={styles.root} role="search" data-state={state}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.field}>
        <SearchGlyph className={styles.glyph} aria-hidden="true" focusable="false" />
        <input
          ref={inputRef}
          id={inputId}
          className={styles.input}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={activeResult ? `${listId}-${active}` : undefined}
          aria-describedby={hintId}
          value={query}
          onChange={(event) => change(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <p className={styles.keys} id={hintId}>
        {shortcut ? (
          <span>
            <kbd>{shortcut}</kbd> jump to search
          </span>
        ) : null}
        <span>
          <kbd>Up</kbd> <kbd>Down</kbd> choose a match
        </span>
        <span>
          <kbd>Enter</kbd> open it
        </span>
        <span>
          <kbd>Esc</kbd> close
        </span>
      </p>
      {open ? (
        <ul className={styles.list} id={listId} role="listbox" aria-label="Matches">
          {results.map((result, index) => {
            const Glyph = GLYPHS[result.kind];
            return (
              <li
                key={result.id}
                id={`${listId}-${index}`}
                className={styles.option}
                role="option"
                aria-selected={index === active}
                data-kind={result.kind}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(result)}
              >
                <span className={styles.kind}>
                  <Glyph className={styles.glyph} aria-hidden="true" focusable="false" />
                  <span>{WORDS[result.kind]}</span>
                </span>
                <span className={styles.name}>{result.label}</span>
                {result.detail ? <span className={styles.detail}>{result.detail}</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className={none ? styles.none : styles.srOnly} role="status">
        {none ? (
          <>
            <SearchX className={styles.glyph} aria-hidden="true" focusable="false" />
            <span>No rule, node, SHA or path matches “{query.trim()}”.</span>
          </>
        ) : open ? (
          `${results.length} ${results.length === 1 ? 'match' : 'matches'}`
        ) : (
          ''
        )}
      </p>
    </div>
  );
}
