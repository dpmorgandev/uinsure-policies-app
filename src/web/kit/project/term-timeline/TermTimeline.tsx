import { useId } from 'react';
import { Ban, CalendarCheck, Flag, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Money } from '../../primitives/money/Money';
import { RuleChip } from '../../primitives/rule-chip/RuleChip';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import { Timestamp } from '../../primitives/timestamp/Timestamp';
import styles from './TermTimeline.module.css';

export interface TimelinePayment {
  /** `Card`, `DirectDebit` or `Cheque`, as the API wrote it. */
  type: string;
  /** `PAY-` and 32 hex characters, or as much of it as the source shows. */
  reference?: string | null;
  /** The payment's amount, as written. */
  amount?: string | null;
}

export interface TimelineTerm {
  termNumber: number;
  /** `yyyy-MM-dd`, as the API returned it. */
  startDate: string;
  endDate: string;
  /** The term's amount, as written. */
  amount: string;
  /** The payment linked to the term. `null` or absent means the term is unpaid (`paymentReference` is null). */
  payment?: TimelinePayment | null;
}

export interface TimelineClaim {
  reference: string;
  claimDate: string;
  description?: string | null;
}

export interface TimelineCancellation {
  cancellationDate: string;
  ruleApplied?: string | null;
  totalRefund?: string | null;
}

export interface TermTimelineProps {
  terms: readonly TimelineTerm[];
  claims?: readonly TimelineClaim[];
  /** The policy's cancellation. Cover after this date is drawn as a gap. */
  cancellation?: TimelineCancellation | null;
  /** Names the list for assistive technology. */
  policyReference?: string;
}

type Entry =
  | { kind: 'start'; date: string; term: TimelineTerm }
  | { kind: 'end'; date: string; term: TimelineTerm }
  | { kind: 'claim'; date: string; claim: TimelineClaim }
  | { kind: 'cancel'; date: string; cancellation: TimelineCancellation };

type Segment = 'paid' | 'unpaid' | 'gap' | 'none';

interface Rung {
  key: string;
  entry: Entry | null;
  /** What the rail below this rung is: cover that is paid, cover that is unpaid, no cover, or nothing. */
  segment: Segment;
  ordinal: number;
}

const RANK: Record<Entry['kind'], number> = { start: 0, claim: 1, cancel: 2, end: 3 };

function entriesOf(
  terms: readonly TimelineTerm[],
  claims: readonly TimelineClaim[],
  cancellation: TimelineCancellation | null | undefined,
): Entry[] {
  const all: Entry[] = [];
  for (const term of terms) {
    all.push({ kind: 'start', date: term.startDate, term });
    all.push({ kind: 'end', date: term.endDate, term });
  }
  for (const claim of claims) all.push({ kind: 'claim', date: claim.claimDate, claim });
  if (cancellation) all.push({ kind: 'cancel', date: cancellation.cancellationDate, cancellation });
  // Only an order: the dates are the API's, compared as the text they are (yyyy-MM-dd sorts as written).
  return all
    .map((entry, position) => ({ entry, position }))
    .sort((a, b) => {
      if (a.entry.date !== b.entry.date) return a.entry.date < b.entry.date ? -1 : 1;
      if (RANK[a.entry.kind] !== RANK[b.entry.kind]) return RANK[a.entry.kind] - RANK[b.entry.kind];
      return a.position - b.position;
    })
    .map(({ entry }) => entry);
}

function ruler(entries: readonly Entry[]): Rung[] {
  const rungs: Rung[] = [];
  let open: TimelineTerm | null = null;
  let cancelled = false;
  let ordinal = 0;
  entries.forEach((entry, position) => {
    ordinal += 1;
    if (entry.kind === 'start') open = entry.term;
    if (entry.kind === 'end') open = null;
    if (entry.kind === 'cancel') cancelled = true;
    const segment: Segment = cancelled ? 'gap' : open ? (open.payment ? 'paid' : 'unpaid') : 'none';
    rungs.push({ key: `${entry.kind}-${position}`, entry, segment, ordinal });
    const next = entries[position + 1];
    // A gap is drawn only when cover would otherwise have run on past the cancellation date.
    if (entry.kind === 'cancel' && next !== undefined && next.date !== entry.date) {
      rungs.push({ key: `gap-${position}`, entry: null, segment: 'gap', ordinal: 0 });
    }
  });
  return rungs;
}

interface Words {
  step: string;
  Glyph: LucideIcon;
}

