import type { InputHTMLAttributes } from 'react';
import styles from './TextInput.module.css';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Marks the field invalid: aria-invalid and an error-coloured border at the same width as the valid state.
   * The icon and the message belong to `field`.
   */
  invalid?: boolean;
  /** Set in the mono face with tabular figures, for IDs, dates and amounts. */
  mono?: boolean;
}

/** A single-line text field. The label, hint and error message are supplied by `field` (aria-describedby). */
export function TextInput({ invalid = false, mono = false, type = 'text', className, ...rest }: TextInputProps) {
  const classes = [styles.input, mono ? styles.mono : undefined, className].filter(Boolean).join(' ');
  return (
    <input
      {...rest}
      type={type}
      className={classes}
      aria-invalid={invalid ? 'true' : undefined}
      data-invalid={invalid ? 'true' : undefined}
    />
  );
}
