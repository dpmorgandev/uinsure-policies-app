import type { CSSProperties } from 'react';
import { Check, Clock, Minus, RefreshCw, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AgentBadge } from '../../primitives/agent-badge/AgentBadge';
import type { AgentName } from '../../primitives/agent-badge/AgentBadge';
import { Disclosure } from '../../primitives/disclosure/Disclosure';
import styles from './AgentLanes.module.css';

export interface LaneEvent {
  /** The event's place in rung order: the walkthrough row number. */
  n: number;
  /** What it did, in the commit's own words. */
  label: string;
  /** The commit's TDD trailer: red, stub, green, refactor. Leave out when it has none. */
  tdd?: string | null;
  sha?: string | null;
}

export interface Lane {
  agent: AgentName;
  events: readonly LaneEvent[];
}

export interface AgentLanesProps {
  /** One lane per agent that acted, in the order given. */
  lanes: readonly Lane[];
  /** The node is git-only (F0a): the trail holds no activity records, by design. */
  gitOnly?: boolean;
  /** Start with the text-equivalent table open. */
  tableOpen?: boolean;
}

const GLYPHS: Record<string, LucideIcon> = {
  red: X,
  green: Check,
  stub: Clock,
  refactor: RefreshCw,
};

const TONES: Record<string, string | undefined> = {
  red: styles.red,
  green: styles.green,
  stub: styles.stub,
  refactor: styles.refactor,
};

function stepOf(event: LaneEvent): string | undefined {
  return event.tdd === undefined || event.tdd === null || event.tdd === '' ? undefined : event.tdd;
}

/**
 * Per-agent lanes of activity. Position along a lane is rung order (the walkthrough row), never clock time, and
 * the same events are in a table as the text equivalent.
 */
export function AgentLanes({ lanes, gitOnly = false, tableOpen = false }: AgentLanesProps) {
  const withEvents = lanes.filter((lane) => lane.events.length > 0);

  if (gitOnly) {
    return (
      <section className={styles.root} aria-label="Agent lanes" data-state="git-only">
        <p className={styles.empty}>
          This node is git-only (F0a): the trail holds no activity records, by design, so there are no lanes to draw.
        </p>
      </section>
    );
  }

  if (withEvents.length === 0) {
    return (
      <section className={styles.root} aria-label="Agent lanes" data-state="empty">
        <p className={styles.empty}>No agent activity is recorded for this node, so there are no lanes to draw.</p>
      </section>
    );
  }

  const positions = Array.from(new Set(withEvents.flatMap((lane) => lane.events.map((event) => event.n)))).sort(
    (a, b) => a - b,
  );
  const column = (n: number) => positions.indexOf(n) + 1;
  const rows = withEvents
    .flatMap((lane) => lane.events.map((event) => ({ agent: lane.agent, event })))
    .sort((a, b) => a.event.n - b.event.n);

  return (
    <section className={styles.root} aria-label="Agent lanes" data-state={withEvents.length === 1 ? 'one agent' : 'pop'}>
      <p className={styles.lead}>
        Position is rung order, not clock time: each tick is one commit at its walkthrough row, left to right. The lanes
        scroll sideways inside their frame when they are wider than the page; in a narrow frame each lane wraps onto
        more lines instead, still in rung order.
      </p>
      <div className={styles.scroll} role="region" aria-label="Agent lanes, by rung" tabIndex={0}>
        <ul className={styles.lanes} style={{ '--cols': positions.length } as CSSProperties}>
          {withEvents.map((lane) => (
            <li key={lane.agent} className={styles.lane}>
              <div className={styles.who}>
                <AgentBadge agent={lane.agent} />
              </div>
              <ol className={styles.ticks} aria-label={`${lane.agent} rungs`}>
                {lane.events.map((event) => {
                  const step = stepOf(event);
                  const Glyph = (step ? GLYPHS[step] : undefined) ?? Minus;
                  return (
                    <li
                      key={event.n}
                      className={[styles.tick, step ? TONES[step] : styles.none].filter(Boolean).join(' ')}
                      style={{ '--col': column(event.n) } as CSSProperties}
                      title={event.label}
                      data-step={step ?? 'none'}
                      data-column={column(event.n)}
                    >
                      <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
                      <span className={styles.n}>{`#${event.n}`}</span>
                      <span className={styles.srOnly}>{step ?? 'no TDD trailer'}</span>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.equivalent}>
        <Disclosure summary="Text equivalent: the lanes as a table" defaultOpen={tableOpen}>
          <div className={styles.scroll} role="region" aria-label="Activity by agent, table" tabIndex={0}>
            <table className={styles.table}>
              <caption>Activity by agent. Sorted by rung number, ascending.</caption>
              <thead>
                <tr>
                  <th scope="col">Rung</th>
                  <th scope="col">Agent</th>
                  <th scope="col">TDD</th>
                  <th scope="col">SHA</th>
                  <th scope="col">What it did</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ agent, event }) => (
                  <tr key={event.n}>
                    <th scope="row" className={styles.cellMono}>{`#${event.n}`}</th>
                    <td className={styles.cellMono}>{agent}</td>
                    <td className={styles.cellTdd}>{stepOf(event) ?? <span className={styles.absent}>none</span>}</td>
                    <td className={styles.cellMono}>{event.sha ?? <span className={styles.absent}>no SHA</span>}</td>
                    <td className={styles.cellWhat}>{event.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Disclosure>
      </div>
    </section>
  );
}
