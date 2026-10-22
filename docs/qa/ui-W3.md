# QA script: ui / W3, Workbench: claims, renew and the request inspector

Rule IDs: WB-5, WB-7
Branch: feature/ui/W3   Worktree: .claude/worktrees/ui-W3
Commit under test: 343c270, HEAD on `feature/ui/W3` when this script was brought up to date at t8, attempt 4, beside
the reviewer and security verdicts. It covers the A2 route (979ee63, 054ca72, 1d3b822, 9edd13f, 6f7a385: headers and
exact text in the request log, one filter, the claim description's `<label>`, the policy view's links to claim and
renew), the A3 route (a25db9d, ea1f575, 673c93d, 44285d4: the policy view's nine regions and its requests region), the
cancel link (c80c957, acf5685), and W2 and U5 merged in (7d0f275, 343c270). The first version of this script was
written at e674cdc. This commit changes only this file. Record the SHA you test in the sign-off.
App URL: http://localhost:4180   API: http://localhost:5090. W3 is position 10 in `ui.dag.yaml`, so its ports are 4170 + 10
and 5080 + 10. The app proxies `/api/…` to the API port it's given in `DOCKET_API_PORT`.

W3 builds three workbench screens on the live API: record a claim (`#/workbench/policies/<reference>/claims/new`),
renew (`#/workbench/policies/<reference>/renew`) and the request log (`#/workbench/requests`). It also adds the
inspector drawer ("The requests as sent") on the claim and renew screens. On W1's policy view it builds two regions:
Actions, which links to `Quote and cancel`, `Record a claim` and `Renew`, and "Requests that touched this policy". W2's
quote-and-cancel screen (`…/cancel`) is merged and built, so part D cancels in the app. The nav still has no Requests
entry, and nothing links to `#/workbench/requests`, so you reach that page from the address bar (note 3a).

The Actual and Pass/Fail columns are empty. I wrote the steps from the code and the acceptance suite at 343c270 and
from the recordings in `docs/ui/fixture/api/` (each quote of the API's words gives the recording's number). I didn't
run them (note 6). Where I read the code as **not** doing what a step expects, the step still states what the
acceptance or the rule asks for, and note 3 names the line. Those are predictions from reading, for you to confirm
or refute. Note 3 also lists what the e674cdc version predicted that the code now fixes.

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node W3)

| Tag | Acceptance item |
|---|---|
| AC1 | A claim is recorded and the re-quote shows its effect; renew renews within the window |
| AC2 | The inspector shows every request this page sent as an overlay that never covers content; the requests page lists them all |
| AC3 | One inspector per page; the requests page has one filter and one count and shows only times it recorded; the claim description has a label and renew's amount is named as shown (g4-defects.md sections 1 and 3) |
| AC4 | The workbench cross-node flow gates pass: sell, then cancel, claim and renew the same policy |

You can't see AC1's "renew renews within the window" against the live API. The acceptance suite draws it from
answers built from recordings, and you can watch that test run (note 2, step 45). Part D runs AC4 end to end in the
app.

## Preconditions

- [ ] Node 22 and the .NET SDK on `PATH` (`node --version`, `dotnet --version`). Run with: ______
- [ ] `npm --prefix src/web ci` done in this worktree.
- [ ] Nothing listening on 5090 or 4180 (`netstat -ano | grep -E ":(5090|4180) "`, no match).
- [ ] Chrome or Edge with DevTools, in a fresh profile or a guest window.
- [ ] Playwright's Chromium installed, for part I (`npx --prefix src/web playwright install chromium`).

Commands are for Git Bash, run from the worktree root, `.claude/worktrees/ui-W3`.

## Run the app on W3's ports

Terminal 1, the API, on a fresh database:

```sh
git status --short; git rev-parse HEAD                  # write both down
rm -f qa-w3.db qa-w3.db-shm qa-w3.db-wal                # a fresh database (*.db is git-ignored)
ASPNETCORE_ENVIRONMENT=Development ConnectionStrings__Policies="Data Source=$(pwd -W)/qa-w3.db" \
  dotnet run --project src/Uinsure.Policies.Api --no-launch-profile --urls http://localhost:5090   # leave it running
```

Terminal 2, the app:

```sh
npm --prefix src/web run trace      # the trail at HEAD -> src/web/public/trace.json, for the rule pages (step 8)
npm --prefix src/web run build
DOCKET_API_PORT=5090 npm --prefix src/web run preview -- --port 4180 --strictPort   # leave it running
```

Terminal 3, checks, dates and setup:

