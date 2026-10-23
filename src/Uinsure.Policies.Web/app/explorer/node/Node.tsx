import { useParams } from 'react-router';
import { MarkdownText, StatusTag, VerifyCommand } from '../../../kit';
import type { TraceNode } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { NotFound } from '../../shell/NotFound';
import { Region, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { Ladder } from '../Ladder';
import { eventsOf } from '../loopData';
import { NodeRules, NodeTasks } from './NodeRules';
import { WhoTouched } from './WhoTouched';
import '../explorer.css';

/** What the node's completeness says, in a sentence. The value itself is the banner above, verbatim (DATA-4). */
function summaryOf(node: TraceNode): string {
  // DATA-8: a node mid-loop has a trail but no README to decide its completeness yet.
  if (node.completeness === null && node.trail === true) {
    return 'This node is in progress: its trail is still being written, so its completeness is not decided yet.';
  }
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
  if (node === undefined) return <NotFound asked={`/plans/${planId}/${nodeId}`} />;

  const gitOnly = node.completeness?.includes('git-only') ?? false;
  const quoted = !(node.completeness?.startsWith('TRAIL INCOMPLETE') ?? false) && node.completenessReasons.length > 0;
  // DATA-8: a line the compile could not read is reported by its file and line, never dropped.
  const unread = trace.trace.problems.filter((problem) => problem.line !== null && problem.file?.startsWith(`docs/trace/${planId}/${nodeId}/`));
  return (
    <>
      <Rung region="completeness-banner" req="DATA-4 DATA-8" ordinal="Step 1" heading="Was the node witnessed by the trail?">
        <p className="s-text">{summaryOf(node)}</p>
        {unread.length === 0 ? null : (
          <ul className="s-bullets" aria-label="Lines the compile could not read">
            {unread.map((problem) => (
              <li key={`${problem.file}:${problem.line}`}>
                <code>{`${problem.file}:${problem.line}`}</code> {problem.reason}
              </li>
            ))}
          </ul>
        )}
        {quoted ? <MarkdownText source={node.completenessReasons.join('\n\n')} /> : null}
        {gitOnly ? (
          <VerifyCommand
            command={`git log --oneline --grep='(${planId}/${nodeId})'`}
            intro="Run this in a clone. It lists the commits whose message names this node."
          />
        ) : null}
      </Rung>
      <NodeRules trace={trace.trace} node={node} />
      <NodeTasks node={node} source={trace.trace.plans.find((plan) => plan.id === planId)?.source} />
      <Region region="attempts" req="LOOP-2" label="Attempts">
        {eventsOf(trace.trace, planId, nodeId).length > 0 ? (
          <Ladder trace={trace.trace} plan={planId} node={nodeId} mode="aggregated" />
        ) : (
          <p className="s-text">
            <StatusTag status="not-built">No loop log</StatusTag> {planId}/{nodeId} has no loop log, so there is no attempt to draw.
          </p>
        )}
        <VerifyCommand command={`git log --oneline --grep='(${planId}/${nodeId})'`} intro="Run this in a clone. It lists the commits whose message names this node." />
      </Region>
      <WhoTouched trace={trace.trace} plan={planId} node={nodeId} />
    </>
  );
}
