import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { ShaLink } from '../../primitives/sha-link/ShaLink';
import type { ShaLinkProps } from '../../primitives/sha-link/ShaLink';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import type { Status } from '../../primitives/status-tag/StatusTag';
import styles from './GateRow.module.css';

/**
 * held: the gate's check held (ok true). failed: ok false. expected-fail: the gate expected a failing run and got
 * one (exit not 0, ok true). waived: the gate was waived, so it did not run.
 */
export type GateResult = 'held' | 'failed' | 'expected-fail' | 'waived';

export interface GateRowProps {
  /** The loop event: "gate.stub", or "state(investigating)" for a state event. */
  gate: string;
  /** A gate event or a state event. Default: a gate event. */
  kind?: 'gate' | 'state';
  /** Attempt, then event: "1·2". */
  marker?: string;
  /** What the gate decided. Not used by a state event. */
  result?: GateResult;
  /** The command the gate ran, when the event holds one. */
  command?: string | null;
  /** The exit code the gate saw. */
  exit?: number | null;
  /** What the gate expected, as the loop wrote it: "every GET-1 test fails". */
  expected?: string | null;
  /** The loop's own ok flag. */
  ok?: boolean | null;
  /** The head SHA the event names. */
  head?: Pick<ShaLinkProps, 'sha' | 'fullSha' | 'href' | 'githubHref'>;
  /** The loop's detail text. Long text wraps. */
  detail?: ReactNode;
}

const WORDS: Record<GateResult, string> = {
  held: 'Gate held',
  failed: 'Gate failed',
  'expected-fail': 'Failed as expected',
  waived: 'Waived',
};

const STATUSES: Record<GateResult, Status> = {
  held: 'pass',
  failed: 'fail',
  'expected-fail': 'pass',
  waived: 'not-built',
};

/**
 * One loop event: the gate, the command, the exit code against what was expected, ok, and the detail.
 * A failed gate is a recorded result the loop acts on, so it is drawn as a result and not as an error.
 */
export function GateRow({ gate, kind = 'gate', marker, result = 'held', command, exit, expected, ok, head, detail }: GateRowProps) {
  const isState = kind === 'state';
  const word = isState ? 'State change' : WORDS[result];
  const name = `${marker ? `${marker} ` : ''}${gate}: ${word}`;
  const hasFields =
    (command !== undefined && command !== null) ||
    (exit !== undefined && exit !== null) ||
    (expected !== undefined && expected !== null) ||
    (ok !== undefined && ok !== null);

  return (
    <div
      className={styles.row}
      role="group"
      aria-label={name}
      data-kind={kind}
      data-result={isState ? undefined : result}
    >
      <p className={styles.head}>
        {marker ? <span className={styles.marker}>{marker}</span> : null}
        <span className={styles.gate}>{gate}</span>
        {isState ? (
          <span className={styles.state}>
            <Info className={styles.icon} aria-hidden="true" focusable="false" />
            <span>{word}</span>
          </span>
        ) : (
          <StatusTag status={STATUSES[result]}>{word}</StatusTag>
        )}
      </p>
      {hasFields ? (
        <dl className={styles.fields}>
          {command !== undefined && command !== null ? (
            <div className={styles.field}>
              <dt>Command</dt>
              <dd className={styles.command}>{command}</dd>
            </div>
          ) : null}
          {exit !== undefined && exit !== null ? (
            <div className={styles.field}>
              <dt>Exit</dt>
              <dd className={styles.figure}>{exit}</dd>
            </div>
          ) : null}
          {expected !== undefined && expected !== null ? (
            <div className={styles.field}>
              <dt>Expected</dt>
              <dd>{expected}</dd>
            </div>
          ) : null}
          {ok !== undefined && ok !== null ? (
            <div className={styles.field}>
              <dt>ok</dt>
              <dd className={styles.figure}>{String(ok)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {head ? (
        <p className={styles.headSha}>
          <span>Head</span> <ShaLink {...head} />
        </p>
      ) : null}
      {result === 'failed' && !isState ? (
        <p className={styles.note}>Recorded as ok false: a result the loop acts on, not an error in this page.</p>
      ) : null}
      {detail ? <div className={styles.detail}>{detail}</div> : null}
    </div>
  );
}
