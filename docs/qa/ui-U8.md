# QA script: ui / U8, Tech debt: W3's carries (D1, W3 review A2/A4)

Rule IDs named by the tests: WB-5, WB-7, A11Y-1, HONEST-1, NAV-5 (U8 is rules-less; its acceptance lines in
`docs/plans/active/ui.dag.yaml` are the contract).
Branch: feature/ui/U8   Worktree: .claude/worktrees/ui-U8
Commit under test: HEAD on `feature/ui/U8` at t8, attempt 2 (after 53f68cd, the A1 fix round: I1 log body, I2 amount
as typed, I5 hint). Record the SHA you test in the sign-off.
App URL: http://localhost:4182   API: http://localhost:5092 (U8's ports, 4170 + 12 and 5080 + 12).

The Actual and Pass/Fail columns are empty. I wrote the steps from the code and the tests at HEAD and didn't run
them: starting the API writes a database file and `npm run build` writes `src/web/dist/`, both outside my write
scope. The API's exact 400 wording for a non-numeric amount (step 9) is not quoted for that reason.

## Preconditions

- [ ] Node 22 and the .NET SDK on `PATH`. `npm --prefix src/web ci` done in this worktree.
- [ ] Nothing listening on 5092 or 4182 (`netstat -ano | grep -E ":(5092|4182) "`, no match).
- [ ] Chrome or Edge with DevTools, in a guest window. A custom throttling profile `U8 slow`, latency `4000` ms
      (Network → throttling → Add…).

Run every command from the worktree root, `.claude/worktrees/ui-U8`, in Git Bash.

## Run the app on U8's ports

Terminal 1, the API, on a fresh database:

```sh
git rev-parse HEAD                                       # write it down
rm -f qa-u8.db qa-u8.db-shm qa-u8.db-wal
ASPNETCORE_ENVIRONMENT=Development ConnectionStrings__Policies="Data Source=$(pwd -W)/qa-u8.db" \
  dotnet run --project src/Uinsure.Policies.Api --no-launch-profile --urls http://localhost:5092   # leave it running
```

Terminal 2, the app:

```sh
npm --prefix src/web run trace      # trace.json at HEAD, for the U7 tour (step 12)
npm --prefix src/web run build
DOCKET_API_PORT=5092 npm --prefix src/web run preview -- --port 4182 --strictPort   # leave it running
```

Terminal 3, setup:

```sh
curl -s http://localhost:4182/api/health/ready; echo     # Healthy: the proxy reaches 5092
T=$(TZ=Europe/London date +%F); echo "T=$T"
sell() {  # sell REFERENCE AMOUNT METHOD AUTORENEW
  curl -s -o /dev/null -w "$1 -> %{http_code}\n" -X POST http://localhost:5092/policies -H "content-type: application/json" \
    -d "{\"reference\":\"$1\",\"type\":\"Household\",\"startDate\":\"$T\",\"amount\":$2,\"autoRenew\":$4,\"paymentMethod\":\"$3\",\"policyholders\":[{\"firstName\":\"Ada\",\"lastName\":\"Lovelace\",\"dateOfBirth\":\"1985-12-10\"}],\"property\":{\"addressLine1\":\"12 Mill Lane\",\"addressLine2\":null,\"addressLine3\":null,\"postcode\":\"M15 4PS\"}}"
}
sell QA-U8-ABC   400.00 Card        false
sell QA-U8-ABC-2 250.00 Card        false
sell QA-U8-RENEW 527.18 DirectDebit true
```

Three `-> 201` lines. **The request log lives as long as the page:** in steps 2 to 6 never reload; move only by
changing the part after `#` in the address bar and pressing Enter.

