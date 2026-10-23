---
plan_id: ui
kind: build
title: Docket UI build
created: 2026-10-20
dag: ui.dag.yaml
parent: null
---

## Why
Docket is the React frontend in `src/web/`: an explorer that shows the API build's trail (rules, plans,
the loop, agents and David's decisions) and a workbench that drives the running API. The screens signed
off at G4 are its contract. This plan builds the explorer, then the workbench, and closes when both exist.

## Approach
- `ui.dag.yaml` is the only state; the orchestrator walks each node's tasks in order. Rules come from
  `docs/ui-requirements.md`; every PR goes into `ui`, rebased onto `origin/ui`.
- U0a is the harness, built in session with David (web-testing spec, the web `/feature` loop, the G4 kit
  defects, `derive-screens.mjs`, fixture trails). U0b, the walking skeleton, is the first loop run.
- Each feature node runs outside-in: red Playwright acceptance with parity against its derived reference,
  a stub of canned routes, then per layer (compiler → loader, or client) tester red and builder green, the
  screen green last. Each task names its rules.
- Pause 1: David opens the stub routes in the running app. Pause 2: David tests the feature on the built,
  running app from the QA script.
- Independent nodes run side by side in their own worktrees (after U0b: U1, U2, U3, U5, W1) and land one
  at a time, each rebased and green on the latest `ui`, so every landed feature is testable.
- No budgets. Cut order: U6, then U5, then the COULD rows, only at David's word.

## Rejected alternatives
- One feature at a time for ui: rejected by David on 2026-10-20; parallel worktrees, landing one at a time, ship sooner without mixing features.
- The React frontend inside the build plan: removed by David on 2026-10-17 so the API plan stayed bounded; Docket gets its own plan.
- A separate manifest beside the DAG (A4): it drifts from the DAG, as agentflow's did; one DAG file stays the one source of truth.
- A task-level DAG (B2): edges between tasks add nothing when one tester and builder work a node in order; parallelism is between nodes.
- One harness-plus-skeleton node (C1): the harness can't be built by the loop it builds, so U0a and U0b are split as F0a and F0b were.
- The workbench after the explorer's last node (ui-requirements §4 draft): it needs only the API, which is merged, so W1 waits only for U0b.

## Prior work consulted
- docs/plans/active/build.plan.md:18: F0a harness built in session, F0b the walking skeleton as the first loop run; mirrored as U0a and U0b.
- docs/plans/active/build.plan.md:34: one F0 node rejected (C1); the same split holds here.
- docs/lessons.md: not on the ui branch; none.

## Carried past the demo

David, 2026-10-22, before the 2026-10-23 demo: U7 is built as a demo slice ("proceed"), and U6 is cut. These U7 acceptance lines are not built; they stay here, word for word, as the tech debt after the demo.

