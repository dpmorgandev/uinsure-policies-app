import { MarkdownText, NotBuiltYet, PageHeader, ProvenanceLabel, StatusTag, VerifyCommand } from '../../../kit';
import type { Provenance, Status } from '../../../kit';
import type { Snapshot, Trace } from '../../data/trace';
import { DataNotice } from '../../shell/DataNotice';
import { Region, Rung } from '../../shell/Rung';
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

/** VERIFY-1: commands that re-check the snapshot in a clone, with no UI. */
function ReVerify({ sha, short }: { sha: string; short: string }) {
  return (
    <>
      <p className="s-text">Every claim here can be re-checked with git alone. Run these in a clone of the repository.</p>
      <VerifyCommand
        command={`git show --no-patch --format="%H %cI %s" ${sha}`}
        intro="This prints the snapshot commit: its full SHA, its commit time and its subject."
        expect={
          <>
            Expect a full SHA that starts <code>{short}</code>.
          </>
        }
        note="The command is filled in from the compiled-at stamp; the page has no recorded output for it."
      />
      <VerifyCommand
        command={`git log -n 20 --format="%h %(trailers:key=TDD,valueonly) %s" ${sha}`}
        intro="This lists the 20 commits up to the snapshot, each with its TDD trailer."
        expect="Expect scaffold, red, stub, green or refactor beside each commit the loop made, and nothing beside a commit it did not."
      />
    </>
  );
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
  // One rule decides all three targets: its node (from the matrix) and its first red commit.
  const rule = trace?.rules.find((r) => r.status === 'built');
  const home = rule?.matrix;
  const commit =
    rule && home ? trace?.commits.find((c) => c.rule.includes(rule.id) && c.tdd === 'red' && c.plan === home.plan && c.node === home.node) : undefined;
  const walkthroughHref = home?.plan && home.node ? `#/plans/${home.plan}/${home.node}/commits` : '#/rules';
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

const LABELS: { provenance: Provenance; reading: string }[] = [
  { provenance: 'generated', reading: 'The compiled-at stamp in the header above is generated.' },
  { provenance: 'recorded', reading: "A reviewer or security verdict is recorded: you read the agent's own words, not a summary of them." },
  {
    provenance: 'written',
    reading: 'Text authored by a person or the main session carries this label. Read it as a claim made by its author, not as a measurement.',
  },
];

export function About() {
  const { trace } = useShell();
  const gaps = trace.state === 'ready' ? gapsOf(trace.trace).length : null;
  return (
    <>
      {trace.state === 'ready' ? null : <DataNotice trace={trace} />}
      <Region region="provenance-labels" req="DATA-2" label="Provenance labels">
        <PageHeader
          eyebrow="Docket · how the trail is made"
          title="How to read this"
          question="Is what I am reading recorded evidence, and how can I check it myself?"
          status={gaps === null ? null : { value: gaps === 0 ? 'pass' : 'warn', label: `${gaps} ${gaps === 1 ? 'gap' : 'gaps'}, counted from problems in trace.json` }}
          ids={[{ label: 'Snapshot SHA', value: trace.state === 'ready' ? `${trace.snapshot.ref} ${trace.snapshot.short}` : null }]}
          compiledAt={trace.state === 'ready' ? trace.snapshot.utc : null}
        />
        <h2 className="s-heading">Read the labels</h2>
        <p className="s-text">Each value on the other screens carries one of these three labels. Read it before you weigh the value.</p>
        <div className="s-list">
          {LABELS.map((entry) => (
            <div className="s-item" key={entry.provenance}>
              <ProvenanceLabel provenance={entry.provenance} />
              <p className="s-item-text">{entry.reading}</p>
            </div>
          ))}
        </div>
      </Region>
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
      <Rung region="re-verify-with-git" req="VERIFY-1" ordinal="Step 3" heading="Re-verify with git">
        {trace.state === 'ready' ? (
          <ReVerify sha={trace.snapshot.sha} short={trace.snapshot.short} />
        ) : (
          <NotBuiltYet kind="region" name="re-verify with git" />
        )}
      </Rung>
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
