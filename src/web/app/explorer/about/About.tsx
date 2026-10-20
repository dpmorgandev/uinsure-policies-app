import { MarkdownText, StatusTag } from '../../../kit';
import type { Status } from '../../../kit';
import { NotBuiltRegion, Rung } from '../../shell/Rung';
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

// Canned for the stub: the loader replaces the snapshot and its plans with trace.json's.
const STAMP = [
  '**Snapshot compiled from origin/main b394466.**',
  '',
  '- Commit: `b394466f9e89d823fbe13a904ab45296d782b033` on `origin/main`',
  '- Time: `2026-10-19T17:45:08Z`, shown as 2026-10-19 17:45:08 UTC',
  '- The ui plan is read from `origin/ui` at `64e52cf3e4ac4ad4efdd9fead4befe0b71118b8d`',
  '',
  '**What the snapshot holds.** 5 plans, counted from plans in trace.json:',
  '',
  '- `build`, the API build plan: approved, by David Morgan on 2026-10-17, 10 nodes.',
  '- `inv-001`, F2 attempt-3 escalation: parent build/F2, created 2026-10-18. No status recorded.',
  '- `inv-002`, F5 what-if still precedes the prod approval: parent build/F5, created 2026-10-19. No status recorded.',
  '- `inv-003`, F6 docs state claims the repo does not prove: parent build/F6, created 2026-10-19. No status recorded.',
  '- `ui`: design stage, no DAG yet. No title recorded.',
].join('\n');

const GAPS = [
  '- `docs/trace/ui/`: the ui plan is read from origin/ui (64e52cf); it is not on origin/main yet.',
  '- `docs/trace/harness.json`: not at origin/main; the harness index was generated from .claude/ instead (DATA-7).',
].join('\n');

export function About() {
  return (
    <>
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
      <NotBuiltRegion
        region="guided-tour-entry-one-rule-end-to-end-could"
        name="guided tour entry: one rule end to end (COULD)"
      />
      <Rung
        region="compiled-at-stamp-the-commit-sha-and-utc-time-trace-json-was-compiled-from"
        req="DATA-3"
        ordinal="Step 5"
        heading="Check the stamp"
      >
        <p className="s-text">
          Everything on this site was compiled once, from one commit. Nothing here is newer than the stamp.
        </p>
        <MarkdownText source={STAMP} />
        <div className="s-gaps">
          <p className="s-stop">
            <StatusTag status="warn">Warn 2 gaps in the trail</StatusTag>
          </p>
          <MarkdownText source={GAPS} />
        </div>
      </Rung>
    </>
  );
}
