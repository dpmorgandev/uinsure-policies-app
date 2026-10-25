# QA script: feat-001 / N1, the two user guides as persona journeys, followed against the running app

Rule IDs: none. N1 is a docs node (`rules: []`), so the Rule column carries `—` and names the guide step instead.
The contract is the acceptance list for N1 in `docs/plans/active/feat-001.dag.yaml`. This script tests line 7:
*a reader follows one persona journey in a PDF against the running app and reaches each step's shown result*.
It also gives a light check of lines 2 and 3 (each step says what you decide and what you get back, and the shot or
output shows the result).
Branch: feature/feat-001/N1   Worktree: .claude/worktrees/feat-001-N1
Commit under test: 35954f1d or later. The guides and both PDFs last changed in 11872be5. This script's own commit
changes only this file. Record the SHA you test in the sign-off.
API URL: http://localhost:5080 (the `http` launch profile: Development, SQLite file)   App URL: http://localhost:4170
Run from: the worktree root, `.claude/worktrees/feat-001-N1` under the main checkout. Use Git Bash for every command.
The guides are written for a POSIX shell.

You follow four short journeys, one per persona. Each one is a subset of the guide steps, so it fits in about
30 minutes in all:

| Journey | Persona | PDF (or its HTML) | Guide steps followed | Time |
|---|---|---|---|---|
| A | Developer joining | `API_UserGuide.pdf` (`docs/guides/api/index.html`) | DJ2, DJ4, DJ6 | ~7 min |
| B | Servicer, API | `API_UserGuide.pdf` | SJ1 to SJ6 | ~8 min |
| C | Servicer, workbench | `UI_UserGuide.pdf` (`docs/guides/ui/index.html`) | SJ1 to SJ7 | ~10 min |
| D | Assessor, explorer | `UI_UserGuide.pdf` | AJ1 to AJ5 | ~5 min |

Run them in this order. A starts the API, B and C use it, and C starts the app that D uses.

The Actual and Pass/Fail columns are empty. I didn't run the journeys (note 1). I ran
`dotnet test --solution Uinsure.Policies.slnx` at 35954f1d (652 passed, 0 failed) and the CANCEL-1b trait filter
(8 passed), so the figures in A3 and A4 are confirmed at this commit.

## Dates

The expected values below assume you run on **2026-10-25**, the capture day of both guides. On a later day, use the
offset in brackets in place of each date. Find your today with `date +%F`, and a later day with `date -d "+7 days" +%F`.
For journey B, the API guide's own **Dates** table (top of Journey 2) gives the same substitutions. Refunds,
`daysUsed` and `ruleApplied` stay as shown. The dates in the outputs, `quotedOn`, every `traceId` and every payment
reference change.

## Preconditions

- [ ] `dotnet test` green in the worktree (passed / failed / skipped: __ / __ / __). Step A3 runs it.
- [ ] .NET SDK 10, Node 22.22 or later, and curl on `PATH`. A global `dotnet-ef` isn't needed: this script skips DJ3.
- [ ] Nothing listening on 5080 or 4170: `netstat -ano | grep -E ":(5080|4170) .*LISTEN"` prints nothing.
- [ ] A fresh database. The API creates `src/Uinsure.Policies.Api/policies.development.db` on its first start, and
      there's none in the worktree at 35954f1d. If you have run the API here before, stop it and delete
      `src/Uinsure.Policies.Api/policies.development.db*` first. Otherwise GUIDE-001 already exists, and B2 answers 409.
- [ ] Both PDFs open beside the terminal: `API_UserGuide.pdf` and `UI_UserGuide.pdf`, at the worktree root.

## Start and stop

| What | Start (Git Bash, from the worktree root) | Listens on | Stop |
|---|---|---|---|
| API | `dotnet run --project src/Uinsure.Policies.Api --launch-profile http` (terminal 1, step A5) | 5080 | Ctrl+C in terminal 1 |
| App | `DOCKET_API_PORT=5080 npm --prefix src/Uinsure.Policies.Web run preview -- --port 4170` (terminal 2, step C3) | 4170, proxying `/api` to 5080 | Ctrl+C in terminal 2 |

Stop the app first and the API last, once D is done. Don't run `npm run e2e` while either is up. This script doesn't
use it.

