import { NotBuiltYet } from '../../../kit';
import type { Trace } from '../../data/trace';
import { DecisionRow, kindOf } from './DecisionRow';
import './decisions.css';

const LATEST = 3;

/** HITL-1: the last few human decisions on the build plan, oldest first so the order reads down the page. */
export function LatestDecisions({ trace, planId }: { trace: Trace; planId: string | undefined }) {
  const all = trace.decisions.filter((d) => d.plan === planId && kindOf(d) !== null);
  if (all.length === 0) return <NotBuiltYet kind="region" name="latest human decisions" />;
  const latest = all.slice(-LATEST);
  return (
    <>
      <p className="s-text">
        The {latest.length === 1 ? 'most recent human decision' : `${latest.length} most recent human decisions`} on plan {planId}, oldest first so the
        order reads down the page. {latest.length} of the {all.length} decision rows are shown.
      </p>
      <ol className="s-decisions">
        {latest.map((decision) => (
          <DecisionRow key={`${decision.evidence?.file}:${decision.evidence?.line}`} trace={trace} decision={decision} />
        ))}
      </ol>
      <p className="s-next">
        <a href="#/decisions">All human decisions</a>
      </p>
    </>
  );
}
