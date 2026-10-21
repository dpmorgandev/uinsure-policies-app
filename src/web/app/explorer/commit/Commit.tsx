import { KeyValueList, RuleChip, VerifyCommand } from '../../../kit';
import { NotBuiltRegion, Rung } from '../../shell/Rung';

// Stub: canned until the loader answers.
export function Commit() {
  return (
    <>
      <NotBuiltRegion region="commit-header-and-trailers" name="commit header and trailers" />
      <NotBuiltRegion region="trailer-agent-vs-hook-agent" name="trailer agent vs hook agent" />
      <NotBuiltRegion region="diff-lazy" name="diff" />
      <Rung region="links-out" req="NAV-3" ordinal="Step 4" heading="Links out">
        <KeyValueList items={[{ label: 'Rule', value: <RuleChip ruleId="GET-1" href="#/rules/GET-1" /> }]} />
        <VerifyCommand command='git log -1 --format="%h %(trailers:key=TDD,valueonly) %s"' intro="Run this in a clone." />
      </Rung>
    </>
  );
}
