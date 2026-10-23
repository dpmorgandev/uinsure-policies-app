import type { ElementType, ReactNode } from 'react';
import { CircleDashed, Clock, Inbox, SearchX, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../primitives/button/Button';
import styles from './EmptyState.module.css';

/** Why there is nothing to show. Each context has its own word and glyph, so colour is never the only signal. */
export type EmptyContext = 'not-built' | 'not-loaded' | 'error' | 'no-matches' | 'empty';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  /** BUSY-1: the action started a process (a retry) that is still running. */
  busy?: boolean;
  /** BUSY-1: what is happening, shown while busy ("Trying again…"). */
  busyLabel?: string;
}

export interface EmptyStateProps {
  context: EmptyContext;
  /** What is absent, in a sentence. */
  title: ReactNode;
  /** Why it is absent. */
  why?: ReactNode;
  /** Where to go instead. */
  to?: { label: string; href: string };
  /** An action that tries again, for a failure the reader can retry. */
  action?: EmptyStateAction;
  /** Makes the title a heading of this level. Without it the title is a bold paragraph. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Less padding and no frame, for use inside a table cell or a bar. */
  compact?: boolean;
}

const WORDS: Record<EmptyContext, string> = {
  'not-built': 'Not built yet',
  'not-loaded': 'Not loaded',
  error: 'Did not load',
  'no-matches': 'No matches',
  empty: 'Nothing here',
};

const GLYPHS: Record<EmptyContext, LucideIcon> = {
  'not-built': CircleDashed,
  'not-loaded': Clock,
  error: TriangleAlert,
  'no-matches': SearchX,
  empty: Inbox,
};

const TONES: Record<EmptyContext, string | undefined> = {
  'not-built': styles.notBuilt,
  'not-loaded': styles.notLoaded,
  error: styles.error,
  'no-matches': styles.noMatches,
  empty: styles.empty,
};

export function EmptyState({ context, title, why, to, action, headingLevel, compact = false }: EmptyStateProps) {
  const Glyph = GLYPHS[context];
  const Title: ElementType = headingLevel ? `h${headingLevel}` : 'p';
  const className = [styles.root, TONES[context], compact ? styles.compact : undefined].filter(Boolean).join(' ');
  return (
    <div className={className} data-context={context} role={context === 'error' ? 'alert' : undefined}>
      <p className={styles.kind}>
        <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
        <span>{WORDS[context]}</span>
      </p>
      <Title className={styles.title}>{title}</Title>
      {why ? <p className={styles.why}>{why}</p> : null}
      {to || action ? (
        <p className={styles.actions}>
          {action ? (
            <Button variant="secondary" onClick={action.onClick} busy={action.busy} busyLabel={action.busyLabel}>
              {action.label}
            </Button>
          ) : null}
          {to ? (
            <a className={styles.link} href={to.href}>
              {to.label}
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
