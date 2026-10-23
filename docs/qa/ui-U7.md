# QA script: ui / U7, Tech debt: the non-blocking carries (inv-005)

Rule IDs: none of U7's own (`rules: []`). The acceptance lines in `docs/plans/active/ui.dag.yaml` are the contract,
and the tests that pin them are tagged SEC-1, NAV-5, DAG-1, HONEST-1 and WB-4. The Rule column below carries those IDs, and AGENT-2 (the
activity screen's rule) for the bounded shot.
Branch: feature/ui/U7   Worktree: .claude/worktrees/ui-U7
Commit under test: 41ae7a3, HEAD when this script was written. The code under test landed in d7489cb (green):
`src/web/index.html`, `About.tsx` (the tour), `u3Routes.tsx` (one plans route) and `CancelPolicy.tsx`. The bounded
activity shot and its baselines are in 53e75e8 and 8845f75. Record the SHA you test in the sign-off.
App URL: http://localhost:4181   API: http://localhost:5091. U7 is position 11 in `ui.dag.yaml`, so its ports are
4170 + 11 and 5080 + 11.

The Actual and Pass/Fail columns are empty. I wrote the steps from the code at 41ae7a3 and the U7 tests, and I didn't
run them (note 3).

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node U7)

| Tag | Acceptance item | Steps |
|---|---|---|
| AC1 | Referrer policy no-referrer; CSP adds base-uri 'self', form-action 'none', object-src 'none' | 1–3, 14 |
| AC2 | Activity's populated regression shot is bounded; its baselines are written | 13, 15 |
| AC3 | Activity baselines at 1440, light and dark, no longer time out | 15 |
| AC4 | The cancel screen states the HTTP status it received, never a literal 200 or 201 | 9, 11, 16 |
| AC5 | After a 201 cancel the screen re-reads the policy; the header status is the API's now | 10–12, 16 |
| AC6 | The tour follows one rule end to end: Walkthrough and Commit open the Rule stop's node | 4–6, 17 |
| AC7 | The tour's Rule, Walkthrough and Commit targets are pinned by tests | 17 |
| AC8 | `plans/:planId` is registered once | 7, 18 |

## Preconditions

- [ ] Node 22 and the .NET SDK on `PATH`.
- [ ] `npm --prefix src/web ci` done in this worktree.
- [ ] Nothing listening on 5091 or 4181 (`netstat -ano | grep -E ":(5091|4181) "`, no match).
- [ ] Chrome or Edge with DevTools; Playwright's Chromium for part D.

**Run everything from the worktree root, `.claude/worktrees/ui-U7`**, in Git Bash.

## Run the app on U7's ports

Terminal 1, the API, on a fresh database:

```sh
git rev-parse HEAD                                       # write it down
rm -f qa-u7.db qa-u7.db-shm qa-u7.db-wal
ASPNETCORE_ENVIRONMENT=Development ConnectionStrings__Policies="Data Source=$(pwd -W)/qa-u7.db" \
  dotnet run --project src/Uinsure.Policies.Api --no-launch-profile --urls http://localhost:5091   # leave it running
```

Terminal 2, the app:

```sh
npm --prefix src/web run trace      # the trail at HEAD -> src/web/public/trace.json (the tour, the plan page)
npm --prefix src/web run build
DOCKET_API_PORT=5091 npm --prefix src/web run preview -- --port 4181 --strictPort   # leave it running
```

Terminal 3: `curl -s http://localhost:4181/api/health/ready; echo` reads `Healthy`.

When you finish: Ctrl+C both servers, then `rm -f qa-u7.db*` and `rm -rf src/web/public`. Never stage
`src/web/public/` or `src/web/test-results/`.

## Steps

### A. Referrer policy and CSP (AC1)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | SEC-1 | `view-source:http://localhost:4181/` | Read the `<head>` | `<meta name="referrer" content="no-referrer" />`, and the CSP meta `default-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'none'; object-src 'none'` | | |
| 2 | SEC-1 | `#/` | DevTools Console open, reload; then visit `#/rules`, `#/about`, `#/workbench/sell` | No `Content-Security-Policy` violation in the console on any of them | | |
| 3 | SEC-1 | `#/rules` | Console: `document.querySelector('meta[name=referrer]').content`, then `document.referrer` after following any in-app link | `"no-referrer"`. A link out (a GitHub QA or PR link in the matrix) opens with no `Referer` request header: check it in the new tab's Network panel with Preserve log on | | |

### B. The tour follows one rule (AC6)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 4 | NAV-5 | `#/about` | Read the tour's five stops; hover each to see its `href` | Overview `#/`, Requirements matrix `#/rules`, Rule `#/rules/SELL-1` (the first built rule), Walkthrough `#/plans/build/F1/commits` (SELL-1's node), Commit `#/commits/<sha>` | | |
| 5 | NAV-5 | `#/about` | Click Rule, then Back; click Walkthrough | The rule page for SELL-1 names its node build/F1; the walkthrough opens build/F1, the same node, not another node with a walkthrough | | |
| 6 | NAV-5 | `#/about` | Click Commit | The commit page is SELL-1's red commit in build/F1: `TDD` red, `Rule` includes SELL-1, node build/F1. It is not F1's first commit if that commit is not SELL-1's red (the old tour took the node's first walkthrough commit) | | |

