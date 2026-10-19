import { ShaLink } from '../../primitives/sha-link/ShaLink';
import { Timestamp } from '../../primitives/timestamp/Timestamp';
import styles from './CompiledAtStamp.module.css';

export interface CompiledAtStampProps {
  /** The short SHA the snapshot was compiled from. `null` or `undefined` means the data holds none. */
  sha?: string | null;
  /** The full 40-character SHA, when the data holds it. */
  fullSha?: string;
  /** The commit on GitHub. */
  commitHref?: string;
  /**
   * When the snapshot was compiled, as the trail holds it (an ISO instant such as "2026-10-19T00:07:57Z").
   * `null` or `undefined` means none was recorded. The UTC time shows from the start.
   */
  time?: string | null;
  /** Words for a missing SHA. */
  missingShaLabel?: string;
}

/** DATA-3: the snapshot's SHA and time, so the reader knows the page is not live. */
export function CompiledAtStamp({
  sha,
  fullSha,
  commitHref,
  time,
  missingShaLabel = 'snapshot SHA not recorded',
}: CompiledAtStampProps) {
  const hasSha = sha !== undefined && sha !== null && sha !== '';
  return (
    <p className={styles.stamp} data-state={hasSha ? 'pop' : 'no-sha'}>
      <span className={styles.label}>Snapshot compiled from</span>
      <ShaLink sha={sha} fullSha={fullSha} githubHref={commitHref} missingLabel={missingShaLabel} />
      <span className={styles.label}>at</span>
      <Timestamp value={time} defaultShowUtc />
    </p>
  );
}
