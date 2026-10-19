import type { ReactNode } from 'react';
import { ClipboardCheck, Compass, ExternalLink, FileText, Gavel, GitMerge, Pause } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AgentBadge } from '../../primitives/agent-badge/AgentBadge';
import type { AgentName } from '../../primitives/agent-badge/AgentBadge';
import { ShaLink } from '../../primitives/sha-link/ShaLink';
import type { ShaLinkProps } from '../../primitives/sha-link/ShaLink';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import type { Status } from '../../primitives/status-tag/StatusTag';
import { Timestamp } from '../../primitives/timestamp/Timestamp';
import styles from './HumanDecisionRow.module.css';

/** The six decisions a person makes in the loop. Each has its own step word, marker and glyph. */
export type DecisionKind = 'pause-1' | 'pause-2' | 'steer' | 'ruling' | 'sign-off' | 'merge';

export interface DecisionEvidence {
  /** What the link opens, in words or as a path. */
  label: string;
  href: string;
  /** The link leaves this app. Adds the external glyph. */
  external?: boolean;
}

export interface DecisionOutcome {
  status: Status;
  /** The word shown, for example "Accepted" or "Gate failed". */
  label: string;
}

export interface HumanDecisionRowProps {
  kind: DecisionKind;
  /** Who decided. */
  who: AgentName;
  /** A few words after the name: "in the GitHub UI". */
  whoNote?: string;
  /** What was decided, in the trail's own words. */
  what: ReactNode;
  /** When, as the trail holds it. `null` or absent shows that no time was recorded. */
  when?: string | null;
  /** Where it happened: the node, attempt or file. */
  where?: ReactNode;
  /** The loop event or state that records it, in mono: `gate.stub`. */
  event?: string;
  outcome?: DecisionOutcome;
  /** The commit it was made against. Passed straight to `sha-link`, so a disagreement between sources shows. */
  sha?: ShaLinkProps;
  /** Where to read the evidence. */
  evidence?: readonly DecisionEvidence[];
  /** Overrides the ordinal marker. Defaults to the kind's own: P1, P2, ST, RU, OK, PR. */
  marker?: string;
  /** Use `li` when the row sits in an `<ol>` of decisions. */
  as?: 'div' | 'li';
}

interface KindInfo {
  step: string;
  marker: string;
  Glyph: LucideIcon;
}

const KINDS: Record<DecisionKind, KindInfo> = {
  'pause-1': { step: 'Pause 1', marker: 'P1', Glyph: Pause },
  'pause-2': { step: 'Pause 2', marker: 'P2', Glyph: Pause },
  steer: { step: 'Steer', marker: 'ST', Glyph: Compass },
  ruling: { step: 'Rule on it', marker: 'RU', Glyph: Gavel },
  'sign-off': { step: 'Sign off', marker: 'OK', Glyph: ClipboardCheck },
  merge: { step: 'Merge the PR', marker: 'PR', Glyph: GitMerge },
};

const TONES: Record<DecisionKind, string> = {
  'pause-1': styles.pause ?? '',
  'pause-2': styles.pause ?? '',
  steer: styles.steer ?? '',
  ruling: styles.ruling ?? '',
  'sign-off': styles.signOff ?? '',
  merge: styles.merge ?? '',
};

export function HumanDecisionRow({
  kind,
  who,
  whoNote,
  what,
  when,
  where,
  event,
  outcome,
  sha,
  evidence,
  marker,
  as = 'div',
}: HumanDecisionRowProps) {
  const info = KINDS[kind];
  const Root = as;
  const Glyph = info.Glyph;
  const whoWords = who === 'david' ? 'David Morgan' : who;
  const grouping = as === 'div' ? { role: 'group', 'aria-label': `${info.step}, ${whoWords}` } : {};
  const hasWhere = where !== undefined && where !== null && where !== false && where !== '';

  return (
    <Root {...grouping} className={`${styles.row} ${TONES[kind]}`.trim()} data-kind={kind}>
      <div className={styles.lbl}>
        <span className={styles.step}>
          <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
          <span>{info.step}</span>
        </span>
        <span className={styles.who}>
          <AgentBadge agent={who} />
          {whoNote ? <span className={styles.whoNote}>{whoNote}</span> : null}
        </span>
      </div>
      <div className={styles.rail}>
        <span className={styles.mk} aria-hidden="true">
          {marker ?? info.marker}
        </span>
      </div>
      <div className={styles.rcp}>
        {outcome || event || sha ? (
          <div className={styles.line}>
            {outcome ? <StatusTag status={outcome.status}>{outcome.label}</StatusTag> : null}
            {event ? <code className={styles.event}>{event}</code> : null}
            {sha ? <ShaLink {...sha} /> : null}
          </div>
        ) : null}
        <p className={styles.what}>{what}</p>
        <dl className={styles.meta}>
          <div className={styles.fact}>
            <dt>When</dt>
            <dd>
              <Timestamp value={when} />
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>Where</dt>
            <dd>{hasWhere ? where : <span className={styles.missing}>not recorded</span>}</dd>
          </div>
        </dl>
        {evidence && evidence.length > 0 ? (
          <ul className={styles.evidence} aria-label="Evidence">
            {evidence.map((item) => (
              <li key={item.href}>
                <a className={styles.link} href={item.href}>
                  <FileText className={styles.icon} aria-hidden="true" focusable="false" />
                  <span>{item.label}</span>
                  {item.external ? (
                    <>
                      <ExternalLink className={styles.icon} aria-hidden="true" focusable="false" />
                      <span className={styles.srOnly}> (opens GitHub)</span>
                    </>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Root>
  );
}
