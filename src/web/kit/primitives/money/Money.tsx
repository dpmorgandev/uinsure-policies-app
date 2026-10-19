import styles from './Money.module.css';

export interface MoneyProps {
  /** The amount exactly as the API wrote it, as a string: "615.40", "0.00". It is never parsed or re-rounded. */
  value: string;
  className?: string;
}

/** A money value in tabular figures. It renders the string it is given and does no arithmetic. */
export function Money({ value, className }: MoneyProps) {
  const classes = [styles.money, className].filter(Boolean).join(' ');
  return <span className={classes}>{value}</span>;
}
