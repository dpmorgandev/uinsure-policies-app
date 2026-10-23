import { useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Spinner } from '../../primitives/spinner/Spinner';
import { EmptyState } from '../empty-state/EmptyState';
import type { EmptyContext } from '../empty-state/EmptyState';
import styles from './DataTable.module.css';

export type SortDirection = 'ascending' | 'descending';

export interface DataTableColumn<Row> {
  /** Stays the same for the life of the column; handed back to `onSortChange`. */
  id: string;
  /** The column header, in words. */
  header: string;
  /** What the cell shows for a row. */
  cell: (row: Row) => ReactNode;
  /** Right-aligned, in tabular figures, and never wrapped. */
  numeric?: boolean;
  /** Set in the mono face, for IDs, SHAs and paths. */
  mono?: boolean;
  /** The row's header cell (`<th scope="row">`): the ID column. */
  rowHeader?: boolean;
  /** The header becomes a button that asks for this column's sort. */
  sortable?: boolean;
  /**
   * How a long unbroken run (a test name, a path) wraps. `words` (the default) keeps whole words together, so a
   * table that cannot fit scrolls inside its frame. `anywhere` lets the run break at any character, for a free-text
   * column that should take the space left over.
   */
  wrap?: 'words' | 'anywhere';
}

export interface DataTableEmpty {
  context?: EmptyContext;
  title: ReactNode;
  why?: ReactNode;
  to?: { label: string; href: string };
}

export interface DataTableProps<Row extends { id: string }> {
  /** What the table shows and how it is ordered. Every table has one. */
  caption: ReactNode;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  /** The column the rows are already sorted by. Sorting is the caller's job; the table only shows it. */
  sort?: { columnId: string; direction: SortDirection };
  onSortChange?: (columnId: string) => void;
  /** The rows are on their way: skeleton rows and a spoken status replace them. */
  loading?: boolean;
  loadingLabel?: string;
  skeletonRows?: number;
  /** The rows did not load: this message replaces them. */
  error?: string | null;
  /** Called by the "Try again" button shown with an error. */
  onRetry?: () => void;
  /** BUSY-1: the retry is running. */
  retrying?: boolean;
  /** Shown when there are no rows. */
  empty?: DataTableEmpty;
  /**
   * Past this height the table scrolls inside its own frame and the header stays put. A CSS length. With none, the
   * table is as tall as its rows: a cap is the caller's choice, never a default that hides rows.
   */
  maxHeight?: string;
}

export function DataTable<Row extends { id: string }>({
  caption,
  columns,
  rows,
  sort,
  onSortChange,
  loading = false,
  loadingLabel = 'Loading rows…',
  skeletonRows = 3,
  error = null,
  onRetry,
  retrying = false,
  empty = { title: 'No rows to show.' },
  maxHeight,
}: DataTableProps<Row>) {
  const captionId = useId();
  const span = Math.max(columns.length, 1);
  const frameStyle = maxHeight ? ({ '--data-table-max-height': maxHeight } as CSSProperties) : undefined;
  const view = loading ? 'load' : error ? 'err' : rows.length === 0 ? 'empty' : 'pop';

  return (
    <div
      className={styles.frame}
      style={frameStyle}
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      data-view={view}
    >
      <table className={styles.table} aria-busy={loading ? 'true' : undefined}>
        <caption className={styles.caption} id={captionId}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => {
              const sorted = sort?.columnId === column.id ? sort.direction : undefined;
              const Arrow = sorted === 'ascending' ? ArrowUp : sorted === 'descending' ? ArrowDown : ArrowUpDown;
              return (
                <th
                  key={column.id}
                  scope="col"
                  className={column.numeric ? styles.num : undefined}
                  data-numeric={column.numeric ? 'true' : undefined}
                  aria-sort={sorted}
                >
                  {column.sortable ? (
                    <button type="button" className={styles.sort} onClick={() => onSortChange?.(column.id)}>
                      <span>{column.header}</span>
                      <Arrow className={styles.arrow} aria-hidden="true" focusable="false" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <>
              <tr>
                <td colSpan={span} className={styles.message}>
                  <span className={styles.loading} role="status">
                    <Spinner />
                    <span>{loadingLabel}</span>
                  </span>
                </td>
              </tr>
              {Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={`skeleton-${index}`} aria-hidden="true">
                  {columns.map((column) => (
                    <td key={column.id} className={styles.cell}>
                      <span className={styles.bar} />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ) : error ? (
            <tr>
              <td colSpan={span} className={styles.message}>
                <EmptyState
                  context="error"
                  compact
                  title={error}
                  action={
                    onRetry
                      ? { label: 'Try again', onClick: onRetry, busy: retrying, busyLabel: 'Trying again…' }
                      : undefined
                  }
                />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={span} className={styles.message}>
                <EmptyState
                  context={empty.context ?? 'empty'}
                  compact
                  title={empty.title}
                  why={empty.why}
                  to={empty.to}
                />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => {
                  const classes = [
                    styles.cell,
                    column.numeric ? styles.num : undefined,
                    column.mono ? styles.mono : undefined,
                    column.wrap === 'anywhere' ? styles.anywhere : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return column.rowHeader ? (
                    <th
                      key={column.id}
                      scope="row"
                      className={`${classes} ${styles.rowHeader}`}
                      data-numeric={column.numeric ? 'true' : undefined}
                    >
                      {column.cell(row)}
                    </th>
                  ) : (
                    <td key={column.id} className={classes} data-numeric={column.numeric ? 'true' : undefined}>
                      {column.cell(row)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
