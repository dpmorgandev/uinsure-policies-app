import { useId } from 'react';
import { TriangleAlert, WifiOff } from 'lucide-react';
import { Button } from '../../primitives/button/Button';
import { RuleChip } from '../../primitives/rule-chip/RuleChip';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import styles from './ProblemBanner.module.css';

export interface ProblemExtension {
  name: string;
  value: string;
}

export interface ProblemBannerProps {
  /** The problem's title as the API sent it: "Policy already cancelled". */
  title: string;
  /** The API's `detail`. Shown as written, and never read for values. */
  detail?: string;
  /** The HTTP status: 404, 409, 429, 500. Leave out when the API did not answer. */
  status?: number;
  /** The rule the problem is under, as a chip. */
  ruleId?: string;
  /** Where the rule chip links (a hash-routed app passes `#/rules/<id>`). Leave out to keep the chip's default `/rules/<id>`. */
  ruleHref?: string;
  /** Values the API sent as extensions (`cancellationDate`, `instance`), each shown as sent. */
  extensions?: readonly ProblemExtension[];
  /** The API did not answer: no status, a dashed edge and "No response". */
  unreachable?: boolean;
  headingLevel?: 2 | 3 | 4;
  /** Offers a retry. BUSY-1 applies: while `retrying` it is disabled, busy and says what is happening. */
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  retryingLabel?: string;
}

/** A record-level problem: it stops the walk on its rung and says what happened, in the API's own words. */
export function ProblemBanner({
  title,
  detail,
  status,
  ruleId,
  ruleHref,
  extensions,
  unreachable = false,
  headingLevel = 3,
  onRetry,
  retryLabel = 'Try again',
  retrying = false,
  retryingLabel = 'Trying again…',
}: ProblemBannerProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const Glyph = unreachable ? WifiOff : TriangleAlert;
  const hasExtensions = extensions !== undefined && extensions.length > 0;
  return (
    <div
      role="alert"
      aria-labelledby={titleId}
      className={styles.root}
      data-kind={unreachable ? 'unreachable' : 'problem'}
      data-status={status !== undefined ? String(status) : undefined}
    >
      <Heading id={titleId} className={styles.title}>
        <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
        {title}
      </Heading>
      <div className={styles.tags}>
        {status !== undefined ? <StatusTag status="fail">{String(status)}</StatusTag> : null}
        {unreachable ? <StatusTag status="fail">No response</StatusTag> : null}
        {ruleId !== undefined ? <RuleChip ruleId={ruleId} href={ruleHref} /> : null}
      </div>
      {detail !== undefined ? <p className={styles.detail}>{detail}</p> : null}
      {hasExtensions ? (
        <dl className={styles.ext}>
          {extensions.map((extension) => (
            <div key={extension.name} className={styles.pair}>
              <dt>{extension.name}</dt>
              <dd>{extension.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {onRetry ? (
        <div className={styles.actions}>
          <Button busy={retrying} busyLabel={retryingLabel} onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
