import { useId } from 'react';
import { Minus } from 'lucide-react';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import styles from './QuoteCancelCompare.module.css';

export interface CompareRow {
  /** The API's field name, as it wrote it: `totalRefund`. */
  field: string;
  /** The value in the quote, as the API wrote it. */
  quote?: string | null;
  /** The value in the cancellation, as the API wrote it. */
  cancellation?: string | null;
  /**
   * Set when only one side has the field, so the row is shown but not compared: a quote has `quotedOn` and no refund
   * reference; a cancellation has the reference and no `quotedOn`.
   */
  only?: 'quote' | 'cancellation';
  /** Words for the side that has no value. Defaults to "not in a cancellation" or "not on a quote". */
  absentNote?: string;
}

export interface QuoteCancelCompareProps {
  rows: readonly CompareRow[];
  /** Names the table. */
  caption?: string;
  quoteHeading?: string;
  cancellationHeading?: string;
}

type Verdict = 'agree' | 'differ' | 'none';

export function QuoteCancelCompare({
  rows,
  caption = 'Quote against the cancellation it led to',
  quoteHeading = 'Quote (rung 1)',
  cancellationHeading = 'Cancellation (rung 2)',
}: QuoteCancelCompareProps) {
  const captionId = useId();
  // Equality of two strings the API wrote: no value is worked out here.
  const compared = rows.filter((row) => row.only === undefined);
  const differing = compared.filter((row) => row.quote !== row.cancellation);
  const verdict: Verdict = compared.length === 0 ? 'none' : differing.length === 0 ? 'agree' : 'differ';

  return (
    <div className={styles.root} data-state={verdict === 'none' ? 'empty' : verdict}>
      <p className={styles.verdict}>
        {verdict === 'agree' ? <StatusTag status="pass">Agree</StatusTag> : null}
        {verdict === 'differ' ? <StatusTag status="fail">Differ</StatusTag> : null}
        {verdict === 'none' ? <StatusTag status="pending">Nothing compared</StatusTag> : null}
        <span className={styles.words}>
          {verdict === 'agree' ? `Agree on all ${compared.length} compared fields` : null}
          {verdict === 'differ'
            ? `Differ on ${differing.length} of ${compared.length} compared fields: ${differing.map((row) => row.field).join(', ')}`
            : null}
          {verdict === 'none' ? 'No field is on both sides yet.' : null}
        </span>
        <span className={styles.hint}>counted from the table below</span>
      </p>
      <div className={styles.frame} role="region" aria-labelledby={captionId} tabIndex={0}>
        <table className={styles.table}>
          <caption id={captionId} className={styles.caption}>
            {caption}
          </caption>
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">{quoteHeading}</th>
              <th scope="col">{cancellationHeading}</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const differs = row.only === undefined && row.quote !== row.cancellation;
              return (
                <tr key={row.field} data-result={row.only ? `${row.only}-only` : differs ? 'differ' : 'agree'}>
                  <th scope="row" className={styles.field}>
                    {row.field}
                  </th>
                  <td className={styles.value}>
                    {row.only === 'cancellation' ? (
                      <span className={styles.absent}>{row.absentNote ?? 'not on a quote'}</span>
                    ) : (
                      row.quote
                    )}
                  </td>
                  <td className={`${styles.value} ${differs ? styles.differs : ''}`.trim()}>
                    {row.only === 'quote' ? (
                      <span className={styles.absent}>{row.absentNote ?? 'not in a cancellation'}</span>
                    ) : (
                      row.cancellation
                    )}
                  </td>
                  <td>
                    {row.only === 'quote' ? (
                      <span className={styles.neutral}>
                        <Minus className={styles.icon} aria-hidden="true" focusable="false" />
                        <span>Quote only</span>
                      </span>
                    ) : row.only === 'cancellation' ? (
                      <span className={styles.neutral}>
                        <Minus className={styles.icon} aria-hidden="true" focusable="false" />
                        <span>Cancellation only</span>
                      </span>
                    ) : differs ? (
                      <StatusTag status="fail">Differs</StatusTag>
                    ) : (
                      <StatusTag status="pass">Agrees</StatusTag>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.some((row) => row.only !== undefined) ? (
        <p className={styles.hint}>
          Rows marked quote only or cancellation only are not compared: the other side does not have that field.
        </p>
      ) : null}
    </div>
  );
}
