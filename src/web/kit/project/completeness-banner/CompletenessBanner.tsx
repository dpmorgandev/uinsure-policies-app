import { Check, CircleHelp, GitBranch, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './CompletenessBanner.module.css';

export type Completeness = 'ok' | 'git-only' | 'incomplete' | 'unrecognised';

export interface CompletenessBannerProps {
  /**
   * The compiler's completeness value, verbatim: "OK", "OK (git-only, F0a)" or "TRAIL INCOMPLETE: <reasons>".
   * It is shown exactly as given and is never reworded.
   */
  value: string;
  /** Make it a live region, so a change is announced: a status, or an alert when the trail is incomplete. */
  live?: boolean;
}

function classify(value: string): Completeness {
  if (value === 'OK') return 'ok';
  if (value.startsWith('OK (git-only')) return 'git-only';
  if (value.startsWith('TRAIL INCOMPLETE')) return 'incomplete';
  return 'unrecognised';
}

const GLYPHS: Record<Completeness, LucideIcon> = {
  ok: Check,
  'git-only': GitBranch,
  incomplete: TriangleAlert,
  unrecognised: CircleHelp,
};

const TONES: Record<Completeness, string | undefined> = {
  ok: styles.ok,
  'git-only': styles.gitOnly,
  incomplete: styles.incomplete,
  unrecognised: styles.unrecognised,
};

const EXPLANATIONS: Partial<Record<Completeness, string>> = {
  'git-only': 'No loop, activity or verdicts, by design: this node is witnessed by git and trailers only.',
  unrecognised: 'This is not one of the three values the trail defines. It is shown as given.',
};

/** The trail's completeness, always the first thing on a page that shows a trail. */
export function CompletenessBanner({ value, live = false }: CompletenessBannerProps) {
  const kind = classify(value);
  const Glyph = GLYPHS[kind];
  const role = live ? (kind === 'incomplete' ? 'alert' : 'status') : undefined;
  const explanation = EXPLANATIONS[kind];
  return (
    <section
      className={[styles.banner, TONES[kind]].filter(Boolean).join(' ')}
      aria-label="Trail completeness"
      role={role}
      data-completeness={kind}
    >
      <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
      <div className={styles.body}>
        <p className={styles.value}>{value}</p>
        {explanation ? <p className={styles.explanation}>{explanation}</p> : null}
      </div>
    </section>
  );
}
