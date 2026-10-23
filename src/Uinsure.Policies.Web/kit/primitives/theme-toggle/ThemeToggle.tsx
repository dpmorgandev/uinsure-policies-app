import { useId, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export type ThemeChoice = 'light' | 'dark' | 'system';

export interface ThemeToggleProps {
  /** Controlled choice. Leave out to let the toggle hold its own, starting from `defaultValue`. */
  value?: ThemeChoice;
  defaultValue?: ThemeChoice;
  /** The app applies the choice (data-theme on an ancestor); the toggle only reports it. */
  onChange?: (value: ThemeChoice) => void;
  className?: string;
}

const choices: { value: ThemeChoice; label: string; Icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

/** Light, dark or system. Three native radios in a fieldset: arrow keys move between them. */
export function ThemeToggle({ value, defaultValue = 'system', onChange, className }: ThemeToggleProps) {
  const name = useId();
  const [inner, setInner] = useState<ThemeChoice>(defaultValue);
  const current = value ?? inner;
  const classes = [styles.toggle, className].filter(Boolean).join(' ');

  return (
    <fieldset role="radiogroup" className={classes}>
      <legend className={styles.legend}>Theme</legend>
      <div className={styles.options}>
        {choices.map(({ value: choice, label, Icon }) => (
          <label key={choice} className={styles.option}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              value={choice}
              checked={current === choice}
              onChange={() => {
                setInner(choice);
                onChange?.(choice);
              }}
            />
            <span className={styles.face}>
              <Icon size="1.25em" aria-hidden="true" />
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
