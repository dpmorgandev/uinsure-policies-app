import { useParams } from 'react-router';
import { VerifyCommand } from '../../../kit';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';

// Stub: the header, banner and tabs come from the frame. The region below is canned.
export function Node() {
  const { planId = '', nodeId = '' } = useParams();
  const { trace } = useShell();
  const gitOnly = trace.state === 'ready' && trace.trace.nodes.some((n) => n.plan === planId && n.id === nodeId && n.completeness?.includes('git-only'));
  return (
    <>
      <Rung region="completeness-banner" req="DATA-4 DATA-8" ordinal="Step 1" heading="Was the node witnessed by the trail?">
        {gitOnly ? (
          <VerifyCommand
            command={`git log --oneline --grep='(${planId}/${nodeId})'`}
            intro="Run this in a clone. It lists the commits whose message names this node."
          />
        ) : null}
      </Rung>
      <NotBuiltRegion region="rules" name="rules" />
      <NotBuiltRegion region="tasks" name="tasks" />
      <NotBuiltRegion region="attempts" name="attempts" />
      <NotBuiltRegion region="who-touched-what" name="who touched what" />
    </>
  );
}
