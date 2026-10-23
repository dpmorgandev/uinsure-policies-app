import { Info, TriangleAlert } from 'lucide-react';
import styles from './ConstraintHint.module.css';

export interface ConstraintHintProps {
  /** The server's constraint, exactly as written: `^[A-Z0-9-]{3,20}$`, `today … today + 60`, `≤ 2 dp`. */
  constraint: string;
  /** The value now in the field breaks the constraint. The caller decides; this only draws it. */
  violated?: boolean;
  /** "Send it anyway" has turned the check off: the value goes to the server unchecked. */
  checkOff?: boolean;
  /** The words before the constraint. */
  label?: string;
  /** Set when the hint stands alone and a control names it in `aria-describedby`. `field` supplies its own. */
  id?: string;
}

function verdictWords(violated: boolean, checkOff: boolean): string | null {
  if (violated && checkOff) return 'Your value breaks this and will be sent anyway';
  if (violated) return 'Your value breaks this';
  if (checkOff) return 'Not checked here, the server checks it';
  return null;
}

/** The constraint the server holds for a field, beside the field. A violation is a word, a glyph and a colour. */
export function ConstraintHint({
  constraint,
  violated = false,
  checkOff = false,
  label = 'Server constraint',
  id,
}: ConstraintHintProps) {
  const verdict = verdictWords(violated, checkOff);
  const state = violated ? 'violated' : checkOff ? 'off' : 'pop';
  const Glyph = violated ? TriangleAlert : Info;
  return (
    <p id={id} className={styles.root} data-state={state}>
      <span className={styles.label}>{label}</span>
      <code className={styles.code}>{constraint}</code>
      {verdict ? (
        <span className={styles.verdict}>
          <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
          <span>{verdict}</span>
        </span>
      ) : null}
    </p>
  );
}
