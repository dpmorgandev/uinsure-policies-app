import { ErrorSummary, ProblemBanner } from '../../kit';
import type { Problem } from '../data/api';

interface ProblemViewProps {
  problem: Problem;
  /** The id of the control a form field name belongs to, or undefined when the page has none. */
  controlId?: (field: string) => string | undefined;
  /** Change it to move focus to a new set of problems. */
  focusKey?: number;
  headingLevel?: 2 | 3;
}

/**
 * WB-3: a problem as the API wrote it. One that lists violations or field messages is an error summary; one that
 * is a single record-level answer (a 404, a 409) is a banner. Both carry the rule as a chip.
 */
export function ProblemView({ problem, controlId, focusKey, headingLevel = 3 }: ProblemViewProps) {
  if (problem.items.length > 0) {
    return (
      <ErrorSummary
        focusKey={focusKey}
        items={problem.items.map((item) => ({
          message: item.message,
          fieldId: item.field !== null ? controlId?.(item.field) : undefined,
          fieldKey: item.fieldKey ?? undefined,
          ruleId: item.ruleId ?? undefined,
        }))}
      />
    );
  }
  return (
    <ProblemBanner
      headingLevel={headingLevel}
      status={problem.status}
      title={problem.title ?? `The API answered ${problem.status}`}
      detail={problem.detail ?? undefined}
      ruleId={problem.ruleId ?? undefined}
    />
  );
}
