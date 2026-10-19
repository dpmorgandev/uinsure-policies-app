import { Ellipsis, LoaderCircle } from 'lucide-react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  /** Show the static busy glyph instead of the rotation. The media query does this too. */
  still?: boolean;
  className?: string;
}

/**
 * Decorative: it sits inside the control that started the process, and that control's label
 * says what is happening (BUSY-1). It is never the only signal.
 */
export function Spinner({ still = false, className }: SpinnerProps) {
  const classes = [styles.spinner, className].filter(Boolean).join(' ');
  return (
    <span className={classes} data-still={still ? 'true' : undefined} aria-hidden="true">
      <LoaderCircle className={`${styles.glyph} ${styles.spin}`} size="1em" aria-hidden="true" />
      <Ellipsis className={`${styles.glyph} ${styles.static}`} size="1em" aria-hidden="true" />
    </span>
  );
}
