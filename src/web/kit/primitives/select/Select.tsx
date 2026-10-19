import type { SelectHTMLAttributes } from 'react';
import { ChevronDown, CircleAlert } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  /** A first, unselectable option shown while nothing is chosen. */
  placeholder?: string;
  invalid?: boolean;
}

/** One of a fixed set, as a native select. The label and error message come from `field`. */
export function Select({ options, placeholder, invalid = false, className, ...rest }: SelectProps) {
  const classes = [styles.select, className].filter(Boolean).join(' ');
  const hasPlaceholder = placeholder !== undefined;
  // Without a chosen value the placeholder is the one shown.
  const initial = rest.value === undefined && rest.defaultValue === undefined && hasPlaceholder ? { defaultValue: '' } : {};
  return (
    <span className={styles.wrap}>
      <select
        {...initial}
        {...rest}
        className={classes}
        aria-invalid={invalid ? 'true' : undefined}
        data-invalid={invalid ? 'true' : undefined}
      >
        {hasPlaceholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {invalid ? <CircleAlert className={styles.invalidGlyph} size="1.25em" aria-hidden="true" /> : null}
      <ChevronDown className={styles.chevron} size="1.25em" aria-hidden="true" />
    </span>
  );
}
