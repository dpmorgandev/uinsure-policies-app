import { NotBuiltYet } from '../../project/not-built-yet/NotBuiltYet';
import styles from './PrimaryNav.module.css';

interface NavItemBase {
  /** Stable identifier, matched against `current`. */
  key: string;
  label: string;
  /** The part of the app the entry belongs to: "explorer" or "workbench". A change of scope draws a divider. */
  scope?: string;
}

/** A built entry: a real link. */
export interface BuiltNavItem extends NavItemBase {
  /** A real route. A route with a parameter in it (`/plans/:planId`) is filled in by the caller first. */
  href: string;
  notBuilt?: false;
}

/** An entry the app has not built: drawn as "not built yet", never as a link, so it has no route to go to. */
export interface NotBuiltNavItem extends NavItemBase {
  notBuilt: true;
  href?: undefined;
}

export type NavItem = BuiltNavItem | NotBuiltNavItem;

export interface PrimaryNavProps {
  /** The `key` of the section being shown. Leave it out of `items` and no link is marked current. */
  current: string;
  /** The entries, in the order they are read. The caller owns them; the bar holds no routes of its own. */
  items: readonly NavItem[];
  /** Names the navigation landmark. */
  label?: string;
}

/**
 * A bar of links under the top bar. The ordinal-spine has no sidebar. When the scope changes along the list (the
 * explorer links, then the workbench), the first entry of the new scope sits after a divider. An entry marked
 * `notBuilt` is not a link: it says "not built yet" in the same place, and is never the current page.
 */
export function PrimaryNav({ current, items, label = 'Primary' }: PrimaryNavProps) {
  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list}>
        {items.map((item, index) => {
          const previous = index > 0 ? items[index - 1] : undefined;
          const startsScope = previous !== undefined && previous.scope !== item.scope;
          const itemClass = startsScope ? `${styles.item} ${styles.scopeStart}` : styles.item;
          if (item.notBuilt === true) {
            return (
              <li
                key={item.key}
                className={itemClass}
                data-scope={item.scope}
                data-scope-start={startsScope ? 'true' : undefined}
                data-built="false"
              >
                <span className={styles.unbuilt}>
                  <NotBuiltYet kind="nav entry" name={item.label} />
                </span>
              </li>
            );
          }
          const isCurrent = item.key === current;
          return (
            <li
              key={item.key}
              className={itemClass}
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
