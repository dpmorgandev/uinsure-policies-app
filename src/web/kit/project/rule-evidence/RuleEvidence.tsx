import type { ReactNode } from 'react';
import { Check, Pin, TriangleAlert } from 'lucide-react';
import { AgentBadge } from '../../primitives/agent-badge/AgentBadge';
import type { AgentName } from '../../primitives/agent-badge/AgentBadge';
import { Disclosure } from '../../primitives/disclosure/Disclosure';
import { ShaLink } from '../../primitives/sha-link/ShaLink';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import type { Status } from '../../primitives/status-tag/StatusTag';
import { NotBuiltYet } from '../not-built-yet/NotBuiltYet';
import { RungSpine } from '../rung-spine/RungSpine';
import type { Rung, RungBranch, RungSpineItem, RungTone } from '../rung-spine/RungSpine';
import styles from './RuleEvidence.module.css';

export type EvidenceStep = 'red' | 'stub' | 'green' | 'refactor';

/** One commit of the rule's evidence, at its walkthrough row. */
export interface EvidenceCommit {
  /** The walkthrough row number: the commit's rung. */
  row: number;
  sha: string;
  fullSha?: string;
  /** The commit on GitHub. */
  githubHref?: string;
  tdd: EvidenceStep;
  agent: AgentName;
  /** The layer the walkthrough names: tests, api. */
  layer?: string;
  /** A short imperative step label: "Write the failing test". */
  label: string;
  /** What the commit did, in its own words. */
  what: string;
  note?: ReactNode;
  /** The requirements matrix records this commit for the rule. It gets the heavier marker and is listed at a glance. */
  key?: boolean;
  /** Rows between the previous commit and this one that the view does not hold: "Row 6 is not in this view". */
  gapBefore?: string;
}

export interface EvidenceRequirement {
  text: ReactNode;
  /** Where the text is written: "docs/requirements.md". */
  source?: string;
}

export interface EvidenceQa {
  /** The QA step reference: "docs/qa/build-F2.md#1". */
  ref: string;
  href?: string;
  result: 'pass' | 'fail';
  summary?: ReactNode;
  by?: string;
}

export interface EvidenceSignoff {
  by: string;
  /** The date as the trail gives it. */
  date: string;
  /** "Accepted". */
  verdict: string;
  note?: ReactNode;
}

export interface EvidencePr {
  number: number;
  href?: string;
  state: 'merged' | 'open' | 'draft';
  by?: string;
  note?: ReactNode;
}

/** Whether red sits above green, as the caller read it from the rows. */
export interface EvidenceOrder {
  state: 'held' | 'violated';
  redRow: number;
  greenRow: number;
}

/** A retry or investigation that steps off the spine after a commit row and rejoins at another. */
export interface EvidenceBranch extends Omit<RungBranch, 'kind' | 'rejoin'> {
  afterRow: number;
  rejoinRow?: number;
  rejoinNote?: ReactNode;
}

export interface RuleEvidenceProps {
  ruleId: string;
  /** In walkthrough order, oldest first. */
  commits: readonly EvidenceCommit[];
  requirement?: EvidenceRequirement;
  /** `null` or nothing means the trail holds no such step, and it is drawn as a gap. */
  qa?: EvidenceQa | null;
  signoff?: EvidenceSignoff | null;
  pr?: EvidencePr | null;
  order?: EvidenceOrder;
  /** Tests that pass at the red gate because an earlier node delivered them: pinned, not red. */
  pinned?: ReactNode;
  branches?: readonly EvidenceBranch[];
  /** The rule is not built: say so, and draw nothing else. */
  notBuilt?: boolean;
  /** A way back, shown when the rule is not built. */
  back?: { href: string; label: string };
}

const STEPS: Record<EvidenceStep, { status: Status; word: string; tone: RungTone }> = {
  red: { status: 'fail', word: 'Red', tone: 'red' },
  stub: { status: 'pending', word: 'Stub', tone: 'stub' },
  green: { status: 'pass', word: 'Green', tone: 'green' },
  refactor: { status: 'pass', word: 'Refactor', tone: 'refactor' },
};

const PR_STATES: Record<EvidencePr['state'], { status: Status; word: string }> = {
  merged: { status: 'pass', word: 'Merged' },
  open: { status: 'pending', word: 'Open' },
  draft: { status: 'pending', word: 'Draft' },
};

