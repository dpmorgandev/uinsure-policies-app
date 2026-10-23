# two-plans

Both plans' rules in one repo, each with its own matrix, in the shapes the real trail has them (U1 round D2:
findings I1 to I6, for MATRIX-1, NAV-1, RULE-1 and NAV-3). The fixtures before this one each left out a real
shape: no slash ID in a matrix, no `ui-requirements-matrix.md`, no `merged(<sha>)` event, no non-SHA matrix cell
and no template-literal test title. This one has all five, each cut from the real file named below.

## The plans (`base/docs/plans/active/`)

| Plan | Kind | Node | Status | Rules |
|---|---|---|---|---|
| build | build | F1 Sell | done | SELL-1 |
| build | build | F4 Renew | done | RENEW-1/2, CANCEL-5 |
| ui | build | U0b Trail compiler and app shell | done | DATA-1 |
| ui | build | U1 Overview, requirements matrix and rule page | in_progress | NAV-1 |

Both DAGs say `kind: build`, as `docs/plans/active/build.dag.yaml` and `ui.dag.yaml` do. `build.dag.yaml` sorts
first, so it is `plans[0]`.

## The rules, each in its own requirements file (`base/docs/`)

| ID | File | Line | Feature | Cut from |
|---|---|---|---|---|
| SELL-1 | `requirements.md` | 12 | Sell | `docs/requirements.md` line 57 (interpretation shortened as in `rules/`) |
| CANCEL-5 | `requirements.md` | 18 | Cancel | `docs/requirements.md` line 82 |
| RENEW-1/2 | `requirements.md` | 24 | Renew | `docs/requirements.md` line 90 |
| DATA-1 | `ui-requirements.md` | 12 | Trail data (the compiler) | `docs/ui-requirements.md` line 108 |
| NAV-1 | `ui-requirements.md` | 18 | Navigation and overview | `docs/ui-requirements.md` line 121 |

So the build plan has 3 rules (`requirements.md`) and the ui plan 2 (`ui-requirements.md`); `trace.json`'s
`rules[]` holds all 5.

## The two matrices (`trail/docs/trace/`)

`requirements-matrix.md`, the build plan's (rows from line 6):

| Line | Rule | plan/node | Tests | Red | Green | Refactor | QA step | Sign-off | PR |
|---|---|---|---|---|---|---|---|---|---|
| 6 | SELL-1 | build/F1 | 22/22 | c1 | c2 | c3 | `docs/qa/build-F1.md#1` | David 2026-10-18 | #10 |
| 7 | CANCEL-5 | build/F4 | 11/11 | c7 | c8 | `undefined` | `docs/qa/build-F4.md#49` | David 2026-10-19 | #28 |
| 8 | RENEW-1/2 | build/F4 | 30/30 | c6 | c8 | `undefined` | `docs/qa/build-F4.md#1` | David 2026-10-19 | #28 |

`ui-requirements-matrix.md`, the ui plan's (rows from line 6):

| Line | Rule | plan/node | Tests | Red | Green | Refactor | QA step | Sign-off | PR |
|---|---|---|---|---|---|---|---|---|---|
| 6 | DATA-1 | ui/U0b | 28/28 | c9 | c10 | `undefined` | `docs/qa/ui-U0b.md#1` | pending | |
| 7 | NAV-1 | ui/U1 | not built yet | | | | | | |

Cut from `docs/trace/requirements-matrix.md` lines 6, 20 and 23 and `docs/trace/ui-requirements-matrix.md` lines 6
and 14, the SHAs replaced by this fixture's commits. Two departures, both on purpose: SELL-1's refactor cell holds
c3 (the real one is blank), so one SHA cell sits beside the `undefined` ones; and NAV-1 is `not built yet`, as it
is in the real ui matrix today. The literal `undefined` is what an earlier `render-trace.mjs` wrote in the
refactor column; the current one copies those rows forward.

## The commits (one branch, `feature/ui/U1`, each at its own `date`)

