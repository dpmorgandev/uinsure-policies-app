import { AgentBadge, KeyValueList } from '../../../kit';
import type { TraceCommit } from '../../data/trace';
import { agentCheck, agentOf } from '../../shell/agents';
import { Rung } from '../../shell/Rung';

const MARK = { match: '✓ trailer and hook agree', mismatch: '✗ trailer and hook disagree' } as const;

const badge = (name: string | null | undefined) => {
  const known = agentOf(name);
  return known === null ? (name ?? null) : <AgentBadge agent={known} />;
};

/** AGENT-1: the Agent trailer beside the agent the hook saw. No hook record is a gap, never a match. */
export function TrailerVsHook({ commit }: { commit: TraceCommit }) {
  const check = agentCheck(commit);
  return (
    <Rung region="trailer-agent-vs-hook-agent" req="AGENT-1" ordinal="Step 2" heading="Agent: the trailer against the hook">
      <p className="s-text">The trailer is what the commit says. The hook is what the harness saw when the commit was made.</p>
      <KeyValueList
        items={[
          { label: 'Agent trailer', value: badge(commit.agent), missing: 'no Agent trailer' },
          { label: 'Agent the hook saw', value: badge(commit.hookAgent), missing: 'not recorded: no hook line logged this commit' },
          { label: 'Match', value: check === 'unrecorded' ? null : MARK[check], missing: 'not shown: a match needs both sides' },
        ]}
      />
    </Rung>
  );
}
