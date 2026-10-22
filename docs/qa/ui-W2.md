# QA script: ui / W2, Workbench: cancel with quote

Rule IDs: WB-4
Branch: feature/ui/W2   Worktree: .claude/worktrees/ui-W2
Commit under test: f8c2268, HEAD on `feature/ui/W2` when this script was revised. The screen and its client landed in
42b57b7 (green) and `src/web/` is unchanged since 5297396. The one later code commit, 46e3e11, changes tests only: it
moves the cancel route's pre-quote honesty check (WB-3) from W1's spec into W2's (note 7).
Record the SHA you test in the sign-off.
App URL: http://localhost:4179   API: http://localhost:5089. W2 is position 9 in `ui.dag.yaml`, so its ports are 4170 + 9
and 5080 + 9. The app proxies `/api/…` to the API port it's given in `DOCKET_API_PORT`.

W2 builds one workbench screen on the live API: quote and cancel (`#/workbench/policies/<reference>/cancel`). It quotes
first, cancels with the quoted date, and compares the quote with the cancellation. Two things on it are not W2's:
the requests-as-sent inspector shows as **not built yet** (WB-7), and so does the policy view's actions region (W1's
screen, unchanged here). So the cancel screen is reached by typing its URL, not from a button on the policy (note 1).

The Actual and Pass/Fail columns are empty. I wrote the steps from the code at f8c2268, the acceptance suite
(`tests/web/e2e/W2/wb-4.spec.ts`) and the recorded answers in `docs/ui/fixture/api/` (the file's number is given), and
I didn't run them (note 5). Where no recording covers an input, the step says to compare with the response in DevTools.

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node W2)

| Tag | Acceptance item |
|---|---|
| AC1 | Cancel quotes first, cancels with the quoted date, and compares quote and cancellation |
| AC2 | A successful cancel is shown; submitting shows one busy Cancel button and its request in flight (g4-defects.md section 3) |

## Preconditions

- [ ] Node 22 and the .NET SDK on `PATH` (`node --version`, `dotnet --version`). Run with: ______
- [ ] `npm --prefix src/web ci` done in this worktree.
- [ ] Nothing listening on 5089 or 4179 (`netstat -ano | grep -E ":(5089|4179) "`, no match).
- [ ] Chrome or Edge with DevTools, a fresh profile or a guest window.
- [ ] Playwright's Chromium installed, for part G (`npx --prefix src/web playwright install chromium`).

Commands are for Git Bash, run from the worktree root, `.claude/worktrees/ui-W2`.

## Run the app on W2's ports

Terminal 1, the API, on a fresh database:

```sh
git status --short; git rev-parse HEAD                  # write both down
rm -f qa-w2.db qa-w2.db-shm qa-w2.db-wal                # a fresh database (*.db is git-ignored)
ASPNETCORE_ENVIRONMENT=Development ConnectionStrings__Policies="Data Source=$(pwd -W)/qa-w2.db" \
  dotnet run --project src/Uinsure.Policies.Api --no-launch-profile --urls http://localhost:5089   # leave it running
```

Terminal 2, the app:

```sh
npm --prefix src/web run trace      # the trail at HEAD -> src/web/public/trace.json, for the rule page a chip opens (step 9)
npm --prefix src/web run build      # copies src/web/public/ into src/web/dist/
DOCKET_API_PORT=5089 npm --prefix src/web run preview -- --port 4179 --strictPort   # leave it running
```

Terminal 3, checks:

```sh
curl -s http://localhost:5089/health/ready; echo                                    # Healthy
curl -s http://localhost:4179/api/health/ready; echo                                # Healthy: the proxy reaches 5089
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5089/policies/QA-W2-PRO   # 404: the database is fresh
for d in -1 0 5 10 14 15 20 30 40 50; do echo "T$d = $(date -d "$d days" +%F)"; done   # the dates below
```

**Dates.** `T` is today on the UK calendar, which is the API's. `T+30` is 30 days later, `T-1` yesterday, and so on.
Type them as `yyyy-MM-dd`: the date field is a text field and sends what you type. Don't run this script across
midnight.

**Day counts.** The API counts the cancellation day as used (CANCEL-1c; recordings 061 and 062). A term that starts on
`T` has 365 days unless it holds a 29 February. Run on or before 2027-02-28 it holds none, and the figures below are the
365-day ones. If your term shows `Days in term` 366, use the figure in brackets.

