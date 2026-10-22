import {
  CompletenessBanner,
  MarkdownText,
  NotBuiltYet,
  PageHeader,
  ReceiptFigure,
  RuleChip,
  StatusTag,
  VerifyCommand,
} from '../../../kit';
import type { Snapshot, Trace, TraceNode } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import { CannedPlanGraph } from '../canned';
import { buildRules, rulesSummary } from '../ruleFacts';
import { buildPlan, checkedRule, headlineAnswer, nodesOf, receiptFigures } from './figures';
import '../explorer.css';

const ruleHref = (id: string): string => `#/rules/${encodeURIComponent(id)}`;

function RuleChips({ ids, label, notBuilt }: { ids: string[]; label: string; notBuilt: boolean }) {
  return (
    <div className="s-chips" role="group" aria-label={label}>
      {ids.map((id) => (
        <RuleChip key={id} ruleId={id} status={notBuilt ? 'nb' : 'built'} href={ruleHref(id)} />
      ))}
    </div>
  );
}

/** DATA-4: every node's completeness as the trail wrote it. Only a node that reads OK is grouped; none is ever shown as clean by default. */
function TrailCompleteness({ trace }: { trace: Trace }) {
  const nodes = nodesOf(trace, buildPlan(trace));
  const ok = nodes.filter((node) => node.completeness === 'OK');
  const noTrail = nodes.filter((node) => node.completeness === null);
  const others = nodes.filter((node) => node.completeness !== null && node.completeness !== 'OK');
  const notBuilt = buildRules(trace).filter((rule) => rule.status !== 'built').map((rule) => rule.id);
  const redOnly = buildRules(trace).filter((rule) => rule.status === 'built' && rule.matrix?.red && !rule.matrix.green).map((rule) => rule.id);
  const ids = (list: TraceNode[]): string => list.map((node) => node.id).join(', ');

  return (
    <>
      <p className="s-text">
        Counted from the {nodes.length} nodes of the build plan: {ok.length} read OK, {noTrail.length} have no trail yet
        {others.length === 0 ? '' : `, ${others.length} read otherwise (${ids(others)})`}.
      </p>
      <div className="s-group">
        {ok.length === 0 ? null : <CompletenessBanner value={`OK: ${ids(ok)}`} />}
        {others.map((node) => (
          <div className="s-group" key={node.id}>
            <p className="s-text">
              <code>{`${node.plan}/${node.id}`}</code> {node.title}
            </p>
            {/* The reasons of an incomplete node are in its banner; a git-only node's are not, so they are written out. */}
            <CompletenessBanner value={node.completeness ?? ''} />
            {node.completeness?.startsWith('TRAIL INCOMPLETE') || node.completenessReasons.length === 0 ? null : (
              <MarkdownText source={node.completenessReasons.join('\n\n')} />
            )}
          </div>
        ))}
      </div>
      {noTrail.map((node) => (
        <div className="s-group" key={node.id}>
          <NotBuiltYet kind="node" name={node.id} />
          <p className="s-text">
            {node.id} ({node.title ?? 'no title recorded'}) has status {node.status ?? 'unknown'} and no trail, so its completeness is null.
          </p>
        </div>
      ))}
      {notBuilt.length === 0 ? null : (
        <div className="s-group">
          <p className="s-text">
            <StatusTag status="not-built" /> {notBuilt.length} {notBuilt.length === 1 ? 'rule is' : 'rules are'} not built yet. Each opens its own page.
          </p>
          <RuleChips ids={notBuilt} label="Rules not built yet" notBuilt />
        </div>
      )}
      {redOnly.length === 0 ? null : (
        <div className="s-group">
          <p className="s-text">
            <StatusTag status="warn">Gap</StatusTag> {redOnly.length} {redOnly.length === 1 ? 'rule lists' : 'rules list'} a red commit and no green
            commit in the matrix. They are shown as listed, with nothing filled in.
          </p>
          <RuleChips ids={redOnly} label="Rules with a red commit and no green commit" notBuilt={false} />
        </div>
      )}
    </>
  );
}