## Journey A: the developer joining (API guide, DJ2, DJ4, DJ6)

Terminal 1, from the worktree root. The tests run before the API starts. On Windows, a build while the API is running
can fail because the API's DLL is locked. The guide runs DJ2 step 3 before DJ4. That order works too if nothing needs
rebuilding.

| # | Rule | Guide step | Command or click | Expected (as the guide shows it) | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| A1 | — | DJ2 · check the SDK | `dotnet --version` | 10.0.1xx or later (the guide's run: `10.0.402`) | | |
| A2 | — | DJ2 · build | `dotnet build Uinsure.Policies.slnx -warnaserror` | `Build succeeded.` `0 Warning(s)` `0 Error(s)` | | |
| A3 | — | DJ4 · run everything | `dotnet test --solution Uinsure.Policies.slnx` | Four DLLs `passed`, then `total: 652`, `failed: 0`, `succeeded: 652`, `skipped: 0` | | |
| A4 | — | DJ4 · one rule | `dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=CANCEL-1b"` | `total: 8`, `failed: 0`, `succeeded: 8` | | |
| A5 | — | DJ2 · run the API | `dotnet run --project src/Uinsure.Policies.Api --launch-profile http` (leave it running) | `Now listening on: http://localhost:5080`, `Hosting environment: Development` | | |
| A6 | — | DJ2 · health and the two pages | In terminal 3, the guide's three lines: `curl -s -i http://localhost:5080/health/live`, then the two `curl -s -o /dev/null -w …` lines for `/openapi/v1.json` and `/scalar/v1` | `HTTP/1.1 200 OK`, `Content-Type: text/plain`, `Healthy`; then `openapi status 200`, `scalar status 200` | | |
| A7 | — | DJ6 · follow CANCEL-1b | Open the three links the guide names: `docs/requirements.md:77`, `tests/Uinsure.Policies.Api.Tests/CancelCoolingOffTests.cs:22`, `src/Uinsure.Policies.Domain/Rules/RefundCalculator.cs:40` | Line 77 is the CANCEL-1b row ("start + 14 days, inclusive"). Line 22 is the comment above `Cancel_on_the_start_date_refunds_in_full_to_the_Cheque_paid`. Line 40 is `// CANCEL-1b: cooling-off runs to start + 14 days, inclusive.` Each matches the guide's extract and Figure 7's CANCEL-1b branch | | |

## Journey B: the servicer driving the API (API guide, SJ1 to SJ6)

Terminal 3, with the API from A5 still running. Copy each command from the PDF, not from here, so you test what a
reader would copy. Change its dates as in the guide's Dates table.

