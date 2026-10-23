import { useState } from 'react';
import { FilterBar, PageHeader } from '../../../kit';
import type { FilterDefinition } from '../../../kit';
import type { TraceDecision } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { Region } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { DecisionRow, kindOf } from './DecisionRow';
import '../u5.css';
import './decisions.css';

type Filters = Record<'kind' | 'plan' | 'node', string>;
const NO_FILTERS: Filters = { kind: '', plan: '', node: '' };

// The filter says the kind in words; the loop's own ids (pause1, signoff, merged) stay out of the page.
const KIND_WORDS: [string, string][] = [
  ['pause1', 'Pause 1'],
  ['pause2', 'Pause 2'],
  ['steer', 'Steer'],
  ['ruling', 'Ruling'],
  ['signoff', 'Sign-off'],
  ['merge', 'Merge'],
];

const distinct = (values: (string | null)[]): { value: string; label: string }[] =>
  [...new Set(values.filter((value): value is string => value !== null))].map((value) => ({ value, label: value }));

const passes = (d: TraceDecision, f: Filters): boolean =>
  (f.kind === '' || d.kind === f.kind) && (f.plan === '' || d.plan === f.plan) && (f.node === '' || d.node === f.node);

/** The shown decisions grouped by plan, then node, in the order the snapshot lists them. */
function grouped(decisions: TraceDecision[]): { plan: string; nodes: { node: string; decisions: TraceDecision[] }[] }[] {
  const plans: { plan: string; nodes: { node: string; decisions: TraceDecision[] }[] }[] = [];
  for (const d of decisions) {
    const plan = plans.find((p) => p.plan === d.plan) ?? plans[plans.push({ plan: d.plan, nodes: [] }) - 1];
    const name = d.node ?? '';
    const node = plan?.nodes.find((n) => n.node === name) ?? plan?.nodes[plan.nodes.push({ node: name, decisions: [] }) - 1];
    node?.decisions.push(d);
  }
  return plans;
}

export function Decisions() {
  const { trace } = useShell();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  const all = trace.trace.decisions.filter((d) => kindOf(d) !== null);
  const shown = all.filter((d) => passes(d, filters));
  const count = (kind: string): number => all.filter((d) => d.kind === kind).length;
  const nodes = new Set(all.map((d) => `${d.plan}/${d.node}`));
  const definitions: FilterDefinition[] = [
    { id: 'kind', label: 'Kind', options: KIND_WORDS.filter(([kind]) => count(kind) > 0).map(([value, label]) => ({ value, label })), value: filters.kind },
    { id: 'plan', label: 'Plan', options: distinct(all.map((d) => d.plan)), value: filters.plan },
    { id: 'node', label: 'Node', options: distinct(all.map((d) => d.node)), value: filters.node },
  ];
  const parts = KIND_WORDS.filter(([kind]) => count(kind) > 0).map(([kind, label]) => `${count(kind)} ${label.toLowerCase()}`);
  let n = 0;
  return (
    <Region region="decision-list" req="HITL-1" label="Human decisions">
      <PageHeader
        eyebrow="Human decisions · all nodes"
        title="Human decisions"
        question="What did David decide across the nodes, and where is each decision recorded?"
        answer={
          all.length === 0
            ? 'No human decision is recorded in this snapshot.'
            : `${all.length} recorded decision points, each pinned to a line of a node's loop log: ${parts.join(', ')}.`
        }
        ids={[{ label: 'Recorded', value: `${all.length} decisions in ${nodes.size} ${nodes.size === 1 ? 'node' : 'nodes'}` }]}
        compiledAt={trace.snapshot.utc}
      />
      <FilterBar
        filters={definitions}
        onChange={(id, value) => setFilters((current) => ({ ...current, [id]: value }))}
        onClear={() => setFilters(NO_FILTERS)}
        matchCount={shown.length}
        totalCount={all.length}
        noun="decisions"
      />
      {grouped(shown).map((plan) => (
        <section className="s-u5-block" key={plan.plan}>
          <h2 className="s-u5-head">Plan: {plan.plan}</h2>
          {plan.nodes.map((node) => (
            <div className="s-u5-block" key={node.node}>
              <h3 className="s-u5-head">{`${plan.plan}/${node.node}`}</h3>
              <ol className="s-decisions">
                {node.decisions.map((decision) => (
                  <DecisionRow key={`${decision.evidence?.file}:${decision.evidence?.line}`} trace={trace.trace} decision={decision} marker={String(++n)} />
                ))}
              </ol>
            </div>
          ))}
        </section>
      ))}
    </Region>
  );
}
