import { useId, useState } from 'react';
import type { ChangeEvent, TextareaHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';
import styles from './TextArea.module.css';

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'maxLength' | 'value' | 'defaultValue'> {
  /** The maximum length, shown beside the count (claim description: 500). */
  maxLength: number;
  /** Controlled text. Leave out to let the box hold its own text, starting from `defaultValue`. */
  value?: string;
  defaultValue?: string;
  invalid?: boolean;
}

/** Multi-line text with a visible count against its maximum. The label and error message come from `field`. */
export function TextArea({
  maxLength,
  value,
  defaultValue = '',
  invalid = false,
  rows = 5,
  className,
  onChange,
  'aria-describedby': describedBy,
  ...rest
}: TextAreaProps) {
  const countId = useId();
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const atLimit = text.length >= maxLength;
  const classes = [styles.area, className].filter(Boolean).join(' ');

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInner(event.target.value);
    onChange?.(event);
  }

  return (
    <div className={styles.root}>
      <span className={styles.wrap}>
        <textarea
          {...rest}
          rows={rows}
          className={classes}
          value={text}
          maxLength={maxLength}
          onChange={handleChange}
          aria-invalid={invalid ? 'true' : undefined}
          aria-describedby={[describedBy, countId].filter(Boolean).join(' ')}
        />
        {invalid ? <CircleAlert className={styles.glyph} size="1.25em" aria-hidden="true" /> : null}
      </span>
      <div className={styles.meta}>
        <span id={countId} className={styles.count} data-at-limit={atLimit ? 'true' : undefined}>
          {text.length} of {maxLength} characters
        </span>
        <span role="status" className={styles.limit}>
          {atLimit ? (
            <>
              <CircleAlert size="1em" aria-hidden="true" />
              Limit reached
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}