```sh
curl -s http://localhost:5090/health/ready; echo                       # Healthy
curl -s http://localhost:4180/api/health/ready; echo                   # Healthy: the proxy reaches 5090
T=$(TZ=Europe/London date +%F); T1=$(date -d "$T +1 day" +%F); T10=$(date -d "$T +10 days" +%F)
E=$(date -d "$T +1 year -1 day" +%F); W=$(date -d "$E -30 days" +%F); E10=$(date -d "$T10 +1 year -1 day" +%F)
echo "T=$T T+1=$T1 T+10=$T10 E=$E W=$W E10=$E10"                        # write these down: the steps use them

sell() {  # sell REFERENCE START AMOUNT METHOD AUTORENEW: one policyholder, Household
  curl -s -w "  -> %{http_code}\n" -X POST http://localhost:5090/policies -H "content-type: application/json" \
    -d "{\"reference\":\"$1\",\"type\":\"Household\",\"startDate\":\"$2\",\"amount\":$3,\"autoRenew\":$5,\"paymentMethod\":\"$4\",\"policyholders\":[{\"firstName\":\"Ada\",\"lastName\":\"Lovelace\",\"dateOfBirth\":\"1985-12-10\"}],\"property\":{\"addressLine1\":\"12 Mill Lane\",\"addressLine2\":null,\"addressLine3\":null,\"postcode\":\"M15 4PS\"}}"
}
sell QA-W3-CLAIM  "$T"   400.00 Card        false
sell QA-W3-FUTURE "$T10" 250.00 Card        false
sell QA-W3-RENEW  "$T"   527.18 DirectDebit true
sell QA-W3-CHQ    "$T"   300.00 Cheque      true
sell QA-W3-OFF    "$T"   250.00 Card        false
```

Each `sell` prints the policy and `-> 201`.

**Dates.** `T` is today on the UK calendar, which is the API's. `E` is the end of a term that starts on `T`
(start + 1 year − 1 day, SELL-3), and `W` is `E` − 30 days, the first day RENEW-1/2's window opens. `E10` is the end of
QA-W3-FUTURE's term. Type dates as `yyyy-MM-dd`. Don't run this script across midnight.

**The request log lives as long as the page.** The log behind the drawer, the requests page and the policy view's
requests region is kept in memory for the life of the document (`app/workbench/browser.ts:15-16`). A reload, a new tab
or a new window empties it. From step 20 to step 39, **never reload**. Move between routes only by the links the
steps name, by Back, or by changing only the part after `#` in the address bar and pressing Enter (a same-document
navigation). In Network, leave *Preserve log* unticked and type `/api/` in the filter box, so Network lists the same
requests as the log since the last reload.

**DevTools set-up:**
- *Slow:* Network → throttling menu → Add… → a custom profile named `W3 slow`, latency `4000` ms. Pick it to hold each
  request for 4 seconds, and pick `No throttling` afterwards.
- *Blocked:* Network request blocking (⋮ → More tools → Network request blocking, "Request conditions" in recent
  Chrome). Add `*/api/*` and tick it; untick it afterwards.

When you finish, stop both servers with Ctrl+C and run `rm -f qa-w3.db*` and `rm -rf src/web/public`. Neither
`src/web/public/` nor `src/web/test-results/` is git-ignored yet (a U7 line). Never stage them.

## Steps

