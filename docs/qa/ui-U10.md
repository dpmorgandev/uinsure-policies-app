# QA script: ui / U10, the web rename, one-key F5, trace on start, the plan switcher and the carried debt

Rule IDs: DAG-1, DATA-1, SEC-1, WB-5, WB-7, NAV-4, AGENT-2 (the rules the node's green commits name; the node's
`rules: []`, the acceptance lines in `docs/plans/active/ui.dag.yaml` are the contract).
Branch: feature/ui/U10   Worktree: .claude/worktrees/ui-U10
Commit under test: 5ac6343 or later. The work landed in c9f8844 and c314a61 (red), 8215566 (plan switcher), 7eee3f4
(trace on start), 4ca549f (Renew amount), 951a756 (request log cap), a4a9caa (search entries), adb4b3d and 78f52d2
(one-key F5), 8b467fb (the rename). Record the SHA you test in the sign-off.
Ports: the **API and web** profile's fixed ports, the API on 5080 and the dev server on 4170.

The Actual and Pass/Fail columns are empty. I wrote the steps from the files at 5ac6343 and didn't run them (note 4).

## Preconditions

- [ ] Visual Studio 2022 or later with the **Node.js development** workload, the .NET 10 SDK, and Node 22.22 or
      later on `PATH`.
- [ ] Nothing listening on 5080 or 4170 (stop any API or dev server started from a worktree).
- [ ] Commands run in PowerShell from the worktree root unless a step names the clone.

## Steps

