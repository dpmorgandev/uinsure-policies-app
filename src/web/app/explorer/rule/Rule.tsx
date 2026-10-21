import { useParams } from 'react-router';
import {
  Breadcrumbs,
  FileLineLink,
  KeyValueList,
  MarkdownText,
  NotBuiltYet,
  PageHeader,
  ProvenanceLabel,
  RuleChip,
  RuleEvidence,
  ShaLink,
  StatusTag,
} from '../../../kit';
import type { EvidenceCommit, EvidenceOrder, EvidenceStep } from '../../../kit';
import type { Snapshot, Trace, TraceCommit, TraceRule } from '../../data/trace';
import { agentOf } from '../../shell/agents';
import { DataNotice } from '../../shell/DataNotice';
import { blobUrl, commitUrl, pullUrl } from '../../shell/repo';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { commitOfShort, fullShaOf, ruleCommits, ruleStatusTag, testsText } from '../ruleFacts';
import '../explorer.css';

const STEP_LABEL: Record<EvidenceStep, string> = {
  red: 'Write the failing test',
  stub: 'Stub the behaviour',
  green: 'Make the test pass',
  refactor: 'Tidy it, same behaviour',
};

const isStep = (tdd: string | null): tdd is EvidenceStep => tdd !== null && tdd in STEP_LABEL;

/** The matrix writes a sign-off as "David 2026-10-18"; "pending" is not one. */
function signoffOf(text: string | null | undefined): { by: string; date: string } | null {
  const match = /^(.+) (\d{4}-\d{2}-\d{2})$/.exec(text ?? '');
  return match ? { by: match[1] ?? '', date: match[2] ?? '' } : null;
}

/** The commits as the kit draws them. A commit with no Agent the badge knows cannot be drawn, so it is left off. */
function evidenceOf(rule: TraceRule, commits: TraceCommit[]): EvidenceCommit[] {
  const recorded = [rule.matrix?.red, rule.matrix?.green, rule.matrix?.refactor];
  return commits.flatMap((commit) => {
    const agent = agentOf(commit.agent);
    if (commit.order === null || !isStep(commit.tdd) || agent === null) return [];
    const isKey = recorded.includes(commit.short);
    return [
      {
        row: commit.order,
        sha: commit.short,
        fullSha: commit.sha,
        githubHref: commitUrl(commit.sha),
        tdd: commit.tdd,
        agent,
        label: STEP_LABEL[commit.tdd],
        what: commit.subject,
        note: commit.date ? `Committed ${commit.date.slice(0, 10)}` : undefined,
        key: isKey,
      },
    ];
  });
}

/** RULE-2: red sits above green when its walkthrough row is the smaller one. Unknown when the matrix names no red or no green. */
function orderOf(trace: Trace, rule: TraceRule): EvidenceOrder | undefined {
  const rowOf = (short: string | null | undefined): number | null => (short ? (commitOfShort(trace, short)?.order ?? null) : null);
  const redRow = rowOf(rule.matrix?.red);
  const greenRow = rowOf(rule.matrix?.green);
  if (redRow === null || greenRow === null) return undefined;
  return { state: greenRow < redRow ? 'violated' : 'held', redRow, greenRow };
}

function answerOf(rule: TraceRule, order: EvidenceOrder | undefined, signoff: { by: string; date: string } | null): string {
  if (rule.status !== 'built') return 'This rule is not built yet, so there is no red, green or sign-off to show.';
  const signed = signoff ? `${signoff.by} signed it off on ${signoff.date}.` : 'the trail records no sign-off.';
  if (order === undefined) return `The trail does not list both a red and a green commit for this rule, and ${signed}`;
  const sequence =
    order.state === 'held'
      ? `Yes. Red is rung #${order.redRow}, green is rung #${order.greenRow}`
      : `No. Green is rung #${order.greenRow}, before red at rung #${order.redRow}`;
  return `${sequence}, and ${signed}`;
}

