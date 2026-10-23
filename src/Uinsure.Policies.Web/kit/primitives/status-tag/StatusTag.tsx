import type { ReactNode } from 'react';
import { Check, CircleDashed, Clock, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './StatusTag.module.css';

export type Status = 'pass' | 'fail' | 'warn' | 'pending' | 'not-built';

export interface StatusTagProps {
  status: Status;
  /** Replaces the default word, for example "Gate held". The glyph and colour still follow `status`. */
  children?: ReactNode;
}

const WORDS: Record<Status, string> = {
  pass: 'Pass',
  fail: 'Fail',
  warn: 'Warn',
  pending: 'Pending',
  'not-built': 'Not built',
};

const GLYPHS: Record<Status, LucideIcon> = {
  pass: Check,
  fail: X,
  warn: TriangleAlert,
  pending: Clock,
  'not-built': CircleDashed,
};

const TONES: Record<Status, string | undefined> = {
  pass: styles.pass,
  fail: styles.fail,
  warn: styles.warn,
  pending: styles.pending,
  'not-built': styles.notBuilt,
};

export function StatusTag({ status, children }: StatusTagProps) {
  const Glyph = GLYPHS[status];
  const className = [styles.tag, TONES[status]].filter(Boolean).join(' ');
  return (
    <span className={className} data-status={status}>
      <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
      <span>{children ?? WORDS[status]}</span>
    </span>
  );
}