### A. A claim recorded, and the quote after it (WB-5)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | WB-5 | (terminal 3) | Run the set-up block above | five `-> 201` lines. The API holds QA-W3-CLAIM, QA-W3-FUTURE, QA-W3-RENEW, QA-W3-CHQ and QA-W3-OFF | | |
| 2 | WB-5 | `#/workbench/policies/QA-W3-CLAIM` → `…/claims/new` | Open http://localhost:4180/#/workbench/policies/QA-W3-CLAIM in a new tab. In its `Actions` region, press `Record a claim` | Actions holds three links: `Quote and cancel`, `Record a claim` and `Renew`. The press takes the URL to `#/workbench/policies/QA-W3-CLAIM/claims/new` with no reload. The tab reads `Record a claim · Docket`, and `Workbench` is the current nav entry. Eyebrow `Workbench · Record a claim · policy QA-W3-CLAIM`, title `Record a claim`, question "After a claim is recorded, does the quote I ask for again refund 0.00?", answer "No claim is recorded yet. Fill in the date and press Record this claim.", status `Active`, ids `Policy QA-W3-CLAIM` and `Term 1 <T> to <E>`, live note `GET /policies/QA-W3-CLAIM: 200`. Claim date holds `<T>`, and Claim description is empty. The three rungs read `Quote the refund` (`Not asked yet`), `Record the claim` (`Not sent yet`) and `Quote again` (`Not asked yet`). Problems reads "No problem. These rules can refuse a claim here:", with `COULD-2a` and `COULD-2c` chips. There is one `Record this claim` button. The drawer `The requests as sent` reads `Closed · 2 requests`: the policy view's read and this page's | | |
| 3 | WB-5 | same | Click the visible words `Claim description` above the text area. Then Elements → the text area → Accessibility | clicking the words puts focus in the text area: they are its `<label>` (AC3, g4-defects section 3). The accessible name is `Claim description` | | |
| 4 | WB-5 | same | In Console: `copy('x'.repeat(510))`. Paste into Claim description, then select the text area in Elements and run `$0.value.length` in Console. Then clear the field | `500`: the field takes at most 500 characters, COULD-2's limit | | |
| 5 | WB-5 | same | Type `Burst pipe under the kitchen sink` into Claim description. Pick `W3 slow`, then press `Record this claim`. Watch until it settles, then pick `No throttling` | while it runs, the button reads `Recording…` and is disabled (`aria-busy="true"`), and pressing it again sends nothing. The rungs go busy in turn: rung 1 `Quoting`, then rung 2 `Recording`, then rung 3 `Quoting`. The date and description keep what you typed | | |
| 6 | WB-5 | same | Read the page | rung 1 is `Quoted`, with Quote date `<T>`, "asked for `<T>`", and "Refund quoted: **£400.00**, rule applied CANCEL-1b." Rung 2 is `Claim recorded`, with Claim date `<T>` and "Claim CLM-QA-W3-CLAIM-1 recorded; the policy now reads hasClaims true." Rung 3 is `Quoted`, with "Refund quoted: **£0.00**, rule applied COULD-2." Under the rungs sits `The refund after the claim`: the worked sum, its term at 0.00 with a `COULD-2` chip, and "The API quotes £0.00 under COULD-2." The header answer reads "Claim CLM-QA-W3-CLAIM-1 is recorded for `<T>` and the policy now reads hasClaims true." | | |
| 7 | WB-5 | same | Network: the three `/api/` requests the press sent | in this order: `GET /api/policies/QA-W3-CLAIM/cancellation-quote?cancellationDate=<T>` → 200 with `"totalRefund":400`. Then `POST /api/policies/QA-W3-CLAIM/claims` with Payload `{"claimDate":"<T>","description":"Burst pipe under the kitchen sink"}` → 201. Then the same quote GET → 200 with `"totalRefund":0` and `"ruleApplied":"COULD-2"`. Every figure on the page in step 6 comes from one of these answers | | |
| 8 | WB-5 | same → `#/rules/COULD-2` | Click the `COULD-2` chip in the worked sum, then Back | the URL becomes `#/rules/COULD-2` and U1's rule page for COULD-2 opens. If `npm run trace` failed, it's U1's `Could not load` notice, never the not-built page. Back returns to the claim page | | |
| 9 | WB-5 | `#/workbench/policies/QA-W3-CLAIM` | Change the hash to the policy view | the Claims table's caption reads "Claims on QA-W3-CLAIM: 1 claim returned (hasClaims is true)." Its one row is `#1`, `CLM-QA-W3-CLAIM-1`, `<T>`, `Burst pipe under the kitchen sink` | | |

### B. Claims the API refuses (WB-5)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 10 | WB-5 | `#/workbench/policies/QA-W3-CLAIM/claims/new` | Change the hash and reload. Set Claim date to `<T+1>`, leave the description empty, and press `Record this claim` | Network: the claim's Payload is `{"claimDate":"<T+1>"}`, with no description key, and the answer is `422`. Rung 1 is `Quoted` at £0.00 under COULD-2, since the policy already has a claim. Rung 2 is `Claim not recorded`, with "The API answered 422, Claim date in the future." Rung 3 stays `Not asked yet`: no quote is asked after a refusal. Problems: `There is a problem`, listing "The claim date cannot be in the future." with a `COULD-2a` chip. The summary entry moves focus to Claim date, as the screen's action says (note 3d). Header: "The claim was refused with 422 under COULD-2a. Nothing was recorded." (the words recorded in 084) | | |
| 11 | WB-5 | `#/workbench/policies/QA-W3-FUTURE/claims/new` | Change the hash. Set Claim date to `<T>` and press `Record this claim` | the status reads `Pending`, and the ids read `Term 1 <T+10> to <E10>`. Rung 1 quotes the full `£250.00`, because the policy hasn't started (compare Network). The claim is refused `422` with a `COULD-2b` chip and "The claim date must be within the cover, `<T+10>` to `<E10>`." (the form recorded in 087) | | |
| 12 | WB-5 | `#/workbench/policies/QA-W3-NONE/claims/new` | Change the hash | Network: `GET /api/policies/QA-W3-NONE` → 404. Problems: a banner `Policy not found` with a `404` tag, a `GET-1` chip and "No policy with reference 'QA-W3-NONE'." (the form recorded in 091). The header shows no status and no term, and the live note reads `GET /policies/QA-W3-NONE: 404` | | |

### C. Renew (WB-5)