| Id | Plan/node | Agent | TDD | Rule | Subject |
|---|---|---|---|---|---|
| c0 | build/F1 | main | | | plan(build/F1): F1 pending → in_progress |
| c1 | build/F1 | tester | red | SELL-1 | a duplicate reference answers 409 |
| c2 | build/F1 | builder | green | SELL-1 | the sale |
| c3 | build/F1 | builder | refactor | SELL-1 | name the reference check |
| c4 | build/F1 | tester | | SELL-1 | docs(F1): QA script (the commit David signed off) |
| c5 | | | | | Merge pull request #10 from dpmorgandev/feature/build/F1 (no trailers, as GitHub writes a merge) |
| c6 | build/F4 | tester | red | RENEW-1/2 | a renewal inside the window answers 201 |
| c7 | build/F4 | tester | red | CANCEL-5 | cancelling a renewed policy refunds the future term in full |
| c8 | build/F4 | builder | green | RENEW-1/2, CANCEL-5 | renew a policy |
| c9 | ui/U0b | web-tester | red | DATA-1 | one compiled data file |
| c10 | ui/U0b | web-builder | green | DATA-1 | the trail compiler |
| c11 | ui/U1 | web-tester | red | NAV-1 | adds `tests/web/e2e/U1/nav-1.spec.ts` |

## build/F1's loop (`trail/docs/trace/build/F1/loop.jsonl`)

| Line | Event | Cut from `docs/trace/build/F1/loop.jsonl` |
|---|---|---|
| 1 | `setup` | line 1 |
| 2 | `pause1`, "David: go" | line 5 |
| 3 | `pr(10)` | |
| 4 | `signoff(<c4>)`, head c4: "David: sign off. docs/qa/build-F1.md signed by David Morgan 2026-10-18, Verdict Accept F1" | line 82 |
| 5 | `merged(<c5>)`, head c5 short: "David merged PR #10 in the GitHub UI with a merge commit at 2026-10-18T18:50:55Z" | line 84 |

So build/F1 has three human decisions: the `pause1` (line 2), the sign-off of c4 (line 4) and the merge at c5
(line 5). No other node has a loop.

## The test source (`files/tests/web/e2e/U1/nav-1.spec.ts.fixture`)

Cut from `tests/web/e2e/U1/nav-1.spec.ts`. Three NAV-1 titles:

- `'NAV-1 · the overview opens on the question, before any other region'`: a plain title.
- `` `NAV-1 · receipt figure ${i + 1}, ${f.name}, reads ${f.value} from the fixture` ``: a template literal in a
  `for` loop that interpolates three values, one source line standing for one test per figure.
- `` `NAV-1 · the overview draws the search and the theme toggle once, in the top bar` ``: a backtick title that
  interpolates nothing, so one plain test name.

## The facts a test reads

- **Each rule against its own matrix:** SELL-1, CANCEL-5 and RENEW-1/2 are built at build/F1, build/F4 and
  build/F4 from `requirements-matrix.md` lines 6, 7 and 8; DATA-1 is built at ui/U0b (28/28) from
  `ui-requirements-matrix.md` line 6; NAV-1 is not built, at ui/U1, from line 7.
- **The overview answers for the build plan:** 3 of 3 rules built, counted from the 3 rows of
  `docs/trace/requirements-matrix.md`; 3 of 3 rules list a red commit. The ui plan's 2 rules are not counted.
- **The matrix, by default:** SELL-1, CANCEL-5, RENEW-1/2, "Showing 3 of 3 rules".
- **Non-SHA cells:** CANCEL-5's and RENEW-1/2's refactor (lines 7 and 8) and DATA-1's (ui matrix line 6) are no
  commit; SELL-1's refactor is c3.
- **Decisions:** build/F1 signoff with SHA c4 at loop line 4; merge with SHA c5 at loop line 5.
- **NAV-1's tests by name:** two plain names and one parameterised entry, all in `tests/web/e2e/U1/nav-1.spec.ts`.

**Expected, and how it was checked:** the line numbers above were counted by hand in each file. The README claims
no `render-trace check` label: no node here has a README or a walkthrough, so the fixture carries no completeness
for the compiler to read.
