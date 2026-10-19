import type { JSX } from 'react';
import { HumanDecisionRow } from './HumanDecisionRow';

const REPO = 'https://github.com/dpmorgandev/uinsure-policies-api';

// Every value below is in the trail excerpts the mockups and docs/ui/research/trail-inventory.md quote:
// build/F2's gates line (pause 1 passed), the gate.stub detail "David: fix (a), accept (b) as pinned",
// the gate.red expectation "pinned (David: trait + gap-fill)", the QA sign-off "David Morgan 19/10/2026 01:05",
// and the merge event of PR #17. Where the excerpt holds no time, the row says so.
export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pause 1',
    element: (
      <HumanDecisionRow
        kind="pause-1"
        who="david"
        event="pause1"
        outcome={{ status: 'pass', label: 'Passed' }}
        what="Paused after red and before green. The gates line for build/F2 records pause 1 as passed."
        when={null}
        where="build/F2"
        evidence={[
          { label: 'docs/trace/build/F2/README.md', href: `${REPO}/blob/main/docs/trace/build/F2/README.md`, external: true },
        ]}
      />
    ),
  },
  {
    state: 'pause 2',
    element: (
      <HumanDecisionRow
        kind="pause-2"
        who="david"
        event="state(paused_acceptance)"
        what="Paused for acceptance. The QA run passed 41 of 41 steps; the verdict is David's to give."
        when={null}
        where="build/F2"
        evidence={[{ label: 'docs/qa/build-F2.md', href: `${REPO}/blob/main/docs/qa/build-F2.md`, external: true }]}
      />
    ),
  },
  {
    state: 'steer',
    element: (
      <HumanDecisionRow
        kind="steer"
        who="david"
        event="gate.stub"
        outcome={{ status: 'fail', label: 'Gate failed' }}
        sha={{
          sha: '305789d',
          fullSha: '305789df2125abfa6ff2e8ba2b0aa9805789008c',
          githubHref: `${REPO}/commit/305789df2125abfa6ff2e8ba2b0aa9805789008c`,
        }}
        what="Fix (a), accept (b) as pinned: 5 tests passed only because the canned status Active coincided, and 7 passed on behaviour F1 and F1b had already delivered."
        when={null}
        where="build/F2, attempt 1"
        evidence={[
          { label: 'docs/trace/build/F2/loop.jsonl', href: `${REPO}/blob/main/docs/trace/build/F2/loop.jsonl`, external: true },
        ]}
      />
    ),
  },
  {
    state: 'ruling',
    element: (
      <HumanDecisionRow
        kind="ruling"
        who="david"
        event="gate.red"
        outcome={{ status: 'pass', label: 'Gate held' }}
        sha={{
          sha: 'c4f7d64',
          fullSha: 'c4f7d6474d27eb5a1bf691028815d19ed1bc05af',
          githubHref: `${REPO}/commit/c4f7d6474d27eb5a1bf691028815d19ed1bc05af`,
        }}
        what="Pinned: trait plus gap-fill. Domain GET-1 passes 22 of 22, no Domain gap was found, so there is no red test."
        when={null}
        where="build/F2, attempt 2"
        evidence={[
          { label: 'docs/trace/build/F2/loop.jsonl', href: `${REPO}/blob/main/docs/trace/build/F2/loop.jsonl`, external: true },
        ]}
      />
    ),
  },
  {
    state: 'sign-off',
    element: (
      <HumanDecisionRow
        kind="sign-off"
        who="david"
        event="signoff"
        outcome={{ status: 'pass', label: 'Accepted' }}
        sha={{
          sha: '223102a',
          fullSha: '223102a7c40f2042674e3b677116c446244dfea7',
          githubHref: `${REPO}/commit/223102a7c40f2042674e3b677116c446244dfea7`,
          disagreement: { sha: 'beba48e', source: 'the QA document' },
        }}
        what="Verdict Accept F2, signed David Morgan 19/10/2026 01:05. 41 of 41 steps passed."
        when="19/10/2026 01:05"
        where="build/F2"
        evidence={[{ label: 'docs/qa/build-F2.md', href: `${REPO}/blob/main/docs/qa/build-F2.md`, external: true }]}
      />
    ),
  },
  {
    state: 'merge',
    element: (
      <HumanDecisionRow
        kind="merge"
        who="david"
        whoNote="in the GitHub UI"
        event="merged"
        outcome={{ status: 'pass', label: 'Merged' }}
        sha={{
          sha: 'ad7b6b0',
          fullSha: 'ad7b6b096e2dba88f3a3c71d860b557b789f5247',
          githubHref: `${REPO}/commit/ad7b6b096e2dba88f3a3c71d860b557b789f5247`,
        }}
        what="PR #17 merged by David in the GitHub UI."
        when="2026-10-19T00:10:40Z"
        where="build/F2"
        evidence={[{ label: 'PR #17', href: `${REPO}/pull/17`, external: true }]}
      />
    ),
  },
];
