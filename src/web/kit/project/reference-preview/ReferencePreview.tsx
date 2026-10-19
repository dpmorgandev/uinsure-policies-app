import { StatusTag } from '../../primitives/status-tag/StatusTag';
import styles from './ReferencePreview.module.css';

export interface ReferencePreviewProps {
  /** What has been typed so far, exactly as typed, spaces and case included. */
  value: string;
  /** The id of the input this previews. Ties the preview to it with `for`. */
  forId?: string;
}

// SELL-1: a reference is trimmed and upper-cased, then must match ^[A-Z0-9-]{3,20}$ or the API answers 400.
const ALLOWED = /^[A-Z0-9-]{3,20}$/;
const ALLOWED_CHARACTER = /[A-Z0-9-]/;
const MIN = 3;
const MAX = 20;

function problemsWith(stored: string): string[] {
  const problems: string[] = [];
  const stray = Array.from(new Set(Array.from(stored))).filter((character) => !ALLOWED_CHARACTER.test(character));
  if (stray.length > 0) {
    problems.push(`Not allowed: ${stray.map((character) => (character === ' ' ? 'a space' : `"${character}"`)).join(', ')}.`);
  }
  if (stored.length < MIN) problems.push(`Too short: ${stored.length} of at least ${MIN} characters.`);
  if (stored.length > MAX) problems.push(`Too long: ${stored.length} of at most ${MAX} characters.`);
  return problems;
}

export function ReferencePreview({ value, forId }: ReferencePreviewProps) {
  const stored = value.trim().toUpperCase();
  const empty = stored === '';
  const valid = !empty && ALLOWED.test(stored);
  const state = empty ? 'empty' : valid ? 'pop' : 'invalid';
  const problems = empty || valid ? [] : problemsWith(stored);

  return (
    <div className={styles.root} data-state={state}>
      <p className={styles.typed}>
        <span className={styles.lead}>As typed</span>
        {empty && value === '' ? (
          <span className={styles.none}>nothing yet</span>
        ) : (
          <code className={styles.code}>{`"${value}"`}</code>
        )}
      </p>
      <output className={styles.stored} htmlFor={forId}>
        <span className={styles.lead}>As the API will store it</span>
        {empty ? (
          <span className={styles.none}>Type a reference to see it here.</span>
        ) : (
          <code className={styles.value}>{stored}</code>
        )}
        <span className={styles.verdict}>
          {empty ? <StatusTag status="pending">Nothing typed</StatusTag> : null}
          {valid ? <StatusTag status="pass">Valid</StatusTag> : null}
          {!empty && !valid ? <StatusTag status="fail">Invalid pattern</StatusTag> : null}
          <span className={styles.words}>
            {valid ? 'Matches A to Z, 0 to 9 and hyphen, 3 to 20 characters.' : null}
            {!empty && !valid ? 'The API would answer 400. A reference is A to Z, 0 to 9 and hyphen, 3 to 20 characters.' : null}
            {empty ? 'The API trims a reference and upper-cases it before it checks it.' : null}
          </span>
        </span>
        {problems.map((problem) => (
          <span key={problem} className={styles.problem} data-problem="true">
            {problem}
          </span>
        ))}
      </output>
    </div>
  );
}
