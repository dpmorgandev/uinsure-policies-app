import type { AgentName } from '../../kit';

const AGENTS: readonly AgentName[] = ['main', 'tester', 'builder', 'reviewer', 'security', 'investigator', 'git', 'david'];

/** The badge name for an agent or owner the trail wrote, or null when it is not one the kit draws (the loop, say). */
export function agentOf(value: string | null | undefined): AgentName | null {
  return AGENTS.find((agent) => agent === value) ?? null;
}

/** AGENT-1: whether a commit's Agent trailer and the agent the hook saw agree. 'unrecorded' when no hook line logged it. */
export function agentCheck(commit: { agent: string | null; hookAgent?: string | null }): 'match' | 'mismatch' | 'unrecorded' {
  if (commit.hookAgent === undefined || commit.hookAgent === null) return 'unrecorded';
  return commit.hookAgent === commit.agent ? 'match' : 'mismatch';
}
