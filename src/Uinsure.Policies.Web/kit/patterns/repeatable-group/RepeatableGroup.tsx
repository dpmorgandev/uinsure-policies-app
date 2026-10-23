import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../../primitives/button/Button';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import { InlineError } from '../inline-error/InlineError';
import styles from './RepeatableGroup.module.css';

export interface RepeatableMember {
  /** A stable id for this member, so its fields keep their values when another is removed. */
  id: string;
  /** The member's fields. */
  children: ReactNode;
  /** The API's 1-based `index`. Leave out to use the member's place in the list, counted from 1. */
  index?: number;
  /** This member has a problem. It is marked in words, not by colour alone. */
  invalid?: boolean;
  /** The member-level message, when the problem is not on one field. */
  error?: string;
}

export interface RepeatableGroupProps {
  /** The group's name: "Policyholders". */
  legend: string;
  /** One member's name, singular: "Policyholder". */
  itemLabel: string;
  members: readonly RepeatableMember[];
  /** The fewest members. Remove is hidden at this count. */
  min?: number;
  /** The most members. Add is hidden at this count. */
  max?: number;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  addLabel?: string;
  headingLevel?: 2 | 3;
}

/**
 * 1 to 3 policyholders, numbered as the API's 1-based `index`. The group holds no values and no rules:
 * the caller owns the members, and this draws them, with add and remove.
 */
export function RepeatableGroup({
  legend,
  itemLabel,
  members,
  min = 1,
  max = 3,
  onAdd,
  onRemove,
  addLabel,
  headingLevel = 3,
}: RepeatableGroupProps) {
  const base = useId();
  const groupId = `${base}-group`;
  const rootRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(members.length);
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  const MemberHeading = `h${headingLevel + 1}` as 'h3' | 'h4';
  const lower = itemLabel.toLowerCase();
  const canAdd = members.length < max;
  const canRemove = members.length > min;

  // Keep the keyboard user's place: a new member takes focus; after a removal the group's own heading does.
  useEffect(() => {
    const before = previousCount.current;
    previousCount.current = members.length;
    const root = rootRef.current;
    if (!root || before === members.length) return;
    if (members.length > before) {
      const headings = root.querySelectorAll<HTMLElement>('[data-member-heading]');
      headings[headings.length - 1]?.focus();
    } else {
      root.querySelector<HTMLElement>('[data-group-heading]')?.focus();
    }
  }, [members.length]);

  return (
    <div ref={rootRef} role="group" aria-labelledby={groupId} className={styles.root}>
      <Heading id={groupId} className={styles.legend} tabIndex={-1} data-group-heading="">
        {legend}
      </Heading>
      <p role="status" className={styles.count}>
        {`${members.length} of ${max} ${legend.toLowerCase()}`}
      </p>
      <ol className={styles.list}>
        {members.map((member, position) => {
          const number = member.index ?? position + 1;
          const headingId = `${base}-member-${member.id}`;
          const errorId = `${headingId}-error`;
          const hasError = member.error !== undefined && member.error !== '';
          return (
            <li key={member.id} className={styles.member} data-invalid={member.invalid ? 'true' : undefined}>
              <div className={styles.rail} aria-hidden="true">
                <span className={styles.node}>{number}</span>
              </div>
              <div
                role="group"
                aria-labelledby={headingId}
                aria-describedby={hasError ? errorId : undefined}
                className={styles.body}
              >
                <div className={styles.bar}>
                  <MemberHeading id={headingId} className={styles.title} tabIndex={-1} data-member-heading="">
                    {`${itemLabel} ${number}`}
                  </MemberHeading>
                  {member.invalid ? <StatusTag status="fail">Needs fixing</StatusTag> : null}
                  {canRemove ? (
                    <Button
                      className={styles.remove}
                      icon={<X size="1em" aria-hidden="true" />}
                      aria-label={`Remove ${lower} ${number}`}
                      onClick={() => onRemove?.(member.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                {hasError ? <InlineError id={errorId} messages={[member.error as string]} /> : null}
                <div className={styles.fields}>{member.children}</div>
              </div>
            </li>
          );
        })}
      </ol>
      {canAdd ? (
        <Button className={styles.add} icon={<Plus size="1em" aria-hidden="true" />} onClick={() => onAdd?.()}>
          {addLabel ?? `Add another ${lower}`}
        </Button>
      ) : null}
    </div>
  );
}
