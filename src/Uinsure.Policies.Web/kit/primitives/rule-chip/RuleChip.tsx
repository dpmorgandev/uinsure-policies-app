import { CircleDashed, CircleHelp } from 'lucide-react';
import styles from './RuleChip.module.css';

export type RuleChipStatus = 'built' | 'nb' | 'unknown';

export interface RuleChipProps {
  ruleId: string;
  /**
   * built: the rule has a page with a trail. nb: the rule exists but is not built yet, so its page says so.
   * unknown: the ID matches no rule, so there is no page to link to.
   */
  status?: RuleChipStatus;
  /** The rule page. Defaults to `/rules/<ruleId>`. */
  href?: string;
}

export function RuleChip({ ruleId, status = 'built', href }: RuleChipProps) {
  if (status === 'unknown') {
    return (
      <span className={`${styles.chip} ${styles.unknown}`} data-status="unknown">
        <CircleHelp className={styles.icon} aria-hidden="true" focusable="false" />
        <span>{ruleId}</span>
        <span className={styles.srOnly}> (unknown rule ID, no page)</span>
      </span>
    );
  }
  const target = href ?? `/rules/${encodeURIComponent(ruleId)}`;
  const notBuilt = status === 'nb';
  return (
    <a className={`${styles.chip} ${styles.link} ${notBuilt ? styles.nb : ''}`.trim()} href={target} data-status={status}>
      {notBuilt ? <CircleDashed className={styles.icon} aria-hidden="true" focusable="false" /> : null}
      <span>{ruleId}</span>
      {notBuilt ? <span className={styles.srOnly}> (not built yet)</span> : null}
    </a>
  );
}
