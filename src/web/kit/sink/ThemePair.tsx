import type { JSX, ReactNode } from 'react';
import styles from './ThemePair.module.css';

export const THEMES = ['light', 'dark'] as const;

export type ThemePairProps = {
  children: ReactNode;
  // When given, each pane wraps the children in an element carrying this data-comp tag.
  comp?: string;
};

// The same content twice, once under data-theme="light" and once under data-theme="dark", side by side.
export function ThemePair({ children, comp }: ThemePairProps): JSX.Element {
  return (
    <div className={styles.pair}>
      {THEMES.map((theme) => (
        <div key={theme} data-theme={theme} className={styles.pane}>
          <p className={styles.label}>{theme}</p>
          {comp === undefined ? children : (
            <div data-comp={comp} className={styles.comp}>
              {children}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
