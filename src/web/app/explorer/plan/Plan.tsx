import { useParams } from 'react-router';
import { PageHeader } from '../../../kit';
import { DataNotice } from '../../shell/DataNotice';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { CannedPlanGraph } from '../canned';
import '../explorer.css';

export function Plan() {
  const { planId = '' } = useParams();
  const { trace: loaded } = useShell();
  if (loaded.state !== 'ready') return <DataNotice trace={loaded} />;
  const { snapshot } = loaded;
  return (
    <>
      <Rung region="plan-header-status-approval-requirements-rev" req="DAG-1" ordinal="Step 1" heading="Read the answer">
        <PageHeader
          eyebrow={`Plan · ${planId}`}
          title={`Plan ${planId}`}
          question="Which steps of the build are done, in what order, and what is still waiting?"
          status={{ value: 'pass', label: 'Approved' }}
          ids={[
            { label: 'Plan', value: planId },
            { label: 'Requirements rev', value: null },
            { label: 'Snapshot SHA', value: `${snapshot.ref} ${snapshot.short}` },
          ]}
          compiledAt={snapshot.utc}
        />
      </Rung>
      <Rung region="node-graph-and-its-table" req="DAG-1" ordinal="Step 2" heading="Follow the plan">
        <CannedPlanGraph />
      </Rung>
      <NotBuiltRegion region="investigation-body-inv-plans-only" name="investigation body" />
    </>
  );
}
