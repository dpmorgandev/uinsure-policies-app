import { ExternalLink, FileText } from 'lucide-react';
import { CompiledAtStamp } from '../compiled-at-stamp/CompiledAtStamp';
import type { CompiledAtStampProps } from '../compiled-at-stamp/CompiledAtStamp';
import styles from './Footer.module.css';

export interface FooterProps {
  /** The snapshot's SHA and time (DATA-3). */
  compiledAt: CompiledAtStampProps;
  /** Where the provenance of the data is explained. */
  provenanceHref: string;
  provenanceLabel?: string;
  /** The repository on GitHub. */
  repoHref: string;
  repoLabel?: string;
}

export function Footer({
  compiledAt,
  provenanceHref,
  provenanceLabel = 'Sources and provenance',
  repoHref,
  repoLabel = 'Repository on GitHub',
}: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <CompiledAtStamp {...compiledAt} />
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
