import { useId } from 'react';
import type { ReactNode } from 'react';
import { InlineError } from '../inline-error/InlineError';
import styles from './Field.module.css';

/** What `field` hands to its control. Spread it onto a kit control: `<TextInput {...control} />`. */
export interface FieldControlProps {
  id: string;
  /** The hint, the constraint and the error, in reading order. Left out when there are none. */
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
  /** For kit controls, which mark it with their border. They draw no icon: the field's message carries it. */
  invalid: boolean;
}

export interface FieldProps {
  label: string;
  /** Leave out to let the field make one. The error summary links to this id. */
  id?: string;
  /** Help that is true before the user types: the format, what the value is for. */
  hint?: ReactNode;
  /** The server's constraint, usually a `constraint-hint`. It sits after the hint. */
  constraint?: ReactNode;
  /** One message, or several. Any message makes the field invalid. */
  error?: string | readonly string[];
  required?: boolean;
  /** Draws the control. It must put `control.id` on the element that takes input. */
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Label, hint, constraint, inline error and the control, in GOV.UK order: the error comes after the hint
 * and before the input. The control is wired to all of them with aria-describedby and aria-invalid.
 */
export function Field({ label, id, hint, constraint, error, required = false, children }: FieldProps) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = `${controlId}-hint`;
  const constraintId = `${controlId}-constraint`;
  const errorId = `${controlId}-error`;

  const messages: readonly string[] = error === undefined ? [] : typeof error === 'string' ? [error] : error;
  const invalid = messages.length > 0;
  const hasHint = hint !== undefined && hint !== null && hint !== false;
  const hasConstraint = constraint !== undefined && constraint !== null && constraint !== false;

  const describedBy = [hasHint ? hintId : null, hasConstraint ? constraintId : null, invalid ? errorId : null]
    .filter((part): part is string => part !== null)
    .join(' ');

  const control: FieldControlProps = {
    id: controlId,
    'aria-describedby': describedBy === '' ? undefined : describedBy,
    'aria-invalid': invalid ? true : undefined,
    'aria-required': required ? true : undefined,
    invalid,
  };

  return (
    <div className={styles.field} data-invalid={invalid ? 'true' : undefined}>
      <label htmlFor={controlId} className={styles.label}>
        {label}
        {required ? ' ' : null}
        {required ? <span className={styles.required}>(required)</span> : null}
      </label>
      {hasHint ? (
        <div id={hintId} className={styles.hint}>
          {hint}
        </div>
      ) : null}
      {hasConstraint ? (
        <div id={constraintId} className={styles.constraint}>
          {constraint}
        </div>
      ) : null}
      {invalid ? <InlineError id={errorId} messages={messages} /> : null}
      {children(control)}
    </div>
  );
}
