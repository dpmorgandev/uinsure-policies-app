import { KeyValueList } from '../../../kit';
import { NotBuiltRegion, Rung } from '../../shell/Rung';

const NOT_AN_INVESTIGATION = 'none: not an investigation plan';

// Canned content (stub): the plan header and the node graph are not built; the investigation body is.
export function Plan() {
  return (
    <>
      <NotBuiltRegion region="plan-header-status-approval-requirements-rev" name="plan header (status, approval, requirements rev)" />
      <NotBuiltRegion region="node-graph-and-its-table" name="node graph and its table" />
      <Rung region="investigation-body-inv-plans-only" req="LOOP-2" ordinal="Step 3" heading="Read the investigation">
        <p className="s-text">
          This plan is not an investigation, so this body is empty. An inv-* plan shows its question, hypothesis, findings and recommendations in these
          rows.
        </p>
        <KeyValueList
          items={[
            { label: 'Question', missing: NOT_AN_INVESTIGATION },
            { label: 'Hypothesis', missing: NOT_AN_INVESTIGATION },
            { label: 'Findings', missing: NOT_AN_INVESTIGATION },
            { label: 'Recommendations', missing: NOT_AN_INVESTIGATION },
          ]}
        />
      </Rung>
    </>
  );
}
