import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import { Button } from '../../primitives/button/Button';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import styles from './InspectorDrawer.module.css';

/** How the API answered: a success, a problem, or nothing yet. The caller decides; the drawer does not read the code. */
export type RequestOutcome = 'ok' | 'problem' | 'pending';

export interface InspectorRequest {
  /** Its place in this session: #1 is the first request sent. */
  number: number;
  method: string;
  /** The path and query as sent. */
  path: string;
  /** The HTTP status, once the API has answered. A `problem` with no status means no response came: the fetch was rejected. */
  status?: number;
  outcome: RequestOutcome;
  /** The request and response as recorded, laid out as they should be read. Shown in the mono face, verbatim. */
  exchange?: string;
  /** A line about how to read the exchange. */
  note?: string;
}

export interface InspectorDrawerProps {
  /** Newest first. The first one is "latest". */
  requests: InspectorRequest[];
  /** Controlled. Leave out to let the drawer hold its own, starting from `defaultOpen`. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The body's starting height in pixels. */
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  headingLevel?: 2 | 3 | 4;
}

/** A problem with no HTTP status was never answered: the fetch was rejected (the API down or blocked). */
function hasNoResponse(request: InspectorRequest): boolean {
  return request.outcome === 'problem' && request.status === undefined;
}

const SMALL_STEP = 24;
const LARGE_STEP = 96;

export function InspectorDrawer({
  requests,
  open,
  defaultOpen = false,
  onOpenChange,
  defaultHeight = 256,
  minHeight = 96,
  maxHeight = 640,
  headingLevel = 3,
}: InspectorDrawerProps) {
  const headingId = useId();
  const bodyId = useId();
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;

  const clamp = (value: number) => Math.min(maxHeight, Math.max(minHeight, value));
  const [height, setHeight] = useState(() => clamp(defaultHeight));
  const drag = useRef<{ startY: number; startHeight: number } | null>(null);

  function toggle() {
    const next = !isOpen;
    if (open === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  }

  // A window splitter: Up makes the drawer taller, Down shorter, Home and End go to the limits.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: ((current: number) => number) | null = null;
    if (event.key === 'ArrowUp') next = (current) => current + SMALL_STEP;
    else if (event.key === 'ArrowDown') next = (current) => current - SMALL_STEP;
    else if (event.key === 'PageUp') next = (current) => current + LARGE_STEP;
    else if (event.key === 'PageDown') next = (current) => current - LARGE_STEP;
    else if (event.key === 'Home') next = () => minHeight;
    else if (event.key === 'End') next = () => maxHeight;
    if (next === null) return;
    event.preventDefault();
    const change = next;
    setHeight((current) => clamp(change(current)));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    drag.current = { startY: event.clientY, startHeight: height };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start) return;
    setHeight(clamp(start.startHeight + (start.startY - event.clientY)));
  }

  function handlePointerEnd() {
    drag.current = null;
  }

  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const count = requests.length;
  const latest = requests[0];
  const announcement = latest
    ? latest.outcome === 'pending'
      ? `Request #${latest.number} sent, waiting for the response`
      : hasNoResponse(latest)
        ? `Request #${latest.number} failed: no response`
        : `Request #${latest.number} answered${latest.status !== undefined ? ` ${latest.status}` : ''}`
    : '';

  return (
    <aside className={styles.drawer} aria-labelledby={headingId} data-open={isOpen ? 'true' : 'false'}>
      {isOpen ? (
        <div
          className={styles.splitter}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize the inspector"
          aria-controls={bodyId}
          aria-valuemin={minHeight}
          aria-valuemax={maxHeight}
          aria-valuenow={height}
          aria-valuetext={`${height} pixels tall`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <GripHorizontal className={styles.grip} aria-hidden="true" focusable="false" />
        </div>
      ) : null}
      <div className={styles.bar}>
        <Heading id={headingId} className={styles.heading}>
          The requests as sent
        </Heading>
        <span className={styles.state}>
          {isOpen ? 'Open' : 'Closed'} · {count} {count === 1 ? 'request' : 'requests'}
        </span>
        {isOpen ? (
          <span className={styles.hint}>Docked, resizable. The latest request and response, as each is sent.</span>
        ) : null}
        <span className={styles.toggle}>
          <Button
            variant="secondary"
            icon={
              isOpen ? <ChevronDown size="1em" aria-hidden="true" /> : <ChevronUp size="1em" aria-hidden="true" />
            }
            aria-expanded={isOpen}
            aria-controls={bodyId}
            onClick={toggle}
          >
            {isOpen ? 'Hide requests' : 'Show requests'}
          </Button>
        </span>
      </div>
      <div
        id={bodyId}
        className={styles.body}
        hidden={!isOpen}
        style={isOpen ? { height: `${height}px` } : undefined}
      >
        {count === 0 ? (
          <p className={styles.empty}>No request has been sent yet.</p>
        ) : (
          <ol className={styles.list} reversed>
            {requests.map((request, index) => (
              <li key={request.number} className={styles.item}>
                <div className={styles.line}>
                  <span className={styles.number}>#{request.number}</span>
                  <code className={styles.request}>
                    <span className={styles.method}>{request.method}</span> {request.path}
                  </code>
                  {request.outcome === 'pending' ? (
                    <StatusTag status="pending">Waiting</StatusTag>
                  ) : hasNoResponse(request) ? (
                    <StatusTag status="fail">
                      Failed
                      <span className={styles.srOnly}> (no response)</span>
                    </StatusTag>
                  ) : (
                    <StatusTag status={request.outcome === 'ok' ? 'pass' : 'fail'}>
                      {request.status ?? (request.outcome === 'ok' ? 'OK' : 'Problem')}
                      <span className={styles.srOnly}> {request.outcome === 'ok' ? '(ok)' : '(problem)'}</span>
                    </StatusTag>
                  )}
                  {index === 0 ? <span className={styles.latest}>latest</span> : null}
                </div>
                {request.exchange ? (
                  <div
                    className={styles.scroll}
                    role="region"
                    aria-label={`Request #${request.number}, request and response`}
                    tabIndex={0}
                  >
                    <pre className={styles.pre}>{request.exchange}</pre>
                  </div>
                ) : null}
                {request.note ? <p className={styles.note}>{request.note}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </div>
      <span role="status" className={styles.srOnly}>
        {announcement}
      </span>
    </aside>
  );
}