| # | Rule | Guide step | Command or click | Expected (as the guide shows it) | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| B1 | — | SJ1 · first call | `curl -s -i http://localhost:5080/health/ready` | `HTTP/1.1 200 OK`, body `Healthy` | | |
| B2 | — | SJ2 · sell | The GUIDE-001 sale, start `2026-11-01` (today + 7) | `201 Created`, `Location: /policies/GUIDE-001`, `"status":"Pending"`, `"endDate":"2027-10-31"` (today + 7 + 1 year − 1 day), `"amount":803.40`, one Card payment of 803.40 | | |
| B3 | — | SJ2 · the same reference again | The same command again | `409 Conflict`, `"type":"/problems/sell-1"`, `"ruleId":"SELL-1"`, `"reference":"GUIDE-001"` | | |
| B4 | — | SJ2 · second policy | The GUIDE-002 sale, start `2026-10-25` (today) | `201 Created`, `Location: /policies/GUIDE-002`, the same shape as B2 | | |
| B5 | — | SJ3 · read it back, lower case | `curl -s -i http://localhost:5080/policies/guide-001`, then `curl -s -i http://localhost:5080/policies/NO-SUCH-POLICY` | `200 OK` with `"reference":"GUIDE-001"`, `"status":"Pending"`, `"currentTermNumber":1`; then `404 Not Found`, `"type":"/problems/get-1"`, `"ruleId":"GET-1"` | | |
| B6 | — | SJ4 · quote twice | The two GUIDE-001 quotes: `cancellationDate=2026-11-10` (today + 16), then `2027-04-30` (today + 187) | First `200`, `"ruleApplied":"CANCEL-1b"`, `"daysUsed":10`, `"totalRefund":803.40`. Then `200`, `"ruleApplied":"CANCEL-1c"`, `"daysUsed":181`, `"unusedDays":184`, `"totalRefund":405.00` | | |
| B7 | — | SJ4 · cancel, then cancel again | The cancel for `2026-11-10` (today + 16), then the bare `curl -s -i -X POST …/GUIDE-001/cancellation` | `201 Created`, no `Location`, `"ruleApplied":"CANCEL-1b"`, `"totalRefund":803.40`, one refund with a `REF-…` reference to the Card. Then `409 Conflict`, `"ruleId":"CANCEL-4"`, `"cancellationDate":"2026-11-10"` | | |
| B8 | — | SJ5 · quote, claim, quote | On GUIDE-002: the quote for `2027-04-30` (today + 187), the claim for `2026-10-25` (today) with `"Burst pipe"`, then the same quote again | `200`, `"ruleApplied":"CANCEL-1c"`, `"daysUsed":188`, `"totalRefund":581.92`. Then `201 Created`, `Location: /policies/GUIDE-002`, `"reference":"CLM-GUIDE-002-1"`, `"hasClaims":true`. Then `200`, `"ruleApplied":"COULD-2"`, `"totalRefund":0.00`, `"refunds":[]` | | |
| B9 | — | SJ5 · refused claims | The claim for `2026-10-26` (today + 1) on GUIDE-002, then the claim for `2026-11-10` on GUIDE-001 | `422`, `"ruleId":"COULD-2a"`; then `409 Conflict`, `"ruleId":"COULD-2c"`, `"cancellationDate":"2026-11-10"` | | |
| B10 | — | SJ6 · renew | `curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/renewals -H "Content-Type: application/json" -d '{"amount":1250.00}'` | `422`, `"type":"/problems/renew-1-2"`, `"ruleId":"RENEW-1/2"`, `"windowStart":"2027-09-24"`, `"windowEnd":"2027-10-24"` (today + 334 and today + 364) | | |

## Journey C: the servicer in the workbench (UI guide, SJ1 to SJ7)

Terminal 2 for the app. Use the references below, not the guide's `UIG-…` ones (the capture made those up for its
run). The inputs are the capture's own (`docs/guides/ui/capture.mjs`), so the figures match the guide's shots. A
shot named in backticks, such as `sj2-sent`, is the file `docs/guides/ui/shots/<name>.png`. In the PDF, it's the shot
under that step whose caption fits the row.

