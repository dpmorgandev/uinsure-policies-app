# QA script: ui / W3, Workbench: claims, renew and the request inspector

Rule IDs: WB-5, WB-7
Branch: feature/ui/W3   Worktree: .claude/worktrees/ui-W3
Commit under test: e674cdc. That was HEAD on `feature/ui/W3` when this script was written, at t8, beside the reviewer
and security verdicts for attempt 2 (after the A1 fix round: I1 to I4 test corrections, I5 the renew amount fix in
e795f19). This script's own commit changes only this file. Record the SHA you test in the sign-off.
App URL: http://localhost:4180   API: http://localhost:5090. W3 is position 10 in `ui.dag.yaml`, so its ports are 4170 + 10
and 5080 + 10. The app proxies `/api/…` to the API port it's given in `DOCKET_API_PORT`.

W3 builds three workbench screens on the live API: record a claim (`#/workbench/policies/<reference>/claims/new`),
renew (`#/workbench/policies/<reference>/renew`) and the request log (`#/workbench/requests`), plus the inspector
drawer ("The requests as sent") on the claim and renew screens. Quote and cancel (`…/cancel`) is W2's and isn't built
on this branch: its route shows the not-built page, so part D cancels with `curl`. Nothing in the app links to W3's
routes yet: the policy view's actions region is still W1's "not built yet", and the nav has no Requests entry. You
reach each route by editing the address bar (note 3b).

The Actual and Pass/Fail columns are empty. I wrote the steps from the code and the acceptance suite at e674cdc and
from the recordings in `docs/ui/fixture/api/` (the file's number is given where the API's words are quoted), and I
didn't run them (note 6). Where I read the code as **not** doing what a step expects, the step still states what the
acceptance or the rule asks for, and note 3 names the line. Those are predictions from reading, for you to confirm
or refute.

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node W3)

| Tag | Acceptance item |
|---|---|
| AC1 | A claim is recorded and the re-quote shows its effect; renew renews within the window |
| AC2 | The inspector shows every request this page sent as an overlay that never covers content; the requests page lists them all |
| AC3 | One inspector per page; the requests page has one filter and one count and shows only times it recorded; the claim description has a label and renew's amount is named as shown (g4-defects.md sections 1 and 3) |
| AC4 | The workbench cross-node flow gates pass: sell, then cancel, claim and renew the same policy |

AC1's "renew renews within the window" can't be shown in the running app (note 2). AC4's cancel is W2's and isn't
built here, so part D runs the flow with the cancel sent by `curl`.

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

**The request log lives as long as the page.** The log behind the drawer and the requests page is kept in memory for
the life of the document (`app/workbench/browser.ts`). A reload, a new tab or a new window empties it. From step 21
to step 38, **never reload**: move between routes only by the links the steps name, or by changing only the part
after `#` in the address bar and pressing Enter (a same-document navigation). In Network, leave *Preserve log*
unticked and type `/api/` in the filter box, so Network lists the same requests as the log since the last reload.

**DevTools set-up:**
- *Slow:* Network → throttling menu → Add… → a custom profile named `W3 slow`, latency `4000` ms. Pick it to hold each
  request for 4 seconds, and pick `No throttling` afterwards.
- *Blocked:* Network request blocking (⋮ → More tools → Network request blocking, "Request conditions" in recent
  Chrome). Add `*/api/*` and tick it; untick it afterwards.

When you finish, stop both servers with Ctrl+C and run `rm -f qa-w3.db*` and `rm -rf src/web/public`. Neither
`src/web/public/` nor `src/web/test-results/` is git-ignored. Never stage them.

## Steps

