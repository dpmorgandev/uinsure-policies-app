import { useParams } from 'react-router';
import { KeyValueList, MarkdownText, NotBuiltYet, PageHeader } from '../../../kit';
import type { Status } from '../../../kit';
import type { TracePlan } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { blobUrl } from '../../shell/repo';
import { Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import '../explorer.css';
import { PlanGraph } from './PlanGraph';

const NOT_AN_INVESTIGATION = 'none: not an investigation plan';
const NOT_COMPILED = 'not read from the plan file';

/** An inv-* plan as the compiler reads it: its Question and Hypothesis sections, as the plan file writes them. */
type InvestigationPlan = TracePlan & { question?: string | null; hypothesis?: string | null };

const markdown = (text: string | null | undefined) => (text === undefined || text === null ? null : <MarkdownText source={text} />);

/** The plan file's own status word; one the page does not know is shown as written, as a warning. An investigation has none. */
function statusOf(plan: TracePlan): { value: Status; label: string } | null {
  if (plan.status == null) return null;
  if (plan.status === 'approved') return { value: 'pass', label: 'Approved' };
  return { value: 'warn', label: plan.status };
}

const approvalOf = (plan: TracePlan): string | null => {
  const parts = [plan.approvedBy, plan.approvedOn].filter((part): part is string => part != null);
  return parts.length === 0 ? null : parts.join(', ');
};

export function Plan() {
  const { planId = '' } = useParams();
  const { trace: loaded } = useShell();
  if (loaded.state !== 'ready') return <DataNotice trace={loaded} />;
  const { trace, snapshot } = loaded;
  const plan = trace.plans.find((candidate) => candidate.id === planId) as InvestigationPlan | undefined;
  if (plan === undefined) {
    return <NotBuiltYet kind="region" name={`plan ${planId}`} back={{ href: '#/', label: 'Back to the overview' }} />;
  }
  return (
    <>
      <Rung region="plan-header-status-approval-requirements-rev" req="DAG-1" ordinal="Step 1" heading="Read the answer">
        <PageHeader
          eyebrow={plan.title === null ? `Plan · ${plan.id}` : `Plan · ${plan.title}`}
          title={`Plan ${plan.id}`}
          question="Which steps of the build are done, in what order, and what is still waiting?"
          status={statusOf(plan)}
          ids={[
            { label: 'Plan', value: plan.id },
            { label: 'Approved', value: approvalOf(plan), missing: 'no approval recorded' },
            { label: 'Requirements rev', value: plan.requirementsRev, missing: 'not in the plan file' },
            {
              label: 'Source',
              value: plan.source,
              href: plan.source == null ? undefined : blobUrl(snapshot.sha, plan.source),
              missing: 'no plan file',
            },
            { label: 'Snapshot SHA', value: `${snapshot.ref} ${snapshot.short}` },
          ]}
          compiledAt={snapshot.utc}
        />
      </Rung>
      <Rung region="node-graph-and-its-table" req="DAG-1" ordinal="Step 2" heading="Follow the plan">
        <PlanGraph trace={trace} plan={plan} />
      </Rung>
      <Rung region="investigation-body-inv-plans-only" req="LOOP-2" ordinal="Step 3" heading="Read the investigation">
        {plan.kind === 'inv' ? (
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
