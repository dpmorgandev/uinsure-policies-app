import styles from './PrimaryNav.module.css';

export interface NavItem {
  /** Stable identifier, matched against `current`. */
  key: string;
  label: string;
  href: string;
}

export interface PrimaryNavProps {
  /** The `key` of the section being shown. Leave it out of `items` and no link is marked current. */
  current: string;
  items?: NavItem[];
  /** Names the navigation landmark. */
  label?: string;
}

// Routes are from docs/ui/screens.json; the plan is "build", the plan the mockups read.
export const primaryNavItems: NavItem[] = [
  { key: 'overview', label: 'Overview', href: '/' },
  { key: 'requirements', label: 'Requirements', href: '/rules' },
  { key: 'plans', label: 'Plans', href: '/plans/build' },
  { key: 'decisions', label: 'Decisions', href: '/decisions' },
  { key: 'about', label: 'About', href: '/about' },
];

/** A bar of five links under the top bar. The ordinal-spine has no sidebar. */
export function PrimaryNav({ current, items = primaryNavItems, label = 'Primary' }: PrimaryNavProps) {
  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => {
          const isCurrent = item.key === current;
          return (
            <li key={item.key} className={styles.item}>
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
