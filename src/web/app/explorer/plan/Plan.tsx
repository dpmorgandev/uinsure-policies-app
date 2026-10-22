import { useParams } from 'react-router';
import { KeyValueList, MarkdownText, NotBuiltYet } from '../../../kit';
import type { TracePlan } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';

const NOT_AN_INVESTIGATION = 'none: not an investigation plan';
const NOT_COMPILED = 'not read from the plan file';

/** An inv-* plan as the compiler reads it: its Question and Hypothesis sections, as the plan file writes them. */
type InvestigationPlan = TracePlan & { question?: string | null; hypothesis?: string | null };

const markdown = (text: string | null | undefined) => (text === undefined || text === null ? null : <MarkdownText source={text} />);

// The plan header and the node graph are not built; the investigation body is.
export function Plan() {
  const { planId = '' } = useParams();
  const { trace } = useShell();
  const plan = trace.state === 'ready' ? (trace.trace.plans.find((candidate) => candidate.id === planId) as InvestigationPlan | undefined) : undefined;
  const investigation = plan?.kind === 'inv';
  return (
    <>
      <NotBuiltRegion region="plan-header-status-approval-requirements-rev" name="plan header (status, approval, requirements rev)" />
      <NotBuiltRegion region="node-graph-and-its-table" name="node graph and its table" />
      <Rung region="investigation-body-inv-plans-only" req="LOOP-2" ordinal="Step 3" heading="Read the investigation">
        {trace.state !== 'ready' ? (
          <DataNotice trace={trace} />
        ) : plan === undefined ? (
          <NotBuiltYet kind="region" name={`plan ${planId}`} back={{ href: '#/', label: 'Back to the overview' }} />
        ) : investigation ? (
          <KeyValueList
            items={[
              { label: 'Question', value: markdown(plan.question), missing: 'no Question section in the plan file' },
              { label: 'Hypothesis', value: markdown(plan.hypothesis), missing: 'no Hypothesis section in the plan file' },
              { label: 'Findings', missing: NOT_COMPILED },
              { label: 'Recommendations', missing: NOT_COMPILED },
            ]}
          />
        ) : (
          <>
            <p className="s-text">
              This plan is not an investigation, so this body is empty. An inv-* plan shows its question, hypothesis, findings and recommendations in
              these rows.
            </p>
            <KeyValueList
              items={[
                { label: 'Question', missing: NOT_AN_INVESTIGATION },
                { label: 'Hypothesis', missing: NOT_AN_INVESTIGATION },
                { label: 'Findings', missing: NOT_AN_INVESTIGATION },
                { label: 'Recommendations', missing: NOT_AN_INVESTIGATION },
              ]}
            />
          </>
        )}
      </Rung>
    </>
  );
}
