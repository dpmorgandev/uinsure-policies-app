import { useParams } from 'react-router';
import { KeyValueList, NotBuiltYet, RuleChip, ShaLink, VerifyCommand } from '../../../kit';
import type { RuleChipStatus } from '../../../kit';
import type { Trace } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { commitUrl } from '../../shell/repo';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { CannedDiff } from '../canned';
import '../explorer.css';

/** A rule trailer names a rule the matrix has, or one it does not: the chip says which. */
function chipStatus(trace: Trace, ruleId: string): RuleChipStatus {
  const rule = trace.rules.find((candidate) => candidate.id === ruleId);
  if (rule === undefined) return 'unknown';
  return rule.status === 'built' ? 'built' : 'nb';
}

const linkOut = (sha: string) => <ShaLink sha={sha.slice(0, 7)} fullSha={sha} githubHref={commitUrl(sha)} />;

export function Commit() {
  const { sha = '' } = useParams();
  const { trace: loaded } = useShell();
  if (loaded.state !== 'ready') return <DataNotice trace={loaded} />;
  const trace = loaded.trace;
  const commit = sha.length < 7 ? undefined : trace.commits.find((candidate) => candidate.sha.startsWith(sha));
  if (commit === undefined) {
    return <NotBuiltYet kind="region" name={`commit ${sha.slice(0, 7)}`} back={{ href: '#/', label: 'Back to the overview' }} />;
  }
  const parents = commit.parents ?? [];
  return (
    <>
      <NotBuiltRegion region="commit-header-and-trailers" name="commit header and trailers" />
      <NotBuiltRegion region="trailer-agent-vs-hook-agent" name="trailer agent vs hook agent" />
      <Rung region="diff-lazy" req="RULE-3" ordinal="Step 3" heading="Diff">
        <CannedDiff rung="#42" sha="3a092b0" tdd="green" layer="domain" agent="builder" />
        <KeyValueList items={[{ label: 'Files changed', value: 'src/Uinsure.Policies.Domain/Common/Money.cs', mono: true }]} />
      </Rung>
      <Rung region="links-out" req="NAV-3" ordinal="Step 4" heading="Links out">
        <KeyValueList
          items={[
            { label: 'Commit', value: linkOut(commit.sha) },
            {
              label: 'Parent',
              value:
                parents.length === 0 ? null : (
                  <span className="s-chips">
                    {parents.map((parent) => (
                      <span key={parent}>{linkOut(parent)}</span>
                    ))}
                  </span>
                ),
              missing: 'no parent recorded',
            },
            {
              label: 'Node',
              value: commit.plan && commit.node ? <a href={`#/plans/${commit.plan}/${commit.node}`}>{`${commit.plan}/${commit.node}`}</a> : null,
              missing: 'no node in the trailers',
            },
            {
              label: 'Rule',
              value:
                commit.rule.length === 0 ? null : (
                  <span className="s-chips">
                    {commit.rule.map((id) => (
                      <RuleChip key={id} ruleId={id} status={chipStatus(trace, id)} href={`#/rules/${encodeURIComponent(id)}`} />
                    ))}
                  </span>
                ),
              missing: 'no Rule trailer',
            },
          ]}
        />
        <VerifyCommand
          command={`git log -1 --format="%h %(trailers:key=TDD,valueonly) %s" ${commit.short}`}
          intro="Run this in a clone."
        />
      </Rung>
    </>
  );
}
