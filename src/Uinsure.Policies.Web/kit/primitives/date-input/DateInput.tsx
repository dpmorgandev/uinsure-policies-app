import { TextInput } from '../text-input/TextInput';
import type { TextInputProps } from '../text-input/TextInput';
import styles from './DateInput.module.css';

export type DateInputProps = Omit<TextInputProps, 'type' | 'inputMode' | 'mono'>;

/**
 * A `yyyy-MM-dd` date, the only format the API accepts. It is a text field, not a date picker, and
 * shows exactly what was typed: nothing is reformatted or parsed here. Errors come from the API.
 */
export function DateInput({ className, ...rest }: DateInputProps) {
  const classes = [styles.date, className].filter(Boolean).join(' ');
  return (
    <TextInput
      autoComplete="off"
      spellCheck={false}
      placeholder="yyyy-MM-dd"
      {...rest}
      className={classes}
      type="text"
      inputMode="numeric"
      mono
    />
  );
}
