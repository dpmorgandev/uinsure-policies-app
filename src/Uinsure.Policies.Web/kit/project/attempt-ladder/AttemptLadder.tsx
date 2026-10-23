import type { ReactNode } from 'react';
import { Disclosure } from '../../primitives/disclosure/Disclosure';
import { RungSpine } from '../rung-spine/RungSpine';
import type { BranchEntry, RungSpineItem, RungTag } from '../rung-spine/RungSpine';
import styles from './AttemptLadder.module.css';

/** The links of the chain an attempt follows: FAIL, findings, red test, Fixes-Finding commit, re-run verdicts. */
export type LadderStage = 'gate' | 'findings' | 'red test' | 'fix commit' | 'verdict';

export interface LadderStep {
  /** The step's ordinal as the data holds it: "1·2" for attempt then event, or "#26" for a walkthrough row. */
  marker: string;
  stage: LadderStage;
  /** The event itself: a gate row, a verdict card, a commit line. */
  content: ReactNode;
  /** The review round it belongs to: "A3", or "A3.2" for a re-review in the same attempt. */
  round?: string;
}

export interface LadderAttempt {
  n: number;
  /** How the attempt ended, as a status word: "Failed at gate.stub". */
  outcome: RungTag;
  /** The review rounds that ran inside this attempt. Two or more is a re-review in the same attempt. */
  rounds?: readonly string[];
  steps: readonly LadderStep[];
  /** Where the attempt turned over: "Attempt 1 → 2 on gate.stub FAIL at 305789d". */
  turn?: ReactNode;
}

/** An investigation opened between two attempts. It steps off the spine and rejoins at the next attempt. */
export interface LadderEscalation {
  /** "inv-001". */
  id: string;
  /** It steps off the spine before this attempt and rejoins at it. */
  beforeAttempt: number;
  leaves: ReactNode;
  entries: BranchEntry[];
  note?: ReactNode;
  why?: ReactNode;
}

export interface AttemptLadderProps {
  /** The accessible name of the list of attempts. */
  label?: string;
  /** Oldest first. Every attempt keeps its own rung: none is folded into a count. */
  attempts: readonly LadderAttempt[];
  escalation?: LadderEscalation;
  /** expanded: every attempt's steps are shown. aggregated: each attempt is one rung with its steps behind a control. */
  mode?: 'expanded' | 'aggregated';
  headingLevel?: 2 | 3 | 4;
}

const STAGES: Record<LadderStage, string> = {
  gate: 'Gate',
  findings: 'Findings',
  'red test': 'Red test',
  'fix commit': 'Fix commit',
  verdict: 'Verdict',
};

function Steps({ attempt }: { attempt: LadderAttempt }) {
  return (
    <ol className={styles.steps} aria-label={`Steps of attempt ${attempt.n}`}>
      {attempt.steps.map((step, index) => (
        <li key={`${step.marker}-${index}`} className={styles.step} data-stage={step.stage}>
          <span className={styles.marker}>{step.marker}</span>
          <div className={styles.body}>
            <p className={styles.stageLine}>
              <span className={styles.stage}>{STAGES[step.stage]}</span>
              {step.round ? <span className={styles.round}>Round {step.round}</span> : null}
            </p>
            {step.content}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Attempts as a chain, oldest first, each on its own rung: a FAIL, its findings, the red test, the Fixes-Finding
 * commit and the re-run verdicts. A re-review in the same attempt keeps its own step, and an investigation steps off
 * the spine and rejoins it.
 */
export function AttemptLadder({
  label = 'Attempts, oldest first',
  attempts,
  escalation,
  mode = 'expanded',
  headingLevel,
}: AttemptLadderProps) {
  const items: RungSpineItem[] = [];
  for (const attempt of attempts) {
    if (escalation && escalation.beforeAttempt === attempt.n) {
      items.push({
        kind: 'branch',
        id: `escalation-${escalation.id}`,
        title: `Investigation ${escalation.id}`,
        leaves: escalation.leaves,
        why: escalation.why,
        entries: escalation.entries,
        investigation: { id: escalation.id, note: escalation.note },
        rejoin: { toId: `attempt-${attempt.n}`, text: `attempt ${attempt.n}` },
      });
    }
    const reReview = attempt.rounds !== undefined && attempt.rounds.length > 1;
    items.push({
      id: `attempt-${attempt.n}`,
      marker: String(attempt.n),
      label: `Attempt ${attempt.n}`,
      tag: attempt.outcome,
      shape: 'round',
      receipt: (
        <div className={styles.receipt} data-mode={mode}>
          {reReview ? (
            <p className={styles.rounds}>
              {`Reviewed more than once in this attempt: rounds ${attempt.rounds!.join(', ')}. Each round keeps its own step.`}
            </p>
          ) : null}
          {mode === 'aggregated' ? (
            <>
              <p className={styles.count}>{`${attempt.steps.length} ${attempt.steps.length === 1 ? 'step' : 'steps'} in this attempt.`}</p>
              <Disclosure summary={`Show the steps of attempt ${attempt.n}`}>
                <Steps attempt={attempt} />
              </Disclosure>
            </>
          ) : (
            <Steps attempt={attempt} />
          )}
          {attempt.turn ? <p className={styles.turn}>{attempt.turn}</p> : null}
        </div>
      ),
    });
  }
  return <RungSpine label={label} items={items} headingLevel={headingLevel} />;
}