function Figures({ trace, snapshot }: { trace: Trace; snapshot: Snapshot }) {
  const checked = checkedRule(trace);
  const red = checked?.matrix?.red;
  const green = checked?.matrix?.green;
  return (
    <>
      <p className="s-text">Each figure says what it was counted from and links to that source. Counts are never added across rules.</p>
      <div className="s-figures">
        {receiptFigures(trace, snapshot.sha).map((figure) => (
          <ReceiptFigure
            key={figure.unit}
            value={figure.value}
            unit={figure.unit}
            source={figure.source === null ? null : { ...figure.source, external: true }}
            provenance="generated"
          />
        ))}
      </div>
      {checked && red && green ? (
        <div className="s-verify">
          <p className="s-text">
            <strong>Check one rule's order yourself.</strong> The matrix lists {checked.id} with red {red} and green {green}.
          </p>
          <VerifyCommand
            command={`git log --reverse --format="%h %(trailers:key=TDD,valueonly) %s" ${red}^..${green}`}
            intro="Run this in a clone. It lists the commits from the red SHA to the green SHA in the order they were made, with each one's TDD trailer."
            expect={
              <>
                Expect <code>{red}</code> first with trailer red and <code>{green}</code> last with trailer green.
              </>
            }
            note="The command is filled in from the SHAs in the requirements matrix; the page has no recorded output for it."
          />
        </div>
      ) : (
        <NotBuiltYet kind="region" name="verify command" />
      )}
    </>
  );
}

export function Overview() {
  const { trace: loaded } = useShell();
  if (loaded.state !== 'ready') return <DataNotice trace={loaded} />;
  const { trace, snapshot } = loaded;
  const plan = buildPlan(trace);
  return (
    <>
      <Rung region="headline-answer" req="NAV-1" ordinal="Step 1" heading="Read the answer">
        <PageHeader
          eyebrow={plan === undefined ? 'Overview' : `Overview · plan ${plan.id}`}
          title="Overview"
          question="Was this really test-driven, and was the AI really checked?"
          answer={headlineAnswer(trace)}
          status={rulesSummary(buildRules(trace))}
          ids={[{ label: 'Snapshot SHA', value: `${snapshot.ref} ${snapshot.short}` }]}
          compiledAt={snapshot.utc}
        />
        <p className="s-next">
          <a href="#/rules">Show me the proof: open the requirements matrix, {buildRules(trace).length} rules with their red and green commits</a>
        </p>
      </Rung>
      <Rung
        region="receipt-figures-rules-built-total-tests-passing-nodes-done-attempts-and-fails-human-decisions"
        req="NAV-1 VERIFY-1"
        ordinal="Step 2"
        heading="Check the figures"
      >
        <Figures trace={trace} snapshot={snapshot} />
      </Rung>
      <Rung region="build-plan-at-a-glance" req="DAG-1" ordinal="Step 3" heading="See the plan at a glance">
        <CannedPlanGraph />
      </Rung>
      <NotBuiltRegion region="latest-human-decisions" name="latest human decisions" />
      <Rung region="compiled-at-stamp" req="DATA-3" ordinal="Step 5" heading="Check the snapshot">
        <p className="s-text">
          This page is a snapshot, not live. It was compiled from <code>{snapshot.ref}</code> at <code>{snapshot.short}</code>, on{' '}
          <code>{snapshot.utc}</code>.
        </p>
      </Rung>
      <Rung
        region="top-bar-search-and-theme-toggle-global-tagged-here-once"
        req="NAV-4 THEME-1"
        ordinal="Step 6"
        heading="Find anything"
      >
        <p className="s-text">
          Global: the search and the theme toggle sit in the top bar on every page, and nowhere else. This region tags them once for this
          screen.
        </p>
      </Rung>
      <Rung
        region="trail-completeness-trail-incomplete-reasons-verbatim-not-built-yet-and-f0a-as-git-only"
        req="DATA-4"
        ordinal="Step 7"
        heading="Is every trail complete?"
      >
        <TrailCompleteness trace={trace} />
      </Rung>
    </>
  );
}