The API accepts a renewal only within 30 days of a term's end, and no policy on the live API can be there today
(note 2). These steps drive every refusal the screen shows, and its defaults.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 13 | WB-5 | `#/workbench/policies/QA-W3-RENEW` → `…/renew` | Change the hash to the policy view, then press `Renew` in its Actions | the URL becomes `#/workbench/policies/QA-W3-RENEW/renew`. The tab reads `Renew · Docket`. Eyebrow `Workbench · Renew · policy QA-W3-RENEW`, title `Renew`, ids `Policy QA-W3-RENEW`, `Auto-renew true` and `Term 1 <T> to <E>`. Answer: "Not asked yet. Press Renew policy to find out whether the API takes the renewal." Renewal amount holds `527.18`, with the hint "… Term 1 is 527.18.". Payment method holds `Direct Debit`, with the hint "Defaults from term 1. Cheque is refused for an auto-renewing renewal.". `2 · What the API said` reads "No problem yet. …". `3 · The new term, last on the timeline` shows term 1 only, from the API's GET. `4 · Renew` reads "Sends POST /policies/QA-W3-RENEW/renewals with the amount and payment method above.", with `Renew policy` and `Open policy QA-W3-RENEW`. The drawer is closed | | |
| 14 | WB-5 | same | Click the visible words `Renewal amount`, then `Payment method`. Elements → Accessibility on each control | each click puts focus in its own control. The accessible names are `Renewal amount` and `Payment method`, the words shown (AC3) | | |
| 15 | WB-5 | same | Pick `W3 slow` and reload. At once, before the page's read answers, select Renewal amount and type `600.00`. Wait for the read to land, then pick `No throttling` | while the read is in flight, `Renew policy` is disabled and the live note says the GET is in flight. When the read lands, Renewal amount still holds `600.00`: the term's amount is only a starting value and never replaces what you typed (I5, e795f19). Payment method takes the term's `Direct Debit` | | |
| 16 | WB-5 | same | Press `Renew policy` | Network: Payload `{"amount":600,"paymentMethod":"DirectDebit"}`, answered `422`. Problems: `There is a problem`, with a `RENEW-1/2` chip and "A policy can be renewed from `<W>` to `<E>`." (the form recorded in 092), and the banner `Outside the renewal window`. Answer: "Not now. The renewal was refused with 422 under RENEW-1/2." The timeline still shows term 1 only | | |
| 17 | WB-5 | same | Set Payment method to `Cheque` and press `Renew policy` | Payload `{"amount":600,"paymentMethod":"Cheque"}`, answered `422`. Both rules are listed, neither placed against a field: `RENEW-1/2` with the window, and `COULD-3` with "An auto-renewing policy cannot be renewed by Cheque. Use Card or DirectDebit." (098). The `COULD-3` chip links to `#/rules/COULD-3` | | |
| 18 | WB-5 | `#/workbench/policies/QA-W3-CHQ/renew` | Change the hash. Leave both defaults and press `Renew policy` | the defaults are `300.00` and `Cheque`, from term 1. Payload `{"amount":300,"paymentMethod":"Cheque"}`, answered `422` with the same two rules: cheque is refused even when it comes from the current term (099) | | |
| 19 | WB-5 | `#/workbench/policies/QA-W3-OFF/renew` | Change the hash. Replace the amount with `0` and press `Renew policy` | the ids read `Auto-renew false`. There is no Payment method field, and the note reads "… with the amount above.". Payload `{"amount":0}`, with no payment method, answered `422` with two rules: `RENEW-1/2` with the window and `RENEW-5` "The renewal amount must be greater than 0." (096) | | |

### D. One policy through sell, claim, renew and cancel (WB-5, WB-7, AC4)

