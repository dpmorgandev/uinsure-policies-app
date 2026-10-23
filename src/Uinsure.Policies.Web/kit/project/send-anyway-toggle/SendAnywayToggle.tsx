import { useId, useState } from 'react';
import { Minus, TriangleAlert } from 'lucide-react';
import { RuleChip } from '../../primitives/rule-chip/RuleChip';
import { Switch } from '../../primitives/switch/Switch';
import styles from './SendAnywayToggle.module.css';

export interface SendAnywayViolation {
  /** The rule the API named. */
  ruleId: string;
  /** What the API said about it. */
  detail: string;
  /** The check this form would have run on its own. `null` or absent when no client check covers it. */
  clientCheck?: string | null;
}

export interface SendAnywayResponse {
  /** The HTTP status the API answered. */
  status: number;
  /** The violations it listed, in the order it listed them. */
  violations: readonly SendAnywayViolation[];
}

export interface SendAnywayToggleProps {
  /** Controlled value. Leave out to let the toggle keep its own. */
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** The API's answer to a request sent with the checks off. Shown only while the toggle is on. */
  response?: SendAnywayResponse | null;
  /**
   * Where a rule chip in the response table links, given the rule's ID. Leave it out, or return `undefined`, to keep
   * the rule chip's own default link.
   */
  ruleHref?: (ruleId: string) => string | undefined;
}

/**
 * Warn, don't disable: with this on, the form's own checks stop blocking the request, so the API's problems show.
 * While on, a notice stays on the page, and a response's violations are lined up with the client check that would have
 * caught each.
 */
export function SendAnywayToggle({ checked, defaultChecked = false, onChange, response, ruleHref }: SendAnywayToggleProps) {
  const hintId = useId();
  const captionId = useId();
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const shown = on && response ? response : null;
  const state = !on ? 'off' : shown ? 'response' : 'on';

  return (
    <section className={styles.root} data-state={state} aria-label="Send anyway">
      <Switch
        label="Send anyway"
        checked={on}
        aria-describedby={hintId}
        onChange={(event) => {
          setInner(event.target.checked);
          onChange?.(event.target.checked);
        }}
      />
      <p id={hintId} className={styles.hint}>
        Turns off this form&rsquo;s own checks, so the API&rsquo;s own problems show.
      </p>
      {on ? (
        <div className={styles.notice} role="status">
          <TriangleAlert className={styles.icon} aria-hidden="true" focusable="false" />
          <p className={styles.noticeText}>
            <strong>Send anyway is on.</strong> This form&rsquo;s checks are off. What you enter goes to the API as it is,
            and the API&rsquo;s answer comes back unchecked.
          </p>
        </div>
      ) : null}
      {shown ? (
        <div className={styles.response}>
          <p className={styles.answered}>
            The API answered <span className={styles.status}>{shown.status}</span> with{' '}
            {shown.violations.length === 1 ? '1 violation' : `${shown.violations.length} violations`}.
          </p>
          <div className={styles.frame} role="region" aria-labelledby={captionId} tabIndex={0}>
            <table className={styles.table}>
              <caption id={captionId} className={styles.caption}>
                Each violation, beside the client check that would have caught it
              </caption>
              <thead>
                <tr>
                  <th scope="col">Rule</th>
                  <th scope="col">What the API said</th>
                  <th scope="col">Client check</th>
                </tr>
              </thead>
              <tbody>
                {shown.violations.map((violation) => (
                  <tr key={violation.ruleId}>
                    <th scope="row">
                      <RuleChip ruleId={violation.ruleId} href={ruleHref?.(violation.ruleId)} />
                    </th>
                    <td>{violation.detail}</td>
                    <td>
                      {violation.clientCheck ? (
                        violation.clientCheck
                      ) : (
                        <span className={styles.none}>
                          <Minus className={styles.icon} aria-hidden="true" focusable="false" />
                          <span>None: only the API decides this</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
