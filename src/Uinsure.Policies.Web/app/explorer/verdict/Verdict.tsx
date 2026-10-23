import { useParams } from 'react-router';
import {
  Breadcrumbs,
  FileLineLink,
  JsonViewer,
  KeyValueList,
  NotBuiltYet,
  PageHeader,
  ProvenanceLabel,
  RuleChip,
  ShaLink,
  StatusTag,
  VerdictCard,
} from '../../../kit';
import type { Snapshot } from '../../data/trace';
import { agentOf } from '../../shell/agents';
import { DataNotice } from '../../shell/DataNotice';
import { blobUrl, commitUrl } from '../../shell/repo';
import { Region } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { headOf } from '../Ladder';
import { severityOf, shortSha, verdictsOf } from '../loopData';
import type { LoopVerdict, VerdictFindingRecord } from '../loopData';
import '../explorer.css';
import './verdict.css';

/** A gate ref is "gate.stub@<sha> (attempt 1, ok:false)": the gate, the commit it ran at, and what the verdict adds. */
function GateRef({ text }: { text: string }) {
  const parts = /^([^@\s]+)@([0-9a-f]{7,40})\s*(.*)$/.exec(text);
  if (parts === null) return <>{text}</>;
  const sha = parts[2] ?? '';
  return (
    <>
      <code>{parts[1]}</code> <ShaLink sha={shortSha(sha)} fullSha={sha} githubHref={commitUrl(sha)} /> {parts[3]}
    </>
  );
}

function Finding({ finding, verdict }: { finding: VerdictFindingRecord; verdict: LoopVerdict }) {
  const sha = verdict.head;
  return (
    <article className="s-finding">
      <h3 className="s-finding-title">
        {finding.id ?? 'no id'}{' '}
        {finding.severity === undefined ? null : <StatusTag status={finding.severity === 'P2' ? 'warn' : 'fail'}>{finding.severity}</StatusTag>}
      </h3>
      <KeyValueList
        items={[
          {
            label: 'Rule',
            value: finding.rule_id === undefined ? null : <RuleChip ruleId={finding.rule_id} href={`#/rules/${encodeURIComponent(finding.rule_id)}`} />,
            missing: 'no rule recorded',
          },
          {
            label: 'File',
            value:
              finding.file === undefined || sha === null ? null : (
                <FileLineLink path={finding.file} line={finding.line} href={blobUrl(sha, finding.file, finding.line)} />
              ),
            missing: 'no file recorded',
          },
          { label: 'Why it matters', value: finding.why, missing: 'no reason recorded' },
          { label: 'Routed to', value: finding.route_to, missing: 'no route recorded' },
        ]}
      />
    </article>
  );
}

