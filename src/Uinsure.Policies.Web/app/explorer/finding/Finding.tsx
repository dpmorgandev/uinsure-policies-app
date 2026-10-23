import { useParams } from 'react-router';
import { Breadcrumbs, FileLineLink, FindingCard, JsonViewer, NotBuiltYet, PageHeader, ProvenanceLabel, ShaLink, StatusTag } from '../../../kit';
import type { FindingFix } from '../../../kit';
import type { Snapshot, Trace, TraceCommit } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { blobUrl, commitUrl } from '../../shell/repo';
import { Region } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { findingsOf, shortSha } from '../loopData';
import type { RoundFinding } from '../loopData';
import '../explorer.css';
import './finding.css';

/** The text between two of the finding's markers is missing when the recorded text has no such marker; the card says so. */
const markerGap = (name: string) => <span>no "{name}:" marker in the recorded text</span>;

const commitLink = (sha: string) => <ShaLink sha={shortSha(sha)} fullSha={sha} href={`#/commits/${shortSha(sha)}`} githubHref={commitUrl(sha)} />;

/** The finding's commits, oldest first, as the kit's finding card takes one: the first, with the others named after it. */
function fixOf(finding: RoundFinding, round: string, commits: TraceCommit[]): FindingFix | null {
  const [first, ...rest] = finding.fixedBy;
  if (first === undefined) return null;
  const subject = commits.find((c) => c.sha === first)?.subject;
  return {
    sha: shortSha(first),
    fullSha: first,
    href: `#/commits/${shortSha(first)}`,
    githubHref: commitUrl(first),
    trailer: `Fixes-Finding: ${round}/${finding.id ?? ''}`,
    subject: rest.length === 0 ? subject : `${subject ?? ''} (then ${rest.map(shortSha).join(', ')})`.trim(),
  };
}

function statusOf(findings: RoundFinding[]): { value: 'pass' | 'warn'; label: string } {
  const fixed = findings.filter((f) => f.fixedBy.length > 0).length;
  if (fixed === findings.length) return { value: 'pass', label: 'Fix commit recorded for each' };
  return { value: 'warn', label: `${fixed} of ${findings.length} have a fix commit recorded` };
}

function Round({ trace, snapshot, plan, node, round, findings }: { trace: Trace; snapshot: Snapshot; plan: string; node: string; round: string; findings: RoundFinding[] }) {
  const first = findings[0]!;
  const rules = [...new Set(findings.flatMap((f) => f.rule ?? []))];
  // The files are linked at the commit the round's source names; a source with no commit falls back to the snapshot.
  const at = /\b[0-9a-f]{40}\b/.exec(first.source ?? '')?.[0] ?? snapshot.sha;
  const nodeHref = `#/plans/${plan}/${node}`;
  const fixedBy = Object.fromEntries(findings.map((f) => [f.id ?? '', f.fixedBy]));
  return (
    <>
      <Region region="findings" req="LOOP-4" label="Findings">
        <Breadcrumbs
          items={[
            { label: 'Plans', href: `#/plans/${plan}` },
            { label: plan, href: `#/plans/${plan}` },
            { label: node, href: nodeHref, mono: true },
            { label: `Findings ${round}`, mono: true },
          ]}
        />
        <PageHeader
          eyebrow={`Finding round · ${plan}/${node}`}
          title={`Round ${round}: findings on node ${node}`}
          question="Which commit fixed each finding the investigator raised in this round?"
          status={statusOf(findings)}
          ids={[
            { label: 'Rule', value: rules.join(', '), missing: 'no rule recorded' },
            { label: 'Attempt', value: first.attempt === null ? null : String(first.attempt) },
            { label: 'Snapshot SHA', value: snapshot.short },
          ]}
          compiledAt={snapshot.utc}
        />
        <h2 className="s-heading">Findings</h2>
        <p className="s-text">
          <ProvenanceLabel provenance="recorded" /> Finding text from <FileLineLink path={first.file} href={blobUrl(snapshot.sha, first.file)} />
        </p>
        <p className="s-text">Source: {first.source ?? 'not recorded'}. Each finding is read down in the order its round lists it.</p>
        <ol className="s-findinglist">
          {findings.map((f, index) => (
            <li className="s-findingitem" key={`${f.id ?? ''}-${index}`}>
              <p className="s-text">
                {f.id} · rule {f.rule ?? 'not recorded'} · layer {f.layer ?? 'not recorded'} · attempt {f.attempt ?? 'not recorded'} ·{' '}
                {f.testable === true ? 'testable' : f.testable === false ? 'untestable' : 'testable: not recorded'}
              </p>
              <FindingCard
                id={`${f.id ?? 'no id'} `}
                symptom={f.symptom ?? markerGap('Symptom')}
                cause={f.cause ?? markerGap('Cause')}
                files={f.files.map((path) => ({ path, href: blobUrl(at, path) }))}
                fixDirection={f.fixDirection ?? markerGap('Fix direction')}
                suggestedTest={f.suggestedTest ?? undefined}
                testable={f.testable === true}
                untestableReason={f.untestableReason ?? undefined}
                fixedBy={fixOf(f, round, trace.commits)}
                headingLevel={3}
              />
            </li>
          ))}
        </ol>
        <p className="s-text">
          <a href={`${nodeHref}/loop`}>Open the loop for {node} to see the gate or verdict that raised these findings</a>
        </p>
      </Region>
      <Region region="fixed-by" req="LOOP-4 LOOP-2" label="Fixed by">
        <h2 className="s-heading">Fixed by</h2>
        <p className="s-text">The commits whose Fixes-Finding trailer names each finding of this round, oldest first.</p>
        <ol className="s-fixlist">
          {findings.map((f, index) => (
            <li key={`${f.id ?? ''}-${index}`}>
              <div className="s-fixrow">
                <span>{f.id}</span>{' '}
                {f.fixedBy.length === 0 ? (
                  <StatusTag status="warn">No fix commit recorded</StatusTag>
                ) : (
                  f.fixedBy.map((sha) => <span key={sha}>{commitLink(sha)}</span>)
                )}
              </div>
            </li>
          ))}
        </ol>
        <JsonViewer json={JSON.stringify(fixedBy)} label={`fixedBy for each finding in round ${round}`} />
      </Region>
    </>
  );
}

export function Finding() {
  const { planId = '', nodeId = '', round = '' } = useParams();
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  const findings = findingsOf(trace.trace, planId, nodeId, round);
  if (findings.length === 0) {
    return <NotBuiltYet kind="region" name={`findings ${round} of ${planId}/${nodeId}`} back={{ href: `#/plans/${planId}/${nodeId}/loop`, label: 'Back to the loop' }} />;
  }
  return <Round trace={trace.trace} snapshot={trace.snapshot} plan={planId} node={nodeId} round={round} findings={findings} />;
}
