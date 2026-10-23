import type { CSSProperties } from 'react';
import { Button } from '../../primitives/button/Button';
import { ShaLink } from '../../primitives/sha-link/ShaLink';
import { TddStepTag } from '../../primitives/tdd-step-tag/TddStepTag';
import { AgentBadge } from '../../primitives/agent-badge/AgentBadge';
import type { AgentName } from '../../primitives/agent-badge/AgentBadge';
import { EmptyState } from '../empty-state/EmptyState';
import styles from './DiffViewer.module.css';

export type DiffLineKind = 'add' | 'del' | 'ctx';

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
  /** The line number before the commit. Absent on an added line. */
  oldNo?: number;
  /** The line number after the commit. Absent on a removed line. */
  newNo?: number;
}

export interface DiffFile {
  path: string;
  lines: DiffLine[];
}

/** idle: not asked for yet. loading: asked, on its way. loaded: lines in hand. error: the request failed. */
export type DiffStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface DiffViewerProps {
  status: DiffStatus;
  /** The rung's ordinal as the walkthrough numbers it: "#5". */
  rung?: string;
  sha: string;
  /** The commit on GitHub. Still opens when the diff did not load. */
  githubHref?: string;
  /** The commit's TDD trailer. */
  tdd?: string | null;
  /** The layer the commit touched: "tests", "api". */
  layer?: string;
  agent?: AgentName | null;
  /** The diff, once loaded. */
  files?: DiffFile[];
  /** What went wrong, when `status` is "error". */
  error?: string;
  /** Words on the button that asks for the diff. */
  loadLabel?: string;
  /** BUSY-1: what is happening while the diff loads. */
  busyLabel?: string;
  /** The line spoken while loading. */
  loadingStatus?: string;
  /** The line shown before the diff is asked for. */
  idleNote?: string;
  /** Asks for the diff. */
  onLoad?: () => void;
  /** Asks again after an error. */
  onRetry?: () => void;
  /** BUSY-1: the retry is running. */
  retrying?: boolean;
  /** Past this height the lines scroll inside their own frame. A CSS length. */
  maxHeight?: string;
}

const MARKS: Record<DiffLineKind, { glyph: string; word: string }> = {
  add: { glyph: '+', word: 'added' },
  del: { glyph: '-', word: 'removed' },
  ctx: { glyph: '', word: 'unchanged' },
};

export function DiffViewer({
  status,
  rung,
  sha,
  githubHref,
  tdd,
  layer,
  agent,
  files = [],
  error,
  loadLabel,
  busyLabel = 'Loading diff…',
  loadingStatus,
  idleNote = 'Not loaded. Diffs are the largest payload, so each loads when asked.',
  onLoad,
  onRetry,
  retrying = false,
  maxHeight,
}: DiffViewerProps) {
  const where = rung ? `${rung} ${sha}` : sha;
  const frameStyle = maxHeight ? ({ '--diff-max-height': maxHeight } as CSSProperties) : undefined;
  const loading = status === 'loading';

  return (
    <section className={styles.root} aria-label={`Diff for ${where}`} data-status={status}>
      <div className={styles.head}>
        {rung ? <span className={styles.rung}>{rung}</span> : null}
        <ShaLink sha={sha} githubHref={githubHref} />
        {tdd !== undefined ? <TddStepTag step={tdd} /> : null}
        {layer || agent !== undefined ? (
          <span className={styles.who}>
            {layer ? <span className={styles.layer}>{layer}</span> : null}
            {agent !== undefined ? <AgentBadge agent={agent} /> : null}
          </span>
        ) : null}
      </div>

      {status === 'idle' || loading ? (
        <div className={styles.body}>
          <div className={styles.ask}>
            <Button variant="primary" busy={loading} busyLabel={busyLabel} onClick={onLoad}>
              {loadLabel ?? `Load diff, ${where}`}
            </Button>
            <p className={styles.note} role="status">
              {loading ? (loadingStatus ?? `Loading the diff for ${where}.`) : idleNote}
            </p>
          </div>
          {loading ? (
            <div className={styles.skeleton} aria-hidden="true">
              <span className={`${styles.bar} ${styles.w90}`} />
              <span className={`${styles.bar} ${styles.w70}`} />
              <span className={`${styles.bar} ${styles.w40}`} />
            </div>
          ) : null}
        </div>
      ) : null}

      {status === 'error' ? (
        <div className={styles.body}>
          <EmptyState
            context="error"
            compact
            title={error ?? `The diff for ${where} did not load.`}
            action={onRetry ? { label: 'Try again', onClick: onRetry, busy: retrying, busyLabel: 'Trying again…' } : undefined}
          />
        </div>
      ) : null}

      {status === 'loaded' ? (
        <div
          className={styles.frame}
          style={frameStyle}
          role="region"
          aria-label={`Diff lines for ${where}`}
          tabIndex={0}
        >
          {files.length === 0 ? (
            <p className={styles.note}>The diff holds no lines.</p>
          ) : (
            files.map((file) => (
              <table key={file.path} className={styles.table}>
                <caption className={styles.path}>{file.path}</caption>
                <thead className={styles.srOnly}>
                  <tr>
                    <th scope="col">Old line</th>
                    <th scope="col">New line</th>
                    <th scope="col">Change</th>
                    <th scope="col">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {file.lines.map((line, index) => {
                    const mark = MARKS[line.kind];
                    return (
                      <tr key={index} className={styles[line.kind]} data-kind={line.kind}>
                        <td className={styles.no}>{line.oldNo}</td>
                        <td className={styles.no}>{line.newNo}</td>
                        <td className={styles.mark}>
                          <span aria-hidden="true">{mark.glyph}</span>
                          <span className={styles.srOnly}>{mark.word}</span>
                        </td>
                        <td className={styles.code}>
                          <code>{line.text}</code>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