Reload once at step 20. From there to step 39, never reload (see "The request log lives as long as the page").

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 20 | WB-5 | `#/workbench/sell` | Open http://localhost:4180/#/workbench/sell and **reload**. Sell `QA-W3-FLOW` with W1's form: `Household`, start `<T>`, amount `350.00`, `Card`, Auto-renew on, Policyholder 1 `Ada` `Lovelace` `1985-12-10`, address line 1 `12 Mill Lane`, postcode `M15 4PS`. Press `Sell this policy`, then `Open policy QA-W3-FLOW` | `201`, then W1's policy view: `Active`, with term 1 from `<T>` to `<E>`. Claims reads "The API returned no claims for QA-W3-FLOW." and "claims is an empty list. A recorded claim would appear here as one numbered row.". Nothing on the page says "not built yet". Actions links `Quote and cancel`, `Record a claim` and `Renew` to `#/workbench/policies/QA-W3-FLOW/cancel`, `…/claims/new` and `…/renew` (hover each, or read them in Elements) | | |
| 21 | WB-5 | `#/workbench/policies/QA-W3-FLOW/claims/new` | Press `Record a claim`. Set Claim date to `<T>`, description to `Storm damage to the roof tiles`, and press `Record this claim` | rung 1 £350.00 under CANCEL-1b, rung 2 `CLM-QA-W3-FLOW-1` recorded, rung 3 £0.00 under COULD-2: the quote drops to £0 after the claim | | |
| 22 | WB-5 | `#/workbench/policies/QA-W3-FLOW/renew` | Press Back to return to the policy view, then press `Renew`. Leave the defaults and press `Renew policy` | the defaults are `350.00` and `Card`. Answered `422` under `RENEW-1/2` with "A policy can be renewed from `<W>` to `<E>`.": today is outside the window | | |
| 23 | WB-5 | `#/workbench/policies/QA-W3-FLOW/cancel` | Back to the policy view, then press `Quote and cancel` (W2's screen). Set Cancellation date to `<T>` and press `Quote this date`. Then press `Cancel on <T>`, and in the dialog `Cancel policy QA-W3-FLOW?` press `Cancel policy on <T>` | the quote is `Quote returned`, with "Quote for `<T>`, rule COULD-2." and a total of `0.00`. The dialog says "The refund quoted is 0.00." After the cancel, the answer reads "Cancelled on `<T>`. The API answered 201, with a total refund of 0.00." and rung 3 is `Compared`. Network: `POST /api/policies/QA-W3-FLOW/cancellation` with Payload `{"cancellationDate":"<T>"}` → 201, with `"ruleApplied":"COULD-2"`, `"totalRefund":0` and `"refunds":[]` (the shape recorded in 071). The step 21 claim means no refund | | |
| 24 | WB-5 | `#/workbench/policies/QA-W3-FLOW/claims/new` | Change the hash. Set Claim date to `<T>` and press `Record this claim` | the header status reads `Cancelled`. Rung 1 is `Quote not returned`, with "The API answered 409, Policy already cancelled." Rung 2 is `Claim not recorded`. Problems: a banner `Claim on a cancelled policy` with a `409` tag, a `COULD-2c` chip and "The policy was cancelled on `<T>`, so a claim cannot be recorded." (088's form). Rung 3 stays `Not asked yet` | | |
| 25 | WB-5 | `#/workbench/policies/QA-W3-FLOW/renew` | Change the hash and press `Renew policy` | the status reads `Cancelled`. Answered `409`: a banner `Cancelled policy cannot be renewed` with a `RENEW-6` chip and "The policy was cancelled on `<T>`, so it cannot be renewed." (100's form). Answer: "Not now. The renewal was refused with 409 under RENEW-6." | | |
| 26 | WB-5 | `#/workbench/policies/QA-W3-FLOW` | Press `Open policy QA-W3-FLOW` | `Cancelled`. One claim row, `CLM-QA-W3-FLOW-1`, `<T>`, `Storm damage to the roof tiles`. Cancellation shows date `<T>`, rule `COULD-2` and total refund `0.00`. Refunds reads "The API returned no refunds for QA-W3-FLOW." (note 3i) | | |
| 27 | WB-7 | same | Read `Requests that touched this policy`, beside Network with `QA-W3-FLOW` added to its filter | the region lists, newest first, every request since step 20 whose path names QA-W3-FLOW, plus step 20's `POST /policies` 201 (the sale that created it), and no request about any other policy. Each row shows `#`, Method, Path (no `/api`, quote paths keeping `?cancellationDate=`), Status as a word-and-colour tag, and Duration `not recorded`. The numbers are the page log's, so they match the drawer's and the requests page's. It has one `Filter requests` box and one `Showing k of k` count | | |

### E. The inspector drawer (WB-7)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 28 | WB-7 | `#/workbench/policies/QA-W3-FLOW/renew` | Press `Renew` on the policy view. Read the closed drawer, then press `Show requests` | closed, the drawer reads `Closed · N requests`, where N is the number of `/api/` rows in Network since step 20's reload. Open, it reads `Open · N requests` and "Docked, resizable. …". It lists every one of those requests, newest first, numbered #N down to #1: the GET this page just sent on top, marked `latest`, and so on back to step 20's `POST /policies` 201. Paths carry no `/api` prefix, and quote paths keep their `?cancellationDate=` query | | |
| 29 | WB-7 | same | In the drawer, read step 25's `POST /policies/QA-W3-FLOW/renewals` 409. In Network, open the same request's Payload (view source) and Response | under `request` the drawer shows the body exactly as sent, `{"amount":350,"paymentMethod":"Card"}`. Under `response` it shows the body as the exact text Network's Response tab shows, character for character: compact, in the API's own key order (`type`, `title`, `status`, `detail`, `instance`, `traceId`, `ruleId`, `cancellationDate`, as in 100). The drawer shows no headers; the requests page does (step 37) | | |
| 30 | WB-7 | claim, renew, `#/workbench/requests`, `#/workbench`, `#/workbench/sell`, `#/workbench/policies/QA-W3-FLOW/cancel`, `#/workbench/policies/QA-W3-FLOW` | On each route, run in Console: `[...document.querySelectorAll('h2,h3,h4')].filter((h) => h.textContent === 'The requests as sent').length` | `1` on the claim and renew routes: one inspector per page (AC3). `0` on the requests page and the home, whose screens list no drawer. `0` on the policy view, whose requests region is a request log (step 27). `0` on the sell form and the cancel screen, where W1's and W2's inspector regions are still "not built yet". Write down what you see there (note 3h) | | |
| 31 | WB-7 | `#/workbench/policies/QA-W3-FLOW/claims/new` | Open the drawer. At 1440 × 900 and at 390 × 844 (device toolbar), scroll from the top to the bottom, then Tab through every control from Claim date to `Hide requests` | the drawer never covers content (AC2, g4-defects section 1). At the bottom of the page, the `Record this claim` button, its note and the Problems region sit wholly above the drawer, and every control Tab reaches is visible when focused, never under the drawer (note 3b) | | |
| 32 | WB-7 | same | With the drawer open, pick `W3 slow` and press `Record this claim`. Watch the drawer, then pick `No throttling` | as each request leaves, it appears at the top of the drawer at once, before any answer, tagged `Waiting` (g4-defects section 3: a submitting screen logs its request in flight). When it lands, it shows its status: the quote `409`, then the claim `409`. The count rises by 2 | | |

### F. The requests page (WB-7)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 33 | WB-7 | `#/workbench/requests` | Change the hash | the tab reads `Requests · Docket`, and `Workbench` is current. Title `Requests`, question "What did this browser send to the API, and what came back?", answer "N requests sent since this page opened, listed newest first. Each is shown as it went over the wire.", with N the `/api/` rows in Network. The table lists all N, newest first, with `#`, Method, Path (no `/api`), Status as a word-and-colour tag, and Duration. `One exchange: #N` shows the newest | | |
| 34 | WB-7 | same | Look at the request-log region's controls and counts | **one** filter, the `Filter requests` box, and **one** count, `Showing N of N` (AC3; g4-defects section 3: "wb-requests has two filters with two counts"). There is no Method or Status filter bar | | |
| 35 | WB-7 | same | In `Filter requests`, type `POST`, then replace it with `409`, then with `nomatch`. Press `Clear filter` | each time, only the matching rows remain, and the count reads `Showing k of N`. With `nomatch`, the page reads 'No request matches "nomatch".' and offers `Clear filter`, which brings all N back. Nothing is sent: Network gains no row | | |
| 36 | WB-7 | same | Press the path of step 21's `POST /policies/QA-W3-FLOW/claims` (201) row. Its name is `Open request #k, POST /policies/QA-W3-FLOW/claims`. Compare it with that request in Network | `One exchange: #k`, `#k POST /policies/QA-W3-FLOW/claims`, status `201`. `Request headers (1)` holds `content-type` `application/json`. The request body is exactly `{"claimDate":"<T>","description":"Storm damage to the roof tiles"}`. Open `Response headers (n)`: every header Network lists under Response Headers, with the same values, names in lower case and in name order (Network may list them in wire order). They include `content-type` `application/json; charset=utf-8` and `location` (the pair recorded in 070). The response body is the exact text of Network's Response tab, with `reference` `CLM-QA-W3-FLOW-1` and `hasClaims` `true`. The JSON viewer `response to request #k` is open below. Write down whether a `Repeat it` part with `Copy curl` is drawn (note 3e) | | |
| 37 | WB-7 | same | Open step 25's `POST /policies/QA-W3-FLOW/renewals` (409) row | status `409`, with `Response headers (n)` already open, as it is for any problem. The request body and the 409 problem details are exactly the text Network shows: `title` `Cancelled policy cannot be renewed`, `detail` "The policy was cancelled on `<T>`, so it cannot be renewed.", `ruleId` `RENEW-6` | | |
| 38 | WB-7 | same | Read every time and duration on the page, leaving out the footer, which is the shell's | the page shows only times it recorded (AC3): every Duration reads `not recorded`, and the page draws no timestamp of its own. The `date` response header in step 36 is the API's, shown as a header the API sent, not a time the page recorded | | |
| 39 | WB-7 | same | Reload | the log is empty, and the page says so: "0 requests sent since this page opened", the log's "No requests sent yet. Each request this browser sends is listed here, newest first.", with no filter box and no count, and "No request has been sent yet, so there is no exchange to show." | | |

### G. No answer from the API (WB-7, WB-5)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 40 | WB-5 | `#/workbench/policies/QA-W3-CLAIM/claims/new` | Change the hash and wait for the page to read the policy. Turn *Blocked* on. Set Claim date to `<T>` and press `Record this claim` | a banner `The API did not answer`, "No request was completed. Nothing was changed by this screen.", with `Try again`. Rung 1 `Quote not returned` and rung 2 `Claim not recorded`, each with "The API did not answer." Header: "The API did not answer, so the claim may not have been recorded." The button is enabled again, and the date keeps `<T>` | | |
| 41 | WB-7 | same, then `#/workbench/requests`, then `#/workbench/policies/QA-W3-CLAIM` | Open the drawer and read the two blocked requests. Then change the hash to the requests page and open each one. Then read the policy view's `Requests that touched this policy` | each is shown as having had no answer, not as still waiting, and with no status the API never sent: no `0` (note 3c). On the requests page, the exchange shows `No response` and reads "No response was read." | | |
| 42 | WB-5 | `#/workbench/policies/QA-W3-CLAIM/claims/new` | Change the hash back. Turn *Blocked* on before the read answers (or reload with it on), then turn it off and press `Try again`. Watch Network | the banner goes once the read answers `200`. Write down what `Try again` sent: the screen's action says it "repeats the request that did not answer" (note 3f). No claim is recorded until you press `Record this claim` | | |

### H. Widths and themes (WB-5, WB-7)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 43 | WB-5 | QA-W3-FLOW's claim, renew and policy view routes | Device toolbar at 390 × 844, then 1440 × 900, in light and dark (top-bar toggle). In Console: `document.documentElement.scrollWidth - document.documentElement.clientWidth` | `0` every time: no sideways page scroll. The rungs, the worked sum, the timeline and the policy view's Actions links can be read in both themes, and every status tag has a word as well as a colour | | |
| 44 | WB-7 | `#/workbench/requests` (with a few requests in its log), and QA-W3-FLOW's policy view | The same four checks, with an exchange's header disclosures open | `0` every time. At 390, each request table scrolls inside its own frame, and its last column (Duration) isn't clipped. Long header values and bodies wrap or scroll inside the exchange, never the page | | |

### I. The acceptance suite: what the running app can't show

First stop the API (terminal 1) and the preview (terminal 2), and run `rm -rf src/web/public`. The suite starts its
own API on 5090 with a fresh database in the OS temp directory. It stops before any test if an API it didn't start
already answers there. It builds and previews the app on 4180 itself.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 45 | WB-5 | shell | `DOCKET_API_PORT=5090 DOCKET_APP_PORT=4180 npm --prefix src/web run e2e -- W3/ --grep "WB-5 · "`, then `npm --prefix src/web run test -- -t "WB-5 · "`. To watch the accepted renewal drawn, add `--headed --grep "WB-5 · a renewal inside the window"` to the first | all passed, 0 failed and 0 skipped, in both runs. This includes the side the live API can't reach: "a renewal inside the window is accepted, and the page draws the 201 body's new term last on the timeline" (the screen, on answers built from recordings, note 2) and its client unit test. It also includes the policy view's links to claim, renew and cancel, the claim description's `<label>`, and parity of wb-claim, wb-renew and wb-policy (nine regions, Actions tagged `WB-4 WB-5`) with `docs/ui/derived/W3/` | | |
| 46 | WB-7 | shell | The same, with `"WB-7 · "` | all passed: the log, the response headers and the drawer hold the claim's exact exchange on the live API. The requests page has one filter and one count. The policy view's requests region is built, with the request-log component. The client's logging fetch keeps headers, exact body text, a refused request and an unanswered one. Parity of wb-requests passes | | |
| 47 | WB-7 | shell | After the trace step has committed W3's baselines (`docs/ui/baselines/wb-claim/`, `wb-renew/`, `wb-requests/`): `DOCKET_API_PORT=5090 DOCKET_APP_PORT=4180 npm --prefix src/web run e2e -- regression/ --workers=2`. Re-run any timeout at `--workers=1` | every W3 screen matches its baseline. The only screenshot failures are the known `activity` captures at 1440 (a U7 line from U2) and wb-policy's 12. Those 12 are W3's intended change: the Actions links and the requests region. You rule on them at pause 2: approve the new baseline or call it a defect. At the 343c270 gates, 10 page-load timeouts at 2 workers passed at 1 (contention) | | |
| 48 | WB-5 | shell | `DOCKET_API_PORT=5090 DOCKET_APP_PORT=4180 npm --prefix src/web run e2e -- W1/ W2/ U5/ --workers=2`. Re-run any failure at `--workers=1` | the earlier workbench suites and U5's still pass on W3's head. At the 343c270 gates (W3, W2, W1 and U5 together), 220 passed and 2 W1 tests failed at 2 workers (a `goto` abort and a slow POST) that pass at 1 worker. Record any other failure by title | | |
| 49 | WB-7 | shell | `npm --prefix src/web run test` | every unit test passes: 338 at the 343c270 gates | | |

## Notes

1. **The ports.** The app reaches the API only through its `/api` proxy, so `DOCKET_API_PORT=5090` is the one
   setting that points this run at W3's API. Only step 1's `curl` goes to the API directly. Part D's cancel now goes
   through W2's screen.
2. **Renewing inside the window isn't shown live.** RENEW-1/2's window opens 30 days before a term's end. The live
   API has no demo clock (WB-8 is cut), and SELL-2 refuses a start in the past, so no policy the running app can sell
   is renewable today. Since the A2 route, the acceptance suite drives the screen into that state:
   `WB-5 · a renewal inside the window is accepted, and the page draws the 201 body's new term last on the timeline`
   (`tests/web/e2e/W3/wb-5.spec.ts`, A2/I1). It answers the page's read with recording 045 through `page.route`. It
   answers the renewal with a 201 built from that read, plus a second term on the API fake-clock test's values (446.83, Card,
   `docs/ui/fixture/api/fake-clock/Renewal_30_days_before_the_end_is_accepted.txt`), dated 2027-11-18 to 2028-11-17.
   It then checks the "Renewed. The policy now has 2 terms, the new one last." answer and that term 2 is drawn last.
   That 201 is built in the test. It is not an answer the API sent. The API's own accepted side is
   `RenewWindowTests.Renewal_30_days_before_the_end_is_accepted`. If AC1's "renew renews within the window" needs a
   live run, that's a steer.
3. **Where I read the code as not meeting a step (predictions, not results), at 343c270:**
   - a. *How you reach the requests page.* The nav has no Requests entry (`app/shell/Frame.tsx:14-21`), and no screen
     links to `#/workbench/requests`. The claim and renew screens are now linked from the policy view's Actions.
   - b. *Step 31.* The kit drawer is `position: sticky; bottom: 0` (`kit/layouts/inspector-drawer/InspectorDrawer.module.css:3-4`),
     the mechanism g4-defects section 1 names. Whether it covers content here needs eyes.
   - c. *Step 41.* A request that got no answer keeps `status: null`. The drawer reads that as `pending`
     (`app/workbench/RequestsDrawer.tsx:20`), so a blocked request is tagged `Waiting`, as if still in flight. The
     requests table and the policy view's requests region map it to `0` (`requests/RequestLogPage.tsx:20`,
     `policy/PolicyView.tsx:334`), a status the API never sent. Review A2 R5 and A4 R4 left the `0` to U8 (David's ruling D1): U8's
     acceptance lines "The request log table shows an unanswered or pending request as pending, never status 0" and
     "The policy view's requests region shows a pending exchange as pending, never status 0" (`docs/plans/active/ui.dag.yaml`,
     node U8). The kit's request-log row has no unanswered state. The requests page's exchange pane itself is right ("No response was read.").
   - d. *Step 10.* The claim screen gives the error summary no field ids (`claim/RecordClaim.tsx:205` passes no
     `controlId`), so its entry likely won't link to Claim date. The screen's actions list that link.
   - e. *Step 36.* The exchange gets no `curl` (`requests/RequestLogPage.tsx:46-64`), so the `Repeat it` part with
     `Copy curl` that the signed-off reference draws isn't there. Also, `fetch` can't see the request headers the
     browser adds itself (`user-agent`, `host`, …), so `Request headers` holds only what the page set, which for a GET
     is none.
   - f. *Step 42.* `Try again` re-reads the policy only (`claim/RecordClaim.tsx:222-226`). It doesn't resend the quote
     or the claim.
   - g. *Not a step.* When the current term's payment can't be read, renew's Payment method falls back to `Card`
     (`renew/RenewPolicy.tsx:24, :63`), a value the API never returned. Review A2 R4 left it to U8 (David's ruling D1): U8's acceptance line "The renew
     form never shows a payment method the term does not hold: no Card fallback". No step reaches
     it live, since every policy sold here has its payment.
   - h. *Step 30.* The sell form's `the request as sent (inspector)` region and the cancel screen's `the requests as
     sent (inspector)` region are still W1's and W2's "not built yet" (`sell/SellPolicy.tsx:406`,
     `cancel/CancelPolicy.tsx:313`). The wb-sell and wb-cancel screens catalogue the drawer.
   - i. *Step 26, outside W3's rules.* The policy view's Cancellation region always says the per-term breakdown has
     "no cancel response is logged for this policy" (`policy/PolicyView.tsx:191`), even after step 23 logged one on
     this page. That region is WB-2 and WB-4 (W1 and W2), not a W3 rule. Record it if you see it.
   - j. *Not a step.* `tests/web/e2e/W3` has no A11Y-1 (axe) test on W3's three routes, although the web-testing skill
     asks for axe on every route a node builds. A11Y-1 isn't a W3 rule. That gap is in the acceptance suite I wrote at
     t1.

   **Fixed since the e674cdc version, read from the code, not run:** the claim description is now a `Field` with a
   `<label>` (979ee63, 6f7a385; step 3). The policy view links to claim, renew and cancel, and its claims empty state
   no longer says "not built yet" (979ee63, c80c957, 6f7a385, acf5685; steps 2, 13, 20). The requests page has one
   filter and one count: the page-level FilterBar is gone, and with it the "No requests match these filters." on an
   empty log (054ca72, 9edd13f, 6f7a385; steps 34, 35, 39). The log keeps request and response headers and both bodies
   as the exact wire text, and the drawer and exchange show that text unchanged (6f7a385; steps 29, 36, 37). The
   policy view has exactly its reference's nine regions, and its requests region is built (a25db9d, ea1f575, 673c93d,
   44285d4; step 27). W1's "renew and claim are not built" premise is retired (1d3b822), and W1's suite passed at the
   343c270 gates (step 48). The accepted renewal is drawn by a screen test (note 2). The cancel screen is W2's, merged
   at 7d0f275 (step 23).
4. **The log is the page's, not the browser's.** It's kept in memory (`app/workbench/browser.ts:15-16`), so a reload
   or a new tab starts it empty, and two tabs have two logs. The header's "since this page opened" means since the
   last load.
5. **What only the suite shows.** A request held in flight for exactly as long as the test wants (`W3 slow` only
   delays it), the accepted renewal (note 2), and parity with the derived references.
6. **The tester didn't run these steps.** Starting the API writes a database file, and `npm run build` and
   `npm run trace` write `src/web/dist/` and `src/web/public/`, all outside the tester's write scope. Review is also
   running against this head. The expected words come from the code at 343c270 and from the recordings named in each
   row. The values that move with the clock (`T`, `E`, `W`, `E10`) are given as what to compare against, not as fixed
   text.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: ___ of 49 · Steer (if any): ______

Steps not run, or only partly seen, and why:
- ______

Defects found (step, what you saw):
- ______

Decision: Pass / Pass with U8 lines (list them; U8 holds W3's carries, David's ruling D1) / Fail
