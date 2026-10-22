# QA script: ui / W1, Workbench: sell, policy view and problem details

Rule IDs: WB-1, WB-2, WB-3, WB-6, WB-9, BUSY-1, A11Y-1
Branch: feature/ui/W1   Worktree: .claude/worktrees/ui-W1
Commit under test: fe6117a. That was HEAD on `feature/ui/W1` when this script was revised, after the rebase onto U1
(`origin/ui` at fa18658), attempt 4's reviewer and security verdicts (both PASS) and the integrate gate at that head.
This script's own commit changes only this file. Record the SHA you test in the sign-off.

The first version (a9bced1) was written at t10 against the pre-rebase head 8ed2ccf, which isn't on this branch. The
rebase brought U1's routes and nav into the shell (`app/shell/App.tsx`, `app/shell/Frame.tsx`), so this revision
re-checks every step that touches the shell against fe6117a: the nav (step 1), a rule chip's link (step 38, note 4),
the not-built routes (step 54), the footer (note 7) and the earlier nodes' suites (step 68). W1's own screens and
client are unchanged by the rebase, so the other steps stand as written.
App URL: http://localhost:4178   API: http://localhost:5088. W1 is position 8 in `ui.dag.yaml`, so its ports are 4170 + 8
and 5080 + 8. The app proxies `/api/…` to the API port it's given in `DOCKET_API_PORT`.

W1 builds three workbench screens on the live API: the workbench home (`#/workbench`), the sell form
(`#/workbench/sell`) and the policy view (`#/workbench/policies/<reference>`). Cancel, renew and record a claim are
out of W1's scope (W2 and W3). Their routes (`…/cancel`, `…/renew`, `…/claims/new`) and the policy view's actions
region show as **not built yet** (inv-006, I1). The request log (`wb-requests`) and the sell form's request inspector
aren't built either.

The Actual and Pass/Fail columns are empty. I wrote the steps from the code and the acceptance suite at fe6117a,
and I didn't run them. Starting the API and building the app both write outside my write scope (note 6). The API's
exact words are quoted from the recorded answer for the same input in `docs/ui/fixture/api/` (the file's number is
given). Where no recording covers an input, the step says to compare with the response in DevTools.

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node W1)