## Steps

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | WB-5 | `#/workbench/policies/QA-U8-ABC` | Open http://localhost:4182/#/workbench/policies/QA-U8-ABC. Look at the Actions region; inspect it in Elements | Three kit Buttons, in order: `Quote and cancel` (primary, receipt icon), `Record a claim`, `Renew`. Each is a `<button>`, not an `<a>`. Pressing `Renew`, then Back, moves to `…/renew` and back with no reload | | |
| 2 | WB-7 | `#/workbench/policies/QA-U8-ABC-2` | Change the hash to QA-U8-ABC-2's view and wait for it to load | "Requests that touched this policy" lists `GET /policies/QA-U8-ABC-2` | | |
| 3 | WB-7 | `#/workbench/policies/QA-U8-ABC` | Change the hash back to QA-U8-ABC's view | Its requests region lists only `/policies/QA-U8-ABC` rows (the read from step 1 and this one). No `/policies/QA-U8-ABC-2` row, though `QA-U8-ABC` is its prefix | | |
| 4 | WB-7 | `#/workbench/policies/QA-U8-RENEW` | Pick the `U8 slow` throttle in Network, then change the hash to QA-U8-RENEW's view. Read the requests region at once | While the read is held, its row's Status reads `pending`, never `0`. After about 4 s it becomes `200` | | |
| 5 | WB-7 | `#/workbench/policies/QA-U8-ABC` → `#/workbench/requests` | Still on `U8 slow`: change the hash to QA-U8-ABC's view, then within 4 s to `#/workbench/requests` | The log table's row for that read reads `pending` in Status, never `0`, then `200` once answered. Set `No throttling` afterwards | | |
| 6 | WB-7 | `#/workbench/requests` | Read the `One exchange` region for the newest exchange | A part headed `Repeat it` holds a code block labelled `curl for request #N` reading `curl -X GET '…/policies/QA-U8-ABC'`, with a `Copy curl` button. Copy it and run it in terminal 3: the API answers the same policy | | |
| 7 | HONEST-1 | `#/workbench/policies/QA-U8-RENEW/renew` | Open the renew screen | Payment method holds `Direct Debit`; its hint reads "Defaults from term 1. Cheque is refused for an auto-renewing renewal." The term holds a payment, so the hint names its default | | |
| 8 | WB-5 | `#/workbench/policies/QA-U8-RENEW/renew` | DevTools → Network → right-click `GET /api/policies/QA-U8-RENEW` → Override content (pick any folder, allow). Edit the body's `"payments"` to `[]`, save, reload. Afterwards remove the override | Payment method shows its placeholder `None returned for the term`, never `Card` (no fallback). The hint reads "The read named no method for term 1. Cheque is refused for an auto-renewing renewal.", with no "Defaults from term" | | |
| 9 | WB-5 | `#/workbench/policies/QA-U8-RENEW/renew` | Clear Renewal amount, type `abc`, press `Renew policy`. In Network, open the `POST …/renewals` and read its payload | The payload carries `"amount":"abc"`, never `null` or `0`. The API answers 400 (a validation problem naming the amount), and `What the API said` shows that 400 | | |
| 10 | WB-5 | same | Clear Renewal amount (leave it empty), press `Renew policy` | The payload carries `"amount":""`, never `null` or `0`; the API answers 400 and the page shows it | | |
| 11 | A11Y-1 | shell | `DOCKET_API_PORT=5092 DOCKET_APP_PORT=4182 npm --prefix src/web run e2e -- U8/a11y-1.spec.ts` (Playwright reuses the app on 4182 and the API on 5092) | wb-claim, wb-renew and wb-requests have no axe violation, light and dark, at 1440 and 390: all passed | | |
| 12 | NAV-5 | `#/about` | Open http://localhost:4182/#/about in a new tab (a cold load). Hover the tour's Rule stop, then click it, Back, and click Walkthrough | Once the trace loads, the Rule stop's `href` names a rule (`#/rules/<ID>`, SELL-1 on today's trail), never bare `#/rules`. Walkthrough opens that rule's node | | |
| 13 | NAV-5 | shell | `DOCKET_APP_PORT=4182 npm --prefix src/web run e2e -- U7/nav-5.spec.ts --repeat-each=3` | 12 passed: the tour tests wait for the Rule stop to name a rule (the old Walkthrough test failed 2 of 6) | | |
| 14 | WB-5 | shell | `DOCKET_API_PORT=5092 DOCKET_APP_PORT=4182 npm --prefix src/web run e2e -- U8/ W3/`, then `npm --prefix src/web run test -- -t "WB-5 · \|WB-7 · \|HONEST-1 · "` | All passed: the U8 specs, W3's specs on literal references with the COULD-3 wait, and the unit tests for the amount as typed, the hint, and the log body kept (I1) | | |

## Notes

1. Step 8 is the only way to see a term with no payment on the live API: every sale records one. The same case,
   and a payment type the form doesn't list, are proven by `U8/wb-5.spec.ts` (step 14).
2. Not in a step, checked by review: `routes.tsx`'s doc comment, `parity.ts`'s orphan comment, the log cap. The
   remaining debt is carried to U10 (6109dd9, 368833d).
3. When you finish, stop both servers with Ctrl+C and run `rm -f qa-u8.db*`. Never stage `src/web/public/`,
   `src/web/dist/` or `src/web/test-results/`.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: ___ of 14 · Steer (if any): ______

Steps not run, or only partly seen, and why:
- ______

Defects found (step, what you saw):
- ______

Decision: Pass / Pass with U10 lines (list them) / Fail