function VerdictPage({ verdict, snapshot }: { verdict: LoopVerdict; snapshot: Snapshot }) {
  const { plan, node, round, agent } = verdict;
  const badge = agentOf(agent);
  const pass = verdict.verdict === 'PASS';
  const nodeHref = `#/plans/${plan}/${node}`;
  const gateRefs = verdict.gateRefs ?? [];
  return (
    <>
      <Region region="verdict-summary" req="LOOP-3" label="Verdict summary">
        <Breadcrumbs
          items={[
            { label: 'Plans', href: `#/plans/${plan}` },
            { label: plan, href: `#/plans/${plan}` },
            { label: node, href: nodeHref, mono: true },
            { label: 'Loop', href: `${nodeHref}/loop` },
            { label: `${agent} ${round}`, mono: true },
          ]}
        />
        <PageHeader
          eyebrow={`Verdict · ${plan}/${node} · ${agent}`}
          title={`${agent.charAt(0).toUpperCase()}${agent.slice(1)} verdict ${round}`}
          question="Did this agent pass the node's work at this round, and what did it leave open?"
          status={{ value: pass ? 'pass' : 'fail', label: verdict.verdict }}
          ids={[
            { label: 'Round', value: round },
            { label: 'Attempt', value: verdict.attempt === null ? null : String(verdict.attempt) },
          ]}
        />
        <p className="s-text">
          <ProvenanceLabel provenance="recorded" />
        </p>
        {badge === null ? (
          <p className="s-text">
            {agent} is not an agent the kit draws, so its verdict is shown as the raw JSON below.
          </p>
        ) : (
          <VerdictCard
            agent={badge}
            round={round}
            node={node}
            verdict={pass ? 'PASS' : verdict.verdict === 'FAIL' ? 'FAIL' : undefined}
            head={headOf(verdict.head)}
            rulesCovered={verdict.rulesCovered}
            rulesMissing={verdict.rulesMissing}
            findings={verdict.findings.map((f) => ({
              id: f.id ?? 'no id',
              severity: severityOf(f.severity),
              summary: f.what ?? '',
              route: f.route_to ?? null,
            }))}
            headingLevel={2}
            ruleHref={(id) => `#/rules/${encodeURIComponent(id)}`}
          />
        )}
        <KeyValueList
          items={[
            {
              label: 'Base',
              value:
                verdict.base === null ? null : <ShaLink sha={shortSha(verdict.base)} fullSha={verdict.base} githubHref={commitUrl(verdict.base)} />,
              missing: 'no base SHA recorded',
            },
            { label: 'Diff fingerprint', value: verdict.diffFingerprint, mono: true, missing: 'no fingerprint recorded' },
            {
              label: 'Gate refs',
              value:
                gateRefs.length === 0 ? null : (
                  <ul className="s-refs" aria-label={`Gate refs of the ${agent} verdict ${round}`}>
                    {gateRefs.map((ref, at) => (
                      <li key={`${ref}-${at}`}>
                        <GateRef text={ref} />
                      </li>
                    ))}
                  </ul>
                ),
              missing: 'no gate refs recorded',
            },
          ]}
        />
      </Region>
      <Region region="findings" req="LOOP-3" label="Findings">
        <h2 className="s-heading">Findings</h2>
        {verdict.findings.length === 0 ? (
          <p className="s-text">This verdict lists no findings.</p>
        ) : (
          <div className="s-findings">
            <p className="s-text">
              <a href={`#/plans/${plan}/${node}/findings/${round}`}>{`Open the findings round ${round} and the commits that fixed it`}</a>
            </p>
            {verdict.findings.map((finding, at) => (
              <Finding key={`${finding.id ?? ''}-${at}`} finding={finding} verdict={verdict} />
            ))}
          </div>
        )}
      </Region>
      <Region region="raw-json" req="LOOP-3 DATA-2" label="Raw JSON">
        <h2 className="s-heading">Raw JSON</h2>
        <p className="s-text">
          <ProvenanceLabel provenance="recorded" />
        </p>
        <p className="s-text">
          Read from <FileLineLink path={verdict.file} href={blobUrl(snapshot.sha, verdict.file)} /> at the snapshot.
        </p>
        {verdict.raw === undefined ? (
          <p className="s-text">This trace.json holds no copy of the file's text, so the JSON below is the verdict as the compiler read it.</p>
        ) : null}
        <JsonViewer json={verdict.raw ?? JSON.stringify(verdict)} label={`${agent} verdict ${round}`} />
      </Region>
    </>
  );
}

export function Verdict() {
  const { planId = '', nodeId = '', round = '', agent = '' } = useParams();
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  const verdict = verdictsOf(trace.trace, planId, nodeId).find((v) => v.round === round && v.agent === agent);
  if (verdict === undefined) {
    return <NotBuiltYet kind="region" name={`${agent} verdict ${round} of ${planId}/${nodeId}`} back={{ href: `#/plans/${planId}/${nodeId}/loop`, label: 'Back to the loop' }} />;
  }
  return <VerdictPage verdict={verdict} snapshot={trace.snapshot} />;
}
