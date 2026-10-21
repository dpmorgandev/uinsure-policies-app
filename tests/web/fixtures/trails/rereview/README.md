# rereview

One node whose reviews include same-attempt re-reviews, named as the orchestrator names them:
`A<n>.<m>-<agent>.json`, beside the first round's `A<n>-<agent>.json` (U1 D1 finding I1, NAV-1).
Cut from the real `build` trail: `build/F5` (a re-review that FAILs, `A2.4-reviewer.json`, then
`attempt++` and `findings/A2.4.md` with `Fixes-Finding: A2.4/I1`) and `build/F3` (a P2 fixed after a
PASS pair, then a re-review `A2.2` PASS pair). Every verdict file has the real envelope (`v`, `ts`,
`plan`, `node`, `attempt`, `agent`, `agent_id`, and the verdict under `verdict`), as
`build/F3/verdicts/A2.2-reviewer.json` has it. `base/` and `files/` are `fail-and-fix/`'s.

## The story

- **c0 to c3:** plan status, red (SELL-1, SELL-2), stub, green.
- **A1 (attempt 1, at c3):** reviewer PASS with one P2 (R1, SELL-1: the reference check is unnamed);
  security PASS.
- **c4:** the P2 fixed (builder, `TDD: refactor`, SELL-1), `gate.refactor`.
- **A1.2 (attempt 1, re-review at c4):** reviewer **FAIL** (P1 R1, SELL-2: a reference differing only in
  case is sold twice); security PASS.
- **c5:** `attempt++` (1 → 2), then `findings/A1.2.md` (I1).
- **c6, c7:** the finding's red test and fix, each `Fixes-Finding: A1.2/I1`; `gate.finding-red`,
  `gate.finding-green`.
- **A2 (attempt 2, at c7):** reviewer PASS with one P2 (R1, SELL-2: an unused helper); security PASS.
- **c8:** the P2 fixed (`TDD: refactor`, SELL-2), `gate.refactor`.
- **A2.2 (attempt 2, re-review at c8):** reviewer and security PASS.
- **c9:** the QA script. No `pause1`, sign-off, integrate, README or walkthrough: the node is in flight
  (DAG: owner loop, `in_progress`, attempt 2). No activity log.

## The facts a test reads

- **Verdicts (8, 1 FAIL):** each file under `trail/docs/trace/build/F1/verdicts/`, with its round as the
  file name gives it, verbatim:

  | File | Round | Agent | Verdict |
  |---|---|---|---|
  | `A1-reviewer.json` | A1 | reviewer | PASS |
  | `A1-security.json` | A1 | security | PASS |
  | `A1.2-reviewer.json` | A1.2 | reviewer | FAIL |
  | `A1.2-security.json` | A1.2 | security | PASS |
  | `A2-reviewer.json` | A2 | reviewer | PASS |
  | `A2-security.json` | A2 | security | PASS |
  | `A2.2-reviewer.json` | A2.2 | reviewer | PASS |
  | `A2.2-security.json` | A2.2 | security | PASS |

- **FAILs taken:** 1 of 8 verdicts FAIL, and it is a re-review's (A1.2 reviewer). A compiler that reads
  only `A<n>-<agent>.json` shows 4 verdicts and 0 FAILs.
- **Problems:** every verdict file is a verdict, so none of them is in `problems[]`.

**Expected, and how it was checked:** worked out by hand from the files above when this fixture was made,
not printed by `render-trace check` (the node has no README, so the trace step has not run on it).
