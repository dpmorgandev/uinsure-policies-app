import { useId, useState } from 'react';
import { Button } from '../../primitives/button/Button';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import type { Status } from '../../primitives/status-tag/StatusTag';
import { TextInput } from '../../primitives/text-input/TextInput';
import styles from './RequestLog.module.css';

export interface RequestLogEntry {
  /** The request's place in the order this browser sent them: #1, #2. */
  n: number;
  method: string;
  /** The path and query as sent. */
  path: string;
  /**
   * The HTTP status the API answered with. Leave it out, or pass `null`, while the request has no answer yet (in
   * flight, or never answered): the table draws it as pending, never as 0.
   */
  status?: number | null;
  /**
   * True when the fetch was rejected (the API down or blocked), so no response ever came back. The row reads Failed,
   * never Pending, whatever `status` holds (HONEST-1).
   */
  failed?: boolean;
  /** How long it took, in milliseconds. Leave out when it was not measured. */
  durationMs?: number;
}

export interface RequestLogProps {
  /** Newest first. The log shows them in the order given. */
  entries: readonly RequestLogEntry[];
  /** Controlled filter text. Leave out to let the log hold its own, starting from `defaultFilter`. */
  filter?: string;
  defaultFilter?: string;
  onFilterChange?: (filter: string) => void;
  /** Makes each path a button that opens that request's exchange. */
  onSelect?: (entry: RequestLogEntry) => void;
  headingLevel?: 2 | 3;
}

/** The status the table draws: the code, or the word `pending` when the request has no answer yet. */
function answered(entry: RequestLogEntry): number | null {
  const code = entry.status;
  return typeof code === 'number' && Number.isFinite(code) && code > 0 ? code : null;
}

/** What the status cell shows: the code, or Failed for a rejected fetch, or Pending while there is no answer yet. */
function word(entry: RequestLogEntry): string {
  if (entry.failed === true) return 'Failed';
  const code = answered(entry);
  return code === null ? 'Pending' : String(code);
}

function tone(entry: RequestLogEntry): Status {
  if (entry.failed === true) return 'fail';
  const code = answered(entry);
  if (code === null) return 'pending';
  if (code < 300) return 'pass';
  if (code < 400) return 'warn';
  return 'fail';
}

function matches(entry: RequestLogEntry, filter: string): boolean {
  const needle = filter.trim().toLowerCase();
  if (needle === '') return true;
  return `${entry.method} ${entry.path} ${word(entry)}`.toLowerCase().includes(needle);
}

/** The requests this browser sent, newest first, with method, path, status and duration. Filterable. */
export function RequestLog({
  entries,
  filter,
  defaultFilter = '',
  onFilterChange,
  onSelect,
  headingLevel = 3,
}: RequestLogProps) {
  const base = useId();
  const headingId = `${base}-heading`;
  const inputId = `${base}-filter`;
  const countId = `${base}-count`;
  const [inner, setInner] = useState(defaultFilter);
  const current = filter ?? inner;
  const Heading = `h${headingLevel}` as 'h2' | 'h3';

  const setFilter = (next: string) => {
    setInner(next);
    onFilterChange?.(next);
  };

  const shown = entries.filter((entry) => matches(entry, current));

  return (
    <section aria-labelledby={headingId} className={styles.root}>
      <Heading id={headingId} className={styles.title}>
        Requests this browser sent
      </Heading>
      {entries.length === 0 ? (
        <p className={styles.empty}>No requests sent yet. Each request this browser sends is listed here, newest first.</p>
      ) : (
        <>
          <div className={styles.bar}>
            <label htmlFor={inputId} className={styles.label}>
              Filter requests
            </label>
            <TextInput
              id={inputId}
              mono
              value={current}
              placeholder="Method, path or status"
              autoComplete="off"
              spellCheck={false}
              aria-describedby={countId}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          <p id={countId} role="status" className={styles.count}>
            {`Showing ${shown.length} of ${entries.length}`}
          </p>
          {shown.length === 0 ? (
            <div className={styles.none}>
              <p className={styles.noneText}>{`No request matches "${current}".`}</p>
              <Button onClick={() => setFilter('')}>Clear filter</Button>
            </div>
          ) : (
            <div className={styles.scroll} role="region" aria-label="Requests, newest first" tabIndex={0}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>Requests this browser sent, newest first</caption>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Method</th>
                    <th scope="col">Path</th>
                    <th scope="col">Status</th>
                    <th scope="col" className={styles.num}>
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((entry) => (
                    <tr key={entry.n}>
                      <th scope="row" className={styles.n}>{`#${entry.n}`}</th>
                      <td className={styles.method}>{entry.method}</td>
                      <td className={styles.path}>
                        {onSelect ? (
                          <button
                            type="button"
                            className={styles.open}
                            aria-label={`Open request #${entry.n}, ${entry.method} ${entry.path}`}
                            onClick={() => onSelect(entry)}
                          >
                            {entry.path}
                          </button>
                        ) : (
                          entry.path
                        )}
                      </td>
                      <td>
                        <StatusTag status={tone(entry)}>{word(entry)}</StatusTag>
                      </td>
                      <td className={styles.num}>
                        {entry.durationMs !== undefined ? (
                          `${entry.durationMs} ms`
                        ) : (
                          <span className={styles.unmeasured}>not recorded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
