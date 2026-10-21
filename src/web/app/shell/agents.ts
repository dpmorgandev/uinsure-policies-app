import type { AgentName } from '../../kit';

const AGENTS: readonly AgentName[] = ['main', 'tester', 'builder', 'reviewer', 'security', 'investigator', 'git', 'david'];

/** The badge name for an agent or owner the trail wrote, or null when it is not one the kit draws (the loop, say). */
export function agentOf(value: string | null | undefined): AgentName | null {
  return AGENTS.find((agent) => agent === value) ?? null;
}
