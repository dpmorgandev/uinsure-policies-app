import { Breadcrumbs, KeyValueList, PageHeader, ProvenanceLabel, RuleChip, RuleEvidence, ShaLink, StatusTag } from '../../../kit';
import { NotBuiltRegion, Rung } from '../../shell/Rung';

// Stub: canned for GET-1, the reference's rule. The loader replaces every value with the routed rule's.
export function Rule() {
  return (
    <>
      <Rung region="rule-text-and-agreed-interpretation" req="RULE-1" ordinal="Step 1" heading="Read the rule">
        <Breadcrumbs items={[{ label: 'Overview', href: '#/' }, { label: 'Requirements matrix', href: '#/rules' }, { label: 'GET-1', mono: true }]} />
        <PageHeader eyebrow="Rule" title="GET-1" />
        <RuleChip ruleId="GET-1" href="#/rules/GET-1" />
        <ProvenanceLabel provenance="written" />
      </Rung>
      <Rung
        region="signature-red-before-green-evidence-custody-chain-tdd-ticks-chronology-per-style"
        req="RULE-2"
        ordinal="Step 2"
        heading="Red before green, rung by rung"
      >
        <RuleEvidence ruleId="GET-1" commits={[]} />
      </Rung>
      <Rung region="tests-count-and-scope" req="RULE-1" ordinal="Step 3" heading="Tests">
        <StatusTag status="not-built" />
        <ProvenanceLabel provenance="generated" />
      </Rung>
      <Rung region="qa-step-and-sign-off" req="RULE-1 HITL-1" ordinal="Step 4" heading="QA step and sign-off">
        <KeyValueList items={[{ label: 'QA step' }, { label: 'Sign-off' }]} />
        <ProvenanceLabel provenance="written" />
        <ShaLink sha={null} />
      </Rung>
      <NotBuiltRegion region="red-and-green-diffs-lazy" name="red and green diffs" />
      <NotBuiltRegion region="verify-it-yourself" name="verify it yourself" />
      <NotBuiltRegion region="load-diff-busy-while-the-diff-chunk-loads" name="load diff" />
      <Rung
        region="links-out-commit-shas-pr-numbers-and-file-line-references-to-github-at-that-sha"
        req="NAV-3"
        ordinal="Step 5"
        heading="Links out"
      >
        <ShaLink sha={null} />
      </Rung>
    </>
  );
}
