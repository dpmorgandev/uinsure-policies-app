import type { Trace, TraceNode, TracePlan, TraceRule } from '../../data/trace';
import { blobUrl, treeUrl } from '../../shell/repo';
import { buildRules, ruleStatus } from '../ruleFacts';

export interface Figure {
  /** "3 of 5", or null when there is nothing to count from. */
  value: string | null;
  unit: string;
  source: { label: string; href: string } | null;
}

/** The plan the overview answers for: the build plan. */
export function buildPlan(trace: Trace): TracePlan | undefined {
  return trace.plans.find((plan) => plan.kind === 'build');
}

export const nodesOf = (trace: Trace, plan: TracePlan | undefined): TraceNode[] =>
  trace.nodes.filter((node) => plan !== undefined && node.plan === plan.id);

const ofTotal = (count: number, total: number): string | null => (total === 0 ? null : `${count} of ${total}`);

/**
 * Where a count was read from. One file links to the file. Files that differ only in some path segments link to the
 * directory they share and read as a pattern, with a star for each segment that differs.
 */
export function sourceOf(files: (string | null | undefined)[], sha: string): Figure['source'] {
  const paths = [...new Set(files.filter((file): file is string => typeof file === 'string'))];
  const first = paths[0]?.split('/');
  if (first === undefined) return null;
  if (paths.length === 1) return { label: paths[0] ?? '', href: blobUrl(sha, paths[0] ?? '') };
  const split = paths.map((path) => path.split('/'));
  const shared = first.map((segment, i) => (split.every((parts) => parts.length === first.length && parts[i] === segment) ? segment : '*'));
  const folder = shared[shared.length - 1] === '*' ? shared.slice(0, -1) : shared;
  const stable = folder.indexOf('*') === -1 ? folder : folder.slice(0, folder.indexOf('*'));
  return {
    label: shared[shared.length - 1] === '*' ? `${folder.join('/')}/` : shared.join('/'),
    href: treeUrl(sha, stable.join('/')),
  };
}

/** NAV-1: the six receipt figures, each counted from the trace and naming the file it was counted from. */
export function receiptFigures(trace: Trace, sha: string): Figure[] {
  const plan = buildPlan(trace);
  const nodes = nodesOf(trace, plan);
  const verdicts = trace.verdicts.filter((verdict) => plan !== undefined && verdict.plan === plan.id);
  const decisions = trace.decisions.filter((decision) => plan !== undefined && decision.plan === plan.id);
  const looped = nodes.filter((node) => (node.attempt ?? 0) >= 1);
  const rules = buildRules(trace);
  const matrixSource = sourceOf(rules.map((rule) => rule.matrix?.source?.file), sha);
  const planSource = sourceOf([plan?.source], sha);
  const built = rules.filter((rule) => rule.status === 'built');
  const passing = rules.filter((rule) => ruleStatus(rule) === 'pass');
  return [
    {
      value: ofTotal(built.length, rules.length),
      unit: `rules built, counted from the ${rules.length} rows of the requirements matrix, each with status built`,
      source: matrixSource,
    },
    {
      value: ofTotal(passing.length, rules.length),
      unit: 'rules whose own test count passes in full: pass equals total in the matrix row',
      source: matrixSource,
    },
    {
      value: ofTotal(nodes.filter((node) => node.status === 'done').length, nodes.length),
      unit: `nodes done, counted from the ${nodes.length} nodes of plan ${plan?.id ?? ''}`,
      source: planSource,
    },
    {
      value: ofTotal(looped.filter((node) => (node.attempt ?? 0) > 1).length, looped.length),
      unit: 'looped nodes needed more than one attempt, counted from the attempt of each node that started one',
      source: planSource,
    },
    {
      value: ofTotal(verdicts.filter((verdict) => verdict.verdict === 'FAIL').length, verdicts.length),
      unit: `verdicts were FAIL, counted from the ${verdicts.length} reviewer and security verdicts`,
      source: sourceOf(verdicts.map((verdict) => verdict.file), sha),
    },
    {
      value: plan === undefined ? null : String(decisions.length),
      unit: `human decisions on plan ${plan?.id ?? ''}, counted from the decision rows`,
      source: sourceOf(decisions.map((decision) => decision.evidence?.file), sha),
    },
  ];
}

/** The rule the verify command re-checks: the first with both a red and a green commit in the matrix. */
export function checkedRule(trace: Trace): TraceRule | undefined {
  return buildRules(trace).find((rule) => rule.matrix?.red && rule.matrix.green);
}

/** The headline answer, counted from the matrix and the verdicts. */
export function headlineAnswer(trace: Trace): string {
  const plan = buildPlan(trace);
  const verdicts = trace.verdicts.filter((verdict) => plan !== undefined && verdict.plan === plan.id);
  const rules = buildRules(trace);
  const red = rules.filter((rule) => rule.matrix?.red);
  const green = red.filter((rule) => rule.matrix?.green);
  const failed = verdicts.filter((verdict) => verdict.verdict === 'FAIL');
  const followed = failed.every((fail) =>
    verdicts.slice(verdicts.indexOf(fail) + 1).some((later) => later.node === fail.node && later.agent === fail.agent && later.verdict === 'PASS'),
  );
  const counts = `${red.length} of ${rules.length} rules list a red commit. ${green.length} also list a green commit and ${red.length - green.length} list none.`;
  if (verdicts.length === 0) return `${counts} No reviewer or security verdict is recorded.`;
  const was = failed.length === 1 ? 'was' : 'were';
  const later = followed && failed.length > 0 ? ', and each was later followed by a PASS from the same agent on the same node' : '';
  return `${counts} ${failed.length} of ${verdicts.length} reviewer and security verdicts ${was} FAIL${later}.`;
}