### A. A claim recorded, and the quote after it (WB-5)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | WB-5 | (terminal 3) | Run the set-up block above | five `-> 201` lines. The API holds QA-W3-CLAIM, QA-W3-FUTURE, QA-W3-RENEW, QA-W3-CHQ and QA-W3-OFF | | |
| 2 | WB-5 | `#/workbench/policies/QA-W3-CLAIM/claims/new` | Open http://localhost:4180/#/workbench/policies/QA-W3-CLAIM/claims/new in a new tab | the tab reads `Record a claim · Docket`, and `Workbench` is the current nav entry. Eyebrow `Workbench · Record a claim · policy QA-W3-CLAIM`, title `Record a claim`, question "After a claim is recorded, does the quote I ask for again refund 0.00?", answer "No claim is recorded yet. Fill in the date and press Record this claim.", status `Active`, ids `Policy QA-W3-CLAIM` and `Term 1 <T> to <E>`, live note `GET /policies/QA-W3-CLAIM: 200`. Claim date holds `<T>`, Claim description is empty. The three rungs read `Quote the refund` (`Not asked yet`), `Record the claim` (`Not sent yet`), `Quote again` (`Not asked yet`). Problems: "No problem. These rules can refuse a claim here:" with `COULD-2a` and `COULD-2c` chips. One `Record this claim` button, and the drawer `The requests as sent` reads `Closed · 1 request` | | |
| 3 | WB-5 | same | Click the visible words `Claim description` above the text area. Then Elements → the text area → Accessibility | clicking the words puts focus in the text area: they are its label (AC3, g4-defects section 3). The accessible name is `Claim description` (note 3a) | | |
| 4 | WB-5 | same | In Console: `copy('x'.repeat(510))`. Paste into Claim description, then select the text area in Elements and run `$0.value.length` in Console. Then clear the field | `500`: the field takes at most 500 characters, COULD-2's limit | | |
| 5 | WB-5 | same | Type `Burst pipe under the kitchen sink` into Claim description. Pick `W3 slow`, then press `Record this claim`. Watch until it settles, then pick `No throttling` | while it runs the button reads `Recording…`, disabled (`aria-busy="true"`), and pressing it again sends nothing. The rungs go busy in turn: rung 1 `Quoting`, then rung 2 `Recording`, then rung 3 `Quoting`. The date and description keep what you typed | | |
| 6 | WB-5 | same | Read the page | rung 1 `Quoted`, Quote date `<T>` "asked for `<T>`", "Refund quoted: **£400.00**, rule applied CANCEL-1b." Rung 2 `Claim recorded`, Claim date `<T>`, "Claim CLM-QA-W3-CLAIM-1 recorded; the policy now reads hasClaims true." Rung 3 `Quoted`, "Refund quoted: **£0.00**, rule applied COULD-2." Under the rungs, `The refund after the claim` (the worked sum, its term at 0.00 with a `COULD-2` chip) and "The API quotes £0.00 under COULD-2." Header answer: "Claim CLM-QA-W3-CLAIM-1 is recorded for `<T>` and the policy now reads hasClaims true." | | |
| 7 | WB-5 | same | Network: the three `/api/` requests the press sent | in this order: `GET /api/policies/QA-W3-CLAIM/cancellation-quote?cancellationDate=<T>` → 200 with `"totalRefund":400`, `POST /api/policies/QA-W3-CLAIM/claims` with Payload `{"claimDate":"<T>","description":"Burst pipe under the kitchen sink"}` → 201, then the same quote GET → 200 with `"totalRefund":0` and `"ruleApplied":"COULD-2"`. Every figure on the page in step 6 is one of these answers' | | |
| 8 | WB-5 | same → `#/rules/COULD-2` | Click the `COULD-2` chip in the worked sum, then Back | the URL becomes `#/rules/COULD-2` and U1's rule page for COULD-2 opens (if `npm run trace` failed, U1's `Could not load` notice, never the not-built page). Back returns to the claim page | | |
| 9 | WB-5 | `#/workbench/policies/QA-W3-CLAIM` | Change the hash to the policy view | W1's policy view lists one claim, `CLM-QA-W3-CLAIM-1`, dated `<T>`, with the description you typed | | |

