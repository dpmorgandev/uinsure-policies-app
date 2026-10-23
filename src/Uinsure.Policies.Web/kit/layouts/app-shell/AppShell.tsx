import { useId } from 'react';
import type { ReactNode } from 'react';
import { Footer } from '../footer/Footer';
import type { FooterProps } from '../footer/Footer';
import { PrimaryNav } from '../primary-nav/PrimaryNav';
import type { NavItem } from '../primary-nav/PrimaryNav';
import { TopBar } from '../top-bar/TopBar';
import type { TopBarProps } from '../top-bar/TopBar';
import styles from './AppShell.module.css';

export interface AppShellProps {
  topBar: TopBarProps;
  /** The `key` of the section being shown, and the links the screen offers. The shell holds no routes of its own. */
  nav: { current: string; items: readonly NavItem[] };
  footer: FooterProps;
  /** Words on the skip link, the first stop for the keyboard. */
  skipLabel?: string;
  /** The screen. */
  children: ReactNode;
}

/**
 * The page frame: top bar, navigation, main, footer. It lays out by the width of its own box, so a 1440,
 * 1280 or 390 frame behaves as a window of that width does: the main column is capped and centred, and at
 * 390 the padding tightens and nothing scrolls sideways.
 */
export function AppShell({ topBar, nav, footer, skipLabel = 'Skip to the content', children }: AppShellProps) {
  const mainId = useId();
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href={`#${mainId}`}>
        {skipLabel}
      </a>
      <TopBar {...topBar} />
      <PrimaryNav current={nav.current} items={nav.items} />
      <main id={mainId} className={styles.main} tabIndex={-1}>
        {children}
      </main>
      <Footer {...footer} />
    </div>
  );
}