| # | Rule | Guide step | Command or click | Expected (as the guide shows it) | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| C1 | — | SJ1 · install | `npm --prefix src/Uinsure.Policies.Web ci` | Exit 0 | | |
| C2 | — | SJ1 · compile the trail, build | `npm --prefix src/Uinsure.Policies.Web run trace`, then `npm --prefix src/Uinsure.Policies.Web run build` | Both exit 0. The trace takes about a minute (the guide: 76.4 s), and the build ends `✓ built in …` | | |
| C3 | — | SJ1 · preview, check all three answer | `DOCKET_API_PORT=5080 npm --prefix src/Uinsure.Policies.Web run preview -- --port 4170` (leave it running); in terminal 3, the guide's three `curl -s -o /dev/null -w "%{http_code}\n" …` lines | `➜  Local:   http://localhost:4170/`; then `200` three times (the app, the API, the app's `/api` proxy) | | |
| C4 | — | SJ1 · open the workbench | Open http://localhost:4170/#/workbench | The shot `sj1-home`: the Policy reference box, Open policy, and Request status reading Idle. No request sent | | |
| C5 | — | SJ2 · sell | Sell a new policy: reference `QA-UI-A`, Household, start `2026-11-04` (today + 10), amount `587.31`, Card, auto-renew on, policyholder Ada Lovelace `1985-12-10`, any address and postcode. Press **Sell this policy** | The end of the form shows the receipt: `POST /policies` with a green `201` and the body as sent (shot `sj2-sent`) | | |
| C6 | — | SJ2 · the same reference again | Same form, same reference, send again | The error summary: `409`, rule `SELL-1`, the API's own words (shot `sj2-conflict`) | | |
| C7 | — | SJ3 · read it | Back to `#/workbench`. Choose `QA-UI-A` under Recent policies in this browser | The policy page headline says **Pending**, with the term's dates and amount 587.31. At the end: Actions (Quote and cancel, Record a claim, Renew) and the requests that touched it, with their statuses (shots `sj3-policy`, `sj3-policy-end`) | | |
| C8 | — | SJ4 · quote | **Quote and cancel**. Cancellation date `2026-12-04` (today + 40). Press **Quote this date** | `200`. Headline **Cancel on 2026-12-04**, refund quoted **537.43**. The refund, term by term: `587.31 × 334 ÷ 365 = 537.43`, rule `CANCEL-1c`. Nothing cancelled yet (shot `sj4-quote`) | | |
| C9 | — | SJ4 · cancel | **Cancel on 2026-12-04**, then **Cancel policy** in the dialog | The dialog repeats the policy, date and refund and says it can't be undone. After it: **Cancelled on 2026-12-04**, `201`, total refund 537.43, Status chip **Cancelled**. At the end of the page, `ruleApplied` and `totalRefund` agree between the quote and the cancellation (shots `sj4-done`, `sj4-compare`) | | |
| C10 | — | SJ5 · claim | Sell `QA-UI-B`: start `2026-10-25` (today), `412.50`, Direct Debit, holder Edsger Dijkstra `1979-05-11`. Open its **Record a claim**. Claim date `2026-10-26` (today + 1), description `Escape of water in the kitchen`, **Record this claim**. Then change the date to `2026-10-25` (today) and record it again | First the problem list: `422`, `COULD-2a`, nothing recorded (shot `sj5-refused`). Then rung 1: refund quoted £412.50, `CANCEL-1b`; rung 2: claim recorded, `hasClaims` true; rung 3: refund quoted £0.00, `COULD-2`, with the sum struck through (shot `sj5-done`) | | |
| C11 | — | SJ6 · renew | Sell `QA-UI-C`: start `2026-10-25` (today), `300.00`, Card, holder Ada Lovelace. Open its **Renew**, press **Renew policy** | What the API said: `422`, chip `RENEW-1/2`, `A policy can be renewed from 2027-09-24 to 2027-10-24` (today + 334 to today + 364). The timeline is unchanged (shot `sj6-refused`) | | |
| C12 | — | SJ7 · inspect what you sent | Open `#/workbench/requests`. Choose the newest entry, `/policies/QA-UI-C/renewals` | The log is newest first. The exchange shows the request body, the response (a problem JSON with `ruleId` `RENEW-1/2`) and, under Repeat it, a curl with **Copy curl**. Optional: run the copied curl in terminal 3 and get the same `422` | | |

## Journey D: the assessor in the explorer (UI guide, AJ1 to AJ5)

The same preview on 4170. The explorer reads only `trace.json`, so it doesn't need the API. The guide's shots come from
the trail compiled at a2dc6df. Between a2dc6df and 35954f1d only `docs/plans/active/feat-001.dag.yaml` changed under
`docs/trace`, `docs/plans` and `docs/requirements.md`, so the build-plan figures below should match exactly.

