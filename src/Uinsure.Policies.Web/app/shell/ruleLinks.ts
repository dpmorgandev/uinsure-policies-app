import type { RuleChipStatus } from '../../kit';
import type { Trace } from '../data/trace';

/** A rule an id names is built or not in the matrix; one the matrix does not have is unknown, and its chip says so. */
export function chipStatus(trace: Trace, ruleId: string): RuleChipStatus {
  const rule = trace.rules.find((candidate) => candidate.id === ruleId);
  if (rule === undefined) return 'unknown';
  return rule.status === 'built' ? 'built' : 'nb';
}

export const ruleHref = (id: string): string => `#/rules/${encodeURIComponent(id)}`;
