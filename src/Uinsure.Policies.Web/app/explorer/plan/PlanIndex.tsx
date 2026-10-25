import { DataNotice } from '../../shell/DataNotice';
import { Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import '../explorer.css';

/** DAG-1: the Plan nav entry opens this list of every plan in trace.json, so none is reached only through another. */
export function PlanIndex() {
  const { trace: loaded } = useShell();
  if (loaded.state !== 'ready') return <DataNotice trace={loaded} />;
  const { plans } = loaded.trace;
  return (
    <Rung region="plan-index" req="DAG-1" ordinal="Step 1" heading="Choose a plan">
      {plans.length === 0 ? (
        <p className="s-text">trace.json holds no plan.</p>
      ) : (
        <ul className="s-text">
          {plans.map((plan) => (
            <li key={plan.id}>
              <a href={`#/plans/${plan.id}`}>{plan.id}</a>
              {plan.title === null ? '' : `: ${plan.title}`}
            </li>
          ))}
        </ul>
      )}
    </Rung>
  );
}