### Part A: a fresh clone, F5, and the trail on start (DATA-1)

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | DATA-1 | worktree root | `git clone --branch feature/ui/U10 . "$env:TEMP\u10-fresh"`, then `cd "$env:TEMP\u10-fresh\src\Uinsure.Policies.Web"; Test-Path public\trace.json; npm ci` | The clone succeeds. `Test-Path` prints `False`: a fresh clone has no `trace.json` (it is git-ignored). `npm ci` exits 0. Don't run `npm run trace` | | |
| 2 | — | Visual Studio | Open the clone's `Uinsure.Policies.slnx`. Look at Solution Explorer | The `src` folder holds five projects: Api, Domain, Persistence, Services and `Docket.Web` (path `src\Uinsure.Policies.Web`), loaded. There is no `web` solution folder. `tests` holds the four .NET test projects | | |
| 3 | — | Visual Studio | Choose the **API and web** profile in the startup dropdown; then Solution → Configure Startup Projects | Two projects start: `Uinsure.Policies.Api` on the `http` target and `Docket.Web` on the `Vite dev server` target. Nothing else | | |
| 4 | DATA-1 | Visual Studio | F5 | No "unable to launch" message. The API opens `http://localhost:5080/health/live`, which answers healthy. The Vite console compiles the trail first, then prints `Local: http://localhost:4170/`, and Docket opens in your default browser (Vite's `--open`, no debugger attached) | | |
| 5 | DATA-1 | `http://localhost:4170/`, DevTools Network | Reload the tab F5 opened | The overview draws the trail, not "Could not load trace.json". `/trace.json` answers 200. Back in the clone's shell, `Test-Path public\trace.json` now prints `True` and `git status` doesn't list it | | |

### Part B: the explorer (DAG-1, NAV-4, AGENT-2, SEC-1)

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 6 | DAG-1 | the primary nav | Click **Plan** | `#/plans/build` opens with a **Plans** tab row above the page holding one tab for each plan in trace.json: `build` and `ui` on the real trail (note 3). `build` is the current tab | | |
| 7 | DAG-1 | the Plans tabs | Click `ui` | The URL is `#/plans/ui`. The plan header names `docs/plans/active/ui.dag.yaml`, and the DAG draws the ui nodes coloured by status, U10 in progress. The `build` tab takes you back to `#/plans/build` | | |
| 8 | NAV-4 | the top bar search | Type `dag-1` and choose the rule; then type `docs/qa/ui-U9` and look at the path entry's link | The rule entry opens `#/rules/DAG-1`. The path entry links to the file itself (a GitHub URL for `docs/qa/ui-U9.md`), not to an in-app `#/files/` route | | |
| 9 | AGENT-2 | `#/plans/ui/U10/activity` | Open it | One swimlane per agent and the main session, over time, with the tool, file or command on each mark. If the page says "N lines are not drawn as lanes", it is still the screen's own markup: that carry is open (note 2) | | |
| 10 | SEC-1 | any rule page, DevTools | In Elements, read `<head>`; then follow a GitHub link (a SHA or a file:line link) and run `document.referrer` in the GitHub tab's console | The head has `<meta name="referrer" content="no-referrer">`. `document.referrer` on the GitHub page is `""`: the Docket URL didn't leave the app (note 1) | | |

### Part C: the workbench (WB-5, WB-7)

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 11 | WB-5 | `#/workbench/sell` | Sell `QA-U10-RN`: start today, amount `365.00`, Card, auto-renew on | 201, and the policy page for `QA-U10-RN` | | |
| 12 | WB-5 | `#/workbench/policies/QA-U10-RN/renew` | As soon as the page shows, click into **Renewal amount**, clear it, type `527.18`. Wait until the hint reads "Term 1 is 365.00". Press **Renew policy** | The field holds exactly `527.18` throughout, never the term's amount joined to it (such as `365.00527.18`). The answer is 422 under `RENEW-1/2`: a policy sold today is a year from its end, outside the window | | |
| 13 | WB-5 | the same page | Type `0x10` and press **Renew policy**; then `1e2` and press again | Each answers 400 with an `errors` entry for the amount and no `ruleId`. Neither is read as 16 or 100 | | |
| 14 | WB-7 | `#/workbench/requests` | Open the three `POST /api/policies/QA-U10-RN/renewals` exchanges | Each shows the exact request and response. The bodies send `"amount": 527.18` as a number and `"amount": "0x10"` and `"amount": "1e2"` as strings, with the 422 and the two 400 bodies as the API returned them | | |

### Part D: the renamed tree

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 15 | — | Visual Studio | Shift+F5 | The API and the Vite console both stop. Nothing listens on 5080 or 4170 | | |
| 16 | — | worktree root | `git ls-files src/web tests/web`; `dotnet build Uinsure.Policies.slnx -warnaserror`; `dotnet test --solution Uinsure.Policies.slnx` | `git ls-files` prints nothing. The build ends with 0 warnings and 0 errors and no `npm` or `Docket.Web` line. Every test passes, including `WebProjectLocationTests` and `LaunchProfileTests` (passed / failed / skipped: __ / __ / __) | | |

## Covered by tests, not by a step

Run from `src/Uinsure.Policies.Web`: `npm test` (unit) and `npm run e2e`.

| Rule | Test | Why not a step |
|---|---|---|
| DATA-1 | `DATA-1 · a compile that fails is reported in the console, naming each problem, and no trace.json is served` (`unit/toolchain/data-1-trace-on-start.test.ts`) | Breaking the trail by hand isn't a QA action. `/trace.json` answers 503, so the page says it couldn't load and never shows an older file |
| DAG-1 | `DAG-1 · the Plan nav entry offers every plan in trace.json: build, ui and inv-001…` (`e2e/U10/dag-1.spec.ts`) | The real trail has no investigation plan; the `plans` fixture does |
| WB-5 | `WB-5 · a person on the amount field when the policy read lands keeps exactly what they type…` (`unit/screens/wb-5-renew-merge.test.tsx`) | Step 12 can't hold the policy read; the test holds it until after the click |
| WB-7 | `WB-7 · the request log is capped: after 2000 exchanges it holds fewer, the newest kept…` (`unit/client/wb-7-log-cap.test.tsx`) | 2000 requests by hand. The cap is 1000 |
| NAV-4 | `NAV-4 · a path entry names its repo path and no route; a rule, node or commit names its route and no repo path` (`unit/data/nav-4.test.ts`) | Step 8 shows one of each |
| SEC-1 | `SEC-1 · the static host sends Referrer-Policy: no-referrer on every response` (`unit/screens/sec-1-links-out.test.tsx`) | The Static Web App isn't deployed |
| AGENT-2 | `AGENT-2 · the notice of build/F3's two lines not drawn as lanes is drawn by a kit component…` (`e2e/U10/agent-2.spec.ts`) | It is `test.fixme`: it doesn't run (note 2) |

## Notes

1. **SEC-1's assertions changed after red.** At c314a61 the test asserted `rel` contains `noreferrer` on the four kit
   links (FileLineLink, ReceiptFigure, PageHeader's id link, RuleEvidence's QA and PR links). In 8b467fb, the rename
   commit, it was re-pointed to the acceptance's stated alternative: the document's `no-referrer` meta and the host's
   `Referrer-Policy` cover the links, and none sets a weaker `referrerpolicy`. The kit is unchanged. It was an
   orchestrator ruling, and it's stated in that commit's message, but it is an assertion changed after its red
   commit, so it's yours to accept or turn into a defect. Step 10 shows the cover works in a browser.
2. **AGENT-2 is carried, not done.** The notice that accounts for the lines the lanes don't draw is still the activity
   screen's own `<p class="s-events-note">`. Making it a kit state needs a `/kit-gap`, cut from U10 under the
   deadline (orchestrator ruling, 8b467fb). Its e2e test is `test.fixme`, so it neither passes nor fails. Step 9
   checks only that the lanes still draw.
3. **The plan switcher is a tab row on the plan page**, not a menu on the nav entry: **Plan** still opens the build
   plan first, and the tabs reach the rest. The acceptance asked for "every plan in trace.json, each opening
   `#/plans/<id>`", which this meets. Say at sign-off if you wanted the choice in the nav itself.
4. **I didn't run these steps.** Visual Studio, the clone and the browser are outside what I run at the QA step. The
   expected text is from the files at 5ac6343. The visual regression, the 22 re-derived shell parity tests and the
   `--repeat-each` runs of STATS-1, NAV-5 and the W3 wb-5 specs are gate t9's, not steps here.
5. Delete `$env:TEMP\u10-fresh` when you're done.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: ___ of 16 · Steer (if any): ______

Notes 1 and 2: ☐ accept the SEC-1 re-point   ☐ accept the AGENT-2 carry   ☐ defect (which)

Steps not run, or only partly seen, and why:
- ______

Decision: ☐ sign off U10   ☐ steer (write it above)   ☐ defect (step numbers)
