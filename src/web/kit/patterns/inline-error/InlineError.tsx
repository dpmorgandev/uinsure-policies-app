import { CircleAlert } from 'lucide-react';
import styles from './InlineError.module.css';

export interface InlineErrorProps {
  /** The id the field names in `aria-describedby`. */
  id: string;
  /** The messages for one field, in the words the error summary uses. Nothing is drawn when there are none. */
  messages: readonly string[];
}

/** One field's problem, under its label and hint and above its input. It is a word, a glyph and a colour. */
export function InlineError({ id, messages }: InlineErrorProps) {
  if (messages.length === 0) return null;
  const several = messages.length > 1;
  return (
    <div id={id} className={styles.root} data-count={messages.length}>
      <CircleAlert className={styles.icon} aria-hidden="true" focusable="false" />
      <div className={styles.body}>
        <span className={styles.srOnly}>{several ? 'Errors: ' : 'Error: '}</span>
        {several ? (
          <ul className={styles.list}>
            {messages.map((message, position) => (
              <li key={`${position}-${message}`}>{message}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.message}>{messages[0]}</p>
        )}
      </div>
    </div>
  );
}
