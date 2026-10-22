import { Breadcrumbs, FileLineLink, JsonViewer, PageHeader, ProvenanceLabel, VerdictCard } from '../../../kit';
import { Region } from '../../shell/Rung';
import { REPO } from '../../shell/repo';
import '../explorer.css';

// Canned content (stub): build/F3, reviewer, round A2.3, as the design fixture holds it.
const HEAD = { sha: 'a59fb6c', fullSha: 'a59fb6cf351006cb8995a385e3ca170931ff3c13' };
const FILE = 'tests/Uinsure.Policies.Services.Tests/PolicyServiceQuoteTests.cs';
const JSON_TEXT = '{"plan":"build","node":"F3","round":"A2.3","agent":"reviewer","verdict":"PASS","head":"a59fb6cf351006cb8995a385e3ca170931ff3c13"}';

export function Verdict() {
  return (
    <>
      <Region region="verdict-summary" req="LOOP-3" label="Verdict summary">
        <Breadcrumbs
          items={[
            { label: 'Plans', href: '#/plans/build' },
            { label: 'build', href: '#/plans/build' },
            { label: 'F3', href: '#/plans/build/F3', mono: true },
            { label: 'Loop', href: '#/plans/build/F3/loop' },
            { label: 'reviewer A2.3', mono: true },
          ]}
        />
        <PageHeader
          eyebrow="Verdict · build/F3 · reviewer"
          title="Reviewer verdict A2.3"
          question="Did the reviewer pass this node's work at this round, and what did it leave open?"
          status={{ value: 'pass', label: 'PASS' }}
          ids={[{ label: 'Round', value: 'A2.3' }]}
        />
        <VerdictCard
          agent="reviewer"
          round="A2.3"
          node="F3"
          verdict="PASS"
          head={HEAD}
          rulesCovered={['CANCEL-1a', 'CANCEL-1b']}
          rulesMissing={[]}
          findings={[{ id: 'R1', severity: 'P2', summary: 'A header comment is stale after the rename.', route: 'tester' }]}
        />
      </Region>
      <Region region="findings" req="LOOP-3" label="Findings">
        <h2 className="s-heading">Findings</h2>
        <FileLineLink path={FILE} line={12} href={`${REPO}/blob/${HEAD.fullSha}/${FILE}#L12`} />
      </Region>
      <Region region="raw-json" req="LOOP-3 DATA-2" label="Raw JSON">
        <h2 className="s-heading">Raw JSON</h2>
        <ProvenanceLabel provenance="recorded" />
        <FileLineLink path="docs/trace/build/F3/verdicts/A2.3-reviewer.json" href={`${REPO}/blob/${HEAD.fullSha}/docs/trace/build/F3/verdicts/A2.3-reviewer.json`} />
        <JsonViewer json={JSON_TEXT} label="reviewer verdict A2.3" />
      </Region>
    </>
  );
}
