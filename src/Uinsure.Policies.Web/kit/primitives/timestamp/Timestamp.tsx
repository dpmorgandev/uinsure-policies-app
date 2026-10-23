import { useId, useState } from 'react';
import styles from './Timestamp.module.css';

export interface TimestampProps {
  /**
   * A time as the trail holds it, in one of three forms:
   * an ISO instant with a zone ("2026-10-19T00:07:57Z"), a DD/MM/YYYY HH:mm signature, read as UK time
   * ("19/10/2026 01:05"), or an ISO date ("2026-10-19"). `null` or `undefined` means none was recorded.
   */
  value?: string | null;
  /** Start with the UTC time showing. */
  defaultShowUtc?: boolean;
}

const UK = 'Europe/London';
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SIGNATURE = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;

type Parsed =
  | { kind: 'instant'; ms: number; seconds: boolean }
  | { kind: 'date'; date: string }
  | null;

function ukParts(ms: number): { y: number; mo: number; d: number; h: number; mi: number; s: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });
  const got: Record<string, number> = {};
  for (const part of formatter.formatToParts(new Date(ms))) {
    if (part.type !== 'literal') got[part.type] = Number(part.value);
  }
  return {
    y: got['year'] ?? 0,
    mo: got['month'] ?? 1,
    d: got['day'] ?? 1,
    h: got['hour'] ?? 0,
    mi: got['minute'] ?? 0,
    s: got['second'] ?? 0,
  };
}

/** How far UK local time is ahead of UTC at an instant, in milliseconds. */
function ukOffsetMs(ms: number): number {
  const p = ukParts(ms);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

/** Reads a wall-clock time on the UK clock as the instant it names. */
function ukLocalToInstant(y: number, mo: number, d: number, h: number, mi: number): number {
  const asIfUtc = Date.UTC(y, mo - 1, d, h, mi);
  const first = ukOffsetMs(asIfUtc);
  const guess = asIfUtc - first;
  const second = ukOffsetMs(guess);
  return second === first ? guess : asIfUtc - second;
}

function parse(value: string): Parsed {
  const text = value.trim();
  if (ISO_INSTANT.test(text)) {
    const ms = new Date(text).getTime();
    if (Number.isNaN(ms)) return null;
    const hasSeconds = /T\d{2}:\d{2}:\d{2}/.test(text);
    return { kind: 'instant', ms, seconds: hasSeconds };
  }
  if (ISO_DATE.test(text)) {
    return Number.isNaN(new Date(`${text}T00:00:00Z`).getTime()) ? null : { kind: 'date', date: text };
  }
  const sig = SIGNATURE.exec(text);
  if (sig) {
    const [, dd, mm, yyyy, hh, mi] = sig;
    const ms = ukLocalToInstant(Number(yyyy), Number(mm), Number(dd), Number(hh), Number(mi));
    return Number.isNaN(ms) ? null : { kind: 'instant', ms, seconds: false };
  }
  return null;
}

function show(ms: number, timeZone: 'UTC' | typeof UK, seconds: boolean): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  });
  const parts = formatter.formatToParts(new Date(ms));
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const clock = seconds ? `${pick('hour')}:${pick('minute')}:${pick('second')}` : `${pick('hour')}:${pick('minute')}`;
  return `${pick('year')}-${pick('month')}-${pick('day')} ${clock} ${pick('timeZoneName')}`;
}

export function Timestamp({ value, defaultShowUtc = false }: TimestampProps) {
  const utcId = useId();
  const [utc, setUtc] = useState(defaultShowUtc);

  if (value === undefined || value === null || value.trim() === '') {
    return (
      <span className={`${styles.stamp} ${styles.missing}`} data-state="missing">
        no time recorded
      </span>
    );
  }

  const parsed = parse(value);
  if (parsed === null) {
    return (
      <span className={styles.stamp} data-state="unrecognised">
        <span className={styles.raw}>{value}</span>
        <span className={styles.note}>format not recognised, shown as written</span>
      </span>
    );
  }
  if (parsed.kind === 'date') {
    return (
      <span className={styles.stamp} data-state="date">
        <time className={styles.time} dateTime={parsed.date}>
          {parsed.date}
        </time>
      </span>
    );
  }

  const iso = new Date(parsed.ms).toISOString();
  return (
    <span className={styles.stamp} data-state="instant">
      <time className={styles.time} dateTime={iso}>
        {show(parsed.ms, UK, parsed.seconds)}
      </time>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={utc}
        aria-controls={utcId}
        aria-label="Show UTC time"
        onClick={() => setUtc((on) => !on)}
      >
        UTC
      </button>
      <span id={utcId} className={styles.utc} hidden={!utc}>
        <time className={styles.time} dateTime={iso}>
          {show(parsed.ms, 'UTC', parsed.seconds)}
        </time>
      </span>
    </span>
  );
}
