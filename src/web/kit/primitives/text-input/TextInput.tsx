import type { InputHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';
import styles from './TextInput.module.css';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field invalid: aria-invalid, a heavier border and a glyph. The message belongs to `field`. */
  invalid?: boolean;
  /** Set in the mono face with tabular figures, for IDs, dates and amounts. */
  mono?: boolean;
}

/** A single-line text field. The label, hint and error message are supplied by `field` (aria-describedby). */
export function TextInput({ invalid = false, mono = false, type = 'text', className, ...rest }: TextInputProps) {
  const classes = [styles.input, mono ? styles.mono : undefined, className].filter(Boolean).join(' ');
  return (
    <span className={styles.wrap}>
      <input
        {...rest}
        type={type}
        className={classes}
        aria-invalid={invalid ? 'true' : undefined}
        data-invalid={invalid ? 'true' : undefined}
      />
      {invalid ? <CircleAlert className={styles.glyph} size="1.25em" aria-hidden="true" /> : null}
    </span>
  );
}