| # | Rule | Guide step | Command or click | Expected (as the guide shows it) | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| D1 | — | AJ1 · overview | Open http://localhost:4170/#/ | Headline answer: **29 of 29 rules list a red commit, 21 also list a green commit and 8 list none**. Below it, the receipt figures, each naming its source (shot `aj1-overview`) | | |
| D2 | — | AJ2 · matrix | Open `#/rules` | **Showing 29 of 29 rules**. The SELL-1 row shows tests at the node **22 of 22**, then red and green commit links. The page's own Step 3 explains per-node counts (shots `aj2-matrix`, `aj2-matrix-end`) | | |
| D3 | — | AJ3 · one rule | Choose **CANCEL-1b** in the matrix (or type it in the header search and press Enter) | Rule text and interpretation: start + 14 days, inclusive, labelled *written*. Red before green lists red commits **3b7522d** and **7bebd33**. The page says **No green commit is recorded for CANCEL-1b**, and Verify it yourself says *not built yet* | | |
| D4 | — | AJ3 · a commit | Open `#/commits/7d3f7914e32e01f4a4a3d4a6d75dcfe60f94d668` | Header and trailers: agent **builder**, TDD **green**, the rules it names. Trailer agent against hook agent reads **not recorded** | | |
| D5 | — | AJ4 · plan and node | Open `#/plans/build`, choose node **F1** in the picture | The plan header says Approved, with who, when and the requirements revision. On F1: completeness banner **OK**. Rules SELL-1 to SELL-7; reviewer coverage **A1 6 of 7, failed**; **A2 7 of 7, passed** | | |
| D6 | — | AJ4 · walkthrough and loop | The node's **Commits** tab (`#/plans/build/F1/commits`), then **Loop** (`#/plans/build/F1/loop`) | Row **#3** is **b716734**, the tester's red test for SELL-1. The sequence ends at **#92**. The builder's green commit for SELL-2 is **#52**. Loop: Attempt 1 ended in a **security FAIL** at A1 | | |
| D7 | — | AJ5 · verdict and findings | Open `#/plans/build/F1/verdicts/A1/reviewer`, then its link **Open the findings round A1 and the commits that fixed it** | **Reviewer verdict A1**, **FAIL**, round A1, attempt 1. Findings R1, R2 and R3 are P1. The round page warns **5 of 7 have a fix commit recorded**, and Fixed by says **No fix commit recorded** for I2 and I3 | | |

## Lines 2 and 3 of the acceptance, as you go

| # | Rule | Check | How | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| E1 | — | Acceptance line 2 | For each step you followed above, read its *You decide* and *Docket gives you* (UI) or *The repository / The API gives you* (API) lines | Every step has both lines, and what you got matches what they promised | | |
| E2 | — | Acceptance line 3 | Compare C4 to C12 and D1 to D7 with the shot the guide prints for that step | Each shot shows the step's result (the response, the end of the page or the plan picture), with a red box and a **Step n** label on the control you used. There are no numbered circles | | |

Exploratory notes / defects (each defect becomes a finding on this node's failure route, not a /plan-bug):

1. **I didn't run the journeys.** The browser, the second terminal and the PDF reading are yours at this step. The
   expected values come from the two guides' HTML at 35954f1d and from `docs/guides/ui/capture.mjs`, which made the
   UI shots. I worked the arithmetic for C8 (587.31 × 334 ÷ 365 = 537.43, half away from zero) and C11 (the window
   for a start of today) from the rule rows. They weren't read from a run of mine.
2. **A runs the tests before it starts the API**, which is the reverse of the guide's DJ2 then DJ4 order. This avoids
   a locked-DLL build failure on Windows. If you follow the guide's order and the build complains a file is in use,
   that's a finding against DJ4's wording, not against the code.
3. **The UI guide's SJ5 doesn't name the date its rung 1 and rung 3 quote on.** If your £412.50 or £0.00 differ,
   note the date the screen shows.
4. **What this script doesn't cover:** DJ3 (the migration script; it needs a global `dotnet-ef` 10.0.13), DJ7 (the
   pre-push run, several minutes), DJ8, SJ7 and SJ8 of the API guide (SJ8's Postman CLI can't start on the reprint
   machine, as the guide says), SJ8 and SJ9 of the UI guide, AJ6 to AJ8, and the Playwright suite. Lines 1 and 4 to 6
   of the acceptance belong to gates t4 (link check, coverage check, privacy scan, PDF reprint, full suite) and t5
   (review), not to steps here.
5. When you're done, stop the app and the API (Ctrl+C) and, if you want a clean worktree, delete
   `src/Uinsure.Policies.Api/policies.development.db*`. The `.db` file is git-ignored.

## Sign-off

David: ______ · SHA tested: ______ · date: ______ · read from: ☐ the PDFs   ☐ the HTML

Steps passed: A ___ of 7 · B ___ of 10 · C ___ of 12 · D ___ of 7 · E ___ of 2

Steps not run, or only partly seen, and why:
- ______

Decision: ☐ sign off N1 (acceptance line 7 met: each journey reached every step's shown result)   ☐ steer (write it above)   ☐ defect (step numbers)
