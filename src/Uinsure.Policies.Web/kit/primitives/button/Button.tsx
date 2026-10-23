import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Spinner } from '../spinner/Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  /** BUSY-1: the process this button started is running. */
  busy?: boolean;
  /** BUSY-1: what is happening, shown while busy ("Quoting…"). */
  busyLabel?: string;
  /** A decorative glyph before the label. */
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  busy = false,
  busyLabel,
  icon,
  children,
  type = 'button',
  disabled = false,
  className,
  onClick,
  ...rest
}: ButtonProps) {
  const inactive = busy || disabled;
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (inactive) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      data-variant={variant}
      disabled={inactive}
      aria-busy={busy ? 'true' : undefined}
      aria-disabled={inactive ? 'true' : undefined}
      onClick={handleClick}
    >
      {busy ? <Spinner /> : icon}
      <span>{busy ? (busyLabel ?? 'Working…') : children}</span>
    </button>
  );
}
