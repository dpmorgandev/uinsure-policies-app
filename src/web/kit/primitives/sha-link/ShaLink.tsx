import { useId } from 'react';
import { ExternalLink, TriangleAlert } from 'lucide-react';
import styles from './ShaLink.module.css';

export interface ShaDisagreement {
  /** The SHA the other source names. */
  sha: string;
  /** Which source names it, in words: "the verdict detail". */
  source: string;
}

export interface ShaLinkProps {
  /** The short SHA as shown. `null` or `undefined` means the trail holds none. */
  sha?: string | null;
  /** The full 40-character SHA, when the trail holds it. Available to hover and to screen readers. */
  fullSha?: string;
  /** The commit page in this app. */
  href?: string;
  /** The commit on GitHub. */
  githubHref?: string;
  /** Set when two sources name different SHAs for the same event. Both are shown. */
  disagreement?: ShaDisagreement;
  /** Words for a missing SHA. */
  missingLabel?: string;
}

export function ShaLink({ sha, fullSha, href, githubHref, disagreement, missingLabel = 'no SHA' }: ShaLinkProps) {
  const fullId = useId();
  if (sha === undefined || sha === null || sha === '') {
    return (
      <span className={`${styles.sha} ${styles.missing}`} data-state="missing">
        {missingLabel}
      </span>
    );
  }

  const primary = href ?? githubHref;
  const separateGithub = href !== undefined && githubHref !== undefined;
  const github = `Commit ${sha} on GitHub`;
  const describedBy = fullSha ? fullId : undefined;

  return (
    <span className={styles.wrap} data-state={disagreement ? 'disagrees' : 'pop'}>
      {primary ? (
        <a
          className={`${styles.sha} ${styles.link}`}
          href={primary}
          title={fullSha}
          aria-describedby={describedBy}
          aria-label={separateGithub ? undefined : githubHref ? github : undefined}
        >
          {sha}
          {!separateGithub && githubHref ? <ExternalLink className={styles.icon} aria-hidden="true" focusable="false" /> : null}
        </a>
      ) : (
        <span className={styles.sha} title={fullSha} aria-describedby={describedBy}>
          {sha}
        </span>
      )}
      {separateGithub ? (
        <a className={`${styles.ext} ${styles.link}`} href={githubHref} aria-label={github}>
          <ExternalLink className={styles.icon} aria-hidden="true" focusable="false" />
        </a>
      ) : null}
      {fullSha ? (
        <span id={fullId} className={styles.srOnly}>
          Full SHA {fullSha}
        </span>
      ) : null}
      {disagreement ? (
        <span className={styles.differs}>
          <TriangleAlert className={styles.icon} aria-hidden="true" focusable="false" />
          <span>
            Sources differ: {disagreement.source} names <span className={styles.other}>{disagreement.sha}</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
