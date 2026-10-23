import { useId } from 'react';
import type { ReactNode } from 'react';
import { Money } from '../../primitives/money/Money';
import { RuleChip } from '../../primitives/rule-chip/RuleChip';
import styles from './RefundWorkedSum.module.css';

/** The rules the API names on a term line. Any other string is shown as given, with an unknown-rule chip. */
export type RefundRule = 'CANCEL-1a' | 'CANCEL-1b' | 'CANCEL-1c' | 'COULD-2' | 'UNPAID-TERM';

/** One term's line from a cancellation or a quote, plus the term's amount, which the line itself does not carry. */
export interface RefundTermLine {
  termNumber: number;
  ruleApplied: RefundRule | (string & {});
  /** The term's amount, as written. `null` or absent when the source does not show it. */
  amount?: string | null;
  daysInTerm?: number | null;
  daysUsed?: number | null;
  unusedDays?: number | null;
  /** The refund exactly as the API wrote it: "445.11", "0.00". */
  refundAmount: string;
}

export interface RefundWorkedSumProps {
  terms: readonly RefundTermLine[];
  /** The total refund as written. Adds a total row. */
  totalRefund?: string | null;
  /** A line under the sums, for example how the API rounded. */
  note?: ReactNode;
  /** Names the table. */
  caption?: string;
  /**
   * Where each rule chip links, given the rule ID. Return `undefined` (or leave the prop out) to keep the chip's own
   * default, `/rules/<ruleId>`. A rule the kit does not recognise is not a link, so it is never asked.
   */
  ruleHref?: (ruleId: string) => string | undefined;
}

interface RuleInfo {
  /** The rule says the refund is zero, whatever the sum would give. */
  zero: boolean;
  words: string;
}

const KNOWN: Record<RefundRule, RuleInfo> = {
  'CANCEL-1a': { zero: false, words: 'Refunded in full: the cancellation date is before the term starts.' },
  'CANCEL-1b': { zero: false, words: 'Refunded in full: the cancellation date is inside the cooling-off period after the term starts.' },
  'CANCEL-1c': {
    zero: false,
    words: 'After cooling-off: pro-rata for the unused days. The cancellation day counts as used.',
  },
  'COULD-2': { zero: true, words: 'A claim is recorded on this policy, so the refund is zero.' },
  'UNPAID-TERM': { zero: true, words: 'This term was never paid, so there is nothing to refund.' },
};

function infoFor(rule: string): RuleInfo | null {
  return (KNOWN as Record<string, RuleInfo | undefined>)[rule] ?? null;
}

function Operand({ value, label }: { value: string | number | null | undefined; label: string }) {
  const given = value !== undefined && value !== null;
  return (
    <span className={styles.val}>
      <b className={given ? undefined : styles.na}>
        {given ? (
          value
        ) : (
          <>
            <span aria-hidden="true">{'—'}</span>
            <span className={styles.srOnly}>not in this response</span>
          </>
        )}
      </b>
      <small>{label}</small>
    </span>
  );
}

function spoken(value: string | number | null | undefined, label: string): string {
  return value === undefined || value === null ? `${label} not given` : String(value);
}

function Cell({ value }: { value: string | number | null | undefined }) {
  return value === undefined || value === null ? <span className={styles.none}>not given</span> : <>{value}</>;
}

export function RefundWorkedSum({
  terms,
  totalRefund,
  note,
  caption = "Refund per term, from the quote's own fields",
  ruleHref,
}: RefundWorkedSumProps) {
  const captionId = useId();
  const hasTotal = totalRefund !== undefined && totalRefund !== null && totalRefund !== '';

  return (
    <figure className={styles.root} data-state={hasTotal ? 'total' : terms.length > 1 ? 'several' : 'one'}>
      <ol className={styles.spine} aria-label="The refund, term by term">
        {terms.map((line) => {
          const info = infoFor(line.ruleApplied);
          const zero = info?.zero ?? false;
          const label = zero
            ? `Term ${line.termNumber}: the sum is not used. The refund is ${line.refundAmount}.`
            : `Term ${line.termNumber}: ${spoken(line.amount, 'amount')} times ${spoken(line.unusedDays, 'unused days')} divided by ${spoken(line.daysInTerm, 'days in term')} equals ${line.refundAmount}.`;
          return (
            <li key={line.termNumber} className={styles.rung} data-rule={line.ruleApplied} data-zero={zero ? 'true' : undefined}>
              <div className={styles.lbl}>
                <span className={styles.step}>Term {line.termNumber}</span>
                <RuleChip
                  ruleId={line.ruleApplied}
                  status={info ? 'built' : 'unknown'}
                  href={info ? ruleHref?.(line.ruleApplied) : undefined}
                />
              </div>
              <div className={styles.rail}>
                <span className={styles.mk} aria-hidden="true">
                  {line.termNumber}
                </span>
              </div>
              <div className={styles.rcp}>
                <div className={styles.eq} role="group" aria-label={label} data-used={zero ? 'false' : 'true'}>
                  <Operand value={line.amount} label="amount" />
                  <span className={styles.op} aria-hidden="true">
                    ×
                  </span>
                  <Operand value={line.unusedDays} label="unusedDays" />
                  <span className={styles.op} aria-hidden="true">
                    ÷
                  </span>
                  <Operand value={line.daysInTerm} label="daysInTerm" />
                  <span className={styles.op} aria-hidden="true">
                    =
                  </span>
                  <span className={`${styles.val} ${styles.res}`}>
                    <b>
                      <Money value={line.refundAmount} />
                    </b>
                    <small>refundAmount</small>
                  </span>
                </div>
                {zero ? <p className={styles.unused}>The sum above is not what set the refund: the rule did.</p> : null}
                <p className={styles.words}>{info ? info.words : 'Rule not recognised: shown as the API sent it.'}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {note ? <p className={styles.note}>{note}</p> : null}
      <div className={styles.frame} role="region" aria-labelledby={captionId} tabIndex={0}>
        <table className={styles.table}>
          <caption id={captionId} className={styles.caption}>
            {caption}
          </caption>
          <thead>
            <tr>
              <th scope="col">Term</th>
              <th scope="col">Rule applied</th>
              <th scope="col" className={styles.num}>
                Amount
              </th>
              <th scope="col" className={styles.num}>
                Days used
              </th>
              <th scope="col" className={styles.num}>
                Unused days
              </th>
              <th scope="col" className={styles.num}>
                Days in term
              </th>
              <th scope="col" className={styles.num}>
                Refund
              </th>
            </tr>
          </thead>
          <tbody>
            {terms.map((line) => (
              <tr key={line.termNumber}>
                <th scope="row" className={styles.mono}>
                  {line.termNumber}
                </th>
                <td className={styles.mono}>{line.ruleApplied}</td>
                <td className={styles.num}>
                  <Cell value={line.amount} />
                </td>
                <td className={styles.num}>
                  <Cell value={line.daysUsed} />
                </td>
                <td className={styles.num}>
                  <Cell value={line.unusedDays} />
                </td>
                <td className={styles.num}>
                  <Cell value={line.daysInTerm} />
                </td>
                <td className={styles.num}>{line.refundAmount}</td>
              </tr>
            ))}
          </tbody>
          {hasTotal ? (
            <tfoot>
              <tr>
                <th scope="row" colSpan={6}>
                  Total refund
                </th>
                <td className={styles.num}>{totalRefund}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </figure>
  );
}
