import { useId } from 'react';
import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import styles from './FormSection.module.css';

export interface FormSectionProps {
  /** "Policy", "Policyholders", "Property". */
  title: string;
  /** The rung this section sits at in the form, read top to bottom. Leave out for an unnumbered group. */
  number?: number;
  description?: ReactNode;
  /** How many fields in this section have a problem. The count is the caller's; zero or none draws nothing. */
  errorCount?: number;
  /** The heading level, so the section sits under the page's own headings. */
  headingLevel?: 2 | 3 | 4;
  children: ReactNode;
}

/** A titled group of fields on the spine. Its problems are counted in words under the title. */
export function FormSection({ title, number, description, errorCount = 0, headingLevel = 2, children }: FormSectionProps) {
  const base = useId();
  const titleId = `${base}-title`;
  const descriptionId = `${base}-description`;
  const problemsId = `${base}-problems`;
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const hasDescription = description !== undefined && description !== null && description !== false;
  const hasProblems = errorCount > 0;
  const describedBy = [hasDescription ? descriptionId : null, hasProblems ? problemsId : null]
    .filter((part): part is string => part !== null)
    .join(' ');

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      aria-describedby={describedBy === '' ? undefined : describedBy}
      className={styles.root}
      data-numbered={number !== undefined ? 'true' : undefined}
      data-invalid={hasProblems ? 'true' : undefined}
    >
      {number !== undefined ? (
        <div className={styles.rail} aria-hidden="true">
          <span className={styles.node}>{number}</span>
        </div>
      ) : null}
      <div className={styles.content}>
        <Heading id={titleId} className={styles.title}>
          {title}
        </Heading>
        {hasProblems ? (
          <p id={problemsId} className={styles.problems}>
            <CircleAlert className={styles.icon} aria-hidden="true" focusable="false" />
            <span>{errorCount === 1 ? '1 problem in this section' : `${errorCount} problems in this section`}</span>
          </p>
        ) : null}
        {hasDescription ? (
          <div id={descriptionId} className={styles.description}>
            {description}
          </div>
        ) : null}
        <div className={styles.fields}>{children}</div>
      </div>
    </div>
  );
}