| Tag | Acceptance item |
|---|---|
| AC1 | With the API on port 5080, the sell form sells a policy and opens its policy view, with the dates the API returns (this script runs the API on W1's port, 5088) |
| AC2 | A 400 or 422 shows the problem details against each field; send anyway sends the body as typed and shows the API answer |
| AC3 | A running request shows busy; recent policies in this browser are listed on the workbench home |
| AC4 | A submitting form shows its request in flight; a field error never sits beside a valid value; the home's reference input has a label; a policy link opens that policy (g4-defects.md section 3) |

## Preconditions

- [ ] Node 22 and the .NET SDK on `PATH` (`node --version`, `dotnet --version`). Run with: ______
- [ ] `npm --prefix src/web ci` done in this worktree.
- [ ] Nothing listening on 5088 or 4178 (`netstat -ano | grep -E ":(5088|4178) "`, no match).
- [ ] Chrome or Edge with DevTools. Use a **fresh profile or a guest window** for parts A to H. Local storage is
      kept per origin, so `http://localhost:4178` must start with none (part A checks this).
- [ ] Playwright's Chromium installed, for part I (`npx --prefix src/web playwright install chromium`).

Commands are for Git Bash, run from the worktree root, `.claude/worktrees/ui-W1`.

## Run the app on W1's ports

Terminal 1, the API, on a fresh database:

```sh
git status --short; git rev-parse HEAD                  # write both down
rm -f qa-w1.db qa-w1.db-shm qa-w1.db-wal                # a fresh database (*.db is git-ignored)
ASPNETCORE_ENVIRONMENT=Development ConnectionStrings__Policies="Data Source=$(pwd -W)/qa-w1.db" \
  dotnet run --project src/Uinsure.Policies.Api --no-launch-profile --urls http://localhost:5088   # leave it running
```

Terminal 2, the app:

```sh
npm --prefix src/web run trace      # the trail at HEAD -> src/web/public/trace.json, for U1's rule page (step 38)
npm --prefix src/web run build      # copies src/web/public/ into src/web/dist/
DOCKET_API_PORT=5088 npm --prefix src/web run preview -- --port 4178 --strictPort   # leave it running
```

Terminal 3, checks and setup:

```sh
curl -s http://localhost:5088/health/ready; echo                                    # Healthy
curl -s http://localhost:4178/api/health/ready; echo                                # Healthy: the proxy reaches 5088
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5088/policies/QA-W1-SOLD  # 404: the database is fresh
for d in -1 0 10 30 60 61; do echo "T$d = $(date -d "$d days" +%F)"; done           # the dates below
```

**Dates.** `T` is today on the UK calendar, which is the API's (SELL-2). `T+30` is 30 days later, `T-1` yesterday, and
so on. Type them as `yyyy-MM-dd`. Don't run this script across midnight.

**DevTools set-up, used in several steps:**
- *Slow:* Network → throttling menu → Add… → a custom profile named `W1 slow`, with latency `4000` ms. Pick it to
  hold a request in flight for 4 seconds, and pick `No throttling` afterwards.
- *Blocked:* the request-blocking panel (⋮ → More tools → Network request blocking, called "Request conditions"
  in recent Chrome). Add the pattern `*/api/*` and tick it, and untick it afterwards. A blocked request fails in the
  browser, so it's the way to see the API give no answer.

If `npm run trace` exits 1, write down what it lists and carry on: W1's screens don't read `trace.json`, and notes 4
and 7 say what steps 38 and the footer show then.

When you finish, stop both servers with Ctrl+C and run `rm -f qa-w1.db*` and `rm -rf src/web/public`. Neither
`src/web/public/` nor `src/web/test-results/` is git-ignored. Never stage them.

## Steps

### A. The workbench home in a fresh browser (WB-9, WB-2, WB-3)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | WB-9 | `#/` → `#/workbench` | Open http://localhost:4178/, then click `Workbench` in the primary nav | the workbench home opens. The tab reads `Workbench · Docket`. The nav's Workbench entry is marked current (Elements: `aria-current="page"`), and no other entry is. The nav's links, in order: `Overview`, `Requirements matrix` (U1's), `How to read this` and `Workbench`. `Plan` and `Human decisions` are drawn as not built yet, not as links. The header `Workbench` carries the question "Which policy do you want to work on?" and a `Live` tag. Under it are four sections, in this order: `Open a policy by reference`, `Request status`, `Sell a new policy` and `Recent policies in this browser` | | |
| 2 | WB-9 | `#/workbench` | Read the recent policies section | `This browser only.` and the scope line, then the empty state `No policy has been sold or opened in this browser yet`, with "A reference appears here after you sell a policy or open one by its reference." There's no list. Application → Local Storage → `http://localhost:4178` has no `workbench.recent` key | | |
| 3 | WB-2 | `#/workbench` | Click the words `Policy reference` above the input. Leave it empty and press `Open policy` | clicking the label puts focus in the input: it is that input's visible label. The empty open shows `Type a policy reference.` under the field, and the Network panel shows no request. Request status still reads `Idle. No request sent. …` | | |
| 4 | WB-3 | `#/workbench` | Type `QA-W1-NONE`, press `Open policy` | the page stays on the home. Network shows `GET /api/policies/QA-W1-NONE` → 404. Request status shows a banner titled `Policy not found`, with a `404` tag, a `GET-1` rule chip and `No policy with reference 'QA-W1-NONE'.` (the words recorded in 053). The header's live note reads `GET /policies answered 404`. The field still holds `QA-W1-NONE` | | |
| 5 | WB-9 | `#/workbench` | Reload | the recent list is still empty: a reference the API has no policy for is never listed | | |

### B. Selling a policy and opening it (WB-1, BUSY-1, WB-9, WB-2)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 6 | WB-1 | `#/workbench` → `#/workbench/sell` | Click `Sell a new policy` | the sell form opens. The tab reads `Sell a policy · Docket` and Workbench stays current in the nav. The defaults are: Type `Buy to let`, Payment method `Card`, Auto-renew off, Send anyway off. There's one policyholder (`1 of 3 policyholders`) with no Remove button. The preview reads `As typed nothing yet` and `Type a reference to see it here.`, with the tag `Nothing typed`. Problems reads `None yet. …`. The last region, `the request as sent (inspector)`, says "not built yet" | | |
| 7 | WB-1 | `#/workbench/sell` | Type `  qa-w1-sold ` (two spaces in front, one after) into Policy reference | the preview's `As typed` shows `"  qa-w1-sold "`, and `As the API will store it` shows `QA-W1-SOLD` with the tag `Valid` and "Matches A to Z, 0 to 9 and hyphen, 3 to 20 characters." | | |
| 8 | WB-1 | `#/workbench/sell` | Replace it with each of these in turn: `w1a`, then `w1-twenty-characters` (20 characters) | each is upper-cased in the preview and tagged `Valid`: 3 and 20 characters are both inside SELL-1's pattern | | |
| 9 | WB-1 | `#/workbench/sell` | Replace it with each of these in turn: `w1`, then `w1-twentyone-charactr` (21), then `qa_w1` | each is tagged `Invalid pattern`, with "The API would answer 400. …" and the reason: `Too short: 2 of at least 3 characters.`, `Too long: 21 of at most 20 characters.` and `Not allowed: "_".` | | |
| 10 | WB-1 | `#/workbench/sell` | Press `Add another policyholder` twice. Type a first name into Policyholder 2, then press `Remove` on Policyholder 3 | after the first add: `2 of 3 policyholders`, and both have a Remove button. After the second: `3 of 3 policyholders`, and the add button is gone. After the remove: two policyholders, and Policyholder 2 still holds the name you typed | | |
| 11 | WB-1 | `#/workbench/sell` | Reload, then fill in: reference `  qa-w1-sold `, `Household`, start `T+60`, amount `527.18`, `Direct Debit`, Auto-renew on. Policyholder 1 `Ada` `Lovelace` `1985-12-10`, then add Policyholder 2 `Edsger` `Dijkstra` `1979-05-11`. Address line 1 `12 Mill Lane`, line 2 `Floor 2`, line 3 left empty, postcode `M15 4PS`. Leave Send anyway off. Choose the `W1 slow` throttling profile, then press `Sell this policy` | (see the next steps) | | |
| 12 | BUSY-1 | `#/workbench/sell` | While the request is held (4 s) | the button reads `Selling…` with a spinner, and is disabled. Elements: the button carries `aria-busy="true"` and `aria-disabled="true"`. Under it is `In flight: POST /policies. Waiting for the API to answer.` The header answer reads `Not known yet. POST /policies is in flight, …`, and Problems reads `None yet. The request is in flight, …`. Every field still holds what you typed | | |
| 13 | BUSY-1 | `#/workbench/sell` | Still in flight: press the button again, and press Enter in Postcode | nothing more is sent. When the answer comes, Network shows exactly **one** `POST /api/policies` | | |
| 14 | BUSY-1 | `#/workbench/sell` | Wait for the answer. Then pick `No throttling` | the button reads `Sell this policy` again, enabled, and `aria-busy` and `aria-disabled` are gone. The result appears (step 16) | | |
| 15 | WB-1 | `#/workbench/sell` | Network → the `POST /api/policies` → Payload | every field, as typed: `"reference":"  qa-w1-sold "` (spaces and case kept, because the form doesn't normalise), `"type":"Household"`, `"startDate":"<T+60>"`, `"amount":527.18`, `"autoRenew":true`, `"paymentMethod":"DirectDebit"`, both policyholders in order, and `"addressLine3":null` (an empty line is sent as null). The response is `201` | | |
| 16 | WB-1 | `#/workbench/sell` | Read the header and Problems | eyebrow `Workbench · Sell a policy · policy QA-W1-SOLD`. Answer: `The API answered 201: QA-W1-SOLD is stored as Pending, term 1 from <T+60> to <endDate>, paid by DirectDebit for 527.18.`, where `<endDate>` is the 201 body's `endDate`. Problems: `None. The API answered 201 and returned no problems.` and a link `Open policy QA-W1-SOLD`. The API stored the reference the preview showed before the sale, `QA-W1-SOLD` | | |
| 17 | WB-9 | `#/workbench` | Click `Workbench` in the nav (don't open the policy yet). Then Application → Local Storage | the list `References, newest first` holds one entry: `QA-W1-SOLD`, as a link, with a glyph and the word `Sold`. `workbench.recent` is `[{"reference":"QA-W1-SOLD","how":"sold"}]` | | |
| 18 | WB-9 | `#/workbench` → `#/workbench/policies/QA-W1-SOLD` | Click `QA-W1-SOLD` in the recent list | that policy's view opens, not another. The `<h1>` is `Policy QA-W1-SOLD` | | |
| 19 | WB-2 | `#/workbench/policies/QA-W1-SOLD` | Read the header and `Current term`, against Network → `GET /api/policies/QA-W1-SOLD` → Response | the tab reads `Policy · Docket`. Eyebrow `Workbench · Policy · QA-W1-SOLD`. A status tag with a glyph and the API's word `Pending`. IDs: Policy `QA-W1-SOLD`, Type `Household`, and `Term 1` `<T+60> to <endDate>`. Answer: `Pending. Term 1 runs <T+60> to <endDate>, with 1 payment, 0 refunds and 0 claims.` Current term: `1`, `<T+60>`, `<endDate>`, `527.18`, Has claims `false`, Auto renew `true`. Each value is the response's own | | |
| 20 | WB-2 | `#/workbench/policies/QA-W1-SOLD` | Read `Terms timeline` | caption `Dates for QA-W1-SOLD, oldest first. Only dates the API returned. …`. Rung #1, `Term 1 starts`: `<T+60>`, `527.18`, `Paid`, then `DirectDebit`, the payment's `PAY-…` reference and `527.18`. Rung #2, `Term 1 ends`: `<endDate>`. Then the note `The response holds no claim and no cancellation, so the timeline has no rung for either.` No cooling-off or renewal window is drawn or shaded | | |
| 21 | WB-2 | `#/workbench/policies/QA-W1-SOLD` | Ctrl+F each `yyyy-MM-dd` on the page, and compare with the GET response | every date shown is in the response: the start, the end and the two dates of birth. Today's date doesn't appear, and no other date does either | | |
| 22 | WB-2 | `#/workbench/policies/QA-W1-SOLD` | Read `Policyholders and property` | the table caption reads `Policyholders on QA-W1-SOLD, numbered in the order the API returned them. 2 policyholders.`, with rows #1 Ada Lovelace 1985-12-10 and #2 Edsger Dijkstra 1979-05-11. Property: `12 Mill Lane`, `Floor 2`, Address line 3 `null: the API returned none`, `M15 4PS` | | |
| 23 | WB-2 | `#/workbench/policies/QA-W1-SOLD` | Read `Payments and refunds`, `Claims` and `Cancellation` | Payments: one row, with the `PAY-…` reference, `DirectDebit` and `527.18`. Refunds: `The API returned no refunds for QA-W1-SOLD.` Claims: `The API returned no claims for QA-W1-SOLD.`, with the caption ending `(hasClaims is false)`. Cancellation: `Summary, from the GET` reads `cancellation is null: this policy has not been cancelled` | | |
| 24 | WB-3 | `#/workbench/policies/QA-W1-SOLD` | Read `Record-level problem`, then the last two regions | a `200` tag and `GET /policies/QA-W1-SOLD answered 200, so there is no problem to show.` Then `actions: quote and cancel, record a claim, renew` and `requests that touched this policy`, each marked "not built yet". Those are W2's, W3's and the request log's | | |
| 25 | WB-9 | `#/workbench` | Back to the home | `QA-W1-SOLD` is still the one entry, now with the word `Opened`. The list keeps one entry per reference, with the last thing this browser did with it (note 2) | | |
| 26 | BUSY-1 | `#/workbench` | Pick `W1 slow`. Type ` qa-w1-sold ` (spaces, lower case) and press `Open policy` | while it's held, the button reads `Opening…` with a spinner, disabled, with `aria-busy="true"` and `aria-disabled="true"`. The reference input is disabled and still holds what you typed. The line above it reads `Opening qa-w1-sold. The reference and the button are locked until the API answers.` Request status reads `In flight: GET /policies/qa-w1-sold. Waiting for the API to answer.` | | |
| 27 | WB-2 | `#/workbench` → `#/workbench/policies/QA-W1-SOLD` | Wait for the answer, then pick `No throttling` | the view opens at `#/workbench/policies/QA-W1-SOLD`, with the reference as the API wrote it (upper case, trimmed), and shows step 19's values | | |

### C. Three policyholders, Buy to let, a start today (WB-1, WB-2)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 28 | WB-1 | `#/workbench/sell` | Sell `QA-W1-THREE`: `Buy to let`, start `T`, amount `412.34`, `Card`, Auto-renew off. Policyholders Ada Lovelace `1985-12-10`, Edsger Dijkstra `1979-05-11` and `Barbara` `Liskov` `1972-11-07`. Address line 1 `7 Canal St`, lines 2 and 3 empty, postcode `M4 6BX` | the payload has `"type":"BuyToLet"`, `"paymentMethod":"Card"`, `"autoRenew":false`, three policyholders in order, and `"addressLine2":null,"addressLine3":null`. The answer is `201`, and the header says `… is stored as Active, term 1 from <T> to …`. A start today is inside the window | | |
| 29 | WB-1 | `#/workbench/sell` → `#/workbench/policies/QA-W1-THREE` | Click `Open policy QA-W1-THREE` | the policy view opens on that policy. Status `Active`. The policyholders table lists all three in the order the API returned them (`3 policyholders.`), and Address lines 2 and 3 read `null: the API returned none` | | |

### D. Send anyway and the API's problems (WB-6, WB-3)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 30 | WB-6 | `#/workbench/sell` | Reload. Fill a valid form (as in step 28, one policyholder, start `T+30`) but with reference `qa_w1_bad`. Send anyway off. Press Sell | Network: nothing is sent. Focus moves to an alert, `There is a problem`, listing `A reference is 3 to 20 letters, digits or hyphens.` as a link, with a `SELL-1` chip. The same message sits under Policy reference, which has `aria-invalid="true"`. Header: `Nothing was sent. The form's own checks caught a problem: …`, with the live note `not sent: the form's own checks stopped the request` | | |
| 31 | WB-6 | `#/workbench/sell` | Turn `Send anyway` on. Press Sell | the notice `Send anyway is on. This form's checks are off. …` appears, and the policyholder count reads `1 of 4 policyholders` (note 3). Network: one POST whose payload carries `"reference":"qa_w1_bad"` exactly as typed. The answer is `400`. The summary lists the API's `The reference must be 3 to 20 characters: letters, digits or hyphens.` (recorded in 018) with the key `reference`, linked to Policy reference, and the same words sit under that field | | |
| 32 | WB-6 | `#/workbench/sell` | Turn Send anyway off. Set a valid reference `QA-W1-WIN`, and set the start to `T+61`. Press Sell | nothing is sent. The summary lists `The start date is from today to 60 days ahead.` with a `SELL-2` chip, and Start date is marked. T+60 sold in step 11, so the form's window ends exactly at T+60 | | |
| 33 | WB-3 | `#/workbench/sell` | Still `QA-W1-WIN`: start `T-1`, amount `0`. Add Policyholder 2 `Charles` `Babbage` `2016-01-01`. Turn Send anyway on. Press Sell | the payload carries `T-1`, `0` and both policyholders as typed. The answer is `422`. The summary lists one entry per entry in the response's `violations`, in that order, each with the API's `detail`, its rule chip and the words `whole request`. The expected rules are SELL-2 (`The start date must be between <T> and <T+60>.`), SELL-5 (`Policyholder 2 must be 16 or older on the start date.`) and SELL-7 (`The policy amount must be greater than 0.`). No field is marked, because the API named none. Header: `Nothing was stored. The API answered 422, <the response's title>.` | | |
| 34 | WB-6 | `#/workbench/sell` | Read the send anyway region | `The API answered 422 with 3 violations.` A table, `Each violation, beside the client check that would have caught it`: SELL-2 beside `The start date is from today to 60 days ahead.`, SELL-5 beside `None: only the API decides this`, and SELL-7 beside `The amount must be above 0.` Each row holds the API's words | | |
| 35 | WB-6 | `#/workbench/sell` | Turn Send anyway off, keeping the values. Press Sell | nothing is sent. The form's own checks are back: the summary lists the SELL-2 and SELL-7 messages. The API's 422 table is gone | | |
| 36 | WB-6 | `#/workbench/sell` | Still off: fix the start to `T+30`, the amount to `300.00`, and Policyholder 2's date of birth to `1990-01-01`. Add a third policyholder (any name, `1980-02-02`) | `3 of 3 policyholders`, with no add button. With the checks on, the form stops at three | | |
| 37 | WB-6 | `#/workbench/sell` | Turn Send anyway on, press `Add another policyholder`, and fill Policyholder 4 `Radia` `Perlman` `1988-01-18`. Press Sell | a fourth policyholder with its own fields. The payload carries all four. The answer is `422`, and the summary and the table list SELL-4, `A policy needs 1 to 3 policyholders.` (recorded in 024), beside the client check `A policy has 1 to 3 policyholders.` | | |
| 38 | WB-3 | `#/workbench/sell` → `#/rules/SELL-4` | Click the `SELL-4` chip in the summary | the URL becomes `#/rules/SELL-4`, and U1's rule page for SELL-4 opens, not the not-built page. The tab reads `Rule · Docket`. The nav marks `Requirements matrix` as current, and `Workbench` no longer is. Breadcrumbs `Overview › Requirements matrix › SELL-4`, and the title `SELL-4 1 to 3 policyholders` (`docs/requirements.md:60`). The rest of that page is U1's to check (note 4) | | |
| 39 | WB-3 | `#/workbench/sell` | Reload. Sell `QA-W1-YOUNG` with a valid form, but Policyholder 1 born `2016-01-01`. Send anyway off | the form has no age check, so it sends. The answer is `422`, and the summary lists `Policyholder 1 must be 16 or older on the start date.` (recorded in 025) with a `SELL-5` chip and `whole request`. No send-anyway table is shown, because the switch is off | | |
| 40 | WB-3 | `#/workbench/sell` | Reload. Sell `QA-W1-FIX` with a valid form (start `T+30`) but amount `527.185`. Send anyway off | the form has no decimal-places check, so it sends. The answer is `400`. The summary lists `The amount must be at most 1,000,000.00 with no more than 2 decimal places.` (recorded in 042) with the key `amount`. Amount alone has `aria-invalid="true"`, with the same words under it. No field holding a valid value carries an error | | |
| 41 | WB-3 | `#/workbench/sell` | Click that summary entry | focus moves into the Amount field, and the URL stays `#/workbench/sell` | | |
| 42 | WB-3 | `#/workbench/sell` | Change the amount to `527.18`, press Sell | `201`. No field is marked, there's no `There is a problem` alert, and Problems reads `None. … Open policy QA-W1-FIX` | | |
| 43 | WB-6 | `#/workbench/sell` | Reload. Fill a valid form, reference `QA-W1-NODATE`, with Start date left empty. Turn Send anyway on, press Sell | the payload carries `"startDate":""`, as typed. The answer is `400`. The summary lists each message in the response's `errors`, with its key. The start-date message links to Start date, and Start date is the only field marked. Compare the words with Network → Response: no recording covers an empty string | | |
| 44 | WB-3 | `#/workbench/sell` | Reload. Sell `qa-w1-sold` (lower case) with a valid form, Send anyway off | `409`. A banner titled `Policy reference already exists`, with a `409` tag, a `SELL-1` chip and `A policy with reference 'QA-W1-SOLD' already exists.` (the words recorded in 014). Header: `Nothing was stored. The API answered 409, Policy reference already exists.` | | |
| 45 | WB-9 | `#/workbench` | Open the home | the list is, newest first: `QA-W1-FIX` Sold, `QA-W1-THREE` Opened, `QA-W1-SOLD` Opened. None of the refused sales (`qa_w1_bad`, `QA-W1-WIN`, `QA-W1-YOUNG`, `QA-W1-NODATE`, the 409) is listed | | |

### E. No answer from the API (BUSY-1, WB-3)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 46 | BUSY-1 | `#/workbench/sell` | Turn *Blocked* on. Sell `QA-W1-OFFLINE` with a valid form | a banner, `The API did not answer`, with a `No response` tag and `No request was completed. Nothing was changed by this screen.`, an `error` line (Chrome: `Failed to fetch`) and a `Try again` button. The Sell button reads `Sell this policy` again, enabled, with no `aria-busy`. Every field still holds what you typed | | |
| 47 | BUSY-1 | `#/workbench/sell` | Turn *Blocked* off and press `Try again` | the button shows `Selling…` while it runs, then the `201` result for `QA-W1-OFFLINE` | | |
| 48 | BUSY-1 | `#/workbench` | Turn *Blocked* on. Open `QA-W1-SOLD` from the home | Request status shows the same `The API did not answer` banner with `Try again`. `Open policy` is enabled again, and the field still holds `QA-W1-SOLD`. Turn *Blocked* off and press `Try again`: `Opening…`, then the policy view | | |
| 49 | WB-3 | `#/workbench/policies/QA-W1-SOLD` | Stop the API (Ctrl+C in terminal 1), then reload the policy view | the preview's proxy answers `502` with an empty text body (Network). The page shows a banner `The API answered 502` with a `502` tag, and no rule chip, because the API named none. Header: `The API answered 502, so no status, term, date or amount is shown: none was returned.` No date appears on the page. Then restart the API with the `ASPNETCORE_ENVIRONMENT=…` line only (not `rm`), so the database is kept | | |

### F. A policy that was cancelled, and one with a claim (WB-2)

Cancelling and recording a claim are W2's and W3's screens, so the setup goes straight to the API.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 50 | WB-2 | `#/workbench/sell` | Sell `QA-W1-CXL` (start `T+10`, amount `250.00`, Card) and `QA-W1-CLAIM` (start `T`, amount `300.00`), each with a valid form. Then in terminal 3: `curl -s -X POST http://localhost:5088/policies/QA-W1-CXL/cancellation -H "content-type: application/json" -d '{}'; echo` and `curl -s -X POST http://localhost:5088/policies/QA-W1-CLAIM/claims -H "content-type: application/json" -d "{\"claimDate\":\"$(date +%F)\",\"description\":\"Escape of water from the boiler\"}"; echo` | two `201`s. The cancel prints `"ruleApplied":"CANCEL-1a"` and `"totalRefund":250.00` or `250` (a cancel before the start refunds in full, as recorded in 059), and one refund with a `REF-…` reference. The claim prints a `CLM-…` reference. Keep both outputs for the next two steps | | |
| 51 | WB-2 | `#/workbench/policies/QA-W1-CXL` | Open it; compare with the GET response | status `Cancelled`. Refunds: one row with the cancel's refund reference, type, `250.00` and the payment reference, which is the `PAY-…` in the Payments row (`1 refund returned.`). Cancellation: date `<T>`, Rule applied `CANCEL-1a`, Total refund `250.00`. `Per-term breakdown, from the cancel response` reads `no cancel response is logged for this policy` (the request log is W2's) | | |
| 52 | WB-2 | `#/workbench/policies/QA-W1-CXL` | Read the timeline | a `Cancelled` rung dated `<T>`, with a `Cancelled` tag, a `CANCEL-1a` chip, `Total refund 250.00` and `cover stops on this date`. Then `No cover after the cancellation date`. Then `Term 1 starts` `<T+10>` and `Term 1 ends`. The rungs follow date order and carry only the API's dates | | |
| 53 | WB-2 | `#/workbench/policies/QA-W1-CLAIM` | Open it | Has claims `true`. Claims: one row with the `CLM-…` reference, `<T>` and `Escape of water from the boiler`, and the caption `Claims on QA-W1-CLAIM: 1 claim returned (hasClaims is true).` The timeline has `Term 1 starts` `<T>`, then `Claim recorded` `<T>` with the `CLM-…` reference and the description, then `Term 1 ends` | | |

### G. Out of W1's scope: cancel, renew and claim routes (WB-3)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 54 | WB-3 | `#/workbench/policies/QA-W1-SOLD/cancel`, `…/renew`, `…/claims/new` | Open each, with Network cleared | the kit's not-built-yet pattern, naming the route (for example `/workbench/policies/QA-W1-SOLD/cancel has nothing to show yet.`), with `Back to the overview`. The tab reads `Not built yet · Docket`, and no nav entry is marked current. The page sends no request. It shows no date, no amount, no `answered <status>`, no alert, no rule chip, and no reference but the one in the route | | |

### H. Keyboard, focus, status words, themes, widths (A11Y-1)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 55 | A11Y-1 | `#/workbench/sell` | Reload. Click the address bar, then Tab through the whole form | the first stop is `Skip to the content`, then the top bar and the nav. The form's controls follow in the order they appear: reference, the Type radios (the arrow keys move between them), start date, amount, payment method, Auto-renew, each policyholder's fields and `Add another policyholder`, the address, `Send anyway`, then `Sell this policy`. Space toggles each switch. Every control is reached, and each shows a visible focus ring | | |
| 56 | A11Y-1 | `#/workbench/sell` | With the keyboard: press `Add another policyholder`, then `Remove` on Policyholder 2 | after the add, focus lands on the new `Policyholder 2` heading. After the remove, focus lands on the `Policyholders` heading, and the count line announces the new number | | |
| 57 | A11Y-1 | `#/workbench/sell` | With an empty form, Tab to Sell and press Enter. Then Tab to the first summary entry and press Enter | focus moves to the `There is a problem` alert as it appears. Enter on an entry moves focus into its field. Elements: each marked field's `aria-describedby` points at its message | | |
| 58 | A11Y-1 | `#/workbench`, `#/workbench/sell`, `#/workbench/policies/QA-W1-CXL`, `#/workbench/policies/QA-W1-NONE` | Look at every status on these pages | each has a word or a glyph as well as a colour: `Sold` and `Opened` with glyphs, `Valid` and `Invalid pattern`, the policy's `Cancelled` and `Paid`, the `404` tag on QA-W1-NONE, and the not-built-yet glyph and words. The `409` (step 44), `No response` (step 46) and `whole request` (step 33) labels you saw earlier also carry a word | | |
| 59 | A11Y-1 | the four routes of step 58, and the sell form after step 33's 422 | Top-bar theme toggle → Dark, then Light | in both themes, all text is readable on its background, focus rings stay visible, and the Send anyway notice and the banners keep their glyphs | | |
| 60 | A11Y-1 | the four routes of step 58 | DevTools device toolbar at 390 × 844, then 1440 × 900, in light and in dark. In Console: `document.documentElement.scrollWidth - document.documentElement.clientWidth` | `0` every time: no page scrolls sideways. At 390, wide tables (policyholders, refunds, the send anyway table) scroll inside their own frame | | |

### I. The acceptance suite: what the running app can't show

First stop the API (Ctrl+C in terminal 1) and the preview (terminal 2), and run `rm -rf src/web/public`, so the suite
builds the app as the gates did, with no compiled trail in it. The suite starts its own API on 5088, with its
own fresh database in the OS temp directory. It stops before any test if an API it didn't start already answers on
5088, because that database can't be known to be fresh. It builds and previews the app on 4178 itself, with the
proxy on 5088. Rows 61 to 65 also run that rule's client unit tests (`tests/web/unit/client/`, on the recorded
responses). BUSY-1 and A11Y-1 have no client unit tests.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 61 | WB-1 | shell | `DOCKET_API_PORT=5088 DOCKET_APP_PORT=4178 npm --prefix src/web run e2e -- W1/ --grep "WB-1 · "`, then `npm --prefix src/web run test -- -t "WB-1 · "` | every test passed, 0 failed, 0 skipped, in both. This includes parity with `docs/ui/derived/W1/wb-sell/` (regions in order, components, tokens only, light and dark) | | |
| 62 | WB-2 | shell | The same, with `"WB-2 · "` | all passed. This includes the one case the running app can't show: a policy view the API answers **400** (an unknown query parameter, relayed) shows the API's 400 and never says "not found" | | |
| 63 | WB-3 | shell | The same, with `"WB-3 · "` | all passed: 422, 400, 409 and 404 from the live API, the three unbuilt routes, and parity on the recorded 422 (021) and 404 (053) | | |
| 64 | WB-6 | shell | The same, with `"WB-6 · "` | all passed: each case on both sides of the switch, and parity with the switch off, and on with the API's answer | | |
| 65 | WB-9 | shell | The same, with `"WB-9 · "` | all passed. This includes "another browser doesn't see it" (a second browser context) and parity of the home | | |
| 66 | BUSY-1 | shell | `DOCKET_API_PORT=5088 DOCKET_APP_PORT=4178 npm --prefix src/web run e2e -- W1/ --grep "BUSY-1 · "` | all passed: each request held in flight by the test, then let through, and the no-answer cases | | |
| 67 | A11Y-1 | shell | `DOCKET_API_PORT=5088 DOCKET_APP_PORT=4178 npm --prefix src/web run e2e -- W1/ --grep "A11Y-1 · "` | 7 passed: axe finds no violation on the home listing a sold policy, the sell form filled in, answered 201, answered 422 and answered 400, and the policy view populated and answered 404. Each runs light and dark, at 1440 and 390 | | |
| 68 | WB-9 | shell | `DOCKET_API_PORT=5088 DOCKET_APP_PORT=4178 npm --prefix src/web run e2e -- U0b/ U1/ --workers=2` | `65 passed` for U0b and `126 passed` for U1, 0 failed, 0 skipped (`191 passed` in all). W1 made `Workbench` a nav link, and this proves the earlier nodes' shell parity still holds: each compares only the nav entries settled at its own derived reference, and leaves Workbench to W1 (85154dd). If a test fails on the 30000 ms timeout with no assertion failed, run it once more and record both runs: the integrate gate at fe6117a saw two such timeouts in U1, and both passed on the re-run | | |

The whole W1 suite in one run: `DOCKET_API_PORT=5088 DOCKET_APP_PORT=4178 npm --prefix src/web run e2e -- W1/`.
W1's, U0b's and U1's together, as the attempt-4 gates ran them: `… run e2e -- W1/ U0b/ U1/ --workers=2`.

## Notes

1. **The ports.** AC1 says "the API on port 5080". This script and the suite use W1's own port, 5088, so W1 never
   meets an API another node or a HITL run left on 5080. The app reaches the API only through its `/api` proxy, so
   only `DOCKET_API_PORT` changes.
2. **Recent policies keep the last thing done (step 25).** WB-9 asks for "the references this browser has sold or
   opened". The list holds one entry per reference, newest first, with the word for the last action. A policy sold
   here and then opened reads `Opened`. The code does exactly that (`remember` in `app/data/api.ts`), and no test
   asserts either way. If you read WB-9 as "sold stays sold", that's a steer. Also, the kit's scope line says the
   list is "read from the request log in this browser's local storage". W1 has no request log (`wb-requests` isn't
   built). The list is the `workbench.recent` key (step 17). The wording is the kit's, not this screen's.
3. **`1 of 4 policyholders` with Send anyway on (step 31).** The form allows a fourth policyholder only with its
   checks off, so the API's own SELL-4 can be shown (WB-6). The kit's count line names that maximum, so it reads
   "of 4" while the switch is on.
4. **Rule chips open U1's rule page (steps 38 and 44).** Every chip links by hash to RULE-1's route, `#/rules/<ID>`,
   as WB-3 requires (`'#/rules/' + ruleId` in `ProblemView.tsx`, `SellPolicy.tsx` and `PolicyView.tsx`). Before the
   rebase that route fell to the not-built page. Since U1 merged, `app/explorer/u1Routes.tsx` routes `rules/:ruleId`
   to U1's Rule page, which reads `trace.json`. Step 38 checks only that the chip lands on the right rule. What that
   page says about SELL-4 (its commits, tests and sign-off) is U1's, checked in `docs/qa/ui-U1.md` part C. If
   `npm run trace` failed, the rule page still opens (tab `Rule · Docket`, Requirements matrix current), but in place
   of the rule it shows a `Could not load` notice with a reason naming `trace.json`. That's U1's honest state for a
   missing trail, and is not a W1 failure. It is never the not-built page.
5. **What only the suite shows.** The running app can't make the API answer 400 to a policy view (step 62).
   It also can't hold a request in flight exactly (the `W1 slow` profile only delays it), or run axe. Part I covers
   these. Nothing here or in the e2e suite drives the recent list's storage-refused state ("Recent policies can't
   be shown") in the running app. The WB-9 client unit tests cover the client's side: with storage refused or
   missing, the list reads as unavailable, and the sale and the read still answer. The kit draws that state.
6. **The tester didn't run these steps.** `npm run build` writes `src/web/dist/`, and the API writes a database
   file, both outside the tester's write scope. The harness also refused a run of the API with its database
   outside the repo. `npm run trace` writes `src/web/public/`, also outside it. The expected words are from the code
   at fe6117a and from the recordings named in each row.
   The values that move with the clock (`T`, `<endDate>`, the `PAY-`, `REF-` and `CLM-` references) are given as
   what to compare against, not as fixed text.
7. **The footer.** This run compiles the trail at HEAD first (`npm run trace`), so the footer shows that snapshot's
   short SHA (the HEAD you wrote down) and its compile time, linked to the commit. If the compile failed, there's no
   `src/web/public/trace.json`, and the footer reads `No snapshot: trace.json hasn't been read.` Either way the
   footer is the shell's (U0b's), not part of W1, and the workbench screens look the same.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: ____ of 68 · Steer (if any): ______

Steps not run, or only partly seen, and why:
- ______
