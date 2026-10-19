import styles from './PrimaryNav.module.css';

export interface NavItem {
  /** Stable identifier, matched against `current`. */
  key: string;
  label: string;
  /** A real route. A route with a parameter in it (`/plans/:planId`) is filled in by the caller first. */
  href: string;
  /** The part of the app the link belongs to: "explorer" or "workbench". A change of scope draws a divider. */
  scope?: string;
}

export interface PrimaryNavProps {
  /** The `key` of the section being shown. Leave it out of `items` and no link is marked current. */
  current: string;
  /** The links, in the order they are read. The caller owns them; the bar holds no routes of its own. */
  items: readonly NavItem[];
  /** Names the navigation landmark. */
  label?: string;
}

/**
 * A bar of links under the top bar. The ordinal-spine has no sidebar. When the scope changes along the list (the
 * explorer links, then the workbench), the first link of the new scope sits after a divider.
 */
export function PrimaryNav({ current, items, label = 'Primary' }: PrimaryNavProps) {
  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list}>
        {items.map((item, index) => {
          const isCurrent = item.key === current;
          const previous = index > 0 ? items[index - 1] : undefined;
          const startsScope = previous !== undefined && previous.scope !== item.scope;
          return (
            <li
              key={item.key}
              className={startsScope ? `${styles.item} ${styles.scopeStart}` : styles.item}
              data-scope={item.scope}
              data-scope-start={startsScope ? 'true' : undefined}
            >
              <a
                className={isCurrent ? `${styles.link} ${styles.current}` : styles.link}
                href={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                data-active={isCurrent ? 'true' : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