- The compiler refuses a plan or node id outside [A-Za-z0-9._-] or holding '..', and never writes outside src/web/public (U0b security S3)
- A commit with several Fixes-Finding lines keeps every one, in order, in trace.json, and each is privacy-scanned (inv-005 I5; skipped if U3 has landed it)
- src/web/public/, src/web/test-results/ and src/web/playwright-report/ are git-ignored, so generated output can't be staged
- The node's e2e suite and every earlier node's pass at the default Playwright worker count, not only at one worker
- The theme toggle's choice survives a reload; with no choice made, the theme follows the system (U0b carry-over, David 2026-10-21)
- The overview and node page decide 'no trail' from the compiler's nodes[*].trail flag, which TraceNode declares, not from completeness being null (U1 review A2 R1, DATA-4)
- TraceRule.status is typed string | null, as the compiler emits it (U1 review A2 R2, MATRIX-1)
- The matrix links a PR cell out only when it matches #<n>, as the rule page does, from one shared parser (U1 review A2 R3, NAV-3)
- A commit trailed 'Rule: none' shows its no-Rule state on its page, with no #/rules/none link, pinned by a screen test (U1 review A2.2 R2, NAV-3)
- compiler/index.ts commitsOf keeps its original spacing; the D3 green reformatted it (U1 review A2.2 R1, RULE-1)
- A 2xx answer whose body isn't JSON is shown as a problem, never as 'ok' with no Policy, and the Sell button re-enables (W1 review A3 R1, WB-3, BUSY-1)
- A test pins the send-anyway list's chips and the timeline's ruleApplied chip to #/rules/<id> (W1 review A3 R2, WB-3)
- One shared helper builds every workbench rule link as '#/rules/' + encodeURIComponent(ruleId) (W1 review A3 R3; W1 security A3 and A4 hygiene note, WB-3)
- .s-wb-list is kept: W2's cancel screen uses it for the refusals list (W1 review A3 R4 revised by W2 A1 R5, WB-2)
- tests/web/e2e/U0b/support/built.ts exports nothing unused (screenSettled, own) (W1 review A4 R1)
- W1's trail carries its merged(8f8f365) event and the QA correction for the stale preview at part I steps 61-68 (W1 carry-over, 2026-10-22)
- PlanGraph builds its rule links through the shared shell/ruleLinks.ts helper (encoded), not its own copy (U2 review A2 R1, DAG-1)
- The plan graph shows a null or unknown node status as written, marked, never as pending or in progress (U2 review A2 R2, DAG-1, HONEST-1)
- The nav's Plan link and the overview's full-plan link use the trail's build plan id, with no 'build' fallback; no build plan draws not built yet (U2 review A2 R3, DAG-1, HONEST-1)
- Vitest characterisation tests pin the compiler's node pr, acceptance and tasks (a title with a quoted comma included), parsePatch and loadDiffs (U2 review A2 R4, NODE-1)
- trace.json carries no field nothing reads (nodes[*].qa, TraceTask.step), or a screen reads it (U2 review A2 R5, NODE-1)
- The cancel screen builds its rule links with the shared ruleLinks helper, encoded, not a local copy (W2 A1 R3, WB-3)
- The WB-4 unit test that compares two recorded answers is replaced by one that can fail for a code fault (W2 A1 R4, WB-4)
- A test moved from another node after a stale-test finding is committed as a test(...) move, not TDD: red, and the trace reads it as such (W2 A2 R2, WB-3)
- A gate line with no ok is drawn 'ok not recorded', never Waived: a gate-row kit state (one /kit-gap, in-node per A5), then Ladder.tsx maps ok null to it (U3 inv-007 I3, LOOP-1)
- A finding with no testable is drawn 'testable not recorded', never Untestable: a finding-card kit state, then Finding.tsx maps null to it (U3 inv-007 I4, LOOP-4)
- FindingCard's severity accepts P0 in the fail tone, as VerdictCard does since KG10 (KG10 left it: one catalog state per node, LOOP-4)
- Loop events and ladder verdicts carry their DATA-2 provenance label wherever they appear; the loop's source sentence reads 'source: orchestrator', not 'recorded' (U3 pause-1 ruling and A3 reviewer note, DATA-2)
- The kit workarounds in U3's screens are removed: FindingCard's id needs no trailing space (Finding.tsx:83), and FindingCard.fixedBy takes several commits, so fixOf drops its '(then …)' subject (U3 t6 kit notes, LOOP-4)
- A severity outside P0-P2 is shown as recorded on the verdict card too, never mapped to P2 (severityOf, loopData.ts:35), so the card and the findings region agree (U3 A3 R2, LOOP-3)
- The trace tells merge repairs from finding fixes: U3's ad2105d and f5f98c8 are fix(...) commits that repair the U2 merge and carry no Fixes-Finding (U3 A3 R4, LOOP-2)
- The commit-msg hook refuses a fix(...) commit with no Fixes-Finding trailer; merge repairs use a non-fix type (U3 A3 I5, LOOP-2; harness)
- splitRootCause treats a single-quoted span as a quotation, so a marker after a sentence end inside it ('Done. Cause: x') stays words; U3's own D1/I1 finding page shows its text unsplit (U3 A5 R1, LOOP-4)
- A marker after a sentence end that closes a single quote ("…'y.' Fix direction:") is a split point again, as it was at ca3f1a3; the ten build F1 D2 and F6 A2 cards split correctly, pinned by a unit test (U3 QA step 46, a regression since 3b25c3c; David 2026-10-22: land, U7)
- Each gate receipt's ok agrees with its exit and expect; a run that passes only on re-run records each re-run as its own receipt, and U3's LOOP-4 round-A1 region test holds under load at --workers=2 (U3 A5.2 R1, LOOP-4)
- Stats computes commits per agent from trace.json commits[] instead of drawing it as a gap, if David rules the gap is not to stand (U5 A1 R3, STATS-1)
- The stats table sorts by its Node column with aria-sort, as the reference's action lists (U5 A1 R4, STATS-1)
- A compiler unit test covers the harness file for AGENT-3 (U5 A1 R5, AGENT-3)
- The unused U5 test support (rowOf, mainText, the rowTexts re-export, route.plan) is removed (U5 A1 R6, CTX-1)
- A context snapshot's path and slug are denylist-scanned before they reach trace.json (U5 A1 S1, CTX-1)
- A test shows that a denylist hit in a docs/context snapshot fails the compile with no trace.json written (U5 A1 S2, CTX-1)
- Each sessions entry opens its own snapshot at /sessions/:file: the reference tags it NAV-2, so U4 or U7 builds it (U5 A1 reviewer note, CTX-1)
- Every external link the kit draws (ShaLink's link to GitHub, the footer's repository and snapshot links) carries rel=noreferrer (U0b security S1; split from U7, 2026-10-22: the page-wide referrer policy shipped in U7 instead)
- Harness: the in-node kit gap (ui.md, A5) runs /kit-gap with --node <node>, but screens-fill.mjs renders a kit prompt only for a KG<n> node, so a build node can't dispatch kit-builder (found in U7, 2026-10-22)
- The activity populated shot at 390 holds at least the first records, so a change to them is caught (U7 review A1 R1, HONEST-1)
- When the re-read after a 201 cancel fails, the header's policy status is marked as read before the cancel, not shown as current (U7 review A1 R2, WB-4)
- The cancel screen's unreachable ': ''' status fallbacks go, or render the not-returned state (U7 review A1 R3, HONEST-1)
- → U10: the renew screen's term default lands in the amount field while the person is typing, and the two texts join ('527.18544.10'); RenewPolicy never merges a default into a typed amount. This is the trigger behind W3's 'amount null' (W3 A4 I6, U8 A1 I2); U8 now sends such text as typed, so the API's 400 answers it (U8 whole suite, 2026-10-23, WB-5)
- → U10: U5's STATS-1 'F1's last verdict reads PASS at A1' failed once in the whole suite: the facts region was not drawn within 5s (U8 whole suite, 2026-10-23, STATS-1)
- → U10: W3's wb-5 claim and renewal specs fail under --repeat-each or beside another session's Playwright run, sharing one API and its data; each test owns its data, or the spec runs serially (U8 repeat run, 2026-10-23, WB-5)
- → U10: the workbench request log is still uncapped for the life of the page; publish() no longer re-copies settled exchanges (U8 security A1 note, WB-7)
- → U10: U7's two pinned NAV-5 tour tests time out under --repeat-each 5 with parallel workers: the trace load is starved; openTour waits for the trace before any test reads a stop (U8 red, 2026-10-23, NAV-5)
- → U10: RenewPolicy's amountToSend tests a clean number with Number(), which reads '0x10' as 16 and '1e2' as 100; a decimal pattern decides what is sent as a number (U8 review A2 R1, WB-5, HONEST-1)
- Carried past U10 (orchestrator ruling under the deadline, 2026-10-23): the undrawn-lines notice (s-events-note) becomes a kit state or component, not screen markup (U4 A2 R2, AGENT-2); it needs a kit notice state through /kit-gap, and tests/Uinsure.Policies.Web.Tests/e2e/U10/agent-2.spec.ts is test.fixme until then (U10 review A1 R4)

## Attempt log
(none)

## Completion record
(none)
