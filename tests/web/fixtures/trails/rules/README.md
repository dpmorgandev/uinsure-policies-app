# rules

A rendered trail across the four kinds of node the overview, the requirements matrix and the rule page must
tell apart (U1: NAV-1, MATRIX-1, RULE-1, RULE-2, DATA-4, NAV-3). Unlike the other fixtures it carries what
the trace step writes after the loop: each node's `README.md` and `walkthrough.md`, and
`docs/trace/requirements-matrix.md`, in the shapes `render-trace.mjs` writes them. Cut from the real
`build` trail: the F0a README's wording, the F1 failure route, the matrix columns and the
`requirements.md` heading-and-table shape (`### Sell (MUST-1)`, `| ID | Rule | Agreed interpretation |`).

## The plan (`base/docs/plans/active/build.dag.yaml`)

| Node | Owner | Status | Attempt | Rules | Trail |
|---|---|---|---|---|---|
| F0a Harness | david | done | 0 | none | git-only: its README is in `base/`, written by the main session |
| F1 Sell | loop | done | 2 | SELL-1, SELL-2 | complete, with one FAIL fixed |
| F2 Retrieve | loop | in_progress | 1 | GET-1 | TRAIL INCOMPLETE: green committed before red |
| F3 Cancel | loop | pending | 0 | CANCEL-1 | none |

`CANCEL-2` is in `requirements.md` and in no node. Five rules in three features: Sell (SELL-1, SELL-2),
Retrieve (GET-1), Cancel (CANCEL-1, CANCEL-2).

## The commits (one branch, each at its own `date`)

| Id | Date (UTC) | Node | Agent | TDD | Rule | Subject |
|---|---|---|---|---|---|---|
| c0 | 2026-10-15 12:00 | F0a | main | | | plan(build/F0a): F0a harness built in-session |
| c1 | 2026-10-16 09:00 | F1 | main | | | plan(build/F1): F1 pending → in_progress |
| c2 | 2026-10-16 12:00 | F1 | tester | red | SELL-1, SELL-2 | the acceptance suite (adds `sell.spec.ts`: 2 SELL-1 and 2 SELL-2 titles) |
| c3 | 2026-10-16 13:00 | F1 | builder | stub | SELL-1, SELL-2 | stub the sale route |
| c4 | 2026-10-17 12:00 | F1 | builder | green | SELL-1, SELL-2 | the sale |
| c5 | 2026-10-17 12:20 | F1 | builder | refactor | SELL-1 | name the reference check |
| c6 | 2026-10-17 13:01 | F1 | main | | | attempt 1 → 2 |
| c7 | 2026-10-17 14:00 | F1 | tester | red | SELL-2 | `Fixes-Finding: A1/I1`; adds `sell-window.spec.ts`: 1 SELL-2 title |
| c8 | 2026-10-17 15:00 | F1 | builder | green | SELL-2 | `Fixes-Finding: A1/I1` |
| c9 | 2026-10-18 09:00 | F1 | tester | | SELL-1, SELL-2 | QA script: SELL-1 is step 1, SELL-2 step 2; signed off |
| c10 | 2026-10-18 10:30 | F2 | main | | | plan(build/F2): F2 pending → in_progress |
| c11 | 2026-10-18 12:00 | F2 | builder | green | GET-1 | retrieve a policy by reference |
| c12 | 2026-10-18 13:00 | F2 | tester | red | GET-1 | an unknown reference answers 404 (adds `get.spec.ts`: 1 GET-1 title) |

The red and green dates of SELL-1 differ (2026-10-16 and 2026-10-17), so a page that shows "the red commit
before the green one, with dates" (RULE-2) is checked against two distinct dates. Both sit at 12:00 UTC,
so each date reads the same in any time zone from UTC−11 to UTC+11.

## The loop

- **F1:** red, stub, `pause1` (2026-10-16), green, refactor; A1 reviewer FAIL (finding R1, investigated as
  I1 in `findings/A1.md`), A1 security PASS; attempt 2: the finding's red test and fix, A2 reviewer and
  security PASS; `gate.integrate` ok (5/5); `pr(10)`; `signoff(c9)` on 2026-10-18. No merge event.
- **F2:** setup, then `gate.red` at c12 **not ok**: exit 0 where a fail was expected, because the code was
  committed first at c11. No `pause1`, no green gate, no verdicts, no QA script, no integrate.

## The facts a test reads

- **Completeness:** F0a `OK (git-only, F0a)`; F1 `OK`; F2
  `TRAIL INCOMPLETE: rule GET-1 has no red commit before its green commit; rule GET-1 has no QA step; gate.red is not ok; gate.green is missing; gate.integrate is missing`,
  five reasons in this order; F3 none (no trail).
- **The matrix rows** (`trail/docs/trace/requirements-matrix.md`, lines 6 to 10, in `requirements.md`
  order): SELL-1 2/2, red c2, green c4, refactor c5, QA `docs/qa/build-F1.md#1`, sign-off David
  2026-10-18, PR #10; SELL-2 3/3, red c2, green c4, no refactor, QA `#2`, David 2026-10-18, #10; GET-1 ?/1
  (no integrate, so no pass count), red c12, green c11, no refactor, no QA step, sign-off pending, no PR;
  CANCEL-1 (build/F3) and CANCEL-2 (unmapped) not built yet.
- **Receipt figures:** 3 of 5 rules built (a node and a test: SELL-1, SELL-2, GET-1); 2 of 5 rules pass
  in full (SELL-1, SELL-2); 2 of 4 nodes done (F0a, F1); 1 of 2 looped nodes took more than one attempt
  (F1 took 2, F2 1; F0a is git-only, F3 not started); 1 of 4 verdicts FAIL (F1 A1 reviewer); 2 human
  decisions (F1's `pause1` and its sign-off). 3 of 5 rules list a red commit.
- **Walkthrough rows:** F1's commits are rows 1 to 9 (c1 to c9), F2's rows 1 to 3 (c10 to c12). SELL-1's red
  is row 2, green row 4, refactor row 5; GET-1's green is row 2 and its red row 3.

**Expected, and how it was checked:** the labels above are what `completeness()` in
`.claude/scripts/render-trace.mjs` gives for each node on its own branch (origin/main up to the node's last
commit), worked through by hand from that function when this fixture was made. They were not printed by
`render-trace check` on the replay: the replay puts every node's commits on one branch, where the real check
would also count F1's commits against F2's activity. The READMEs, walkthroughs and matrix are the files the
trace step commits, so the compiler reads them as it reads the real trail.
