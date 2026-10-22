import { Breadcrumbs, FileLineLink, FindingCard, JsonViewer, PageHeader, ProvenanceLabel, ShaLink } from '../../../kit';
import { Region } from '../../shell/Rung';
import { REPO } from '../../shell/repo';
import '../explorer.css';

// Canned content (stub): build/F3, finding round A1, as the design fixture holds it.
const FIX = { sha: '9ec61af', fullSha: '9ec61afec7f61151e82914751458ea0714b89200' };
const FILE = 'src/Uinsure.Policies.Api/Contracts/CancellationContracts.cs';
const FIXED_BY = '{"I1":["9ec61afec7f61151e82914751458ea0714b89200"]}';

export function Finding() {
  return (
    <>
      <Region region="findings" req="LOOP-4" label="Findings">
        <Breadcrumbs
          items={[
            { label: 'Plans', href: '#/plans/build' },
            { label: 'build', href: '#/plans/build' },
            { label: 'F3', href: '#/plans/build/F3', mono: true },
            { label: 'Findings A1', mono: true },
          ]}
        />
        <PageHeader
          eyebrow="Finding round · build/F3"
          title="Round A1: findings on node F3"
          question="Which commit fixed each finding the investigator raised in this round?"
          ids={[{ label: 'Rule', value: 'COULD-2' }]}
        />
        <ProvenanceLabel provenance="recorded" />
        <FileLineLink path="docs/trace/build/F3/findings/A1.md" href={`${REPO}/blob/${FIX.fullSha}/docs/trace/build/F3/findings/A1.md`} />
        <FindingCard
          id="I1"
          severity="P2"
          symptom="live POST /policies/{ref}/claims returns 500."
          cause="The record's DataAnnotations target the generated properties."
          files={[{ path: FILE, line: 38, href: `${REPO}/blob/${FIX.fullSha}/${FILE}#L38` }]}
          fixDirection="Put the constraints where MVC reads them for this type."
          testable
          fixedBy={FIX}
        />
      </Region>
      <Region region="fixed-by" req="LOOP-4 LOOP-2" label="Fixed by">
        <h2 className="s-heading">Fixed by</h2>
        <ShaLink sha={FIX.sha} fullSha={FIX.fullSha} githubHref={`${REPO}/commit/${FIX.fullSha}`} />
        <JsonViewer json={FIXED_BY} label="fixedBy for each finding in round A1" />
      </Region>
    </>
  );
}
