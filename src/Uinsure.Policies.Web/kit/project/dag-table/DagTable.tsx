import { RuleChip } from '../../primitives/rule-chip/RuleChip';
import { StatusTag } from '../../primitives/status-tag/StatusTag';
import styles from './DagTable.module.css';

/** The states a plan node is drawn in. `not-built` is a node whose rules have no code yet. */
export type DagNodeStatus = 'done' | 'in-progress' | 'pending' | 'not-built';

export interface DagNode {
  /** The node's id in the plan: `F2`. */
  id: string;
  title: string;
  status: DagNodeStatus;
  /** Ids of the nodes this one waits for. Empty for a root. */
  dependsOn: readonly string[];
  /** Rule IDs the node builds. */
  rules: readonly string[];
  /** Where the node's page is, when it has one. */
  href?: string;
  /** The pull request that merged it. */
  pr?: number | null;
}

export interface DagTableProps {
  nodes: readonly DagNode[];
  /** Says what the table is. Defaults to the text-equivalent wording. */
  caption?: string;
  /**
   * Where each rule chip links, given the rule ID. Return `undefined` (or leave the prop out) to keep the chip's own
   * default, `/rules/<ruleId>`.
   */
  ruleHref?: (ruleId: string) => string | undefined;
}

/** A node's status as a word, a glyph and a colour. Shared by the graph and the table, so they never disagree. */
export function DagStatusTag({ status }: { status: DagNodeStatus }) {
  switch (status) {
    case 'done':
      return <StatusTag status="pass">Done</StatusTag>;
    case 'in-progress':
      return <StatusTag status="pending">In progress</StatusTag>;
    case 'pending':
      return <StatusTag status="pending">Pending</StatusTag>;
    case 'not-built':
      return <StatusTag status="not-built">Not built</StatusTag>;
  }
}

export function DagTable({
  nodes,
  caption = 'The plan as an adjacency table: each node, what it waits for, its status and its rules',
  ruleHref,
}: DagTableProps) {
  return (
    <div className={styles.frame} role="region" aria-label="Plan nodes table, scrolls sideways" tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Node</th>
            <th scope="col">Depends on</th>
            <th scope="col">Status</th>
            <th scope="col">Rules</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.id} data-status={node.status}>
              <th scope="row" className={styles.node}>
                {node.href ? (
                  <a className={styles.id} href={node.href}>
                    {node.id}
                  </a>
                ) : (
                  <span className={styles.id}>{node.id}</span>
                )}
                <span className={styles.title}>{node.title}</span>
                {node.pr !== undefined && node.pr !== null ? <span className={styles.pr}>PR #{node.pr}</span> : null}
              </th>
              <td>
                {node.dependsOn.length === 0 ? (
                  <span className={styles.none}>none, a root</span>
                ) : (
                  <ul className={styles.ids} aria-label={`${node.id} depends on`}>
                    {node.dependsOn.map((dep) => (
                      <li key={dep} className={styles.dep}>
                        {dep}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td>
                <DagStatusTag status={node.status} />
              </td>
              <td>
                {node.rules.length === 0 ? (
                  <span className={styles.none}>none</span>
                ) : (
                  <ul className={styles.rules} aria-label={`${node.id} rules`}>
                    {node.rules.map((rule) => (
                      <li key={rule}>
                        <RuleChip
                          ruleId={rule}
                          status={node.status === 'not-built' ? 'nb' : 'built'}
                          href={ruleHref?.(rule)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
