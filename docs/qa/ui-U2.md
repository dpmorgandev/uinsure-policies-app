# QA script: ui / U2, Plan DAG, node page and walkthrough

Rule IDs: DAG-1, NODE-1, TDD-1, RULE-3, DATA-8
Branch: feature/ui/U2   Worktree: .claude/worktrees/ui-U2
Commit under test: 40c2915. That was HEAD when this script was written, after t9's gates and attempt 2's reviewer and security
verdicts (both PASS). This script's own commit changes only this file. The rebase (t12) and the trace commit (t13) come
before you test, so record the SHA you test in the sign-off.
App URL: http://localhost:4173. U2 is position 3 in `ui.dag.yaml`, so its app port is 4173. API: 5083, not used by U2.

U2 builds these pages:

- the plan page (`#/plans/<plan>`): its header, the graph and the graph's text equivalent;
- the overview's "plan at a glance" (`#/`);
- the node page's rules, acceptance and tasks (`#/plans/<plan>/<node>`), with the node header and tabs taken from the
  route;
- the walkthrough (`#/plans/<plan>/<node>/commits`);
- the diff on the commit page (`#/commits/<sha>`) and the rule page's red and green diffs (`#/rules/<id>`);
- the compiler's plans, nodes, commits, diffs and in-flight tolerance.

These regions still show the not-built-yet pattern: the node page's attempts and "who touched what", the commit page's
header and trailers, and the plan page's investigation body. Those are U3's and U4's.

The Actual and Pass/Fail columns are empty. I wrote these steps from the code and the acceptance suite at 40c2915, and
didn't run them in the app. `npm run trace` and `npm run build` write into `src/web/`, which is outside my write scope, and
the guard also refused a compile into a scratch clone. I counted the figures in the Expected column from the committed
files at 40c2915 (`docs/plans/active/*.dag.yaml`, `docs/trace/**`, the trailers in `git log`). Where a figure could move,
the step gives the command that counts it.

From reading the code, I expect **six steps to fail or to need your ruling**. Notes 1 to 6 explain each, and the steps
carry them in bold. Check those first.

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node U2)

| Tag | Acceptance item |
|---|---|
| AC1 | The plan page shows the DAG with each node status and a text equivalent, in file order |
| AC2 | The node page shows the node header, its tasks and tabs from the route |
| AC3 | Every node link opens the node it names, and every node page (node, walkthrough, loop, activity) heads the node shown, not F3 (g4-defects.md sections 1 and 3) |
| AC4 | The walkthrough lists the node commits in order with their TDD steps; a commit shows its diff |
| AC5 | A node in flight compiles with what exists and shows as in progress; malformed lines are reported, never dropped |

## Preconditions

