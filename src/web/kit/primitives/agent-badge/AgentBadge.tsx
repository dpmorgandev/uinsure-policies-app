import { Bot, Minus, User } from 'lucide-react';
import styles from './AgentBadge.module.css';

export type AgentName =
  | 'main'
  | 'tester'
  | 'builder'
  | 'reviewer'
  | 'security'
  | 'investigator'
  | 'git'
  | 'david';

export interface AgentBadgeProps {
  /** Who made the change. `null` or `undefined` means the hook saw no agent. */
  agent?: AgentName | null;
}

export function AgentBadge({ agent }: AgentBadgeProps) {
  if (agent === undefined || agent === null) {
    return (
      <span className={`${styles.badge} ${styles.none}`} data-agent="none" data-glyph="minus">
        <Minus className={styles.icon} aria-hidden="true" focusable="false" />
        <span aria-hidden="true">{'—'}</span>
        <span className={styles.srOnly}>no agent recorded, the hook saw none</span>
      </span>
    );
  }
  const person = agent === 'david';
  const Glyph = person ? User : Bot;
  return (
    <span className={styles.badge} data-agent={agent} data-glyph={person ? 'user' : 'bot'}>
      <Glyph className={styles.icon} aria-hidden="true" focusable="false" />
      <span>{person ? 'David Morgan' : agent}</span>
    </span>
  );
}
