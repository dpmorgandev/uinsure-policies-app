import type { Status } from '../../kit';
import type { TestCount, Trace, TraceCommit, TraceRule } from '../data/trace';

/** The build plan's rules are docs/requirements.md's; trace.json also holds the ui plan's, which the overview and matrix leave out. */
export const buildRules = (trace: Trace): TraceRule[] => trace.rules.filter((rule) => rule.source?.file === 'docs/requirements.md');

/** "2 of 2", or "? of 1" when the trail holds no pass count; null when the rule has no tests yet. */
export function testsText(tests: TestCount | null | undefined): string | null {
  if (!tests) return null;
  return `${tests.pass ?? '?'} of ${tests.total ?? '?'}`;
}

/** A rule's status from the matrix row: not built, or by its own test count. A missing pass count is pending, not a pass. */
export function ruleStatus(rule: TraceRule): Status {
  if (rule.status !== 'built') return 'not-built';
  const tests = rule.matrix?.tests;
  if (!tests || tests.pass === null || tests.total === null) return 'pending';
  return tests.pass === tests.total ? 'pass' : 'fail';
}

const WORDS: Partial<Record<Status, string>> = { pass: 'Pass', fail: 'Fail', pending: 'Pending' };

/** The status tag of a rule: its status word and test count ("Pass 2 of 2"); a rule not built keeps the plain word. */
export function ruleStatusTag(rule: TraceRule): { value: Status; label?: string } {
  const value = ruleStatus(rule);
  const tests = testsText(rule.matrix?.tests);
  const word = WORDS[value];
  return word === undefined || tests === null ? { value } : { value, label: `${word} ${tests}` };
}

/** The header's status for a set of rules: pass only when every rule's own tests pass in full. */
export function rulesSummary(rules: TraceRule[]): { value: Status; label: string } {
  const passing = rules.filter((rule) => ruleStatus(rule) === 'pass').length;
  const all = passing === rules.length;
  return { value: all ? 'pass' : 'warn', label: `${all ? 'Pass' : 'Warn'} ${passing} of ${rules.length} rules` };
}

/** The matrix gives short SHAs; the commit is the one that starts with it. */
export function commitOfShort(trace: Trace, short: string): TraceCommit | undefined {
  return trace.commits.find((commit) => commit.sha.startsWith(short));
}

/** The full SHA of a matrix short SHA, or the short one itself when no commit starts with it. */
export function fullShaOf(trace: Trace, short: string): string {
  return commitOfShort(trace, short)?.sha ?? short;
}

const TDD_STEPS = ['red', 'stub', 'green', 'refactor'];

/** A rule's TDD commits in the order its node's walkthrough numbered them. Commits without a row are not on the spine. */
export function ruleCommits(trace: Trace, rule: TraceRule): TraceCommit[] {
  const matrix = rule.matrix;
  return trace.commits
    .filter(
      (commit) =>
        commit.rule.includes(rule.id) &&
        commit.order !== null &&
        commit.tdd !== null &&
        TDD_STEPS.includes(commit.tdd) &&
        (matrix?.node == null || (commit.plan === matrix.plan && commit.node === matrix.node)),
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