function wordsOf(entry: Entry): Words {
  switch (entry.kind) {
    case 'start':
      return { step: `Term ${entry.term.termNumber} starts`, Glyph: Flag };
    case 'end':
      return { step: `Term ${entry.term.termNumber} ends`, Glyph: CalendarCheck };
    case 'claim':
      return { step: 'Claim recorded', Glyph: ShieldAlert };
    case 'cancel':
      return { step: 'Cancelled', Glyph: Ban };
  }
}

function Receipt({ entry }: { entry: Entry }) {
  switch (entry.kind) {
    case 'start': {
      const { term } = entry;
      const payment = term.payment;
      return (
        <>
          <p className={styles.line}>
            <Timestamp value={entry.date} />
            <Money value={term.amount} />
            {payment ? <StatusTag status="pass">Paid</StatusTag> : <StatusTag status="warn">Unpaid</StatusTag>}
          </p>
          {payment ? (
            <p className={styles.detail}>
              <span>{payment.type}</span>
              {payment.reference ? <span className={styles.mono}>{payment.reference}</span> : null}
              {payment.amount ? <Money value={payment.amount} /> : null}
              {!payment.reference ? <span className={styles.note}>payment reference not shown in the source</span> : null}
            </p>
          ) : (
            <p className={styles.detail}>
              <span className={styles.note}>paymentReference is null: no payment is linked to this term</span>
            </p>
          )}
        </>
      );
    }
    case 'end':
      return (
        <p className={styles.line}>
          <Timestamp value={entry.date} />
        </p>
      );
    case 'claim':
      return (
        <>
          <p className={styles.line}>
            <Timestamp value={entry.date} />
            <span className={styles.mono}>{entry.claim.reference}</span>
          </p>
          <p className={styles.detail}>
            {entry.claim.description ? (
              <span>{entry.claim.description}</span>
            ) : (
              <span className={styles.note}>no description</span>
            )}
          </p>
        </>
      );
    case 'cancel':
      return (
        <>
          <p className={styles.line}>
            <Timestamp value={entry.date} />
            <StatusTag status="fail">Cancelled</StatusTag>
            {entry.cancellation.ruleApplied ? <RuleChip ruleId={entry.cancellation.ruleApplied} /> : null}
          </p>
          <p className={styles.detail}>
            {entry.cancellation.totalRefund ? (
              <span>
                Total refund <Money value={entry.cancellation.totalRefund} />
              </span>
            ) : null}
            <span className={styles.note}>cover stops on this date</span>
          </p>
        </>
      );
  }
}

/**
 * One policy as a list of the dates the API returned, oldest first. Position is the order of the dates, not a
 * scale: no bar is longer for a longer term. No window (cooling-off, renewal) is drawn, because the API does not
 * return one; a quote asks it.
 */
export function TermTimeline({ terms, claims = [], cancellation, policyReference }: TermTimelineProps) {
  const captionId = useId();
  const rungs = ruler(entriesOf(terms, claims, cancellation));
  const cancelled = Boolean(cancellation);
  const state = cancelled ? 'cancelled' : claims.length > 0 ? 'claims' : terms.length > 1 ? 'several' : 'one';

  return (
    <figure className={styles.root} data-state={state} aria-labelledby={captionId}>
      <figcaption id={captionId} className={styles.caption}>
        <strong>{policyReference ? `Dates for ${policyReference}, oldest first.` : 'Dates, oldest first.'}</strong>{' '}
        Only dates the API returned. The rungs are in date order, not drawn to scale.
      </figcaption>
      <ol className={styles.spine} aria-label={policyReference ? `Dates for ${policyReference}` : 'Dates'}>
        {rungs.map((rung) => {
          if (rung.entry === null) {
            return (
              <li key={rung.key} className={`${styles.rung} ${styles.gap}`} data-segment={rung.segment} data-kind="gap">
                <div className={styles.lbl} />
                <div className={styles.rail} />
                <div className={styles.rcp}>No cover after the cancellation date</div>
              </li>
            );
          }
          const { step, Glyph } = wordsOf(rung.entry);
          return (
            <li key={rung.key} className={styles.rung} data-segment={rung.segment} data-kind={rung.entry.kind}>
              <div className={styles.lbl}>
                <span className={styles.step}>
                  <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
                  <span>{step}</span>
                </span>
              </div>
              <div className={styles.rail}>
                <span className={styles.mk} aria-hidden="true">
                  #{rung.ordinal}
                </span>
              </div>
              <div className={styles.rcp}>
                <Receipt entry={rung.entry} />
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
