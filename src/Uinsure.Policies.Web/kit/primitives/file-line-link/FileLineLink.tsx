import { ExternalLink } from 'lucide-react';
import styles from './FileLineLink.module.css';

export interface FileLineLinkProps {
  /** The repo path as the trail gives it. */
  path: string;
  /** The line, when the source names one. Without it only the path is shown. */
  line?: number | null;
  /** The file on GitHub at the SHA the finding names, built by the caller. */
  href: string;
}

export function FileLineLink({ path, line, href }: FileLineLinkProps) {
  const hasLine = line !== undefined && line !== null;
  const text = hasLine ? `${path}:${line}` : path;
  return (
    <a
      className={styles.link}
      href={href}
      aria-label={`${text} on GitHub`}
      data-line={hasLine ? 'present' : 'absent'}
    >
      <span className={styles.text}>{text}</span>
      <ExternalLink className={styles.icon} aria-hidden="true" focusable="false" />
    </a>
  );
}
