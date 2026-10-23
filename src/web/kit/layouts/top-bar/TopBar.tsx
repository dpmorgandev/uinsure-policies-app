import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../../primitives/button/Button';
import { TextInput } from '../../primitives/text-input/TextInput';
import { ThemeToggle } from '../../primitives/theme-toggle/ThemeToggle';
import type { ThemeChoice } from '../../primitives/theme-toggle/ThemeToggle';
import styles from './TopBar.module.css';

export interface TopBarProps {
  appName: string;
  /** Where the app name links to. */
  homeHref?: string;
  /** Starts the search box with this text. */
  defaultQuery?: string;
  /** Called with the text in the box when it is submitted. The app decides what a search finds. */
  onSearch?: (query: string) => void;
  /** BUSY-1: a search is running. The button says so, is disabled, and ignores clicks. */
  searching?: boolean;
  /** Names the search box for assistive technology. */
  searchLabel?: string;
  searchPlaceholder?: string;
  /**
   * The site search, drawn where the bar's own search box sits. Give it the kit Search combobox
   * (it carries its own label and `search` landmark). When given, the plain box, its button and the
   * `onSearch`, `searching`, `defaultQuery`, `searchLabel` and `searchPlaceholder` props are not used.
   */
  search?: ReactNode;
  /** Controlled theme choice. Leave out to let the toggle hold its own. */
  theme?: ThemeChoice;
  defaultTheme?: ThemeChoice;
  /** The app applies the choice (data-theme on an ancestor); the bar only reports it. */
  onThemeChange?: (value: ThemeChoice) => void;
}

export function TopBar({
  appName,
  homeHref = '/',
  defaultQuery = '',
  onSearch,
  searching = false,
  searchLabel = 'Search rules, nodes, SHAs and file paths',
  searchPlaceholder = 'Rule ID, node, SHA or path',
  search,
  theme,
  defaultTheme,
  onThemeChange,
}: TopBarProps) {
  const inputId = useId();
  const [query, setQuery] = useState(defaultQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searching) return;
    onSearch?.(query);
  }

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <a className={styles.name} href={homeHref}>
          {appName}
        </a>
        {search !== undefined && search !== null ? (
          <div className={styles.slot}>{search}</div>
        ) : (
          <form className={styles.search} role="search" aria-label="Find" onSubmit={handleSubmit}>
            <label className={styles.srOnly} htmlFor={inputId}>
              {searchLabel}
            </label>
            <div className={styles.field}>
              <TextInput
                id={inputId}
                name="q"
                type="search"
                mono
                autoComplete="off"
                spellCheck={false}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              icon={<Search size="1em" aria-hidden="true" />}
              busy={searching}
              busyLabel="Searching…"
            >
              Search
            </Button>
          </form>
        )}
        <div className={styles.theme}>
          <ThemeToggle value={theme} defaultValue={defaultTheme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}