function RulePage({ trace, snapshot, rule }: { trace: Trace; snapshot: Snapshot; rule: TraceRule }) {
  const { matrix } = rule;
  const built = rule.status === 'built';
  const status = ruleStatusTag(rule);
  const tests = testsText(matrix?.tests);
  const signoff = signoffOf(matrix?.signoff);
  const order = orderOf(trace, rule);
  const commits = built ? evidenceOf(rule, ruleCommits(trace, rule)) : [];
  const prNumber = /^#(\d+)$/.exec(matrix?.pr ?? '')?.[1];
  const merged = trace.decisions.some((d) => d.kind === 'merge' && d.plan === matrix?.plan && d.node === matrix?.node);
  const qaPath = matrix?.qaStep?.split('#')[0];
  const signoffSha = trace.decisions.find((d) => d.kind === 'signoff' && d.plan === matrix?.plan && d.node === matrix?.node)?.sha;
  const recorded = [
    { word: 'Red', short: matrix?.red },
    { word: 'Green', short: matrix?.green },
    { word: 'Refactor', short: matrix?.refactor },
  ];

  return (
    <>
      <Rung region="rule-text-and-agreed-interpretation" req="RULE-1" ordinal="Step 1" heading="Read the rule">
        <Breadcrumbs
          items={[
            { label: 'Overview', href: '#/' },
            { label: 'Requirements matrix', href: '#/rules' },
            { label: rule.id, mono: true },
          ]}
        />
        <PageHeader
          eyebrow={['Rule', matrix?.plan && matrix.node ? `${matrix.plan}/${matrix.node}` : null, rule.feature, rule.priority]
            .filter((part) => part !== null)
            .join(' · ')}
          title={rule.title === null ? rule.id : `${rule.id} ${rule.title}`}
          question="Did this rule's test fail before its code made it pass, and who signed it off?"
          answer={answerOf(rule, order, signoff)}
          status={status}
          ids={[
            { label: 'Rule', value: rule.id },
            { label: 'PR', value: matrix?.pr, href: prNumber ? pullUrl(prNumber) : undefined, missing: 'no PR recorded' },
            { label: 'Snapshot SHA', value: `${snapshot.ref} ${snapshot.short}` },
          ]}
          compiledAt={snapshot.utc}
        />
        <RuleChip ruleId={rule.id} status={built ? 'built' : 'nb'} href={`#/rules/${encodeURIComponent(rule.id)}`} />
        {rule.interpretation === null ? (
          <p className="s-text">requirements.md gives no agreed interpretation for this rule.</p>
        ) : (
          <MarkdownText source={rule.interpretation} />
        )}
        <ProvenanceLabel provenance="written" />
      </Rung>
      <Rung
        region="signature-red-before-green-evidence-custody-chain-tdd-ticks-chronology-per-style"
        req="RULE-2"
        ordinal="Step 2"
        heading="Red before green, rung by rung"
      >
        <RuleEvidence
          ruleId={rule.id}
          commits={commits}
          notBuilt={!built}
          back={{ href: '#/rules', label: 'Back to the requirements matrix' }}
          requirement={rule.title === null ? undefined : { text: rule.title, source: rule.source?.file }}
          qa={matrix?.qaStep && signoff ? { ref: matrix.qaStep, href: qaPath ? blobUrl(snapshot.sha, qaPath) : undefined, result: 'pass' } : null}
          signoff={signoff ? { by: signoff.by, date: signoff.date, verdict: 'Signed off' } : null}
          pr={prNumber ? { number: Number(prNumber), href: pullUrl(prNumber), state: merged ? 'merged' : 'open' } : null}
          order={order}
        />
      </Rung>
      <Rung region="tests-count-and-scope" req="RULE-1" ordinal="Step 3" heading="Tests">
        <div className="s-row">
          <StatusTag status={status.value}>{status.label}</StatusTag>
          <ProvenanceLabel provenance="generated" />
        </div>
        {tests === null ? (
          <p className="s-text">The matrix holds no test count for this rule yet.</p>
        ) : (
          <p className="s-text">
            Tests passing, as the requirements matrix row gives them: {tests}.
            {matrix?.source ? (
              <>
                {' '}
                <FileLineLink path={matrix.source.file} line={matrix.source.line} href={blobUrl(snapshot.sha, matrix.source.file, matrix.source.line)} />
              </>
            ) : null}
          </p>
        )}
        {rule.tests === undefined || rule.tests.length === 0 ? (
          <p className="s-text">The trail names no tests for this rule.</p>
        ) : (
          <ul className="s-bullets">
            {rule.tests.map((test) => (
              <li key={`${test.file} ${test.name}`}>
                {test.name} <code>{test.file}</code>
              </li>
            ))}
          </ul>
        )}
      </Rung>
      <Rung region="qa-step-and-sign-off" req="RULE-1 HITL-1" ordinal="Step 4" heading="QA step and sign-off">
        {/* The label says who wrote what is shown: with no QA step and no sign-off there is nothing for it to label. */}
        {matrix?.qaStep || signoff ? <ProvenanceLabel provenance="written" /> : null}
        <KeyValueList
          items={[
            {
              label: 'QA step',
              value: matrix?.qaStep ? (
                <a href={qaPath ? blobUrl(snapshot.sha, qaPath) : undefined} rel="noreferrer">
                  {matrix.qaStep}
                </a>
              ) : null,
              missing: 'no QA step recorded',
            },
            { label: 'Sign-off', value: matrix?.signoff, missing: 'no sign-off recorded' },
          ]}
        />
        <p className="s-text">
          Commit signed off: <ShaLink sha={signoffSha?.slice(0, 7)} fullSha={signoffSha ?? undefined} githubHref={signoffSha ? commitUrl(signoffSha) : undefined} missingLabel="none recorded" />
        </p>
      </Rung>
      <NotBuiltRegion region="red-and-green-diffs-lazy" name="red and green diffs" />
      <NotBuiltRegion region="verify-it-yourself" name="verify it yourself" />
      <NotBuiltRegion region="load-diff-busy-while-the-diff-chunk-loads" name="load diff" />
      <Rung
        region="links-out-commit-shas-pr-numbers-and-file-line-references-to-github-at-that-sha"
        req="NAV-3"
        ordinal="Step 5"
        heading="Links out, to GitHub"
      >
        <ul className="s-bullets">
          {recorded.map(({ word, short }) =>
            short ? (
              <li key={word}>
                {word}: <ShaLink sha={short} fullSha={fullShaOf(trace, short)} githubHref={commitUrl(fullShaOf(trace, short))} />
              </li>
            ) : null,
          )}
          {prNumber ? (
            <li>
              Pull request:{' '}
              <a href={pullUrl(prNumber)} rel="noreferrer">
                PR #{prNumber}
              </a>
            </li>
          ) : null}
          {rule.source ? (
            <li>
              Rule text: <FileLineLink path={rule.source.file} line={rule.source.line} href={blobUrl(snapshot.sha, rule.source.file, rule.source.line)} />
            </li>
          ) : null}
          {matrix?.source ? (
            <li>
              Matrix row:{' '}
              <FileLineLink path={matrix.source.file} line={matrix.source.line} href={blobUrl(snapshot.sha, matrix.source.file, matrix.source.line)} />
            </li>
          ) : null}
          {matrix?.qaStep && qaPath ? (
            <li>
              QA script:{' '}
              <a href={blobUrl(snapshot.sha, qaPath)} rel="noreferrer">
                {matrix.qaStep}
              </a>
            </li>
          ) : null}
        </ul>
      </Rung>
    </>
  );
}

export function Rule() {
  const { ruleId = '' } = useParams();
  const { trace } = useShell();
  if (trace.state !== 'ready') return <DataNotice trace={trace} />;
  const rule = trace.trace.rules.find((candidate) => candidate.id === ruleId);
  if (rule === undefined) {
    return (
      <NotBuiltYet kind="region" name={`rule ${ruleId}`} back={{ href: '#/rules', label: 'Back to the requirements matrix' }}>
        requirements.md in this snapshot has no rule with that ID.
      </NotBuiltYet>
    );
  }
  return <RulePage trace={trace.trace} snapshot={trace.snapshot} rule={rule} />;
}
