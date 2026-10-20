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

## Attempt log
(none)

## Completion record
(none)
