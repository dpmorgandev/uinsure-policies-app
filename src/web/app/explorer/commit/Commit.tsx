import { useParams } from 'react-router';
import { KeyValueList, NotBuiltYet, RuleChip, ShaLink, VerifyCommand } from '../../../kit';
import type { Trace, TraceCommit } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { commitUrl } from '../../shell/repo';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
import { chipStatus, ruleHref } from '../../shell/ruleLinks';
import { useShell } from '../../shell/ShellContext';
import { CommitDiff } from '../diff/CommitDiff';
import { useDiffs } from '../diff/useDiffs';
import { TrailerVsHook } from './TrailerVsHook';
import '../explorer.css';

const linkOut = (sha: string) => <ShaLink sha={sha.slice(0, 7)} fullSha={sha} githubHref={commitUrl(sha)} />;

function CommitPage({ trace, commit }: { trace: Trace; commit: TraceCommit }) {
  const diffs = useDiffs(trace);
  const diff = diffs.stateOf(commit.sha);
  const parents = commit.parents ?? [];
  return (
    <>
      <NotBuiltRegion region="commit-header-and-trailers" name="commit header and trailers" />
      <TrailerVsHook commit={commit} />
      <Rung region="diff-lazy" req="RULE-3" ordinal="Step 3" heading="Diff">
        <CommitDiff commit={commit} state={diff} onLoad={diffs.load} />
        <KeyValueList
          items={[
            {
              label: 'Files changed',
              value: diff.status === 'loaded' && diff.files.length > 0 ? diff.files.map((file) => file.path).join(', ') : null,
              mono: true,
              missing: diff.status === 'loaded' ? 'the diff names no file' : 'load the diff to list its files',
            },
          ]}
        />
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
                      <RuleChip key={id} ruleId={id} status={chipStatus(trace, id)} href={ruleHref(id)} />
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

export function Commit() {
  const { sha = '' } = useParams();
  const { trace: loaded } = useShell();
  if (loaded.state !== 'ready') return <DataNotice trace={loaded} />;
  const commit = sha.length < 7 ? undefined : loaded.trace.commits.find((candidate) => candidate.sha.startsWith(sha));
  if (commit === undefined) {
    return <NotBuiltYet kind="region" name={`commit ${sha.slice(0, 7)}`} back={{ href: '#/', label: 'Back to the overview' }} />;
  }
  return <CommitPage trace={loaded.trace} commit={commit} />;
}
