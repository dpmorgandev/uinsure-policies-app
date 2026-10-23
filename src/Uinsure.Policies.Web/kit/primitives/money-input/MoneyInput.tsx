import { TextInput } from '../text-input/TextInput';
import type { TextInputProps } from '../text-input/TextInput';
import styles from './MoneyInput.module.css';

export type MoneyInputProps = Omit<TextInputProps, 'type' | 'inputMode' | 'mono'>;

/**
 * A decimal amount, at most 2 dp, sent as a JSON number. It is a text field so that what was typed stays
 * exactly as typed: nothing is rounded, padded or parsed on entry. The rules (SELL-7, 2 dp) are the API's.
 */
export function MoneyInput({ className, ...rest }: MoneyInputProps) {
  const classes = [styles.money, className].filter(Boolean).join(' ');
  return (
    <TextInput
      autoComplete="off"
      spellCheck={false}
      {...rest}
      className={classes}
      type="text"
      inputMode="decimal"
      mono
    />
  );
}
