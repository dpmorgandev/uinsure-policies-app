# User flows

Drafted 2026-10-19 by the main session. A flow is **one task**, not one person (agentflow
`analyze/flows.md`). Screen IDs are those in `docs/ui/screens.json`. Readers: **R1** the Uinsure
reviewer alone with the link, **R2** David presenting live (`docs/ui-requirements.md` §1). Every screen
appears in at least one flow (coverage at the end).

## FL-1: Was this really test-driven?

Primary reader R1. Requirements: NAV-1, MATRIX-1, RULE-1, RULE-2, VERIFY-1.

`overview` → `matrix` → `rule` (e.g. SELL-5) → `commit` (its red commit) → back → `commit` (its green
commit) → the rule's verify command.

The answer must be visible on `rule` without opening a commit: red before green, with dates, and the test
count (`trail-inventory.md` D1, D8).

## FL-2: Follow a FAIL to its fix

Primary reader R1 and R2. Requirements: LOOP-1, LOOP-2, LOOP-3, LOOP-4, NODE-1.

`overview` → `plan` (build) → `node` (F2) → `loop` (attempt 1 `gate.stub` ok:false; attempt 2 reviewer
FAIL) → `verdict` (A2 reviewer) → `finding` (A2) → `commit` (the `Fixes-Finding: A2/I1` commit) →
`verdict` (A3 reviewer PASS) → `plan` (inv-001, the attempt-3 investigation).

The reference case is real: F2's three attempts and inv-001 (`trail-inventory.md` §4).

## FL-3: Who did what?

Primary reader R1. Requirements: AGENT-1, AGENT-2, NODE-1.

`node` → `activity` (per-agent lanes, filter by agent) → `commit` (trailer agent vs hook-seen agent,
match ✓/✗) → `node`.

Must surface the real mismatch (F1 `0e4fe2f`, hook agent `—`, ✗) rather than hide it.

## FL-4: Where did a human decide?

Primary reader R1. Requirements: HITL-1, NAV-2.

`overview` → `decisions` (every pause 1, pause 2, steer, ruling, sign-off and merge, across nodes) → the
evidence it links to: `node`, `finding` (a D-finding), `rule` (its QA step and sign-off), or `commit`.

## FL-5: Re-verify a claim without the UI

Primary reader R1. Requirements: VERIFY-1, NAV-3.

Any of `rule`, `node`, `commit` → the verify panel → copy the `git log --format=…` command, or open the
commit or PR on GitHub.

## FL-6: Understand how the harness works

Primary reader R1 (first visit) and R2. Requirements: AGENT-3, DATA-2, DATA-3.

`overview` → `about` (how to read the trail: provenance labels, completeness, the compiled-at stamp, the
glossary of gate, verdict, finding, steer) → `harness` (six agents, their skills and never-dos, the
hooks) → `node`.

## FL-7: Present one feature live

Primary reader R2. Requirements: NAV-2, NAV-4, TDD-1.

Search (NAV-4, from any screen) → `node` → `walkthrough` (commits in TDD order) → `rule` → `loop`.
Deep links are pasted into the conversation (NAV-2).

## FL-8: See how the work ran across days

Primary reader R2. Requirements: CTX-1, STATS-1 (both COULD).

`overview` → `sessions` (the context snapshot chain) → `node` at that point; `overview` → `stats`.

## FL-9: Land somewhere that doesn't exist

Any reader. Requirements: NAV-2.

A stale or mistyped deep link → `not-found`, which names what was asked for and links to `overview`,
`matrix` and search.

## Coverage

| Screen | Flows |
|---|---|
| overview | FL-1, FL-2, FL-4, FL-6, FL-8 |
| matrix | FL-1 |
| rule | FL-1, FL-4, FL-5, FL-7 |
| plan | FL-2 |
| node | FL-2, FL-3, FL-4, FL-5, FL-6, FL-7, FL-8 |
| walkthrough | FL-7 |
| loop | FL-2, FL-7 |
| verdict | FL-2 |
| finding | FL-2, FL-4 |
| activity | FL-3 |
| commit | FL-1, FL-2, FL-3, FL-4, FL-5 |
| decisions | FL-4 |
| about | FL-6 |
| harness | FL-6 |
| sessions | FL-8 |
| stats | FL-8 |
| not-found | FL-9 |

17 screens, every one in at least one flow. No orphans.
