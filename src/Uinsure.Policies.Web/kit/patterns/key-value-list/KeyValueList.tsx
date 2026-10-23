import type { ReactNode } from 'react';
import { CircleDashed } from 'lucide-react';
import styles from './KeyValueList.module.css';

export interface KeyValueItem {
  /** The field's name. */
  label: ReactNode;
  /** The field's value. `null`, `undefined` or an empty string means the source holds none. */
  value?: ReactNode | null;
  /** Set the value in the mono face with tabular figures, for IDs, SHAs, dates and amounts. */
  mono?: boolean;
  /** Words for this field when it has no value, replacing `missingLabel`: "not in the excerpt". */
  missing?: string;
}

export interface KeyValueListProps {
  items: KeyValueItem[];
  /** Words for a field with no value, unless the item gives its own. */
  missingLabel?: string;
}

function isMissing(value: ReactNode | null | undefined): boolean {
  return value === undefined || value === null || value === '' || value === false;
}

export function KeyValueList({ items, missingLabel = 'not in this data' }: KeyValueListProps) {
  return (
    <dl className={styles.root}>
      {items.map((item, index) => {
        const missing = isMissing(item.value);
        return (
          <div key={index} className={styles.group} data-missing={missing ? 'true' : 'false'}>
            <dt className={styles.term}>{item.label}</dt>
            <dd className={item.mono && !missing ? `${styles.value} ${styles.mono}` : styles.value}>
              {missing ? (
                <span className={styles.gap}>
                  <CircleDashed className={styles.icon} aria-hidden="true" focusable="false" />
                  <span>{item.missing ?? missingLabel}</span>
                </span>
              ) : (
                item.value
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
