import { useId } from 'react';
import type { ReactNode } from 'react';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import styles from './SourcesDisagree.module.css';

export interface SourceClaim {
  /** Where the claim comes from, in words: "loop log, merged(…) event". */
  source: string;
  /** What that source says, as it says it. */
  says: ReactNode;
  /** When the source was written or compiled, if it says. */
  when?: ReactNode;
}

export interface SourcesDisagreeProps {
  /** The fact the two sources disagree about: "PR #17". */
  fact: string;
  /** The value derived from events. It is shown first. */
  derived: SourceClaim;
  /** The other source: a generated header, a document, a stale field. */
  other: SourceClaim;
  /** The level of the heading that names the fact. */
  headingLevel?: 2 | 3 | 4;
}

function Claim({ claim, role, n }: { claim: SourceClaim; role: string; n: number }) {
  return (
    <li className={styles.claim}>
      <span className={styles.n} aria-hidden="true">
        {n}
      </span>
      <div className={styles.claimBody}>
        <p className={styles.role}>{role}</p>
        <p className={styles.source}>{claim.source}</p>
        {claim.when ? <p className={styles.when}>{claim.when}</p> : null}
        <div className={styles.says}>{claim.says}</div>
      </div>
    </li>
  );
}

/** Two sources that conflict. Both are shown, the event-derived value first, each with its source. None is picked. */
export function SourcesDisagree({ fact, derived, other, headingLevel = 3 }: SourcesDisagreeProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <Heading id={headingId} className={styles.title}>
        <span>{fact}</span>
        <StatusTag status="warn">Sources disagree</StatusTag>
      </Heading>
      <p className={styles.lead}>Both are shown and none is picked. The value derived from events comes first.</p>
      <ol className={styles.claims} aria-label={`What the sources say about ${fact}`}>
        <Claim claim={derived} role="Derived from events" n={1} />
        <Claim claim={other} role="Also stated by" n={2} />
      </ol>
    </section>
  );
}
