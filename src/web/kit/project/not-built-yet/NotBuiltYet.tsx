import type { ReactNode } from 'react';
import { CircleDashed } from 'lucide-react';
import styles from './NotBuiltYet.module.css';

export type NotBuiltKind = 'rule' | 'node' | 'region' | 'nav entry';

export interface NotBuiltYetProps {
  kind: NotBuiltKind;
  /** The rule ID, node ID, region name or nav entry label that is not built. */
  name: string;
  /** Replaces the default sentence under the words "not built yet". */
  children?: ReactNode;
  /** A way back, for a page that has nothing else to show. */
  back?: { href: string; label: string };
}

function sentence(kind: Exclude<NotBuiltKind, 'nav entry'>, name: string): ReactNode {
  const id = <span className={styles.mono}>{name}</span>;
  switch (kind) {
    case 'rule':
      return <>Rule {id} has no red, green, refactor, QA step or sign-off to show.</>;
    case 'node':
      return <>Node {id} has no commits, gates or verdicts to show.</>;
    case 'region':
      return <>{id} has nothing to show yet.</>;
  }
}

/**
 * The one pattern for something that is not built: a dashed neutral outline and the words "not built yet".
 * A missing step is a gap, never a failure.
 */
export function NotBuiltYet({ kind, name, children, back }: NotBuiltYetProps) {
  if (kind === 'nav entry') {
    return (
      <span className={styles.nav} data-kind={kind}>
        <CircleDashed className={styles.icon} aria-hidden="true" focusable="false" />
        <span className={styles.mono}>{name}</span>
        <span className={styles.words}>not built yet</span>
      </span>
    );
  }
  return (
    <div className={styles.box} data-kind={kind}>
      <p className={styles.head}>
        <CircleDashed className={styles.icon} aria-hidden="true" focusable="false" />
        <strong>not built yet</strong>
      </p>
      <p className={styles.text}>{children ?? sentence(kind, name)}</p>
      {back ? (
        <p className={styles.back}>
          <a href={back.href}>{back.label}</a>
        </p>
      ) : null}
    </div>
  );
}
