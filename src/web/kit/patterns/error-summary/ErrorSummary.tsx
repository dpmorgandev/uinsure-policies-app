import { useEffect, useId, useRef } from 'react';
import type { MouseEvent } from 'react';
import { TriangleAlert } from 'lucide-react';
import { RuleChip } from '../../primitives/rule-chip/RuleChip';
import styles from './ErrorSummary.module.css';

export interface ErrorSummaryExtension {
  name: string;
  value: string;
}

export interface ErrorSummaryItem {
  /** The words the API sent for this problem. The field shows the same words. */
  message: string;
  /** The id of the field it belongs to. With one, the item is a link that moves focus to that field. */
  fieldId?: string;
  /** The key the API sent the message under (a 400's `errors.cancellationDate`), shown as sent. */
  fieldKey?: string;
  /** The rule it breaks, as a chip. */
  ruleId?: string;
  /** Where that rule's chip links. Leave out to use the component's `ruleHref`, then the chip's own default. */
  ruleHref?: string;
  /** Values the API sent beside the problem, such as `today`. Never read out of the message. */
  extensions?: readonly ErrorSummaryExtension[];
}

export interface ErrorSummaryProps {
  items: readonly ErrorSummaryItem[];
  title?: string;
  /** Move focus to the summary when it arrives, so the keyboard and screen reader land on it. */
  focusOnMount?: boolean;
  /** Change it to move focus again for a new set of problems shown by the same instance. */
  focusKey?: string | number;
  headingLevel?: 2 | 3;
  /**
   * Where each rule chip links, given the rule's ID (a hash-routed app passes `(id) => '#/rules/' + id`).
   * An item's own `ruleHref` wins. Leave out to keep the chip's default `/rules/<id>`.
   */
  ruleHref?: (ruleId: string) => string;
}

function focusField(event: MouseEvent<HTMLAnchorElement>, fieldId: string) {
  const target = document.getElementById(fieldId);
  if (!target) return;
  event.preventDefault();
  target.focus();
  if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'center' });
}

/**
 * Every problem in one list at the top. An item with a field links to it; an item without one is listed,
 * not placed, and says it applies to the whole request.
 */
export function ErrorSummary({
  items,
  title = 'There is a problem',
  focusOnMount = true,
  focusKey,
  headingLevel = 2,
  ruleHref,
}: ErrorSummaryProps) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  const hasItems = items.length > 0;

  useEffect(() => {
    if (focusOnMount && hasItems) rootRef.current?.focus();
  }, [focusOnMount, focusKey, hasItems]);

  if (!hasItems) return null;

  return (
    <div ref={rootRef} role="alert" tabIndex={-1} aria-labelledby={titleId} className={styles.root}>
      <Heading id={titleId} className={styles.title}>
        <TriangleAlert className={styles.icon} aria-hidden="true" focusable="false" />
        {title}
      </Heading>
      <ul className={styles.list}>
        {items.map((item, position) => {
          const placed = item.fieldId !== undefined || item.fieldKey !== undefined;
          return (
            <li key={`${position}-${item.message}`} className={styles.item}>
              <div className={styles.line}>
                {item.fieldId !== undefined ? (
                  <a
                    className={styles.link}
                    href={`#${item.fieldId}`}
                    onClick={(event) => focusField(event, item.fieldId as string)}
                  >
                    {item.message}
                  </a>
                ) : (
                  <span className={styles.text}>{item.message}</span>
                )}
                {item.fieldKey !== undefined ? <code className={styles.key}>{item.fieldKey}</code> : null}
                {item.ruleId !== undefined ? (
                  <RuleChip ruleId={item.ruleId} href={item.ruleHref ?? ruleHref?.(item.ruleId)} />
                ) : null}
                {!placed ? <span className={styles.scope}>whole request</span> : null}
              </div>
              {item.extensions && item.extensions.length > 0 ? (
                <dl className={styles.ext}>
                  {item.extensions.map((extension) => (
                    <div key={extension.name} className={styles.pair}>
                      <dt>{extension.name}</dt>
                      <dd>{extension.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
