import { AgentBadge, DataTable, KeyValueList, PageHeader } from '../../../kit';
import type { DataTableColumn } from '../../../kit';
import type { Harness as HarnessFile } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { agentOf } from '../../shell/agents';
import { useShell } from '../../shell/ShellContext';
import '../u5.css';

type Agent = HarnessFile['agents'][number] & { id: string; position: number };
type Hook = HarnessFile['hooks'][number] & { id: string; position: number };

const agentColumns: DataTableColumn<Agent>[] = [
  { id: 'rung', header: 'Rung', rowHeader: true, cell: (row) => `#${row.position}` },
  {
    id: 'agent',
    header: 'Agent',
    cell: (row) => (agentOf(row.name) === null ? <code>{row.name}</code> : <AgentBadge agent={agentOf(row.name)} />),
  },
  { id: 'tools', header: 'Model · tools', mono: true, cell: (row) => [row.model, row.tools].filter(Boolean).join(' · ') || 'not recorded' },
  { id: 'what', header: 'What it is dispatched for', wrap: 'anywhere', cell: (row) => row.description ?? 'not recorded' },
];

const hookColumns: DataTableColumn<Hook>[] = [
  { id: 'rung', header: 'Rung', rowHeader: true, cell: (row) => `#${row.position}` },
  { id: 'file', header: 'Hook file', mono: true, wrap: 'anywhere', cell: (row) => row.file },
  { id: 'gates', header: 'Gates it names', mono: true, cell: (row) => (row.gates.length === 0 ? 'none named' : row.gates.join(' · ')) },
  { id: 'purpose', header: 'Purpose, as the file holds it', wrap: 'anywhere', cell: (row) => row.purpose ?? 'not recorded' },
];

export function Harness() {
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  const { harness } = trace.trace;
  const agents: Agent[] = (harness?.agents ?? []).map((agent, index) => ({ ...agent, id: agent.file, position: index + 1 }));
  const hooks: Hook[] = (harness?.hooks ?? []).map((hook, index) => ({ ...hook, id: hook.file, position: index + 1 }));
  return (
    <>
      <section className="s-u5-region" data-region="agents" data-req="AGENT-3">
        <PageHeader
          eyebrow="About · Harness"
          title="Harness"
          question="What is each agent allowed to touch, and which hooks stand guard over them?"
          answer={
            harness === null
              ? 'docs/trace/harness.json is not in this snapshot, so there are no agents or hooks to show.'
              : `${agents.length} agents and ${hooks.length} hooks, counted from the harness file.`
          }
          ids={[
            { label: 'Harness file (DATA-7)', value: harness?.provenance ?? null, missing: 'not in this snapshot' },
            { label: 'Snapshot SHA', value: `${trace.snapshot.ref} ${trace.snapshot.short}` },
          ]}
          compiledAt={trace.snapshot.utc}
        />
        <section className="s-u5-block" aria-labelledby="harness-agents">
          <h2 className="s-u5-head" id="harness-agents">
            Agents and their tools
          </h2>
          <DataTable<Agent>
            caption="Agents in the harness file, in file order. Each agent's file is named in the harness file."
            rows={agents}
            columns={agentColumns}
          />
        </section>
        <section className="s-u5-block" aria-labelledby="harness-never">
          <h2 className="s-u5-head" id="harness-never">
            Preloaded skills and never-dos, per agent
          </h2>
          <KeyValueList
            items={[
              { label: 'Preloaded skills, per agent', value: null, missing: 'not in the harness file: it does not say which skill each agent preloads' },
              { label: 'Never-dos, per agent', value: null, missing: 'not in the harness file: no never-do list is recorded for any agent' },
            ]}
          />
        </section>
        <section className="s-u5-block" aria-labelledby="harness-skills">
          <h2 className="s-u5-head" id="harness-skills">
            Skills on disk, not mapped to agents
          </h2>
          <p className="s-u5-lead">
            {harness?.skills.length ?? 0} skills, counted from the harness file, in file order. The file lists them but does not link any to
            an agent.
          </p>
          <KeyValueList
            items={(harness?.skills ?? []).map((skill) => ({ label: skill.name, value: skill.description, missing: 'no description recorded' }))}
          />
        </section>
      </section>
      <section className="s-u5-region" data-region="hooks" data-req="AGENT-3">
        <section className="s-u5-block" aria-labelledby="harness-hooks">
          <h2 className="s-u5-head" id="harness-hooks">
            Hooks and what each guards
          </h2>
          <p className="s-u5-lead">
            The gate IDs are those the harness file names for each hook. A hook that names none is shown as none named, not as unguarded.
          </p>
          <DataTable<Hook> caption="Hooks in the harness file, in file order." rows={hooks} columns={hookColumns} />
        </section>
      </section>
    </>
  );
}
