import { useId } from 'react';
import type { ReactNode } from 'react';
import { AgentBadge } from '../../primitives/agent-badge/AgentBadge';
import type { AgentName } from '../../primitives/agent-badge/AgentBadge';
import { RuleChip } from '../../primitives/rule-chip/RuleChip';
import { ShaLink } from '../../primitives/sha-link/ShaLink';
import type { ShaLinkProps } from '../../primitives/sha-link/ShaLink';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import styles from './VerdictCard.module.css';

export interface VerdictFinding {
  /** The reviewer's own number for it: "R1". */
  id: string;
  severity: 'P1' | 'P2';
  summary: ReactNode;
  /** Who the finding is routed to: "tester" or "builder". Leave out when the verdict records none. */
  route?: string | null;
}

export interface LostVerdict {
  /** The receipt file that was lost: "A1-reviewer.json". */
  file: string;
  /** The loop holds a reconciled(...) event and reconciliation.md explains the loss. */
  reconciled: boolean;
}

export interface VerdictCardProps {
  agent: AgentName;
  /** The round: "A2", or "A3.2" for a re-review in the same attempt. */
  round: string;
  /** The node the verdict is for: "F0b". */
  node?: string;
  /** The verdict. Leave out when the receipt is lost. */
  verdict?: 'PASS' | 'FAIL';
  /** Set when the verdict receipt no longer exists. No verdict, rules or findings are shown. */
  lost?: LostVerdict;
  /** The head SHA the log names for the verdict. */
  head?: Pick<ShaLinkProps, 'sha' | 'fullSha' | 'href' | 'githubHref'>;
  /** Rules the verdict covers. Leave out when the trail does not say; an empty list means none. */
  rulesCovered?: readonly string[];
  /** Rules the verdict says are missing. Leave out when the trail does not say; an empty list means none. */
  rulesMissing?: readonly string[];
  /** Leave out when the trail does not say; an empty list means the verdict raised none. */
  findings?: readonly VerdictFinding[];
  /** The verdict's own summary text. */
  summary?: ReactNode;
  headingLevel?: 2 | 3 | 4;
}

function Rules({ ids }: { ids: readonly string[] | undefined }) {
  if (ids === undefined) return <span className={styles.absent}>not in the excerpt</span>;
  if (ids.length === 0) return <span>none</span>;
  return (
    <span className={styles.chips}>
      {ids.map((id) => (
        <RuleChip key={id} ruleId={id} />
      ))}
    </span>
  );
}

/** A verdict: PASS or FAIL, who gave it, in which round, at which head, what it covered and what it found. */
export function VerdictCard({
  agent,
  round,
  node,
  verdict,
  lost,
  head,
  rulesCovered,
  rulesMissing,
  findings,
  summary,
  headingLevel = 3,
}: VerdictCardProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const state = lost ? 'lost' : (verdict ?? 'unknown');
  return (
    <article className={styles.card} aria-labelledby={headingId} data-verdict={state}>
      <Heading id={headingId} className={styles.title}>
        <span>
          {agent} verdict {round}
        </span>
        {node ? <span className={styles.node}>{node}</span> : null}
        {lost ? (
          <StatusTag status="not-built">Lost</StatusTag>
        ) : verdict ? (
          <StatusTag status={verdict === 'PASS' ? 'pass' : 'fail'}>{verdict}</StatusTag>
        ) : null}
      </Heading>

      {lost ? (
        <div className={styles.lost}>
          <p>
            The verdict receipt <span className={styles.mono}>{lost.file}</span> was overwritten and lost. No verdict, rules or
            findings are shown for it.
          </p>
          <p>
            {lost.reconciled ? (
              <>
                It is reconciled: the loop holds <span className={styles.mono}>reconciled({lost.file})</span> and{' '}
                <span className={styles.mono}>reconciliation.md</span> explains it.
              </>
            ) : (
              'No reconciliation is recorded for it.'
            )}
          </p>
        </div>
      ) : (
        <>
          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Agent</dt>
              <dd>
                <AgentBadge agent={agent} />
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>Round</dt>
              <dd className={styles.mono}>{round}</dd>
            </div>
            <div className={styles.fact}>
              <dt>Head</dt>
              <dd>{head ? <ShaLink {...head} /> : <span className={styles.absent}>no SHA in the excerpt</span>}</dd>
            </div>
            <div className={styles.fact}>
              <dt>Rules covered</dt>
              <dd>
                <Rules ids={rulesCovered} />
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>Rules missing</dt>
              <dd>
                <Rules ids={rulesMissing} />
              </dd>
            </div>
          </dl>
          {summary ? <div className={styles.summary}>{summary}</div> : null}
          {findings === undefined ? (
            <p className={styles.absent}>Findings: not in the excerpt.</p>
          ) : findings.length === 0 ? (
            <p className={styles.none}>No findings.</p>
          ) : (
            <ol className={styles.findings} aria-label={`Findings of the ${agent} verdict ${round}`}>
              {findings.map((finding) => (
                <li key={finding.id} className={styles.finding}>
                  <span className={styles.findingId}>{finding.id}</span>
                  <div className={styles.findingBody}>
                    <p className={styles.findingHead}>
                      <StatusTag status={finding.severity === 'P1' ? 'fail' : 'warn'}>{finding.severity}</StatusTag>
                      <span className={styles.route}>
                        {finding.route ? `Route: ${finding.route}` : 'Route: not recorded'}
                      </span>
                    </p>
                    <p className={styles.text}>{finding.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </article>
  );
}
