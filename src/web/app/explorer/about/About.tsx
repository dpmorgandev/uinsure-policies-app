import { MarkdownText, StatusTag } from '../../../kit';
import type { Status } from '../../../kit';
import type { Snapshot, Trace } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
import { useShell } from '../../shell/ShellContext';
import './about.css';

const LEGEND: { status: Status; label: string; meaning: string }[] = [
  { status: 'pass', label: 'Pass', meaning: 'What was counted or checked passed. A count says what it was counted from.' },
  { status: 'fail', label: 'Fail', meaning: 'A recorded check or verdict failed. It keeps its own rung and is never folded into a count.' },
  { status: 'warn', label: 'Warn', meaning: 'A gap or disagreement in the trail. Read the sentence beside it before relying on the value.' },
  { status: 'pending', label: 'Pending', meaning: 'Not done yet, so there is nothing to check yet.' },
  {
    status: 'not-built',
    label: 'Not built',
    meaning:
      'Not built yet. There is no red, green, refactor, QA step or sign-off to show, and the page says so instead of inventing one.',
  },
];

const GLOSSARY = [
  '**Terms used on the other screens.**',
  '',
  "- **Rung.** One numbered step in a story. The number is the step's position in the order, not a time.",
  "- **Red, green, refactor.** The values of a commit's `TDD` trailer. A rule page puts the red commit above the green one, so you read the order from position.",
  '- **Attempt.** One pass of a node through the build loop. Every attempt keeps its own rung; retries are never folded into a counter.',
  '- **gate.stub.** A recorded check, shown with what it expected and what it returned.',
  "- **Verdict.** A reviewer's or security agent's PASS or FAIL, recorded verbatim.",
  "- **Finding.** A problem a verdict raised. A later commit's `Fixes-Finding` trailer names the one it fixes.",
  '- **Human decision.** A point where David approved, steered or merged. They are listed together on the Human decisions screen.',
  '- **Git-only.** A node with no trail files; what is shown comes from git alone.',
  '- **Snapshot.** The commit this site was compiled from, stamped in step 5.',
].join('\n');

const SNAPSHOT_LEAD = '**The snapshot.** Where this site was compiled from:';
const PLANS_LEAD = '**What the snapshot holds.** Counted from `plans` in trace.json:';
const NO_HARNESS = 'docs/trace/harness.json: not found at this ref, so the trace holds no harness index.';

/** What the compiler reported or did not find, one line each. Nothing is added that the trace does not hold. */
function gapsOf(trace: Trace): string[] {
  const reported = trace.problems.map((p) => {
    const where = p.file === null ? 'trace.json' : p.line === null ? p.file : `${p.file}:${p.line}`;
    return `${where}: ${p.reason}`;
  });
  return trace.harness === null ? [...reported, NO_HARNESS] : reported;
}

function Stamp({ trace, snapshot }: { trace: Trace; snapshot: Snapshot }) {
  const gaps = gapsOf(trace);
  const gapWord = gaps.length === 1 ? 'gap' : 'gaps';
  return (
    <>
      <p className="s-text">Everything on this site was compiled once, from one commit. Nothing here is newer than the stamp.</p>
      <MarkdownText source={SNAPSHOT_LEAD} />
      <ul className="s-lines">
        <li>
          Ref: <code>{snapshot.ref}</code>
        </li>
        <li>
          Commit: <code>{snapshot.sha}</code>
        </li>
        <li>
          Time: <code>{snapshot.utc}</code>
        </li>
      </ul>
      <MarkdownText source={PLANS_LEAD} />
      <ul className="s-lines">
        {trace.plans.map((plan) => (
          <li key={plan.id}>
            <code>{plan.id}</code>, {plan.title ?? 'no title recorded'}: {plan.nodes.length} {plan.nodes.length === 1 ? 'node' : 'nodes'}.
          </li>
        ))}
      </ul>
      <div className="s-gaps">
        <p className="s-stop">
          <StatusTag status={gaps.length === 0 ? 'pass' : 'warn'}>
            {gaps.length === 0 ? 'No gaps in the trail' : `Warn ${gaps.length} ${gapWord} in the trail`}
          </StatusTag>
        </p>
        <ul className="s-lines">
          {gaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** NAV-5: the five stops of one rule's story. A stop whose page needs data the trace holds links to the first such page. */
function Tour({ trace }: { trace: Trace | null }) {
  const rule = trace?.rules.find((r) => r.status === 'built');
  const node = trace?.nodes.find((n) => (n.walkthrough ?? []).length > 0);
  const commit = node?.walkthrough?.[0];
  const walkthroughHref = node ? `#/plans/${node.plan}/${node.id}/commits` : '#/rules';
  const stops: { href: string; label: string; what: string }[] = [
    { href: '#/', label: 'Overview', what: 'read the headline answer and check its figures.' },
    { href: '#/rules', label: 'Requirements matrix', what: 'choose one rule.' },
    { href: rule ? `#/rules/${encodeURIComponent(rule.id)}` : '#/rules', label: 'Rule', what: 'read its red and green in order.' },
    { href: walkthroughHref, label: 'Walkthrough', what: 'read the commits of its node, numbered.' },
    { href: commit ? `#/commits/${commit.sha}` : walkthroughHref, label: 'Commit', what: 'open one commit and its trailers.' },
  ];
  return (
    <>
      <p className="s-text">Optional. Pick any rule and read it down the five screens below, in this order.</p>
      <ol className="s-steps">
        {stops.map((stop) => (
          <li key={stop.label}>
            <a href={stop.href}>{stop.label}</a>: {stop.what}
          </li>
        ))}
      </ol>
      <p className="s-next">
        <a href="#/rules">Start the tour: open the requirements matrix and pick a rule</a>
      </p>
    </>
  );
}

export function About() {
  const { trace } = useShell();
  return (
    <>
      {trace.state === 'ready' ? null : <DataNotice trace={trace} />}
      <NotBuiltRegion region="provenance-labels" name="provenance labels" />
      <Rung region="glossary-and-status-legend" req="A11Y-1" ordinal="Step 2" heading="Look up the terms">
        <p className="s-text">A status is always a word, a glyph and a colour. Colour is never the only signal.</p>
        <div className="s-list">
          {LEGEND.map((entry) => (
            <div className="s-item" key={entry.status}>
              <StatusTag status={entry.status}>{entry.label}</StatusTag>
              <p className="s-item-text">{entry.meaning}</p>
            </div>
          ))}
        </div>
        <MarkdownText source={GLOSSARY} />
      </Rung>
      <NotBuiltRegion region="re-verify-with-git" name="re-verify with git" />
      <Rung region="guided-tour-entry-one-rule-end-to-end-could" req="NAV-5" ordinal="Step 4" heading="Follow one rule">
        <Tour trace={trace.state === 'ready' ? trace.trace : null} />
      </Rung>
      {trace.state === 'ready' ? (
        <Rung
          region="compiled-at-stamp-the-commit-sha-and-utc-time-trace-json-was-compiled-from"
          req="DATA-3"
          ordinal="Step 5"
          heading="Check the stamp"
        >
          <Stamp trace={trace.trace} snapshot={trace.snapshot} />
        </Rung>
      ) : null}
    </>
  );
}
