import { useId, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import styles from './RadioGroup.module.css';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  /** The group's name for assistive technology, shown as the legend. */
  legend: string;
  options: RadioOption[];
  /** Controlled value. Leave out to let the group hold its own choice, starting from `defaultValue`. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** The id of the error message `field` draws. */
  'aria-describedby'?: string;
  className?: string;
}

/** One of a few visible choices: native radios in a fieldset, so arrow keys and the legend work as they should. */
export function RadioGroup({
  legend,
  options,
  value,
  defaultValue,
  onChange,
  name,
  invalid = false,
  disabled = false,
  className,
  'aria-describedby': describedBy,
}: RadioGroupProps) {
  const generatedName = useId();
  const [inner, setInner] = useState<string | undefined>(defaultValue);
  const current = value ?? inner;
  const classes = [styles.group, className].filter(Boolean).join(' ');

  return (
    <fieldset
      role="radiogroup"
      className={classes}
      disabled={disabled}
      aria-invalid={invalid ? 'true' : undefined}
      aria-describedby={describedBy}
      data-invalid={invalid ? 'true' : undefined}
    >
      <legend className={styles.legend}>
        {invalid ? <CircleAlert size="1.25em" aria-hidden="true" /> : null}
        {legend}
      </legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              className={styles.radio}
              name={name ?? generatedName}
              value={option.value}
              checked={current === option.value}
              onChange={() => {
                setInner(option.value);
                onChange?.(option.value);
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
