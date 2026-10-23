import { useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role' | 'children'> {
  /** What the switch controls, as a noun ("Auto-renew"). */
  label: string;
  /** The word shown while on. */
  onText?: string;
  /** The word shown while off. */
  offText?: string;
}

/** On/off. The label names the setting and the visible word states the current value, so colour is never the signal. */
export function Switch({
  label,
  onText = 'On',
  offText = 'Off',
  checked,
  defaultChecked = false,
  onChange,
  className,
  ...rest
}: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const classes = [styles.root, className].filter(Boolean).join(' ');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setInner(event.target.checked);
    onChange?.(event);
  }

  return (
    <label className={classes}>
      <input {...rest} type="checkbox" role="switch" className={styles.input} checked={on} onChange={handleChange} />
      <span className={styles.label}>{label}</span>
      <span className={styles.state} aria-hidden="true">
        {on ? onText : offText}
      </span>
    </label>
  );
}