**Selling a policy for a step.** On `#/workbench/sell` (W1's form), with the reference, start date, amount and payment
method the step gives, one adult policyholder of your choosing and any valid UK address. Expect `201` and the policy
view. Then type the cancel URL the step gives into the address bar.

**DevTools set-up**, as in W1's script:
- *Slow:* Network → throttling → Add… → a custom profile `W2 slow`, latency `4000` ms. Pick `No throttling` afterwards.
- *Blocked:* Network request blocking (⋮ → More tools, "Request conditions" in recent Chrome). Add `*/api/*`, tick it,
  and untick it afterwards.

When you finish, stop both servers with Ctrl+C and run `rm -f qa-w2.db*` and `rm -rf src/web/public`. Neither
`src/web/public/` nor `src/web/test-results/` is git-ignored. Never stage them.

## Steps

### A. Quote first (AC1)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | WB-4 | `#/workbench/sell` | Sell `QA-W2-PRO`: start `T`, amount `365.00`, Card. Then open `#/workbench/policies/QA-W2-PRO/cancel` | The tab reads `Quote and cancel · Docket`. The header: eyebrow `Workbench · Quote and cancel · policy QA-W2-PRO`, title `Quote and cancel`, the question `If I cancel on the date I quoted, is the refund the one I was quoted?`, the answer `Nothing is quoted yet. Quote a date to see the refund before anything is cancelled.` The ids: `Policy status` `Active`, `Policy` `QA-W2-PRO`, `Term 1` `T to <endDate>` (the end the policy view showed) | | |
| 2 | WB-4 | `#/workbench/policies/QA-W2-PRO/cancel` | Look at the Actions region and the three rungs, before typing anything | Actions offers only `Quote this date`: no Cancel button anywhere. Rung 1 `Quote the date` tagged `Not quoted yet`; rung 2 `Cancel on that date` tagged `Waiting for rung 1`; rung 3 `Check they agree` tagged `Waiting for rung 2`. The refund region reads `Nothing quoted yet, so there is no refund to work out.` Problems reads `No problem. These rules can refuse a date here:` with chips CANCEL-3, CANCEL-4 and CANCEL-7 | | |
| 3 | WB-4 | `#/workbench/policies/QA-W2-PRO/cancel` | DevTools Network open. Type `T+30` in `Cancellation date`, press `Quote this date` | One request, `GET /api/policies/QA-W2-PRO/cancellation-quote?cancellationDate=T+30`, answered 200. **No** POST. Rung 1 tagged `Quote returned`, its note `GET /policies/QA-W2-PRO/cancellation-quote?cancellationDate=T+30 answered 200, quotedOn T.` The header answer: `Cancel on T+30 and the refund quoted is 334.00. Nothing is cancelled yet.` (334.09) | | |
| 4 | WB-4 | same | Read `The refund, term by term` | The note `Quote for T+30, rule CANCEL-1c. The days and the refund are the quote's own.` One row for term 1: Rule applied `CANCEL-1c` (a chip), Amount `365.00`, Days used `31`, Unused days `334` (335), Days in term `365` (366), Refund `334.00` (334.09). Total refund `334.00` (334.09). Each figure equals the quote's response body in DevTools | | |
| 5 | WB-4 | same | In terminal 3: `curl -s http://localhost:5089/policies/QA-W2-PRO; echo` | `"status":"Active"` and `"cancellation":null`: the quote changed nothing | | |
| 6 | WB-4 | `#/workbench/sell` | Sell `QA-W2-PRE`: start `T+10`, amount `250.00`, Card. Open `#/workbench/policies/QA-W2-PRE/cancel`, quote `T+5` | Rule `CANCEL-1a` (before the start: full refund), Refund and Total refund `250.00`. The day counts are the quote's own: compare them with the response in DevTools | | |
| 7 | WB-4 | `#/workbench/sell` | Sell `QA-W2-COOL`: start `T`, amount `400.00`, Card. Open `#/workbench/policies/QA-W2-COOL/cancel`, quote `T+14` | Rule `CANCEL-1b` (the last day of cooling-off: full refund), Days used `15`, Unused days `350` (351), Refund `400.00`. As recorded in 061 for start + 14 | | |
| 8 | WB-4 | same | Type `T+15`, press `Quote again` | Rule `CANCEL-1c`, Days used `16`, Unused days `349` (350), Refund `382.47` (382.51). The Cancel button now reads `Cancel on T+15`. As recorded in 062 for start + 15 | | |
| 9 | WB-4 | same | Click the `CANCEL-1c` chip in the refund row | The hash is `#/rules/CANCEL-1c`: U1's rule page for CANCEL-1c. If `npm run trace` failed, that page shows U1's `Could not load` notice naming `trace.json`, which is U1's honest state, not a W2 failure. Press Back | | |

### B. Cancel with the quoted date (AC1, AC2)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 10 | WB-4 | `#/workbench/policies/QA-W2-PRO/cancel` | Reload, quote `T+30` again. Then type `T+40` in the date field, and don't quote | The destructive button still reads `Cancel on T+30`, and the note under the actions `Cancel asks you to confirm, then sends exactly the quoted date, T+30.` Rung 2 carries `Cancellation date T+30`, `carried from rung 1. To change it, quote again.`, tagged `Ready, not sent` | | |
| 11 | WB-4 | same | Press `Cancel on T+30` | A dialog titled `Cancel policy QA-W2-PRO?`: `This cancels policy QA-W2-PRO on T+30, the quoted date. The refund quoted is 334.00. A cancellation cannot be undone.` Buttons `Go back` and `Cancel policy on T+30`. Nothing is sent yet | | |
| 12 | WB-4 | same | Press `Go back` | The dialog closes. No POST in Network. `curl -s http://localhost:5089/policies/QA-W2-PRO; echo` still shows `"cancellation":null` | | |
| 13 | WB-4 | same | Press `Cancel on T+30`, then `Cancel policy on T+30` | One `POST /api/policies/QA-W2-PRO/cancellation`, its request body `{"cancellationDate":"T+30"}` (the quoted date, not the `T+40` still in the field), answered 201 | | |
| 14 | WB-4 | same | Read the page | The header answer: `Cancelled on T+30. The API answered 201, with a total refund of 334.00.` (334.09). Rung 2 tagged `Cancelled`, its note `POST /policies/QA-W2-PRO/cancellation answered 201, cancellationDate T+30.` The Actions region offers neither `Cancel on …` nor `Quote again` | | |
| 15 | WB-4 | same | Read rung 3, `Check they agree` | Tagged `Compared`. `Agree` and `Agree on all 3 compared fields`. Rows `cancellationDate` (T+30 / T+30), `ruleApplied` (CANCEL-1c / CANCEL-1c) and `totalRefund` (334.00 / 334.00), each `Agrees`. Two rows on one side only: `quotedOn` (T, the quote's) and `refunds[0].reference` (a `REF-…`, the cancellation's, equal to the 201's body) | | |
| 16 | WB-4 | `#/workbench/policies/QA-W2-PRO` | Open the policy view | Status `Cancelled`; the timeline's cancellation on `T+30`, `CANCEL-1c`, total refund `334.00`; one refund with the same `REF-…`, to Card | | |

### C. Refusals (AC1)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 17 | WB-4 | `#/workbench/policies/QA-W2-COOL/cancel` | Reload. Quote `T-1` | `422`. Problems shows the API's problem: title `Cancellation date in the past`, detail `The cancellation date cannot be in the past.`, a CANCEL-3 chip (as recorded in 074). Rung 1 tagged `No quote`. No Cancel button | | |
| 18 | WB-4 | same | Quote the day after `Term 1`'s end date (the header's) | `422`, title `Cancellation date after the end of cover`, detail `The cancellation date must be on or before the end of cover, <endDate>.`, a CANCEL-7 chip (as in 079). No Cancel button | | |
| 19 | WB-4 | same | Clear the date field and press `Quote this date` | The API's own answer, shown from its problem details: compare the title, status and detail with the response in DevTools. No Cancel button. (A quote without a date is a 400 in 080; the client sends the field as typed) | | |
| 20 | WB-4 | `#/workbench/sell` | Sell `QA-W2-RACE`: start `T+10`, amount `300.00`, Card. Open `#/workbench/policies/QA-W2-RACE/cancel`, quote `T+20`. Then in terminal 3: `curl -s -X POST http://localhost:5089/policies/QA-W2-RACE/cancellation -H "content-type: application/json" -d '{}'; echo` | The curl answers `201` with `"cancellationDate":"T"` and `"ruleApplied":"CANCEL-1a"`. The page still offers `Cancel on T+20`: it doesn't know yet | | |
| 21 | WB-4 | same | Press `Cancel on T+20`, then `Cancel policy on T+20` | `409`. Problems: `Policy already cancelled`, detail `The policy was already cancelled on T.`, a CANCEL-4 chip (as in 076). Rung 2 tagged `Refused`. Rung 3 still `Waiting for rung 2`, and no `Agree` or `Differ` verdict anywhere | | |
| 22 | WB-4 | `#/workbench/policies/QA-W2-PRO/cancel` | Reload (QA-W2-PRO was cancelled in step 13). Status reads `Cancelled`. Quote `T+50` | `409`, `Policy already cancelled`, a CANCEL-4 chip (as in 077). No Cancel button | | |
| 23 | WB-4 | `#/workbench/policies/QA-W2-NONE/cancel` | Open it (no such policy), then quote `T+5` | Before the quote: `Policy status` and `Term 1` read `not returned`, never a default. The quote answers `404`, shown from its problem details: compare with DevTools | | |

### D. Busy and in flight (AC2)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 24 | WB-4 | `#/workbench/sell` | Sell `QA-W2-SLOW`: start `T+10`, amount `300.00`, Card. Open `#/workbench/policies/QA-W2-SLOW/cancel`, type `T+20`. Pick `W2 slow`, press `Quote this date` | For about 4 s: the button reads `Quoting…`, is disabled and carries `aria-busy="true"` (Elements panel); the field keeps `T+20`; rung 1 shows busy (`Asking for the quote`); the header answer reads `Not known yet. The quote is in flight, so no refund is shown until the API answers.` Then the quote lands (`CANCEL-1b`, `300.00`) | | |
| 25 | WB-4 | same | Still on `W2 slow`: press `Cancel on T+20`, then `Cancel policy on T+20`, and click that busy button twice more | For about 4 s: **one** busy Cancel button, `Cancelling…` with the kit spinner, disabled, `aria-busy="true"` and `aria-disabled="true"`. Under the actions: `In flight: POST /policies/QA-W2-SLOW/cancellation. Waiting for the API to answer.` Rung 2 tagged `In flight`. Network shows **one** POST. Then `201`, the dialog closes and rung 3 reads `Agree on all 3 compared fields`. Pick `No throttling` | | |
| 26 | WB-4 | `#/workbench/policies/QA-W2-COOL/cancel` | Reload. Tick *Blocked*, quote `T+20` | Problems: `The API did not answer`, `No request was completed. Nothing was changed by this screen.`, an `error` line with the browser's reason, and a Retry button. Untick *Blocked*, press Retry: the quote lands (`CANCEL-1b`, `400.00`) | | |

### E. What isn't W2's

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 27 | WB-4 | `#/workbench/policies/QA-W2-COOL/cancel` | Scroll to the end of the page | The last region, `the requests as sent (inspector)`, reads **not built yet** (WB-7) | | |
| 28 | WB-4 | `#/workbench/policies/QA-W2-COOL` | Open the policy view | Its actions region (`actions: quote and cancel, record a claim, renew`) still reads **not built yet**: no link from the policy to the cancel screen (note 1) | | |

### F. Keyboard, themes, widths

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 29 | WB-4 | `#/workbench/policies/QA-W2-COOL/cancel` | Reload. Using only the keyboard: Tab to `Cancellation date`, type `T+20`, Tab to `Quote this date`, Enter; Tab to `Cancel on T+20`, Enter; in the dialog Tab between its buttons and press `Go back` | Each stop shows a focus ring; the field has its label and the hint `Format yyyy-MM-dd, …`; the dialog takes focus while open and gives it back when it closes. Needs eyes: axe and the focus tests are in step 33 | | |
| 30 | WB-4 | same | Toggle the theme (dark, then light), and narrow the window to 390 px, with a quote shown | Legible in both themes; at 390 no sideways scroll of the page (the worked sum's table may scroll inside its own frame) | | |

### G. The acceptance suite: what the running app can't show

First stop the API and the preview (Ctrl+C in terminals 1 and 2), and run `rm -rf src/web/public`, so the suite builds
the app as the gates did. The suite starts its own API on 5089 with its own fresh database, and builds and previews the
app on 4179. It stops before any test if an API it didn't start already answers on 5089.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 31 | WB-4 | shell | `DOCKET_API_PORT=5089 DOCKET_APP_PORT=4179 npm --prefix src/web run e2e -- W2/ --grep "WB-[34] · "` | All passed, 0 failed, 0 skipped (27 by my count: 26 `WB-4 · ` tests and the one `WB-3 · ` cancel test, note 7). This includes the cases the running app can't make: a cancellation whose `totalRefund` differs from the quote's by 1.00 reads `Differ on 1 of 3 compared fields: totalRefund`, with `ruleApplied` still `Agrees`; and a request held exactly in flight (steps 24 and 25 only delay it) | | |
| 32 | WB-4 | shell | `npm --prefix src/web run test -- -t "WB-4 · "` | All passed: the client's quote and cancel on the recorded responses, handing back the API's answer as it came | | |
| 33 | WB-4 | shell | The step-31 run's axe tests: `… run e2e -- W2/ --grep "WB-4 · the cancel screen, "` | 3 passed: quoted, asking to confirm, and cancelled and compared, each with no axe violation light and dark, at 1440 and 390 | | |
| 34 | WB-4 | shell | The parity tests: `… run e2e -- W2/ --grep "WB-4 · parity: "` | 9 passed: the populated, submitting, error and unreachable states keep the regions of `docs/ui/derived/W2/wb-cancel/` in order; the four built regions carry its components; colours from tokens only, light and dark | | |
| 35 | WB-4 | shell | `DOCKET_API_PORT=5089 DOCKET_APP_PORT=4179 npm --prefix src/web run e2e -- regression/wb-cancel.spec.ts` | 16 passed (4 states × 2 widths × 2 themes) against `docs/ui/baselines/wb-cancel/`. Before the trace step those baselines are in the worktree but not yet committed (note 4) | | |
| 36 | WB-4 | shell | `DOCKET_API_PORT=5089 DOCKET_APP_PORT=4179 npm --prefix src/web run e2e -- W1/ regression/ --workers=2` | W1's flows all pass, including its `screens W1 does not build` cases, now renew and record a claim only (note 7). Every earlier screen's baseline holds except two: `activity` at 1440, light and dark, which also failed in the orchestrator's all-e2e gate at f576e09 and are already U7 acceptance lines, not W2's. Record the run's pass and fail counts and the failing titles | | |

## Notes

1. **No way in from the policy.** The policy view's actions region is W1's screen and still reads not built yet, and
   no W2 task names it. So the cancel screen is reached only by its URL. If David reads WB-4 ("Quote, then cancel") as
   needing a Cancel action on the policy, that's a steer for a later node (W3 builds the other actions), not a W2 defect.
2. **The quoted date is the one sent.** The screen keeps the date it quoted beside the quote, and Cancel sends that,
   never the field's later text (steps 10 and 13). To cancel on another date, quote again.
3. **The comparison counts three fields.** `cancellationDate`, `ruleApplied` and `totalRefund` are on both sides.
   `quotedOn` is the quote's only and `refunds[0].reference` the cancellation's only, so they're shown but not counted.
   Per-term day counts aren't compared: the cancellation's terms equal the quote's in the recordings (068), but the
   screen doesn't set them side by side.
4. **Baselines.** `docs/ui/baselines/wb-cancel/` is in the worktree, written by the orchestrator, and is committed at
   the trace step (t10). Step 35 compares against the files present when you run it.
5. **I didn't run these steps.** `npm run build` writes `src/web/dist/`, `npm run trace` writes `src/web/public/` and
   the API writes a database file, all outside my write scope. The expected words are the code's at f8c2268 and the
   recordings named in each row. Values that move with the clock (`T`, `<endDate>`, the `REF-` and `PAY-` references)
   are given as what to compare against, not as fixed text. The figures in steps 3, 4, 7 and 8 are my arithmetic from
   CANCEL-1c's interpretation (amount × unused days ÷ days in term, the cancellation day used, 2 dp half away from zero),
   checked against 061 and 062. If the screen and DevTools agree with each other but not with my figure, the figure is
   wrong, not the screen.
6. **The test count in step 31** is mine, from the spec file: 17 `WB-4 · ` flow, busy and axe tests, 9 parity tests,
   and the `WB-3 · ` cancel honesty test, 27 in all, as the orchestrator's W2 e2e gate ran. Record the number the run
   prints.
7. **The cancel route's honesty check moved to W2 (steps 31 and 36).** Until 46e3e11, W1's
   `tests/web/e2e/W1/wb-3.spec.ts` (`screens W1 does not build`) opened the cancel route on a sold policy and asserted
   `not built yet`, no request and no date, which W2's built screen contradicts: it reads the policy on open and shows
   `Term 1`'s dates. 46e3e11 (W2 finding A1/I1) took the cancel case out of W1's loop, leaving renew and record a claim
   with their assertions unchanged, and added `WB-3 · the cancel route, before Quote is pressed, shows no canned value
   and no other policy's reference` to `tests/web/e2e/W2/wb-4.spec.ts`. That test checks the screen as built: the
   route's own reference and term start, as the API returned them; no recorded-fixture reference and no other live
   policy's; no `answered NNN`, no alert, and no rule chip but the Problems region's standing CANCEL-3, CANCEL-4 and
   CANCEL-7; no cancellation-quote or cancellation request. It isn't a W2 rule (WB-4), so step 31's filter names
   both. The removal of W1's cancel case is a test edit after red, logged by the investigator for you to read at
   pause 2.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: ___ of 36 · Steer (if any): ______

Steps not run, or only partly seen, and why:
- ______

Decision: ☐ sign off W2 (WB-4)   ☐ steer (write it above)   ☐ defect (step numbers)