- [ ] Node 22 on `PATH` (`node --version`).
- [ ] `npm --prefix src/web ci` done in this worktree.
- [ ] Playwright's Chromium installed, for part F (`npx --prefix src/web playwright install chromium`).
- [ ] Nothing listening on 4173 (`netstat -ano | grep ":4173 "`, no match).
- [ ] Chrome or Edge, with DevTools.
- [ ] The branch pushed (t14). Links built from the snapshot SHA (a plan's Source link) answer 404 on GitHub until that
      commit is pushed. Commit links to the build plan's SHAs already resolve.

Run the commands in Git Bash, from the worktree root, `.claude/worktrees/ui-U2`.

## Run the app on U2's ports

```sh
git status --short; git rev-parse HEAD             # write the SHA down: the snapshot SHA in steps 2 and 7
npm --prefix src/web run trace                     # the trail at HEAD -> src/web/public/trace.json + chunks
npm --prefix src/web run build                     # vite build; copies src/web/public/ into src/web/dist/
npm --prefix src/web run preview -- --port 4173 --strictPort    # leave it running; open http://localhost:4173/
```

Part E compiles the trail at an earlier commit, and then compiles it at HEAD again. It gives its own commands.

The acceptance suite runs on the same port (part F). It reuses a preview that is already running on 4173. It serves its
own fixture trails to the page, so the live trail doesn't affect it. Filter by the path `e2e/U2/`: a bare `U2/` also
matches the worktree's folder name, `ui-U2/`, and runs every spec.

```sh
DOCKET_APP_PORT=4173 npm --prefix src/web run e2e -- e2e/U2/                      # the whole U2 suite, 80 tests
DOCKET_APP_PORT=4173 npm --prefix src/web run e2e -- e2e/U2/ --grep "DAG-1 · "    # one rule
npm --prefix src/web run test -- -t "DAG-1 · "                                    # one rule's unit tests
```

When you finish, run `rm -r src/web/public src/web/test-results`. Neither folder is git-ignored (note 10), so never stage
them.

## Console snippets

Paste these into the DevTools Console on the page the step names. The steps refer to them by S-number. They are kept
here because some contain `|` or are too long for a table cell.

```js
// S1: the graph's nodes in page order, as id:layer:status. Set R to the region the step names first.
R = 'node-graph-and-its-table';
[...document.querySelectorAll(`[data-region="${R}"] li[data-layer]`)].map((li) => `${li.querySelector('a').textContent}:${li.dataset.layer}:${li.dataset.status}`).join(' ')

// S2: the text equivalent's rows in page order.
[...document.querySelectorAll('[data-region="node-graph-and-its-table"] tbody tr')].map((tr) => tr.querySelector('th a').textContent).join(' ')

// S3: every node link on the plan page, graph and table: how many there are, and how many point anywhere but their own node.
links = [...document.querySelectorAll('[data-region="node-graph-and-its-table"] li[data-layer] a, [data-region="node-graph-and-its-table"] tbody th a')];
[links.length, links.filter((a) => !a.getAttribute('href').endsWith('/' + a.textContent)).length]

// S4: how a rule chip is drawn: built, nb (not built yet) or unknown. Set REGION and RULE first.
REGION = 'node-graph-and-its-table'; RULE = 'LOOP-1';
document.querySelector(`[data-region="${REGION}"] a[href="#/rules/${RULE}"]`)?.dataset.status

// S5: the walkthrough's rows, counted by TDD step and by agent badge.
tally = (sel, key) => { const c = {}; document.querySelectorAll(`[data-region="commit-sequence"] tbody tr ${sel}`).forEach((e) => { c[e.dataset[key]] = (c[e.dataset[key]] ?? 0) + 1; }); return Object.entries(c).sort().map(([k, n]) => `${k} ${n}`).join(', '); };
[tally('[data-step]', 'step'), tally('[data-agent]', 'agent')]

// S6: the problems the compile reported against a JSON-lines trail file.
fetch('trace.json').then((r) => r.json()).then((t) => t.problems.filter((p) => (p.file ?? '').endsWith('.jsonl')))

// S7: how far the page scrolls sideways (0: it doesn't).
document.documentElement.scrollWidth - document.documentElement.clientWidth
```

## Steps

### A. The plan page, `#/plans/<plan>` (AC1, AC3)

Open http://localhost:4173/ with DevTools open.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | DAG-1 | `#/` | Click `Plan` in the primary nav | `#/plans/build` opens. The nav marks `Plan` as current (`aria-current="page"`). Tab: `Plan · Docket` | | |
| 2 | DAG-1 | `#/plans/build` | Read "Step 1 · Read the answer". Compare with `git show HEAD:docs/plans/active/build.dag.yaml \| sed -n 1,9p` | Eyebrow `Plan · Uinsure Policies API build`. Title `Plan build`. Question `Which steps of the build are done, in what order, and what is still waiting?` Status `Approved`. Plan `build`. Approved `David Morgan, 2026-10-17`. Requirements rev `d56e048`. Source `docs/plans/active/build.dag.yaml`, linked to `…/blob/<snapshot SHA>/docs/plans/active/build.dag.yaml`. Snapshot SHA `HEAD <short SHA>` | | |
| 3 | DAG-1 | `#/plans/build` | Read "Step 2 · Follow the plan", the graph. Run S1 | Ten nodes, read top to bottom. S1: `F0a:1:done F0b:2:done F1:3:done F1b:4:done F2:5:done F3:6:done F4:7:done F5:3:done F6:8:done F7:9:pending`. F5 sits beside F1 in layer 3, because both wait only on F0b. Each node shows its id, its title and its status in words. Nine read `Done` and F7 reads `Pending`. The line into F7 is dashed. `PR #10` on F1, `#15` on F1b, `#17` on F2, `#20` on F3, `#28` on F4, `#34` on F5 and `#38` on F6. F0a, F0b and F7 show no PR | | |
| 4 | DAG-1 | `#/plans/build` | Read the text equivalent under the graph (open by default). Run S2. Compare with `git show HEAD:docs/plans/active/build.dag.yaml \| grep -E '^  - id:\|^    (depends_on\|status\|rules):'` | S2: `F0a F0b F1 F1b F2 F3 F4 F5 F6 F7`, the file's order. Depends on: F0a `none, a root`. F0b on F0a, F1 on F0b, F1b on F1, F2 on F1b, F3 on F2, F4 on F3, F5 on F0b, F6 on F4 and F7 on F6. Status in words, as in step 3. Rules: F1 has SELL-1 to SELL-7, F2 GET-1, F3 its 13 (CANCEL-1a to COULD-2c) and F4 its 8 (RENEW-1/2 to CANCEL-5). F0a, F0b, F1b, F5, F6 and F7 read `none` | | |
| 5 | DAG-1 | `#/plans/build` | Run S3. Then click F5 in the graph; go back; click F7 in the table | S3: `[20, 0]`, ten graph links and ten table links, each to its own node. F5 opens `#/plans/build/F5`, headed `F5 IaC + pipeline (evidence, never deployed)`. F7 opens `#/plans/build/F7`, headed `F7 Pitch deck`. Neither is headed F3 (AC3) | | |
| 6 | DAG-1 | `#/plans/build` | In the text equivalent, click F3's `COULD-2b` chip. Go back and click F4's `RENEW-1/2` chip | `#/rules/COULD-2b` heads `COULD-2b Claim date within a term's cover`. RENEW-1/2's chip opens `#/rules/RENEW-1%2F2`, headed `RENEW-1/2 Renew within 30 days of the end date, not after it`. **I expect the RENEW-1/2 half to fail at 40c2915. The address bar shows `#/rules/RENEW-1/2`, the page reads `not built yet · /rules/RENEW-1/2 has nothing to show yet.`, and the tab reads `Not built yet · Docket` (note 1)** | | |
| 7 | DAG-1 | `#/plans/ui` | From any ui node page, click the `ui` breadcrumb (or type the URL). Read Step 1, then run S1 | Eyebrow `Plan · Docket UI build`. Title `Plan ui`. `Approved`, approved `david, 2026-10-20`. Requirements rev `716553f`. Source `docs/plans/active/ui.dag.yaml`. S1: `U0a:1:done U0b:2:done U1:3:done U2:3:in-progress U3:3:pending U4:4:pending U5:3:pending U6:5:pending W1:3:done W2:4:pending W3:4:pending U7:3:pending`. U2 reads `In progress`. If the plan file says `paused_acceptance` by then, the graph still draws U2 as in progress. `PR #57` on U0a, `#84` on U1 and `#92` on W1. No build-plan node is drawn | | |
| 8 | DAG-1 | `#/plans/ui` | Run S4 with `REGION = 'node-graph-and-its-table'; RULE = 'LOOP-1'`. Then open `#/plans/ui/U3` and run S4 with `REGION = 'rules'` | Both read `nb`, and LOOP-1's chip is dashed with the hidden text "(not built yet)" on both pages. The matrix says `not built yet` (`grep '^\| LOOP-1 ' docs/trace/ui-requirements-matrix.md`). **I expect the plan page to read `built` at 40c2915, so the same chip is drawn as built on the plan page and as not built on U3's node page (note 5)** | | |
| 9 | DAG-1 | `#/plans/inv-001` | Type the URL. Then try `#/plans/inv-006` | Eyebrow `Plan · F2 attempt-3 escalation`. Title `Plan inv-001`. Status `not in this screen's data`. Approved `no approval recorded`. Requirements rev `not in the plan file`. Source `docs/plans/active/inv-001.plan.md`. Step 2: `Plan inv-001 lists no nodes, so there is no graph to draw.` The investigation body is not built yet. inv-006 has the eyebrow `Plan · W1 review fails on scope, a kit gap and an untested section, not the built screens`. The app has no link to an investigation, so you reach one only by its URL (note 9) | | |
| 10 | DAG-1 | `#/plans/nope` | Type the URL | `not built yet · plan nope has nothing to show yet.`, then `Back to the overview`. No graph, and no plan invented | | |
| 11 | DAG-1 | `#/` | Read "Step 3 · See the plan at a glance". Run S1 with `R = 'build-plan-at-a-glance'`. Click `Open the full plan` | The build plan's graph and table, as in steps 3 and 4. S1 gives the same string as step 3. `Open the full plan` opens `#/plans/build`. F4's RENEW-1/2 chip here has the same fault as step 6 (note 1) | | |
| 12 | DAG-1 | `#/plans/ui` | DevTools device toolbar at 390 × 844; switch the theme toggle to light, then to dark. Run S7 in each | S7 gives `0` both times. The graph scrolls sideways inside its own frame ("Plan graph, scrolls sideways"), and so does the table. The page itself never scrolls sideways. The status words and the dashed lines are readable in both themes | | |

### B. The node page, `#/plans/<plan>/<node>` (AC2, AC3)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 13 | NODE-1 | `#/plans/build/F1` | Open it from the plan page; read the header | Breadcrumbs `Plans › build › F1`. Eyebrow `Node · build/F1`. Title `F1 Sell (+ bare GET)`. Status `Done`. Attempt `2`. PR `#10`, linked to `https://github.com/dpmorgandev/uinsure-policies-api/pull/10`. Depends on `F0b`. The banner reads `OK`. Tabs: Node (current), Walkthrough, Loop, Activity. Tab `Node build/F1 · Docket`, and the nav marks `Plan` as current. No owner badge: the owner is `loop`, which isn't an agent | | |
| 14 | NODE-1 | `#/plans/build/F1` | Read "Step 2 · Rules this node covers". Click `SELL-4`, then go back. Check the table with `git show HEAD:docs/trace/build/F1/verdicts/A1-reviewer.json \| grep -A8 rules_covered` | `7 rules, counted from the node's rules list. Each chip opens its rule page.` Seven solid chips, SELL-1 to SELL-7. SELL-4 opens `#/rules/SELL-4`. The reviewer coverage table has one row per reviewer verdict: `A1` `6 of 7` `FAIL` (SELL-1 missing), then `A2` `7 of 7` `PASS` | | |
| 15 | NODE-1 | `#/plans/build/F1` | Read "Acceptance, as planned". Compare with `git show HEAD:docs/plans/active/build.dag.yaml \| sed -n 122,126p` | Five numbered lines, in the file's order and words, without the file's quotes. The first starts `POST /policies → 201 + Location;` and the fifth reads `SELL-6: a Payment for the full amount with a generated reference` | | |
| 16 | NODE-1 | `#/plans/build/F1` | Read "Step 3 · Tasks and their status". Compare with `git show HEAD:docs/plans/active/build.dag.yaml \| sed -n 128,146p` | 19 rows in the file's order, t1 to t19, titled as written. The first is `Sell acceptance suite in Api.Tests as POST → GET round trips, …` and the last is `David marks the PR ready and merges`. Every row: Status `Done`. Owner is the task's role (tester, builder, david, orchestrator, review or git). Attempt `2`. Recorded in `docs/plans/active/build.dag.yaml`. Below: Attempts and Who touched what each say not built yet | | |
| 17 | NODE-1 | `#/plans/build/F0a` | Open it | Title `F0a Harness`, `Done`, Attempt `0`. PR `no PR recorded`. Depends on `none, a root`. The owner badge reads `David Morgan`. The banner reads `OK (git-only, F0a)`. The tabs are labelled "Views of a git-only node", with Loop and Activity marked empty. Step 2: an empty table, `This node lists no rules.`, then 13 acceptance lines. Step 3: 20 tasks, all `Done`, owner `david`, t1 to t20 in the file's order (`git show HEAD:docs/plans/active/build.dag.yaml \| sed -n 41,60p`) | | |
| 18 | NODE-1 | `#/plans/build/F5` | Click the tabs in turn: Walkthrough, Activity, Node | Each opens F5's own view (`#/plans/build/F5/commits`, `…/activity`, `#/plans/build/F5`), headed `F5 IaC + pipeline (evidence, never deployed)`, with that tab current and the tab title `Node build/F5 · Docket` (AC2, AC3) | | |
| 19 | NODE-1 | `#/plans/ui/W1` | Open it. Then use the build plan graph to open F2 | W1: `W1 Workbench: sell, policy view and problem details`, `Done`, Attempt `4`, PR `#92`, Depends on `U0b`. F2: `F2 Retrieve`, `Done`, Attempt `3`, PR `#17`, Depends on `F1b`. Each page heads its own node, never F3 (AC3) | | |
| 20 | NODE-1 | `#/plans/build/F4` | Click the `RENEW-1/2` chip in Step 2 | Opens `#/rules/RENEW-1%2F2`, headed `RENEW-1/2 Renew within 30 days of the end date, not after it`. This is the control for step 6: the node page encodes the slash | | |
| 21 | NODE-1 | `#/plans/build/F3` | Click the `Loop` tab | AC3: the loop view heads F3. **I expect this step to fail at 40c2915. The page reads `not built yet · /plans/build/F3/loop has nothing to show yet.`, with no node header and the tab title `Not built yet · Docket` (note 4)** | | |
| 22 | NODE-1 | `#/plans/build/F9` | Type the URL (no such node) | `not built yet · Node build/F9 has no commits, gates or verdicts to show.`, then `Back to the overview`. No node header, and nothing invented. Tab `Node build/F9 · Docket` | | |
| 23 | NODE-1 | `#/plans/ui/U2` | Open it. Compare the tasks with `git show HEAD:docs/plans/active/ui.dag.yaml \| grep -A40 'id: U2$' \| grep -o 'title: "[^"]*", status: [a-z_]*'` | Title `U2 Plan DAG, node page and walkthrough`. Depends on `U0b`. Attempt `2` (or the attempt the file holds by then). PR: the file's `pr`, or `no PR recorded` while it is null. Five rule chips: DAG-1, NODE-1, TDD-1, RULE-3, DATA-8. Each chip is dashed while the ui matrix row says `not built yet` and solid once t13 has rendered the matrix. Reviewer coverage: `A2` `5 of 5` `PASS`. Five acceptance lines, AC1 to AC5 above. 16 tasks, each with the status the command prints | | |

### C. The walkthrough, `#/plans/<plan>/<node>/commits` (AC4)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 24 | TDD-1 | `#/plans/build/F1/commits` | Click the Walkthrough tab on F1. Read the caption and the rows. Count with `git show HEAD:docs/trace/build/F1/walkthrough.md \| grep -cE '^[\|] [0-9]+ [\|] [0-9a-f]{7} '` (prints `92`) | "Step 1 · Follow the commits". Caption: `Commits of build/F1 in walkthrough order, #1 to #92. The # is the walkthrough's row number, not a date.` 92 rows, #1 to #92 in order. #1 is `916a05a`, TDD `none`, `main`, `docs(context): F0b trail tail and f0b-done-merged snapshot`. #3 is `b716734`, TDD `red`, `tester`, chip `SELL-1`, `test(SELL-1): red: unique, normalised reference; 409 on duplicate, 400 off-pattern`. #52 is `7d3f791`, `green`, `builder`, seven chips SELL-1 to SELL-7. #91 is `0d39041` with Rule `—` (its trailer is `Rule: none`). #92 is `977998e`, `plan(build/F1): t18, t19 pending → done; F1 hitl → done`. Each subject is the commit's full subject line | | |
| 25 | TDD-1 | `#/plans/build/F1/commits` | Run S5 | `["green 10, none 33, red 46, refactor 1, stub 2", "builder 13, git 1, main 28, tester 50"]`. Each step and each agent is drawn in its own colour, with its word. Cross-check: `git log --format='%(trailers:key=Node,valueonly,separator=;)\|%(trailers:key=TDD,valueonly,separator=;)' HEAD \| grep -c '^F1\|red$'` prints `46` | | |
| 26 | TDD-1 | `#/plans/build/F1/commits` | Hover row #3's SHA. In row #52, click `SELL-7` | #3 links to `https://github.com/dpmorgandev/uinsure-policies-api/commit/b7167342ed28fdac4f781734ef6b1b288b607141`. SELL-7 opens `#/rules/SELL-7`, headed `SELL-7`. Every chip opens its own rule | | |
| 27 | TDD-1 | `#/plans/build/F1/commits` | Read under the table | `One commit on this node has no walkthrough number, so it is not a rung in the sequence. Oldest first:`, then `a5ca84d chore(trace): F1 trail (sign-off and done)`, its SHA linked to GitHub. It was committed after the walkthrough was rendered. It is shown, not dropped, and not numbered | | |
| 28 | TDD-1 | `#/plans/build/F0a/commits` | Open it | `The node predates the trail, so no walkthrough was rendered. That is not the same as nothing being committed.` Then an empty table, captioned `Commits of F0a. The trail holds no walkthrough row for any of them.`, reading `No commit has a walkthrough row yet.` No list follows: no commit carries `Node: F0a` | | |
| 29 | TDD-1 | `#/plans/ui/U1/commits` | Run S5. Read row #4 | 66 rows, #1 to #66. TDD-1 needs each row's Agent trailer: row #4 (`74b73a4`, red, NAV-1) named `web-tester`, and the agent tally to include `web-builder 8` and `web-tester 31`. **I expect this step to fail at 40c2915. The tally reads `git 3, main 24, none 39`, and row #4's Agent cell shows `—`, whose hidden text says `no agent recorded, the hook saw none` (note 2)**. Below the table, two commits have no walkthrough number: `chore(trace): U1 sign-off, merge and done` and `plan(ui/U1): hitl → done` | | |
| 30 | TDD-1 | `#/plans/ui/U7/commits` | Open it (U7 is pending and has no trail) | The header reads `U7 Tech debt: the non-blocking carries (inv-005)`, `Pending`. An empty table, then `One commit on this node has no walkthrough number, so it is not a rung in the sequence. Oldest first:` and `3431ce3 plan(ui): add U7, the tech-debt node` | | |

### D. Diffs: the rule page and the commit page (AC4)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 31 | RULE-3 | `#/rules/SELL-1` | Read "Step 5 · Red and green diffs, loaded when asked", then "Step 6 · Loading a diff" | Two diff viewers, red then green. The first is `#3` `b716734`, TDD `red`, `tester`, with the button `Load red diff, #3 b716734`. The second is `#52` `7d3f791`, `green`, `builder`, with `Load green diff, #52 7d3f791`. Each says `Not loaded. Diffs are the largest payload, so each loads when asked.` Step 6: `Idle. No diff chunk is loading. …` The page numbers two regions "Step 5" (note 7) | | |
| 32 | RULE-3 | `#/rules/SELL-1` | DevTools Network, filter `diffs`. Reload the page. Click `Load green diff, #52 7d3f791`, then `Load red diff, #3 b716734`. Compare with `git show --stat --format= 7d3f791 b716734` | On load, no request. The green press sends one request, `trace/build/F1/diffs.json`, 200. The red press sends none: the chunk is fetched once per node. Green shows five files in git's order: `src/Uinsure.Policies.Domain/Common/Result.cs`, `…/Policies/Policy.cs`, `…/Policies/PolicyReference.cs`, `…/Policies/Term.cs`, `…/Rules/RuleIds.cs`. Red shows seven files. The new ones (`tests/Uinsure.Policies.Api.Tests/SellReferenceTests.cs` and others) have every line marked `+` | | |
| 33 | RULE-3 | `#/rules/SELL-1` | In green's `Policy.cs`, compare a few lines with `git show 7d3f791 -- src/Uinsure.Policies.Domain/Policies/Policy.cs` | Each line is as git shows it. A removed line is `-` with its old line number, an added line is `+` with its new line number, and an unchanged line has both numbers and no mark. A screen reader hears "added", "removed" or "unchanged". The code is plain text: no markup is rendered | | |
| 34 | RULE-3 | `#/rules/SELL-1` | DevTools Network throttling: add a custom profile, `U2 slow`, with latency `4000` ms, and select it. Reload; click `Load red diff, #3 b716734`. Set throttling back to `No throttling` after | While it waits, the button is busy and disabled and reads `Loading diff…`. The note reads `Loading the diff for #3 b716734.` Step 6: `Busy. b716734 is loading from trace/build/F1/diffs.json; its button is disabled until the chunk answers.` Then the diff appears and Step 6 returns to `Idle. …` | | |
| 35 | RULE-3 | `#/rules/CANCEL-1a` | Read Step 5 | One viewer only: `#5` `61f73b1`, `red`, `tester`. The matrix lists no green for CANCEL-1a, so no green viewer is drawn | | |
| 36 | RULE-3 | `#/rules/DATA-2` | Read Step 5 | `The requirements matrix lists no red or green commit for this rule, so there is no diff to ask for.` | | |
| 37 | RULE-3 | `#/rules/NAV-1` | Load both diffs | Red: `#4` `74b73a4`, which adds `tests/web/e2e/U1/nav-1.spec.ts` and others. Green: `#22` `feb65db`, `src/web/compiler/git.ts`, `index.ts`, `plans.ts` and `trace-files.ts`, from `trace/ui/U1/diffs.json`. RULE-3's viewers name their agents: `web-tester` on red and `web-builder` on green. **I expect the agent half to fail at 40c2915: both viewers show `—` (note 2)** | | |
| 38 | RULE-3 | `#/commits/7d3f791` | Read "Step 3 · Diff". Click `Load green diff, #52 7d3f791` | Before loading: Files changed `load the diff to list its files`. After loading: the five files of step 32, and Files changed lists the same five paths, comma-separated. The header, trailer and agent-vs-hook regions say not built yet. Links out, Rule: seven chips, SELL-1 to SELL-7 (the compiler now keeps every `Rule:` line; U1's note 1) | | |
| 39 | RULE-3 | `#/commits/2ae467c` | Click `Load diff, #61 2ae467c`. Compare with `git show --format= --patch 2ae467c \| wc -l` | A merge on U1's trail: TDD `none`, agent `git`. Once loaded: `The diff holds no lines.` and Files changed `the diff names no file`. The command prints `0`: git shows a clean merge with no patch | | |
| 40 | RULE-3 | `#/commits/48fdd0d` | The first commit, which has no Plan or Node trailer. Click `Load diff, 48fdd0d` | The viewer shows TDD `none` and agent `—`. The press shows the error `48fdd0d names no plan and node in its trailers, so no diffs chunk holds it.` with `Try again`. No `diffs.json` request is made. **This honest error is the code's intent. Whether it meets AC4's "a commit shows its diff" is your ruling: 386 of the 1107 commits reachable from 40c2915 can't show their diff (note 6)** | | |
| 41 | RULE-3 | `#/commits/b60cd32` | A KG9 commit (`Node: KG9`, not a node in either DAG). Click `Load diff, b60cd32` | The error `trace.json holds no node ui/KG9`, with `Try again`. The commit is one of note 6's 386 | | |

### E. A trail in flight (AC5)

The live trail at 40c2915 has two nodes with a trail and no README: ui/U0a (done) and ui/U2 (this node, until t13 renders
its README). No live trail file holds a malformed line. U2's in-flight state is gone once t13 commits its README, so
steps 44 to 48 compile the trail at U2's last pre-trace commit, then at HEAD again. The malformed-line cases run on the
fixture in part F.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 42 | DATA-8 | `#/plans/ui/U0a` | Open it (trail at HEAD). Check with `git ls-tree --name-only HEAD docs/trace/ui/U0a/` | The header reads `U0a Harness extension: the web loop, kit fixes, derivation and fixture trails`, `Done`, PR `#57`. There's no completeness banner: its trail has a loop and an activity log and no README (the command lists `activity.jsonl` and `loop.jsonl`). Step 1 says what is true: a done node with no README, never "in progress". **I expect this step to fail at 40c2915. Step 1 reads `This node is in progress: its trail is still being written, so its completeness is not decided yet.` under a header that says `Done` (note 3)** | | |
| 43 | DATA-8 | `#/` | Run S6 (trail at HEAD) | `[]`: no line of any committed `loop.jsonl` or `activity.jsonl` is malformed at 40c2915. If an entry appears, that node's page lists it in Step 1 as `<file>:<line> the line is not a JSON object` | | |
| 44 | DATA-8 | shell | Stop the preview. Run `REF=$(git log -1 --format=%h --grep='^plan(ui/U2): t10 pending' HEAD); echo "$REF"`, then `git log --format='%(trailers:key=Plan,valueonly,separator=;)/%(trailers:key=Node,valueonly,separator=;)' "$REF" \| grep -cx 'ui/U2'`, then `(cd src/web && node compiler/index.ts --ref "$REF")` and `npm --prefix src/web run build`. Start the preview again | One SHA (`40c2915` before the rebase). The count is U2's commits so far: `43` at 40c2915, and one fewer if the rebase drops the merge `Merge origin/ui (KG9) into feature/ui/U2`. Write it down as N. The compile exits 0 with no output. The build passes | | |
| 45 | DATA-8 | `#/plans/ui` | Run S1 (trail at REF) | U2 is drawn `in-progress` and reads `In progress`. U4, which waits on U2, reads `Pending` | | |
| 46 | DATA-8 | `#/plans/ui/U2` | Open it (trail at REF) | Header `In progress`. There's no completeness banner and no `trail completeness has nothing to show yet` box. Step 1: `This node is in progress: its trail is still being written, so its completeness is not decided yet.` The page never says "no trail". No malformed-line list (S6 gives `[]` here too). Rules, reviewer coverage `A2 5 of 5 PASS`, the five acceptance lines and the 16 tasks are all shown from what exists: t1 to t10 `Done`, t11 to t16 `Pending` | | |
| 47 | DATA-8 | `#/plans/ui/U2/commits` | Open it (trail at REF) | An empty table, `Commits of U2. The trail holds no walkthrough row for any of them.`, reading `No commit has a walkthrough row yet.` Then `N commits on this node have no walkthrough number, so they are not rungs in the sequence. Oldest first:`, followed by the N commits. The first is `plan(ui/U2): pending → in_progress`, then `docs(U2): derived reference screens`, and the last is `plan(ui/U2): t10 pending → done`. Each SHA links to GitHub. Nothing is dropped, and nothing is numbered | | |
| 48 | DATA-8 | `#/commits/<sha>` | Find the SHA with `git log -1 --format=%h --grep='^test(DAG-1): red: the plan page draws' HEAD`; open its commit page (trail at REF); load the diff | `Load red diff, <sha>` (no `#`: it has no walkthrough row yet). It loads from `trace/ui/U2/diffs.json`: 13 files, the first `tests/web/e2e/U2/dag-1.spec.ts`. A node in flight already has its diffs (`git show --stat --format= <sha>`) | | |
| 49 | DATA-8 | shell, then `#/plans/ui/U2` | Stop the preview. Run `npm --prefix src/web run trace` and `npm --prefix src/web run build`, which return to HEAD. Start the preview and open U2's page | Once t13 has committed U2's README, the banner shows that README's completeness word for word, and Step 1 no longer says "in progress". The walkthrough numbers U2's commits from the rendered `walkthrough.md`. Before t13, the page reads as in step 46 | | |

### F. The acceptance suite

Run from the worktree root. The suite replays fixture trails into throwaway repos and never touches this one. The
`in-flight` fixture is build/F1 mid-loop, with no README, `loop.jsonl` line 4 malformed and `activity.jsonl` line 3
malformed. The `plans` fixture has three plans and a branching DAG. The `rules` fixture is U1's.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 50 | DAG-1 | shell | `DOCKET_APP_PORT=4173 npm --prefix src/web run e2e -- e2e/U2/ --grep "DAG-1 · "`, then `npm --prefix src/web run test -- -t "DAG-1 · "` | `22 passed`, then 8 unit tests passed. They cover: six nodes in file order with F5 branching off F0b and F3 joining F2 and F5; each node's status as a word and a colour, and its layer; every graph and table link opening its own node; the plan header; the ui plan's own nodes; inv-001 as a plan; the nav's Plan entry; the overview at a glance; axe; parity | | |
| 51 | NODE-1 | shell | `DOCKET_APP_PORT=4173 npm --prefix src/web run e2e -- e2e/U2/ --grep "NODE-1 · "` | `17 passed`. They cover: F1's and F2's own rules, acceptance and tasks, each task's status in words, PR #10, depends on, every tab heading F2, axe, and parity for the node and git-only references. No unit test carries NODE-1 (note 8) | | |
| 52 | TDD-1 | shell | `DOCKET_APP_PORT=4173 npm --prefix src/web run e2e -- e2e/U2/ --grep "TDD-1 · "`, then `npm --prefix src/web run test -- -t "TDD-1 · "` | `15 passed`, then 7 unit tests passed. They cover: F1's nine commits in order and numbered #1 to #9; F2's own three; each commit's TDD step, Agent trailer, subject and rule chips; each SHA's GitHub link; axe; parity. The fixture's agents are `main`, `tester` and `builder`, so none of them is a `web-*` agent (note 2) | | |
| 53 | RULE-3 | shell | `DOCKET_APP_PORT=4173 npm --prefix src/web run e2e -- e2e/U2/ --grep "RULE-3 · "`, then `npm --prefix src/web run test -- -t "RULE-3 · "` | `17 passed`, then 8 unit tests passed. They cover: SELL-1's red and green diffs and no others; the chunk fetched only on the press; each diff's files and lines; GET-1's own green; commit pages showing their own diff; the in-flight stub's removed and added line; axe with diffs loaded; parity | | |
| 54 | DATA-8 | shell | `DOCKET_APP_PORT=4173 npm --prefix src/web run e2e -- e2e/U2/ --grep "DATA-8 · "`, then `npm --prefix src/web run test -- -t "DATA-8 · "` | `9 passed`, then 4 unit tests passed. On the in-flight fixture: F1 is in progress (not OK, not TRAIL INCOMPLETE, never "no trail"); `docs/trace/build/F1/loop.jsonl:4` and `docs/trace/build/F1/activity.jsonl:3` are reported by file and line; the malformed loop line is kept as `raw`; the rule and tasks still show; pending F2 reports none of F1's lines; the walkthrough lists c1 to c3 oldest first; the plan draws F1 in progress; axe | | |

## Notes

1. **A slash rule's chip on the plan graph opens no rule (steps 6 and 11).** `app/explorer/plan/PlanGraph.tsx` passes the
   kit's graph `ruleHref = (ruleId) => '#/rules/' + ruleId`, which doesn't encode the ID. RENEW-1/2's chip links to
   `#/rules/RENEW-1/2`. That is two path segments, so no route matches and the not-built page answers. The node page, the
   walkthrough and the commit page use `shell/ruleLinks.ts`'s `ruleHref`, which encodes the slash (step 20 is the
   control). No fixture has a slash rule on a plan node, so DAG-1's chip test is green. The fix is one import.
2. **`web-tester` and `web-builder` are drawn as "no agent" (steps 29 and 37).** `shell/agents.ts`'s `agentOf` returns null
   for any name outside the kit's eight (`main`, `tester`, `builder`, …). Every ui-plan commit's `Agent:` trailer is
   `web-tester` or `web-builder` (138 commits at 40c2915), so on every ui walkthrough and ui rule diff those rows show `—`.
   The hidden text claims "no agent recorded, the hook saw none". That contradicts the trailer, which TDD-1 says to colour
   by, and it is a HONEST-1 problem. The kit's `AgentName` has no web-* member, so the fix may be a kit change (`/kit-gap`)
   or a mapping in `agentOf`. That is your ruling. The fixtures use build-plan agent names only.
3. **A done node with a trail and no README reads "in progress" (step 42).** `app/explorer/node/Node.tsx`'s `summaryOf`
   decides "in progress" from `completeness === null && trail === true` and ignores the node's own status. ui/U0a is
   `done` in `ui.dag.yaml` and has `loop.jsonl` and `activity.jsonl` but no README, so its page says it is in progress
   under a `Done` header. The plan graph shows it done. No fixture has a done node without a README.
4. **The Loop tab doesn't head the node (step 21).** AC3 lists "loop" among the views that head the node shown. No route
   serves `/plans/:plan/:node/loop` yet: the loop view is U3's (LOOP-1). The frame draws the node header only for the
   node, walkthrough and activity routes, so the Loop tab lands on the generic not-built page. It no longer shows F3, but
   it shows no node either. Is "loop" in AC3 U3's to meet, or U2's? That is your ruling.
5. **The plan's text equivalent draws a not-built rule as built (step 8).** The kit's `DagTable` sets every chip's status
   from the *node's* status (`not-built` → nb, anything else → built). It doesn't take a per-rule status, so a pending
   node's unbuilt rules show as built chips. `PlanGraph` can't pass the matrix's status through, so the fix is a kit gap.
6. **Commits outside a DAG node can't show their diff (steps 40 and 41).** The compiler writes a diffs chunk only for a
   node in a `*.dag.yaml`. At 40c2915 that leaves 386 of the 1107 reachable commits with no diff on their commit page: 237
   have no `Plan`/`Node` trailer (F0a's era, merges of PRs), 26 have `Plan: ui` and no `Node`, and 123 belong to the kit
   and design nodes (DS, DC, DK, DM, DM2, KG1–KG9, RS1), which aren't in `ui.dag.yaml`. Each says why, in words, with a
   retry. RULE-3 asks only for a rule's red and green diffs, and every rule's red and green is on a DAG node. AC4 says "a
   commit shows its diff". Whether these 386 need it is your ruling.
7. **The rule page has two "Step 5"s (step 31).** U1's links-out region is still labelled `Step 5`, and U2 inserted the
   diffs as `Step 5` and the busy region as `Step 6` above it. The page reads 1, 2, 3, 4, 5, (not built), 6, 5. This is
   cosmetic; the regions are in the reference's order.
8. **NODE-1 has no unit test.** The compiler's node fields `pr`, `qa`, `acceptance` and `tasks` (858783c, a NODE-1
   green) are proven only through the e2e suite on the `plans` fixture. No Vitest test is tagged `NODE-1 · `.
9. **Investigations are reachable only by URL (step 9).** DAG-1 says the view shows investigations such as inv-001, and
   `#/plans/inv-001` does. The signed-off plan screen has no plan switcher, and no page links to an investigation.
10. **`src/web/public/` and `src/web/test-results/` are still not git-ignored.** `src/web/.gitignore` lists
    `node_modules/` and `dist/` only. Delete both when you finish.
11. **What moves after this script.** The rebase (t12) rewrites U2's SHAs, so step 44 finds its ref by subject. The trace
    commit (t13) adds U2's README, walkthrough and matrix rows, so the U2 chips in step 23 turn solid and step 49's banner
    appears. The figures for the build plan are stable: F7 is its only pending node.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: __ of 54 · Expected failures confirmed (notes 1–5): ______ · Rulings (notes 4 and 6): ______ · Steer (if any): ______