### B. Claims the API refuses (WB-5)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 10 | WB-5 | `#/workbench/policies/QA-W3-CLAIM/claims/new` | Reload. Set Claim date to `<T+1>`, leave the description empty, press `Record this claim` | Network: the claim's Payload is `{"claimDate":"<T+1>"}` (no description key), answered `422`. Rung 1 is `Quoted` (£0.00 under COULD-2: the policy already has a claim). Rung 2 `Claim not recorded`, "The API answered 422, Claim date in the future." Rung 3 stays `Not asked yet`: no quote is asked after a refusal. Problems: `There is a problem` listing "The claim date cannot be in the future." with a `COULD-2a` chip, and the summary entry moves focus to Claim date (the screen's action; note 3g). Header: "The claim was refused with 422 under COULD-2a. Nothing was recorded." (words recorded in 084) | | |
| 11 | WB-5 | `#/workbench/policies/QA-W3-FUTURE/claims/new` | Change the hash. Claim date `<T>`, press `Record this claim` | status `Pending`, ids `Term 1 <T+10> to <E10>`. Rung 1 quotes the full `£250.00` (compare Network: the policy hasn't started). The claim is refused `422` with a `COULD-2b` chip and "The claim date must be within the cover, `<T+10>` to `<E10>`." (the form recorded in 087) | | |
| 12 | WB-5 | `#/workbench/policies/QA-W3-NONE/claims/new` | Change the hash | Network: `GET /api/policies/QA-W3-NONE` → 404. Problems: a banner `Policy not found` with a `404` tag, a `GET-1` chip and "No policy with reference 'QA-W3-NONE'." (the form recorded in 091). The header shows no status and no term, and the live note reads `GET /policies/QA-W3-NONE: 404` | | |

### C. Renew (WB-5)

A renewal the API accepts needs a policy within 30 days of its end, which the live API can't hold today (note 2).
These steps drive every refusal the screen shows, and the defaults.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 13 | WB-5 | `#/workbench/policies/QA-W3-RENEW/renew` | Change the hash | the tab reads `Renew · Docket`. Eyebrow `Workbench · Renew · policy QA-W3-RENEW`, title `Renew`, ids `Policy QA-W3-RENEW`, `Auto-renew true`, `Term 1 <T> to <E>`. Answer: "Not asked yet. Press Renew policy to find out whether the API takes the renewal." Renewal amount holds `527.18` (hint "… Term 1 is 527.18."), Payment method holds `Direct Debit` (hint "Defaults from term 1. Cheque is refused for an auto-renewing renewal."). `2 · What the API said` reads "No problem yet. …". `3 · The new term, last on the timeline` shows term 1 only, from the API's GET. `4 · Renew` reads "Sends POST /policies/QA-W3-RENEW/renewals with the amount and payment method above.", with `Renew policy` and `Open policy QA-W3-RENEW`. The drawer is closed | | |
| 14 | WB-5 | same | Click the visible words `Renewal amount`, then `Payment method`. Elements → Accessibility on each control | each click puts focus in its own control. The accessible names are `Renewal amount` and `Payment method`, the words shown (AC3) | | |
| 15 | WB-5 | same | Pick `W3 slow` and reload. At once, before the page's read answers, select Renewal amount and type `600.00`. Wait for the read to land, then pick `No throttling` | while the read is in flight, `Renew policy` is disabled and the live note says the GET is in flight. When it lands, Renewal amount still holds `600.00`: the term amount is only a starting value and never replaces what you typed (I5, e795f19). Payment method takes the term's `Direct Debit` | | |
| 16 | WB-5 | same | Press `Renew policy` | Network: Payload `{"amount":600,"paymentMethod":"DirectDebit"}`, answered `422`. Problems: `There is a problem` with a `RENEW-1/2` chip and "A policy can be renewed from `<W>` to `<E>`." (the form recorded in 092), and the banner `Outside the renewal window`. Answer: "Not now. The renewal was refused with 422 under RENEW-1/2." The timeline still shows term 1 only | | |
| 17 | WB-5 | same | Set Payment method to `Cheque`, press `Renew policy` | Payload `{"amount":600,"paymentMethod":"Cheque"}`, `422`. Both rules are listed, not placed against a field: `RENEW-1/2` with the window, and `COULD-3` "An auto-renewing policy cannot be renewed by Cheque. Use Card or DirectDebit." (098). The `COULD-3` chip's link is `#/rules/COULD-3` | | |
| 18 | WB-5 | `#/workbench/policies/QA-W3-CHQ/renew` | Change the hash. Leave both defaults, press `Renew policy` | the defaults are `300.00` and `Cheque`, from term 1. Payload `{"amount":300,"paymentMethod":"Cheque"}`, `422`, with the same two rules: cheque is refused when it comes from the current term too (099) | | |
| 19 | WB-5 | `#/workbench/policies/QA-W3-OFF/renew` | Change the hash. Replace the amount with `0`, press `Renew policy` | the ids read `Auto-renew false`. There is no Payment method field, and the note reads "… with the amount above." Payload `{"amount":0}`, with no payment method. `422` with two rules listed: `RENEW-1/2` with the window and `RENEW-5` "The renewal amount must be greater than 0." (096) | | |

### D. One policy through sell, claim, renew and cancel (WB-5, AC4)

Reload once at step 20. From there to step 38, never reload (see "The request log lives as long as the page").

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 20 | WB-5 | `#/workbench/sell` | Open http://localhost:4180/#/workbench/sell and **reload**. Sell `QA-W3-FLOW` with W1's form: `Household`, start `<T>`, amount `350.00`, `Card`, Auto-renew on, Policyholder 1 `Ada` `Lovelace` `1985-12-10`, address line 1 `12 Mill Lane`, postcode `M15 4PS`. Press `Sell this policy`, then `Open policy QA-W3-FLOW` | `201`, then W1's policy view: `Active`, term 1 `<T>` to `<E>`. The claims section says no claim is recorded, and doesn't say that recording a claim is not built yet: W3 built it (note 3b) | | |
| 21 | WB-5 | `#/workbench/policies/QA-W3-FLOW/claims/new` | Change the hash. Claim date `<T>`, description `Storm damage to the roof tiles`, press `Record this claim` | rung 1 £350.00 under CANCEL-1b, rung 2 `CLM-QA-W3-FLOW-1` recorded, rung 3 £0.00 under COULD-2: the quote drops to £0 after the claim | | |
| 22 | WB-5 | `#/workbench/policies/QA-W3-FLOW/renew` | Change the hash. Leave the defaults, press `Renew policy` | the defaults are `350.00` and `Card`. `422` under `RENEW-1/2` with "A policy can be renewed from `<W>` to `<E>`.": today is outside the window | | |
| 23 | WB-5 | `#/workbench/policies/QA-W3-FLOW/cancel`, then terminal 3 | Change the hash to the cancel route. Then run `curl -s -X POST http://localhost:5090/policies/QA-W3-FLOW/cancellation -H "content-type: application/json" -d '{}'; echo` | the cancel route is the not-built page (W2's). The curl answers `201` with `"totalRefund":0` and `"ruleApplied":"COULD-2"`: the claim in step 21 means no refund | | |
| 24 | WB-5 | `#/workbench/policies/QA-W3-FLOW/claims/new` | Change the hash. Claim date `<T>`, press `Record this claim` | the header status reads `Cancelled`. Rung 1 `Quote not returned`, "The API answered 409, Policy already cancelled." Rung 2 `Claim not recorded`. Problems: a banner `Claim on a cancelled policy` with a `409` tag, a `COULD-2c` chip and "The policy was cancelled on `<T>`, so a claim cannot be recorded." (088's form). Rung 3 stays `Not asked yet` | | |
| 25 | WB-5 | `#/workbench/policies/QA-W3-FLOW/renew` | Change the hash, press `Renew policy` | status `Cancelled`. `409`: a banner `Cancelled policy cannot be renewed` with a `RENEW-6` chip and "The policy was cancelled on `<T>`, so it cannot be renewed." (100's form). Answer: "Not now. The renewal was refused with 409 under RENEW-6." | | |
| 26 | WB-5 | `#/workbench/policies/QA-W3-FLOW` | Change the hash | `Cancelled`, one claim `CLM-QA-W3-FLOW-1` with its description, the cancellation dated `<T>` with refund `0.00` under `COULD-2`, and no refund row | | |

### E. The inspector drawer (WB-7)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 27 | WB-7 | `#/workbench/policies/QA-W3-FLOW/renew` | Change the hash. Read the closed drawer, then press `Show requests` | closed, it reads `Closed · N requests`, where N is the number of `/api/` rows in Network since step 20's reload. Open, it reads `Open · N requests` and "Docked, resizable. …", and lists every one of them, newest first, numbered #N down to #1: the GET this page just sent on top, then step 25's `POST /policies/QA-W3-FLOW/renewals` 409, and so on back to step 20's `POST /policies` 201. Paths carry no `/api` prefix, and quote paths keep their `?cancellationDate=` query | | |
| 28 | WB-7 | same | In the drawer, read the 409 renewal. In Network, open the same request's Payload and Response | the drawer shows the request body (`amount`, `paymentMethod`) and the response body (`title`, `status`, `detail`, `ruleId`, `instance`, …) with every key and value Network shows, in the same order. The drawer lays each body out with 2-space indents (note 3k) | | |
| 29 | WB-7 | claim, renew, `#/workbench/requests`, `#/workbench`, `#/workbench/sell`, `#/workbench/policies/QA-W3-FLOW` | On each route, run in Console: `[...document.querySelectorAll('h2,h3,h4')].filter((h) => h.textContent === 'The requests as sent').length` | `1` on the claim and renew routes: one inspector per page (AC3). `0` on the requests page and the home, whose screens list no drawer. On the sell form and the policy view, write down what you see: their inspector regions are still W1's "not built yet" (note 3l) | | |
| 30 | WB-7 | `#/workbench/policies/QA-W3-FLOW/claims/new` | Open the drawer. At 1440 × 900 and at 390 × 844 (device toolbar), scroll from the top to the bottom, then Tab through every control from Claim date to `Hide requests` | the drawer never covers content (AC2, g4-defects section 1): at the bottom of the page the `Record this claim` button, its note and the Problems region sit wholly above the drawer, and every control Tab reaches is visible when focused, never under the drawer (note 3c) | | |
| 31 | WB-7 | same | With the drawer open, pick `W3 slow` and press `Record this claim`. Watch the drawer, then pick `No throttling` | as each request leaves, it appears at the top of the drawer at once, before any answer, shown as waiting with no status (g4-defects section 3: a submitting screen logs its request in flight). When it lands it shows its status: the quote `409`, then the claim `409`. The count rises by 2 | | |

### F. The requests page (WB-7)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 32 | WB-7 | `#/workbench/requests` | Change the hash | the tab reads `Requests · Docket`, `Workbench` is current. Title `Requests`, question "What did this browser send to the API, and what came back?", answer "N requests sent since this page opened, listed newest first. …", with N the `/api/` rows in Network. The table lists all N, newest first: `#`, Method, Path (no `/api`), Status as a word-and-colour tag, Duration. `One exchange: #N` shows the newest | | |
| 33 | WB-7 | same | Look at the request-log region's controls and counts | **one** filter and **one** count of the rows shown (AC3; g4-defects section 3: "wb-requests has two filters with two counts") (note 3d) | | |
| 34 | WB-7 | same | Narrow the list to the POST rows, then to the 409 rows, then clear. Use whichever filter the page has | each time only the matching rows remain, the count says how many of N are shown, and clearing brings all N back. Nothing is sent: Network gains no row | | |
| 35 | WB-7 | same | Press the path of step 21's `POST /policies/QA-W3-FLOW/claims` (201) row (its name is `Open request #k, POST /policies/QA-W3-FLOW/claims`). Compare with that request in Network | `One exchange: #k`: `POST /policies/QA-W3-FLOW/claims`, request body `{"claimDate":"<T>","description":"Storm damage to the roof tiles"}`, status `201`, and the response body with `reference` `CLM-QA-W3-FLOW-1`, `claimDate`, `description` and `hasClaims` `true`, as Network shows them. The JSON viewer `response to request #k` is open | | |
| 36 | WB-7 | same | Open step 25's `POST /policies/QA-W3-FLOW/renewals` (409) row | the request body and the 409 problem details exactly as Network shows them: `title`, `detail` "The policy was cancelled on `<T>`, so it cannot be renewed.", `ruleId` `RENEW-6` | | |
| 37 | WB-7 | same | Read every time and duration on the page (the footer is the shell's, so leave it out) | the page shows only times it recorded (AC3): every Duration reads `not recorded`, and no timestamp appears | | |
| 38 | WB-7 | same | Reload | the log is empty, and the page says so: "0 requests sent since this page opened", the log's "No requests sent yet. …" and "No request has been sent yet, so there is no exchange to show." Nothing on the page says a filter hid any row (note 3e) | | |

### G. No answer from the API (WB-7, WB-5)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 39 | WB-5 | `#/workbench/policies/QA-W3-CLAIM/claims/new` | Change the hash and wait for the page to read the policy. Turn *Blocked* on. Claim date `<T>`, press `Record this claim` | a banner `The API did not answer`, "No request was completed. Nothing was changed by this screen.", with `Try again`. Rung 1 `Quote not returned` and rung 2 `Claim not recorded`, each "The API did not answer." Header: "The API did not answer, so the claim may not have been recorded." The button is enabled again, and the date keeps `<T>` | | |
| 40 | WB-7 | same, then `#/workbench/requests` | Open the drawer and read the two blocked requests. Then change the hash to the requests page and open each of them | each is shown as having had no answer, not as still waiting, and with no status the API never sent: no `0`. The exchange pane reads "No response was read." (note 3f) | | |
| 41 | WB-5 | `#/workbench/policies/QA-W3-CLAIM/claims/new` | Change the hash back. Turn *Blocked* on before the read answers (or reload with it on), then turn it off and press `Try again`. Watch Network | the banner goes once the read answers `200`. Write down what `Try again` sent: the screen's action says it "repeats the request that did not answer" (note 3h). No claim is recorded until you press `Record this claim` | | |

### H. Widths and themes (WB-5, WB-7)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 42 | WB-5 | QA-W3-FLOW's claim and renew routes | Device toolbar at 390 × 844, then 1440 × 900, in light and dark (top-bar toggle). In Console: `document.documentElement.scrollWidth - document.documentElement.clientWidth` | `0` every time: no sideways page scroll. The rungs, the worked sum and the timeline are readable in both themes, and every status tag has a word as well as a colour | | |
| 43 | WB-7 | `#/workbench/requests` (with a few requests in its log) | The same four checks | `0` every time. At 390 the request table scrolls inside its own frame, and its last column (Duration) isn't clipped | | |

### I. The acceptance suite: what the running app can't show

First stop the API (terminal 1) and the preview (terminal 2), and run `rm -rf src/web/public`. The suite starts its
own API on 5090 with a fresh database in the OS temp directory, and stops before any test if an API it didn't start
already answers there. It builds and previews the app on 4180 itself.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 44 | WB-5 | shell | `DOCKET_API_PORT=5090 DOCKET_APP_PORT=4180 npm --prefix src/web run e2e -- W3/ --grep "WB-5 · "`, then `npm --prefix src/web run test -- -t "WB-5 · "` | all passed, 0 failed, 0 skipped, in both. This includes the one side the running app can't show: "a renewal inside the window answers with the renewed policy, its new term last" (client unit test, note 2), and parity of wb-claim and wb-renew with `docs/ui/derived/W3/` | | |
| 45 | WB-7 | shell | The same, with `"WB-7 · "` | all passed: the log and drawer hold the claim's exact exchange on the live API; the client's logging fetch keeps a refused and an unanswered request; parity of wb-requests | | |
| 46 | WB-7 | shell | After the trace step has committed W3's baselines (`docs/ui/baselines/wb-claim/`, `wb-renew/`, `wb-requests/`): `DOCKET_API_PORT=5090 DOCKET_APP_PORT=4180 npm --prefix src/web run e2e -- regression/ --workers=2` | every W3 screen matches its baseline. The only failures are the known `activity` captures at 1440 (a U7 line from U2); no earlier screen regressed | | |
| 47 | WB-5 | shell | `DOCKET_API_PORT=5090 DOCKET_APP_PORT=4180 npm --prefix src/web run e2e -- W1/ --workers=2` | W1's suite still passes on W3's head. Record any failure by title (note 3i: I expect two) | | |
| 48 | WB-7 | shell | `npm --prefix src/web run test` | every unit test passes (257 at the attempt-2 gates) | | |

The whole W3 suite in one run: `DOCKET_API_PORT=5090 DOCKET_APP_PORT=4180 npm --prefix src/web run e2e -- W3/ --workers=2`
(33 passed at the attempt-2 gates).

## Notes

1. **The ports.** The app reaches the API only through its `/api` proxy, so `DOCKET_API_PORT=5090` is the one
   setting that points this run at W3's API. `curl` in steps 1 and 23 goes to the API directly.
2. **Renewing inside the window isn't shown live.** RENEW-1/2's window opens 30 days before a term's end. The live
   API has no demo clock (WB-8 is cut), and SELL-2 refuses a start in the past, so no policy the running app can sell
   is renewable today. What proves the accepted side: the API's own fake-clock test
   (`RenewWindowTests.Renewal_30_days_before_the_end_is_accepted`, recorded in
   `docs/ui/fixture/api/fake-clock/`), and the client unit test in step 44. That unit test's 201 answer is built in
   the test from a recorded policy with a second term added. It is not an answer the API sent. No test and no step
   here shows the renew screen drawing an accepted renewal's new term last on the timeline. If AC1's "renew renews
   within the window" needs that on screen, it's a steer.
3. **Where I read the code as not meeting a step (predictions, not results):**
   - a. *Step 3.* `RecordClaim.tsx:169-170` draws the words as an `h3` and names the text area with `aria-label`;
     there's no `<label>`, so clicking the words shouldn't move focus. The derived reference does the same. AC3 and
     g4-defects section 3 say "has no `<label>`".
   - b. *Step 20, and how you reach W3's routes.* `PolicyView.tsx:167` still says "Recording a claim is not built
     yet." on an empty claims list, and the actions region (`:386`) is still not built, so no link leads to the claim
     or renew screens. Nothing links to `#/workbench/requests` either.
   - c. *Step 30.* The kit drawer is `position: sticky; bottom: 0` (`InspectorDrawer.module.css:3-4`), the mechanism
     g4-defects section 1 names. Whether it covers content here needs eyes.
   - d. *Step 33.* `RequestLogPage.tsx:45-59` draws a FilterBar (Method, Status, "Showing … of … requests, …") and then
     the kit RequestLog, which draws its own `Filter requests` box and "Showing … of …" (`RequestLog.tsx:76-92`). That's
     two filters and two counts. The signed-off screen's actions list both filters too, so the screen and AC3 disagree.
     You decide which holds.
   - e. *Step 38.* With an empty log, FilterBar's match count is 0, so it draws "No requests match these filters."
     with no filter set (`FilterBar.tsx:85-92`).
   - f. *Step 40.* A request that got no answer keeps `status: null`. The drawer reads that as `pending`
     (`RequestsDrawer.tsx:23`), so a blocked request looks like it's still waiting. The log table maps it to `0`
     (`RequestLogPage.tsx:26`), a status the API never sent.
   - g. *Step 10.* The error summary isn't given the field ids (`RecordClaim.tsx:204`), so its entry likely won't link
     to Claim date. The screen's actions list that link.
   - h. *Step 41.* `Try again` re-reads the policy only (`RecordClaim.tsx:221-225`); it doesn't resend the quote or the
     claim.
   - i. *Step 47.* W1's `wb-3.spec.ts:186-205` asserts that the renew and record-a-claim routes are not built, that they
     send no request and show no date. W3 built both, so I expect those two W1 tests to fail at this head. W3's gates
     ran `tests/web/e2e/W3` only. No test may be weakened, so the orchestrator and you decide how W1's premise is
     retired.
   - k. *Steps 28 and 35.* The log keeps the method, path, bodies and status (`api.ts:368-374`), not headers. The
     screen catalogues header disclosures and a `Copy curl`, and neither is drawn. The bodies are parsed and laid out
     again, so the values are exact but the bytes and whitespace aren't the wire's.
   - l. *Step 29.* The sell form's `the request as sent (inspector)` region and the policy view's `requests that
     touched this policy` region are still W1's "not built yet". The wb-sell and wb-policy screens catalogue the drawer.
   - m. *Not a step.* `tests/web/e2e/W3` has no A11Y-1 (axe) test on W3's three routes, although the web-testing skill
     asks for axe on every route a node builds. A11Y-1 isn't a W3 rule. That gap is in the acceptance suite I wrote at
     t1.
4. **The log is the page's, not the browser's.** It's kept in memory (`app/workbench/browser.ts:15-16`), so a reload
   or a new tab starts it empty, and two tabs have two logs. The header's "since this page opened" means since the
   last load.
5. **What only the suite shows.** A held request in flight for exactly as long as the test wants (`W3 slow` only
   delays it), the accepted renewal (note 2), and parity with the derived references.
6. **The tester didn't run these steps.** Starting the API writes a database file, and `npm run build` and
   `npm run trace` write `src/web/dist/` and `src/web/public/`, all outside the tester's write scope. Review is also
   running against this head. The expected words are from the code at e674cdc and from the recordings named in each
   row. The values that move with the clock (`T`, `E`, `W`, `E10`) are given as what to compare against, not as fixed
   text.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: ___ of 48 · Steer (if any): ______

Steps not run, or only partly seen, and why:
- ______

Defects found (step, what you saw):
- ______

Decision: Pass / Pass with U7 lines (list them) / Fail
