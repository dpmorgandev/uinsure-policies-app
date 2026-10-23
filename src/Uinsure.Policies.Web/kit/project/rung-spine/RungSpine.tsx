import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Flag, GitBranch, GitMerge } from 'lucide-react';
import { Spinner } from '../../primitives/spinner/Spinner';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import type { Status } from '../../primitives/status-tag/StatusTag';
import styles from './RungSpine.module.css';

/** A status word with its glyph and colour, as the StatusTag shows it. */
export interface RungTag {
  status: Status;
  label: ReactNode;
}

/** The colour of a commit rung's marker. The word and the glyph in its tag carry the same meaning. */
export type RungTone = 'red' | 'green' | 'refactor' | 'stub' | 'neutral';

/**
 * done: the rung has returned. current: the next rung to act on. waiting: not reached. busy: its process is
 * running. stopped: it failed and the walk stops here.
 */
export type RungState = 'done' | 'current' | 'waiting' | 'busy' | 'stopped';

export interface CarriedValue {
  /** What the value is: "Cancellation date". */
  label: string;
  /** The value as an earlier rung returned it. It is shown, never typed again. */
  value: string;
  /** Where it came from: "carried from rung 1. To change it, quote again." */
  note?: ReactNode;
}

export interface Rung {
  kind?: 'rung';
  /** Unique within the spine. Rejoin links point at it. */
  id: string;
  /** The rung's ordinal as the data holds it: "#5", "1", "QA". */
  marker: string;
  /** A short imperative step label: "Write the failing test". */
  label: ReactNode;
  /** Who did it, under the label. */
  agent?: ReactNode;
  /** A line of help under the label. */
  hint?: ReactNode;
  tag?: RungTag;
  tone?: RungTone;
  state?: RungState;
  /** The marker is a box (default) or a circle. */
  shape?: 'box' | 'round';
  /** The rung the page is about: a heavier marker. */
  emphasis?: boolean;
  /** The receipt, to the right of the rail (under the label at 390 wide). */
  receipt?: ReactNode;
  carried?: CarriedValue;
  /** BUSY-1: this rung's process is running. */
  busy?: boolean;
  /** What is happening, in words: "Sending the cancel". Shown while busy. */
  busyLabel?: string;
}

/** Rows the data does not hold. Drawn as a dashed stretch of rail, never as a failure. */
export interface RungGap {
  kind: 'gap';
  id: string;
  text: ReactNode;
}

/** A heading line across the receipt column, for example the start of an attempt. */
export interface RungBand {
  kind: 'band';
  id: string;
  text: ReactNode;
}

export interface BranchStep {
  /** Attempt, then event: "1·2". */
  marker: string;
  /** The event: "gate.stub". */
  title: ReactNode;
  tag?: RungTag;
  meta?: ReactNode;
  body?: ReactNode;
  /** A step the data names but does not hold. */
  dashed?: boolean;
}

/** A line between steps that says where the branch turned. */
export interface BranchTurn {
  turn: ReactNode;
}

export type BranchEntry = BranchStep | BranchTurn;

export interface BranchRejoin {
  /** The id of the rung it rejoins. Without one, the text is not a link. */
  toId?: string;
  /** The link text: "#26". */
  text: ReactNode;
  note?: ReactNode;
}

/** A retry or an investigation that steps off the spine and rejoins it. */
export interface RungBranch {
  kind: 'branch';
  id: string;
  title: ReactNode;
  /** Where it steps off, in words: "Steps off the spine at the first red gate." */
  leaves: ReactNode;
  why?: ReactNode;
  entries: BranchEntry[];
  rejoin?: BranchRejoin;
  /** Marks the branch as an investigation. */
  investigation?: { id: string; note?: ReactNode };
}

export type RungSpineItem = Rung | RungGap | RungBand | RungBranch;

export interface RungSpineProps {
  /** The accessible name of the ordered list: "Commits, rows 1 to 25". */
  label: string;
  items: readonly RungSpineItem[];
  /** Show the keys legend and move rung to rung on J and K. On by default. */
  keyboard?: boolean;
  /** Set to make each rung label a heading of this level. Branch titles sit one level below. */
  headingLevel?: 2 | 3 | 4;
}

