import type { ReactNode } from 'react';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: ReactNode;
  /** Every level links to its own page. Only the last level may leave it out. */
  href?: string;
  /** Set the label in the mono face, for IDs such as a rule or a node. */
  mono?: boolean;
}

export interface BreadcrumbsProps {
  /** The path from the overview down to this page: plan, node, view. The last item is the current page. */
  items: BreadcrumbItem[];
  /** Names the landmark. */
  label?: string;
}

export function Breadcrumbs({ items, label = 'Breadcrumb' }: BreadcrumbsProps) {
  const lastIndex = items.length - 1;
  return (
    <nav className={styles.root} aria-label={label}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const current = index === lastIndex;
          const content = item.mono ? <span className={styles.mono}>{item.label}</span> : item.label;
          return (
            <li key={index} className={styles.item}>
              {index > 0 ? (
                <span className={styles.sep} aria-hidden="true">
                  /
                </span>
              ) : null}
              {item.href ? (
                <a className={styles.link} href={item.href} aria-current={current ? 'page' : undefined}>
                  {content}
                </a>
              ) : (
                <span className={styles.here} aria-current={current ? 'page' : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
