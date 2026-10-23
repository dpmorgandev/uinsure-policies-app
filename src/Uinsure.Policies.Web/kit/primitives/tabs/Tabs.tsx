import { Minus } from 'lucide-react';
import styles from './Tabs.module.css';

export interface TabItem {
  /** Stable identifier, matched against `current`. */
  key: string;
  label: string;
  /** The route this view lives at. */
  href: string;
  /** The view has nothing to show for this node. It stays a link, and says so. */
  empty?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** The `key` of the view being shown. */
  current: string;
  /** Names the navigation landmark. */
  label?: string;
}

export function Tabs({ items, current, label = 'Views of this node' }: TabsProps) {
  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => {
          const isCurrent = item.key === current;
          const className = [styles.tab, isCurrent ? styles.current : undefined, item.empty ? styles.empty : undefined]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={item.key} className={styles.item}>
              <a
                className={className}
                href={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                data-empty={item.empty ? 'true' : undefined}
              >
                <span>{item.label}</span>
                {item.empty ? (
                  <span className={styles.emptyNote}>
                    <Minus className={styles.icon} aria-hidden="true" focusable="false" />
                    <span>empty</span>
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