function commitRung(commit: EvidenceCommit, flagged: boolean): Rung {
  const step = STEPS[commit.tdd];
  return {
    id: `r${commit.row}`,
    marker: `#${commit.row}`,
    label: commit.label,
    agent: <AgentBadge agent={commit.agent} />,
    tone: step.tone,
    emphasis: commit.key,
    state: flagged ? 'stopped' : undefined,
    tag: flagged ? { status: 'fail', label: 'Out of order' } : undefined,
    receipt: (
      <>
        <p className={styles.line}>
          <ShaLink sha={commit.sha} fullSha={commit.fullSha} githubHref={commit.githubHref} />
          <StatusTag status={step.status}>{step.word}</StatusTag>
          {commit.layer ? <span className={styles.layer}>{commit.layer}</span> : null}
        </p>
        <p className={styles.what}>{commit.what}</p>
        {commit.note ? <p className={styles.note}>{commit.note}</p> : null}
      </>
    ),
  };
}

function gap(id: string, text: string): RungSpineItem {
  return { kind: 'gap', id, text };
}

/**
 * A rule's evidence in TDD order, down one spine: requirement, red, green, refactor, QA step, sign-off, PR.
 * Position is the proof: red above green is read from the rungs. A missing step is a gap, never a failure.
 */
export function RuleEvidence({
  ruleId,
  commits,
  requirement,
  qa,
  signoff,
  pr,
  order,
  pinned,
  branches = [],
  notBuilt = false,
  back,
}: RuleEvidenceProps) {
  if (notBuilt) {
    return (
      <section className={styles.root} aria-label={`Evidence for ${ruleId}`} data-state="not-built">
        <NotBuiltYet kind="rule" name={ruleId} back={back} />
      </section>
    );
  }

  const violated = order !== undefined && order.state === 'violated';
  const flaggedRows = order !== undefined && order.state === 'violated' ? new Set([order.redRow, order.greenRow]) : new Set<number>();
  const hasStep = (step: EvidenceStep) => commits.some((commit) => commit.tdd === step);

  const items: RungSpineItem[] = [];

  if (requirement) {
    items.push({
      id: 'rule',
      marker: 'REQ',
      label: 'Read the rule',
      agent: requirement.source,
      shape: 'round',
      receipt: <p className={styles.what}>{requirement.text}</p>,
    });
  }

  if (!hasStep('red')) items.push(gap('no-red', `No red commit is recorded for ${ruleId}`));

  for (const commit of commits) {
    if (commit.gapBefore) items.push(gap(`gap-before-${commit.row}`, commit.gapBefore));
    items.push(commitRung(commit, flaggedRows.has(commit.row)));
    for (const branch of branches.filter((b) => b.afterRow === commit.row)) {
      const { afterRow, rejoinRow, rejoinNote, ...rest } = branch;
      void afterRow;
      items.push({
        ...rest,
        kind: 'branch',
        rejoin:
          rejoinRow !== undefined ? { toId: `r${rejoinRow}`, text: `#${rejoinRow}`, note: rejoinNote } : undefined,
      });
    }
  }

  if (!hasStep('green')) items.push(gap('no-green', `No green commit is recorded for ${ruleId}`));
  if (!hasStep('refactor')) items.push(gap('no-refactor', `No refactor commit is recorded for ${ruleId}`));

  if (qa) {
    items.push({
      id: 'qa',
      marker: 'QA',
      label: 'Run the QA step',
      agent: qa.by,
      shape: 'round',
      receipt: (
        <>
          <p className={styles.line}>
            {qa.href ? (
              <a className={styles.ref} href={qa.href}>
                {qa.ref}
              </a>
            ) : (
              <span className={styles.ref}>{qa.ref}</span>
            )}
            <StatusTag status={qa.result === 'pass' ? 'pass' : 'fail'} />
          </p>
          {qa.summary ? <p className={styles.what}>{qa.summary}</p> : null}
        </>
      ),
    });
  } else {
    items.push(gap('no-qa', `No QA step is recorded for ${ruleId}`));
  }

  if (signoff) {
    items.push({
      id: 'signoff',
      marker: 'OK',
      label: 'Sign off',
      agent: signoff.by,
      shape: 'round',
      receipt: (
        <>
          <p className={styles.line}>
            <StatusTag status="pass">{signoff.verdict}</StatusTag>
            <span className={styles.ref}>{signoff.date}</span>
          </p>
          {signoff.note ? <p className={styles.what}>{signoff.note}</p> : null}
        </>
      ),
    });
  } else {
    items.push(gap('no-signoff', `No sign-off is recorded for ${ruleId}`));
  }

  if (pr) {
    const state = PR_STATES[pr.state];
    items.push({
      id: 'pr',
      marker: 'PR',
      label: 'Merge the PR',
      agent: pr.by,
      shape: 'round',
      receipt: (
        <>
          <p className={styles.line}>
            {pr.href ? <a href={pr.href}>{`PR #${pr.number}`}</a> : <span>{`PR #${pr.number}`}</span>}
            <StatusTag status={state.status}>{state.word}</StatusTag>
          </p>
          {pr.note ? <p className={styles.what}>{pr.note}</p> : null}
        </>
      ),
    });
  } else {
    items.push(gap('no-pr', `No PR is recorded for ${ruleId}`));
  }

  const glance = commits.filter((commit) => commit.key);

  return (
    <section
      className={styles.root}
      aria-label={`Evidence for ${ruleId}`}
      data-state={violated ? 'order-violated' : 'recorded'}
    >
      {order ? (
        order.state === 'held' ? (
          <p className={`${styles.order} ${styles.held}`} data-order="held">
            <Check className={styles.icon} aria-hidden="true" focusable="false" />
            <span>{`Red at #${order.redRow} sits above green at #${order.greenRow}.`}</span>
          </p>
        ) : (
          <p className={`${styles.order} ${styles.violated}`} data-order="violated">
            <TriangleAlert className={styles.icon} aria-hidden="true" focusable="false" />
            <span>{`Order violated: green at #${order.greenRow} sits above red at #${order.redRow}. The test did not come first.`}</span>
          </p>
        )
      ) : null}

      {glance.length > 0 ? (
        <ol className={styles.glance} aria-label="The order in one glance: red, then green, then refactor">
          {glance.map((commit) => {
            const step = STEPS[commit.tdd];
            return (
              <li key={commit.row} className={styles.glanceItem} data-tdd={commit.tdd}>
                <span className={styles.glanceRow}>{`#${commit.row}`}</span>
                <ShaLink sha={commit.sha} fullSha={commit.fullSha} githubHref={commit.githubHref} />
                <StatusTag status={step.status}>{step.word}</StatusTag>
              </li>
            );
          })}
        </ol>
      ) : null}

      <RungSpine label={`Evidence for ${ruleId}, in order`} items={items} />

      {pinned ? (
        <aside className={styles.pinned} aria-label="Pinned tests">
          <Pin className={styles.icon} aria-hidden="true" focusable="false" />
          <div>
            <p className={styles.pinnedTitle}>Pinned tests</p>
            <p className={styles.what}>{pinned}</p>
          </div>
        </aside>
      ) : null}

      {commits.length > 0 ? (
        <div className={styles.equivalent}>
          <Disclosure summary="Text equivalent: the commit rungs as a table">
            <div className={styles.scroll} role="region" aria-label={`Commits for ${ruleId}, table`} tabIndex={0}>
              <table className={styles.table}>
                <caption>{`Commits for ${ruleId}, sorted by rung number, ascending: the walkthrough's own order.`}</caption>
                <thead>
                  <tr>
                    <th scope="col">Rung</th>
                    <th scope="col">SHA</th>
                    <th scope="col">TDD</th>
                    <th scope="col">Agent</th>
                    <th scope="col">Layer</th>
                    <th scope="col">What it did</th>
                  </tr>
                </thead>
                <tbody>
                  {commits.map((commit) => (
                    <tr key={commit.row}>
                      <th scope="row" className={styles.cellMono}>{`#${commit.row}`}</th>
                      <td className={styles.cellMono}>{commit.sha}</td>
                      <td>{STEPS[commit.tdd].word}</td>
                      <td className={styles.cellMono}>{commit.agent}</td>
                      <td>{commit.layer ?? <span className={styles.absent}>none</span>}</td>
                      <td>{commit.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Disclosure>
        </div>
      ) : null}
    </section>
  );
}
