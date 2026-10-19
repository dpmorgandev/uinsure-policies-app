import type { ReactNode } from 'react';
import { CircleDashed, Radio } from 'lucide-react';
import { ProvenanceLabel } from '../../primitives/provenance-label/ProvenanceLabel';
import type { Provenance } from '../../primitives/provenance-label/ProvenanceLabel';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import type { Status } from '../../primitives/status-tag/StatusTag';
import { Timestamp } from '../../primitives/timestamp/Timestamp';
import styles from './PageHeader.module.css';

export interface PageHeaderId {
  /** Which ID it is: "Policy", "Rule", "PR". */
  label: string;
  /** The ID as the source writes it. `null`, `undefined` or an empty string means the source holds none. */
  value?: string | null;
  /** Makes the ID a link to its own page. */
  href?: string;
  /** Words for an ID with no value, replacing `missingLabel`. */
  missing?: string;
}

export interface PageHeaderProps {
  /** The page's one h1. */
  title: ReactNode;
  /** A line above the title: where this view sits ("Workbench · Quote and cancel"). */
  eyebrow?: ReactNode;
  /** The question the page answers (M6: summary first). */
  question?: ReactNode;
  /** The answer in one sentence, set large, so the page opens on it. */
  answer?: ReactNode;
  /** The entity's status. `null` or absent shows a gap that says the status is not in the data. */
  status?: { value: Status; label?: string } | null;
  /** The key IDs of the entity, shown as labelled fields. */
  ids?: PageHeaderId[];
  /**
   * compiled: built from the trail at a moment, and stamped with it. live: read from the API as it is used,
   * so there is no compiled-at stamp to show.
   */
  mode?: 'compiled' | 'live';
  /** compiled only: the stamp, in any form the Timestamp primitive reads. `null` or absent shows a gap. */
  compiledAt?: string | null;
  /** compiled only: the script that wrote the page's data. */
  compiledBy?: string;
  /** compiled only: how the stamp was made. */
  provenance?: Provenance;
  /** Words for a stamp or status that is absent, unless the field gives its own. */
  missingLabel?: string;
  /** live only: what "live" means for this page. */
  liveNote?: ReactNode;
  /** Words under the fields, for anything the header cannot say with them. */
  note?: ReactNode;
}

function Gap({ children }: { children: ReactNode }) {
  return (
    <span className={styles.gap}>
      <CircleDashed className={styles.icon} aria-hidden="true" focusable="false" />
      <span>{children}</span>
    </span>
  );
}

export function PageHeader({
  title,
  eyebrow,
  question,
  answer,
  status,
  ids = [],
  mode = 'compiled',
  compiledAt,
  compiledBy,
  provenance = 'generated',
  missingLabel = "not in this screen's data",
  liveNote = 'read from the API as you use it, not compiled from the trail',
  note,
}: PageHeaderProps) {
  const stamped = compiledAt !== undefined && compiledAt !== null && compiledAt.trim() !== '';
  return (
    <header className={styles.root} data-mode={mode}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h1 className={styles.title}>{title}</h1>
      {question ? (
        <p className={styles.question}>
          <strong>Question.</strong> {question}
        </p>
      ) : null}
      {answer ? <p className={styles.answer}>{answer}</p> : null}
      <dl className={styles.meta}>
        <div className={styles.field}>
          <dt>Status</dt>
          <dd>
            {status ? <StatusTag status={status.value}>{status.label}</StatusTag> : <Gap>{missingLabel}</Gap>}
          </dd>
        </div>
        {ids.map((id) => {
          const present = id.value !== undefined && id.value !== null && id.value !== '';
          return (
            <div className={styles.field} key={id.label}>
              <dt>{id.label}</dt>
              <dd>
                {!present ? (
                  <Gap>{id.missing ?? missingLabel}</Gap>
                ) : id.href ? (
                  <a className={styles.mono} href={id.href}>
                    {id.value}
                  </a>
                ) : (
                  <span className={styles.mono}>{id.value}</span>
                )}
              </dd>
            </div>
          );
        })}
        {mode === 'live' ? (
          <div className={styles.field}>
            <dt>Data</dt>
            <dd>
              <span className={styles.live}>
                <Radio className={styles.icon} aria-hidden="true" focusable="false" />
                <span>Live</span>
              </span>{' '}
              <span className={styles.liveNote}>{liveNote}</span>
            </dd>
          </div>
        ) : (
          <div className={styles.field}>
            <dt>Compiled at</dt>
            <dd className={styles.stamp}>
              {stamped ? <Timestamp value={compiledAt} /> : <Gap>{missingLabel}</Gap>}
              {stamped ? <ProvenanceLabel provenance={provenance} showMeaning={false} /> : null}
              {stamped && compiledBy ? (
                <span>
                  by <code className={styles.mono}>{compiledBy}</code>
                </span>
              ) : null}
            </dd>
          </div>
        )}
      </dl>
      {note ? <p className={styles.note}>{note}</p> : null}
    </header>
  );
}