### C. One plans route, cancel status and re-read, activity (AC8, AC4, AC5, AC2)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 7 | DAG-1 | `#/plans/build`, then `#/plans/ui` | Open each | The plan page: the plan's DAG and its text equivalent, each node linking to its node page; no blank page and no other screen in its place. `#/plans/build/F1/loop` still opens F1's loop | | |
| 8 | WB-4 | `#/workbench/sell` | Sell `QA-U7-C1`: start today (`T`), amount `365.00`, Card, one adult, any UK address. Then open `#/workbench/policies/QA-U7-C1/cancel` | Header `Policy status` reads `Active` | | |
| 9 | HONEST-1 | same | DevTools Network open. Type `T+30` (`date -d "30 days" +%F`), press `Quote this date` | The GET answers 200; rung 1's note reads `… answered 200, quotedOn T.` and the number equals the Network status | | |
| 10 | WB-4 | same | Press `Cancel on T+30`, then `Cancel policy on T+30` | Network: one `POST /api/policies/QA-U7-C1/cancellation` answered 201, **then** a `GET /api/policies/QA-U7-C1` after it (the re-read) | | |
| 11 | HONEST-1 | same | Read the header answer and rung 2's note | `Cancelled on T+30. The API answered 201, …` and `POST /policies/QA-U7-C1/cancellation answered 201, …`: the status Network shows for the POST | | |
| 12 | WB-4 | same | Read the header's `Policy status` without reloading; then `curl -s http://localhost:5091/policies/QA-U7-C1; echo` | The header now reads the status the curl's `"status"` holds (`Cancelled`), not `Active` | | |
| 13 | AGENT-2 | `#/plans/build/F3/activity` | Open it and scroll | The page renders every record (a long page); nothing is cut. The bounding is the regression shot's only (step 15), not the screen's | | |

### D. The suites: what the running app can't show

Stop both servers first (Ctrl+C) and `rm -rf src/web/public`: the e2e config reuses a server already on 4181, and must
build the app on the design fixture itself. The workbench spec starts its own API on 5091 with a fresh database.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 14 | SEC-1 | shell | `DOCKET_API_PORT=5091 DOCKET_APP_PORT=4181 npm --prefix src/web run e2e -- U7/sec-1.spec.ts` | 2 passed: the no-referrer policy (meta or header), and the four CSP directives | | |
| 15 | AGENT-2 | shell | `DOCKET_API_PORT=5091 DOCKET_APP_PORT=4181 npm --prefix src/web run e2e -- regression/activity.spec.ts` | 9 passed in well under the 5000 ms screenshot timeout: 8 shots against `docs/ui/baselines/activity/` (populated bounded, git-only full page, 1440 and 390, light and dark) and the test that pins which is which. The populated PNGs are a viewport's height, not about 144310 px | | |
| 16 | HONEST-1 | shell | `DOCKET_API_PORT=5091 DOCKET_APP_PORT=4181 npm --prefix src/web run e2e -- U7/wb-cancel.spec.ts` | 3 passed. The HONEST-1 test rewrites the real 201 to a 200 on its way to the page and the screen says `answered 200`, never `answered 201`: the case steps 9–11 can't make. The two WB-4 tests: a GET of the policy after the POST, and the header's status is the API's now | | |
| 17 | NAV-5 | shell | `DOCKET_APP_PORT=4181 npm --prefix src/web run e2e -- U7/nav-5.spec.ts` | 4 passed: Rule `#/rules/SELL-1` and Walkthrough `#/plans/build/F1/commits` pinned; Commit pinned to SELL-1's red commit `c2` on the design fixture; Walkthrough and Commit each follow the Rule stop's rule | | |
| 18 | DAG-1 | shell | `npm --prefix src/web run test -- -t "DAG-1 · plans/:planId is registered once"` | Passed: the route table holds `plans/:planId` once (u2Routes only) | | |
| 19 | AGENT-2 | shell | `DOCKET_API_PORT=5091 DOCKET_APP_PORT=4181 npm --prefix src/web run e2e -- regression/ --workers=2` | Every built screen's baseline holds, activity at 1440 included. Record the pass and fail counts and any failing title | | |

## Notes

1. **Rules-less node.** U7 owns no rule; the Rule column names the rule each carried fix serves, as its tests are
   tagged. Steps 13, 15 and 19 sit under AGENT-2, the activity screen's rule, because the regression specs carry no
   rule tag; the activity lines (AC2, AC3) are baseline housekeeping, not a change to AGENT-2's behaviour.
2. **Per-link `rel="noreferrer"`** stays on the matrix and rule links; the page-wide referrer policy replaces it as
   the guarantee (acceptance amended in f4a2af1). Step 3's link-out check is optional if no GitHub link is reachable.
3. **I didn't run these steps.** The build, the trace and the API write files outside my write scope. The expected
   text is the code's at 41ae7a3 and the U7 specs'. `T` and the policy's end date move with the clock: compare them
   with DevTools, not with fixed text. The test counts are mine, from the spec files; record what the run prints.
4. **Step 6 on the live trail.** The e2e pins `c2` on the design fixture. On the live trail the Commit stop is
   whichever commit carries `TDD: red`, `Rule: SELL-1` and node build/F1; check those three on the commit page.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: ___ of 19 · Steer (if any): ______

Steps not run, or only partly seen, and why:
- ______

Decision: ☐ sign off U7   ☐ steer (write it above)   ☐ defect (step numbers)
