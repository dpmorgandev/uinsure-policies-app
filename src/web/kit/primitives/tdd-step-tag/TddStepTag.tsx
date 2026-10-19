import styles from './TddStepTag.module.css';

/** The values the trail's `TDD:` trailer takes. Any other string is shown as given. */
export type TddStep = 'scaffold' | 'red' | 'stub' | 'green' | 'refactor' | 'plan' | 'trace';

export interface TddStepTagProps {
  /** The trailer value. `null`, `undefined` or an empty string means the commit has no TDD trailer. */
  step?: TddStep | (string & {}) | null;
}

export function TddStepTag({ step }: TddStepTagProps) {
  const empty = step === undefined || step === null || step.trim() === '';
  const className = [styles.tag, empty ? styles.empty : undefined].filter(Boolean).join(' ');
  return (
    <span
      className={className}
      data-step={empty ? 'none' : step}
      title={empty ? 'This commit has no TDD trailer' : undefined}
    >
      <span className={styles.key}>TDD</span>{' '}
      <span className={styles.value}>{empty ? 'none' : step}</span>
    </span>
  );
}
