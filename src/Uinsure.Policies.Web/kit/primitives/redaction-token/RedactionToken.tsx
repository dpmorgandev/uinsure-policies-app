import { EyeOff } from 'lucide-react';
import styles from './RedactionToken.module.css';

export type Redaction = 'user' | 'outside-repo' | 'root';

export interface RedactionTokenProps {
  /** Which redaction the trail holds. The token is shown as written, never stripped. */
  token: Redaction;
}

const MEANINGS: Record<Redaction, string> = {
  user: 'a user name, removed before the trail was stored',
  'outside-repo': 'a path outside the repo, removed before the trail was stored',
  root: 'the repo root, removed before the trail was stored',
};

export function RedactionToken({ token }: RedactionTokenProps) {
  return (
    <span className={styles.token} data-token={token} title={`Redacted: ${MEANINGS[token]}`}>
      <EyeOff className={styles.icon} aria-hidden="true" focusable="false" />
      <code className={styles.code}>{`<${token}>`}</code>
      <span className={styles.label}>redacted</span>
      <span className={styles.srOnly}>, {MEANINGS[token]}</span>
    </span>
  );
}