function isRung(item: RungSpineItem): item is Rung {
  return item.kind === undefined || item.kind === 'rung';
}

function isTurn(entry: BranchEntry): entry is BranchTurn {
  return 'turn' in entry;
}

function join(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' ');
}

const TONES: Record<RungTone, string | undefined> = {
  red: styles.red,
  green: styles.green,
  refactor: styles.refactor,
  stub: styles.stub,
  neutral: undefined,
};

const STATES: Record<RungState, string | undefined> = {
  done: undefined,
  current: styles.current,
  waiting: styles.waiting,
  busy: styles.current,
  stopped: styles.stopped,
};

/**
 * A numbered vertical spine of rungs: the label to the left of the rail, the receipt to its right. A retry steps
 * off the spine as a branch and rejoins it. It is a real ordered list, and J and K move from rung to rung.
 */
export function RungSpine({ label, items, keyboard = true, headingLevel }: RungSpineProps) {
  const base = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const rungIds = items.filter(isRung).map((rung) => rung.id);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const roving = activeId !== undefined && rungIds.includes(activeId) ? activeId : rungIds[0];
  const allIds = items.map((item) => item.id);

  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    if (!keyboard || event.altKey || event.ctrlKey || event.metaKey) return;
    const pressed = event.key.toLowerCase();
    if (pressed !== 'j' && pressed !== 'k') return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const list = listRef.current;
    if (!list) return;
    const rungs = Array.from(list.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.dataset['rung'] === 'true',
    );
    let destination: HTMLElement | undefined;
    if (pressed === 'j') {
      destination = rungs.find((el) => (target.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
    } else {
      for (let i = rungs.length - 1; i >= 0; i -= 1) {
        const el = rungs[i]!;
        if ((target.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING) !== 0) {
          destination = el;
          break;
        }
      }
    }
    if (destination) {
      event.preventDefault();
      destination.focus();
    }
  };

  const LabelTag = headingLevel ? (`h${headingLevel}` as 'h2' | 'h3' | 'h4') : 'span';
  const BranchHeading = `h${Math.min((headingLevel ?? 2) + 1, 6)}` as 'h3' | 'h4' | 'h5';

  return (
    <div className={styles.root}>
      {keyboard ? (
        <div className={styles.keys} role="group" aria-label="Keyboard">
          <span>Keys</span>
          <span>
            <kbd>J</kbd> next rung
          </span>
          <span>
            <kbd>K</kbd> previous rung
          </span>
          <span>
            <kbd>Tab</kbd> moves through the links in each rung
          </span>
        </div>
      ) : null}
      <ol className={styles.spine} aria-label={label} ref={listRef} onKeyDown={onKeyDown}>
        {items.map((item) => {
          const domId = `${base}-${item.id}`;

          if (item.kind === 'gap') {
            return (
              <li key={item.id} id={domId} className={join(styles.item, styles.gap)} data-kind="gap">
                <div className={styles.rail} aria-hidden="true" />
                <div className={styles.receipt}>{item.text}</div>
              </li>
            );
          }

          if (item.kind === 'band') {
            return (
              <li key={item.id} id={domId} className={join(styles.item, styles.bandItem)} data-kind="band">
                <div className={styles.rail} aria-hidden="true" />
                <div className={join(styles.receipt, styles.band)}>{item.text}</div>
              </li>
            );
          }

          if (item.kind === 'branch') {
            const headingId = `${domId}-heading`;
            const marked = item.investigation !== undefined;
            const rejoin = item.rejoin;
            const target = rejoin?.toId !== undefined && allIds.includes(rejoin.toId) ? `#${base}-${rejoin.toId}` : undefined;
            return (
              <li key={item.id} id={domId} className={join(styles.item, styles.branchItem)} data-kind="branch">
                <div className={styles.rail} aria-hidden="true">
                  <span className={styles.branchGlyph}>{marked ? <Flag size="1em" /> : <GitBranch size="1em" />}</span>
                </div>
                <section
                  className={join(styles.receipt, styles.branch, marked && styles.marked)}
                  aria-labelledby={headingId}
                  data-marked={marked ? 'true' : undefined}
                >
                  <BranchHeading id={headingId} className={styles.branchTitle}>
                    {item.title}
                  </BranchHeading>
                  {item.investigation ? (
                    <p className={styles.markedLine}>
                      <Flag className={styles.icon} aria-hidden="true" focusable="false" />
                      <span>
                        Marked branch: investigation <span className={styles.mono}>{item.investigation.id}</span>
                      </span>
                      {item.investigation.note ? <span className={styles.muted}>{item.investigation.note}</span> : null}
                    </p>
                  ) : null}
                  <p className={styles.leaves}>{item.leaves}</p>
                  {item.why ? <p className={styles.why}>{item.why}</p> : null}
                  <ol className={styles.steps} aria-labelledby={headingId}>
                    {item.entries.map((entry, index) =>
                      isTurn(entry) ? (
                        <li key={`turn-${index}`} className={styles.turn}>
                          {entry.turn}
                        </li>
                      ) : (
                        <li key={`${entry.marker}-${index}`} className={styles.step}>
                          <span className={join(styles.stepMarker, entry.dashed && styles.dashed)}>{entry.marker}</span>
                          <div className={styles.stepBody}>
                            <p className={styles.stepHead}>
                              <span className={styles.event}>{entry.title}</span>
                              {entry.tag ? <StatusTag status={entry.tag.status}>{entry.tag.label}</StatusTag> : null}
                            </p>
                            {entry.meta ? <p className={styles.muted}>{entry.meta}</p> : null}
                            {entry.body ? <div className={styles.stepText}>{entry.body}</div> : null}
                          </div>
                        </li>
                      ),
                    )}
                  </ol>
                  {rejoin ? (
                    <p className={styles.rejoin}>
                      <GitMerge className={styles.icon} aria-hidden="true" focusable="false" />
                      <span>
                        Rejoins the spine at {target ? <a href={target}>{rejoin.text}</a> : <span>{rejoin.text}</span>}
                        {rejoin.note ? <>, {rejoin.note}</> : null}.
                      </span>
                    </p>
                  ) : null}
                </section>
              </li>
            );
          }

          const labelId = `${domId}-label`;
          const state = item.state ?? 'done';
          const classes = join(
            styles.item,
            styles.rung,
            item.tone ? TONES[item.tone] : undefined,
            STATES[state],
            item.shape === 'round' ? styles.round : undefined,
            item.emphasis ? styles.emphasis : undefined,
          );
          return (
            <li
              key={item.id}
              id={domId}
              className={classes}
              data-kind="rung"
              data-rung="true"
              data-state={state}
              aria-labelledby={labelId}
              aria-busy={item.busy ? 'true' : undefined}
              tabIndex={keyboard ? (roving === item.id ? 0 : -1) : undefined}
              onFocus={() => setActiveId(item.id)}
            >
              <div className={styles.rail}>
                <span className={styles.marker} data-marker="true">
                  <span className={styles.srOnly}>Rung </span>
                  {item.marker}
                </span>
              </div>
              <div className={styles.label}>
                <LabelTag id={labelId} className={styles.stepLabel}>
                  {item.label}
                </LabelTag>
                {item.agent ? <span className={styles.agent}>{item.agent}</span> : null}
                {item.hint ? <p className={styles.hint}>{item.hint}</p> : null}
                {item.tag ? (
                  <p className={styles.tagLine}>
                    <StatusTag status={item.tag.status}>{item.tag.label}</StatusTag>
                  </p>
                ) : null}
                {item.busy ? (
                  <p className={styles.busyLine} role="status">
                    <Spinner />
                    <span>{item.busyLabel ?? 'In progress'}</span>
                  </p>
                ) : null}
              </div>
              <div className={styles.receipt}>
                {item.carried ? (
                  <dl className={styles.carried}>
                    <dt>{item.carried.label}</dt>
                    <dd className={styles.carriedValue}>{item.carried.value}</dd>
                    {item.carried.note ? <dd className={styles.carriedNote}>{item.carried.note}</dd> : null}
                  </dl>
                ) : null}
                {item.receipt}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
