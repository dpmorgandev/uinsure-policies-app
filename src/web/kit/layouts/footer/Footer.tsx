import { ExternalLink, FileText, Info } from 'lucide-react';
import { CompiledAtStamp } from '../compiled-at-stamp/CompiledAtStamp';
import type { CompiledAtStampProps } from '../compiled-at-stamp/CompiledAtStamp';
import styles from './Footer.module.css';

export interface FooterProps {
  /** The snapshot's SHA and time (DATA-3). Leave it out, or set `noSnapshot`, when no trace was read. */
  compiledAt?: CompiledAtStampProps;
  /**
   * HONEST-1: no trace was read (trace.json is loading or unreadable). The footer states that in words and
   * shows no commit link, no time and no "Snapshot compiled from". The two links below stay.
   */
  noSnapshot?: boolean;
  /** Words for the no-snapshot state. */
  noSnapshotLabel?: string;
  /** Where the provenance of the data is explained. */
  provenanceHref: string;
  provenanceLabel?: string;
  /** The repository on GitHub. */
  repoHref: string;
  repoLabel?: string;
}

export function Footer({
  compiledAt,
  noSnapshot = false,
  noSnapshotLabel = "No snapshot: trace.json hasn't been read.",
  provenanceHref,
  provenanceLabel = 'Sources and provenance',
  repoHref,
  repoLabel = 'Repository on GitHub',
}: FooterProps) {
  const showNone = noSnapshot || compiledAt === undefined;
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {showNone ? (
          <p className={styles.none} data-state="no-snapshot">
            <Info className={styles.noneIcon} aria-hidden="true" focusable="false" />
            <span>{noSnapshotLabel}</span>
          </p>
        ) : (
          <CompiledAtStamp {...compiledAt} />
        )}
        <ul className={styles.links}>
          <li>
            <a className={styles.link} href={provenanceHref}>
              <FileText className={styles.icon} aria-hidden="true" focusable="false" />
              <span>{provenanceLabel}</span>
            </a>
          </li>
          <li>
            <a className={styles.link} href={repoHref}>
              <ExternalLink className={styles.icon} aria-hidden="true" focusable="false" />
              <span>{repoLabel}</span>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
