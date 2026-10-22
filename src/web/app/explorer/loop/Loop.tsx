import { AttemptLadder, CodeBlock, GateRow } from '../../../kit';
import type { LadderAttempt } from '../../../kit';
import { Region } from '../../shell/Rung';
import '../explorer.css';

// Canned content (stub): build/F3 as the design fixture holds it. The real loop events replace it at the screen layer.
const HEAD = { sha: 'fc8dc03', fullSha: 'fc8dc035bf684ce60651629990168416f4163563' };
const COMMAND = 'npm run e2e -- --grep "COULD-2"; curl -X POST /policies/ABC-1/claims';

const ATTEMPTS: LadderAttempt[] = [
  {
    n: 1,
    outcome: { status: 'fail', label: 'Failed at gate.stub' },
    steps: [
      {
        marker: '1·4',
        stage: 'gate',
        content: (
          <GateRow gate="gate.stub" result="failed" exit={1} expected="every COULD-2 test fails" ok={false} head={HEAD} detail="The stub answers 500 on a valid claim." />
        ),
      },
    ],
  },
  {
    n: 2,
    outcome: { status: 'pass', label: 'Passed' },
    steps: [
      {
        marker: '2·10',
        stage: 'gate',
        content: <GateRow gate="gate.green" result="held" exit={0} expected="pass, >=1 test per rule" ok={true} detail="COULD-2 passes." />,
      },
    ],
  },
];

export function Loop() {
  return (
    <>
      <Region region="attempt-ladder" req="LOOP-2" label="Attempt ladder">
        <AttemptLadder attempts={ATTEMPTS} mode="aggregated" headingLevel={2} />
      </Region>
      <Region region="gate-timeline" req="LOOP-1" label="Gate timeline">
        <div className="s-group">
          <GateRow gate="state(in_progress)" kind="state" marker="1·2" detail="Node started." />
          <GateRow gate="gate.stub" marker="1·4" result="failed" exit={1} expected="every COULD-2 test fails" ok={false} head={HEAD} />
          <CodeBlock label="Command of 1·4 gate.stub">{COMMAND}</CodeBlock>
        </div>
      </Region>
    </>
  );
}
