import { useParams } from 'react-router';
import { MarkdownText, NotBuiltYet, StatusTag, VerifyCommand } from '../../../kit';
import type { TraceNode } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { NotBuiltRegion, Region, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { Ladder } from '../Ladder';
import { eventsOf } from '../loopData';

/** What the node's completeness says, in a sentence. The value itself is the banner above, verbatim (DATA-4). */
function summaryOf(node: TraceNode): string {
  if (node.completeness === null) return 'This node has no trail yet, so it has no completeness value to show.';
  if (node.completeness === 'OK') return 'Completeness is OK, as the banner above says.';
  if (node.completeness.startsWith('TRAIL INCOMPLETE')) return 'The trail is incomplete. The banner above gives every reason, in the trail\'s own words.';
  return 'Completeness is shown in the banner above, in the trail\'s own words.';
}

// The header, banner and tabs come from the frame; this is what sits under them.
export function Node() {
  const { planId = '', nodeId = '' } = useParams();
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  const node = trace.trace.nodes.find((candidate) => candidate.plan === planId && candidate.id === nodeId);
  if (node === undefined) return <NotBuiltYet kind="node" name={`${planId}/${nodeId}`} back={{ href: '#/', label: 'Back to the overview' }} />;

  const gitOnly = node.completeness?.includes('git-only') ?? false;
  const quoted = !(node.completeness?.startsWith('TRAIL INCOMPLETE') ?? false) && node.completenessReasons.length > 0;
  return (
    <>
      <Rung region="completeness-banner" req="DATA-4 DATA-8" ordinal="Step 1" heading="Was the node witnessed by the trail?">
        <p className="s-text">{summaryOf(node)}</p>
        {quoted ? <MarkdownText source={node.completenessReasons.join('\n\n')} /> : null}
        {gitOnly ? (
          <VerifyCommand
            command={`git log --oneline --grep='(${planId}/${nodeId})'`}
            intro="Run this in a clone. It lists the commits whose message names this node."
          />
        ) : null}
      </Rung>
      <NotBuiltRegion region="rules" name="rules" />
      <NotBuiltRegion region="tasks" name="tasks" />
      <Region region="attempts" req="LOOP-2" label="Attempts">
        {eventsOf(trace.trace, planId, nodeId).length > 0 ? (
          <Ladder trace={trace.trace} plan={planId} node={nodeId} mode="aggregated" />
        ) : (
          <p className="s-text">
            <StatusTag status="not-built">No loop log</StatusTag> {planId}/{nodeId} has no loop.jsonl, so there is no attempt to draw.
          </p>
        )}
        <VerifyCommand command={`git log --oneline --grep='(${planId}/${nodeId})'`} intro="Run this in a clone. It lists the commits whose message names this node." />
      </Region>
      <NotBuiltRegion region="who-touched-what" name="who touched what" />
    </>
  );
}
