import { AgentBadge, Breadcrumbs, KeyValueList, PageHeader, RuleChip, TddStepTag } from '../../../kit';
import type { Trace } from '../../data/trace';
import { entityUrl } from '../../data/trace';
import type { FixingCommit } from '../loopData';
import { agentOf } from '../../shell/agents';
import { Rung } from '../../shell/Rung';
import { chipStatus, ruleHref } from '../../shell/ruleLinks';

/** NAV-2: the commit at its own URL, named by its subject, with the trailers the compile read from it. */
export function CommitHeader({ trace, commit, stamp }: { trace: Trace; commit: FixingCommit; stamp: string }) {
  const agent = agentOf(commit.agent);
  const fixes = (commit.fixesFinding ?? []).map((f) => (f.round === null ? f.id : `A${f.round}/${f.id}`)).join(', ');
  const node = commit.plan && commit.node ? `${commit.plan}/${commit.node}` : null;
  return (
    <Rung region="commit-header-and-trailers" req="NAV-2" ordinal="Step 1" heading="Read the commit">
      <Breadcrumbs
        items={[
          { label: 'Overview', href: '#/' },
          ...(node === null ? [] : [{ label: node, href: entityUrl({ kind: 'node', plan: commit.plan ?? '', node: commit.node ?? '' }), mono: true }]),
          { label: commit.short, mono: true },
        ]}
      />
      <PageHeader
        eyebrow={node === null ? 'Commit' : `Commit · ${node}`}
        title={commit.subject}
        ids={[{ label: 'Commit', value: commit.short }]}
        compiledAt={stamp}
      />
      <KeyValueList
        items={[
          { label: 'Walkthrough row', value: commit.order === null ? null : `#${commit.order}`, mono: true, missing: 'not in a walkthrough' },
          { label: 'Agent', value: agent === null ? commit.agent : <AgentBadge agent={agent} />, missing: 'no Agent trailer' },
          { label: 'TDD', value: <TddStepTag step={commit.tdd} /> },
          {
            label: 'Rule',
            value:
              commit.rule.length === 0 ? null : (
                <span className="s-chips">
                  {commit.rule.map((id) => (
                    <RuleChip key={id} ruleId={id} status={chipStatus(trace, id)} href={ruleHref(id)} />
                  ))}
                </span>
              ),
            missing: 'no Rule trailer',
          },
          { label: 'Fixes finding', value: fixes === '' ? null : fixes, mono: true, missing: 'fixes no finding' },
        ]}
      />
    </Rung>
  );
}
