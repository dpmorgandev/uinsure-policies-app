# QA script: ui / U4, agents, human decisions and verify-it-yourself: the explorer end to end

Rule IDs: AGENT-1, AGENT-2, HITL-1, VERIFY-1, NAV-2, NAV-4, PERF-1
Branch: feature/ui/U4   Worktree: .claude/worktrees/ui-U4
Commit under test: write the SHA you test in the sign-off. This script was written at 792247f (attempt 2 opened),
while the attempt-2 fix round was landing beside it. Test at the HEAD that carries those fixes, not at 792247f.
App URL: http://localhost:4175. U4's app port is 4175 and its API port 5085. The explorer needs no API; the
workbench pages do, so start the API too if you open them.

U4 builds or completes these, all explorer screens read from `trace.json`:

- the commit page's trailer agent against the hook agent, and the node page's `Who touched what` (AGENT-1);
- the activity page's agent lanes and its text table (`#/plans/<plan>/<node>/activity`) (AGENT-2);
- the human decisions page (`#/decisions`) and the overview's latest decisions (HITL-1);
- `Verify it yourself` on the rule page and `Re-verify with git` on the about page (VERIFY-1);
- a URL for every entity, the not-found page and an open session at `#/sessions/<file>` (NAV-2);
- the top-bar search over rule IDs, nodes, SHAs and file paths (NAV-4);
- the cold-load mark and the lazy chunks (PERF-1).

The steps below are written for the behaviour after the attempt-2 fixes:

- a file-path search result opens that file on GitHub, in a new tab, at the snapshot SHA (NAV-4, steps 33 to 35);
- the activity lanes draw every agent in the log, including `web-tester`, `web-builder` and `kit-builder` (AGENT-2,
  steps 8 to 10);
- Enter opens the highlighted search result (NAV-4, step 32);
- the rule page's git command still lists the red before the green when a merge sits between them (VERIFY-1, step 22);
- every link out to GitHub carries `rel="noreferrer"` (steps 13, 19, 34).

The Actual and Pass/Fail columns are empty. I wrote these steps from the code and the acceptance suite
(`tests/web/e2e/U4/`) and didn't run them in the app. The acceptance suite runs on fixture trails; this script runs on
the real trail at HEAD, so where a count can move, the step gives the command that counts it.

## Run the app on U4's ports

Commands are for Git Bash, run from the worktree root, `.claude/worktrees/ui-U4`.

```sh
git status --short; git rev-parse HEAD                  # write both down
npm --prefix src/web run trace                          # the trail at HEAD -> src/web/public/trace.json
npm --prefix src/web run build
npm --prefix src/web run preview -- --port 4175 --strictPort   # leave it running; DOCKET_API_PORT=5085 for the workbench
```

Counts used below, in a second terminal:

```sh
node -e "const t=require('./src/web/public/trace.json');console.log('decisions',t.decisions.length);t.decisions.forEach(d=>console.log(d.kind,d.who,d.where,d.evidence&&d.evidence.file+':'+d.evidence.line))"
node -e "const t=require('./src/web/public/trace.json');const c=t.commits.filter(c=>c.plan==='build'&&c.node==='F1');console.log(c.length);c.forEach(c=>console.log(c.short,c.agent,c.hookAgent))"
for n in build/F1 ui/U1 ui/KG1; do echo "$n: $(grep -o '"agent":"[^"]*"' docs/trace/$n/activity.jsonl | sed 's/"agent"://' | tr -d '"' | awk '!s[$0]++' | tr '\n' ' ')"; done
node -e "const t=require('./src/web/public/trace.json');const r=t.rules.find(r=>r.id==='SELL-1');console.log(r.red,r.green,r.refactor)"
ls -la src/web/public/trace.json src/web/public/trace/*/*/                   # the index and its lazy chunks
```

## Steps

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| **A** | | | **Who touched what (AGENT-1)** | | | |
| 1 | AGENT-1 | `#/plans/build/F1` | Open http://localhost:4175/#/plans/build/F1 and scroll to `Step 5 · Who touched what` | a table captioned "Commits of this node, with the agent in the trailer and the agent the hook saw", one row per F1 commit in walkthrough order. The row count matches the F1 command above | | |
| 2 | AGENT-1 | `#/plans/build/F1` | Read each row's two agent columns and its match mark | each row shows the trailer agent and the hook agent side by side, with ✓ where they agree and ✗ where they differ. Spot-check three rows against the F1 command above | | |
| 3 | AGENT-1 | `#/plans/build/F1` | Find a row whose hook agent is missing (F0a's commits are git-only, so try `#/plans/build/F0a` if F1 has none) | the hook column reads "not recorded: no hook line logged this commit" and the row carries neither ✓ nor ✗. A missing record is never shown as a match | | |
| 4 | AGENT-1 | `#/commits/<sha>` | Click one row's SHA | the commit page opens; `Step 2 · Agent: the trailer against the hook` shows the trailer agent beside `Agent the hook saw`, with the same ✓ or ✗ as the node table | | |
| 5 | AGENT-1 | `#/commits/<sha>` | Open a commit you noted as ✗ in step 2, if any | both agents are named and the mark is ✗; nothing on the page claims they agree. If no row is ✗, write "none in this trail" | | |
| 6 | AGENT-1 | `#/commits/<sha>` | Toggle dark, then shrink to 390 px (DevTools device bar) | readable in both themes; agent badges legible; ✓ and ✗ carry text or an accessible name, not colour alone; no sideways scroll of the page | | |
| **B** | | | **Agent swimlanes (AGENT-2)** | | | |
| 7 | AGENT-2 | `#/plans/build/F1/activity` | Open http://localhost:4175/#/plans/build/F1/activity | the region `Agent lanes` draws one lane per agent in the order each first appears in the log, matching the `build/F1` line of the agents command above. Below it, `Every line as text` lists the same lines in log order | | |
| 8 | AGENT-2 | `#/plans/ui/U1/activity` | Open a ui node's activity: http://localhost:4175/#/plans/ui/U1/activity | lanes for `web-tester` and `web-builder` are drawn beside `main` (and any other agent the `ui/U1` line names), each holding its own lines. No agent from the log is missing from the lanes | | |
| 9 | AGENT-2 | `#/plans/ui/KG1/activity` | Open a kit-gap node's activity: http://localhost:4175/#/plans/ui/KG1/activity | a `kit-builder` lane is drawn beside `main`, holding its lines | | |
| 10 | AGENT-2 | `#/plans/ui/U1/activity` | Count the lines in each lane, then use the filter bar's `Agent` select to pick each agent in turn | each agent's filter shows the same count of lines as its lane; the table's caption ("Activity events for …, n lines") matches the filter count | | |
| 11 | AGENT-2 | `#/plans/build/F1/activity` | Read three entries in a lane and the same lines in the text table | each entry names its tool and, where the log has one, its file or command. A redacted value shows as a labelled token, not blank. A dash in the table means the log holds no value | | |
| 12 | AGENT-2 | `#/plans/build/F0a/activity` | Open a git-only node's activity | the page says the trail holds no activity log for this node (git-only), and draws no empty lanes as if work had happened | | |
| 13 | AGENT-2 | `#/plans/ui/U1/activity` | Toggle dark, then 390 px; then tab through the lanes and the filter bar with the keyboard | readable in both themes; the lanes and the table scroll inside their own frame at 390, with no sideways scroll of the page; focus is visible on every control | | |
| **C** | | | **Human decisions (HITL-1)** | | | |
| 14 | HITL-1 | `#/decisions` | Click `Human decisions` in the primary nav | `#/decisions` opens; tab `Human decisions · Docket`; the nav item is current. Eyebrow `Human decisions · all nodes`, question "What did David decide across the nodes, and where is each decision recorded?". The id `Recorded` reads "<n> decisions in <m> nodes", with n matching the decisions command above | | |
| 15 | HITL-1 | `#/decisions` | Read the list | grouped by `Plan: <plan>`, then `<plan>/<node>`, each node's decisions in the loop's order (pause 1, steer, pause 2, sign-off, merge, as they happened), numbered down the page | | |
| 16 | HITL-1 | `#/decisions` | Open the `Kind` filter | its options are words: `Pause 1`, `Pause 2`, `Steer`, `Ruling`, `Sign-off`, `Merge` (only the kinds present). The raw ids `pause1`, `signoff` or `merged` appear nowhere on the page | | |
| 17 | HITL-1 | `#/decisions` | Filter `Kind` to `Steer`, then clear; filter `Node` to one node, then `Clear` | the count line reads "<shown> of <total> decisions" and the list narrows; `Clear` restores every decision | | |
| 18 | HITL-1 | `#/decisions` | Read a steer row (a D-finding) | it names its round (e.g. D1), the pause it was given at and what David said | | |
| 19 | HITL-1 | `#/decisions` | On any row, click its evidence link (`<file>, line <n>`); right-click it and inspect | it opens that line of the loop log on GitHub at the snapshot SHA, in a new tab; the anchor carries `rel="noreferrer"`. The line it lands on is the decision | | |
| 20 | HITL-1 | `#/decisions` | On a sign-off and a merge row, click the named commit | each opens `#/commits/<short>` for the commit it names; a sign-off reads `Signed off`, a merge `Merged` | | |
| 21 | HITL-1 | `#/` | Open the overview and read `Latest human decisions` | the newest decisions across nodes, each row with its evidence link, matching the top of the decisions command above. Toggle dark and 390 px on both pages: readable, no sideways scroll | | |
| **D** | | | **Verify it yourself (VERIFY-1)** | | | |
| 22 | VERIFY-1 | `#/rules/SELL-1` | Open http://localhost:4175/#/rules/SELL-1 and read `Step 5 · Verify it yourself`. Copy the command and run it in the worktree | the command is filled in (no `<sha>` or other placeholder). Its output lists SELL-1's red SHA first with trailer `red` and its green SHA last with `green`, as the page's `Expect` line says, even where a merge commit from another branch sits between them in history. Note the SHAs against the SELL-1 command above | | |
| 23 | VERIFY-1 | `#/rules/SELL-1` | If SELL-1 has a refactor, run the second command | it lists the commits after the green, with the refactor SHA last and trailer `refactor` | | |
| 24 | VERIFY-1 | `#/rules/<id>` | Open a rule with no green (a not-built rule from the matrix) | `Verify it yourself` shows the not-built-yet pattern for its red and green commits, never a half-filled command | | |
| 25 | VERIFY-1 | `#/about` | Open `How to read this` and read `Step 3 · Re-verify with git`; run both commands | the first prints the snapshot commit, its full SHA starting with the footer stamp's short SHA. The second lists the 20 commits up to the snapshot, each loop commit with its TDD trailer beside it | | |
| 26 | VERIFY-1 | `#/about` | Toggle dark, then 390 px | the command blocks read in both themes and scroll inside their frame at 390; each can be selected and copied whole | | |
| **E** | | | **Every entity has a URL, and not-found (NAV-2)** | | | |
| 27 | NAV-2 | address bar | Paste each in a new tab: `#/rules/SELL-1`, `#/plans/build/F1`, `#/commits/<short sha from step 4>`, `#/plans/build/F2/verdicts/A2/reviewer`, `#/plans/build/F2/findings/A2`, `#/sessions/<a file name from docs/context/>` | each opens its own page cold, with its title in the tab; the session opens on its snapshot with its next action | | |
| 28 | NAV-2 | `#/plans/build/F2` | Follow F2's A2 reviewer FAIL: from the node page to its loop, the FAIL verdict, its findings round and the fix commit | each hop is a link, and each page's URL is one you could paste (copy the last one into a new tab: it opens the same commit) | | |
| 29 | NAV-2 | `#/no/such/page` | Open http://localhost:4175/#/no/such/page | the not-found page in the triangle-alert state, titled "Nothing at /no/such/page"; ids `Path asked for` and `Snapshot SHA` (ref and short SHA). It does not claim nothing was compiled | | |
| 30 | NAV-2 | `#/no/such/page` | Read the way out | links `Go to the overview` and `Go to the requirements matrix`, and the search under them; no nearest match is guessed | | |
| 31 | NAV-2 | `#/rules/NOPE-9` | Open an unknown rule ID | the not-found page, not an empty rule page. Toggle dark and 390 px on it: readable, no sideways scroll | | |
| **F** | | | **Search (NAV-4)** | | | |
| 32 | NAV-4 | any page | Click the top-bar search, type `SELL-1`, arrow down to the rule and press Enter. Then type `F1` and press Enter on the node | Enter opens the highlighted result: the SELL-1 rule page, then `#/plans/build/F1`. Clicking a result does the same | | |
| 33 | NAV-4 | any page | Type the first five characters of a commit SHA (from step 4) and choose the result | it offers that commit and opens `#/commits/<short>` | | |
| 34 | NAV-4 | any page | Type part of a file path, e.g. `Money.cs` or `src/web/app/shell`, then choose a path result (click, then again with Enter) | it offers matching paths, marked as paths. Choosing one opens that file on GitHub, in a new tab, at the snapshot SHA (the URL holds `/blob/<sha>/<path>`); the docket tab stays where it was. In DevTools, the new tab has no `window.opener` and sends no referrer | | |
| 35 | NAV-4 | any page | Type `e` | at most 30 matches are listed; the list scrolls, the page doesn't hang | | |
| 36 | NAV-4 | any page | Type `zzzz-nothing` | the search says no rule, node, SHA or path matches it | | |
| 37 | NAV-4 | any page | Toggle dark, then 390 px, and run steps 32 and 36 with the keyboard only | the search and its results read in both themes and fit at 390; focus is visible; Escape closes the results | | |
| **G** | | | **Fast from cold (PERF-1)** | | | |
| 38 | PERF-1 | `#/` | DevTools, Network, `Disable cache`; Performance tab, record a reload of http://localhost:4175/#/ | the overview draws and is interactive in under 2 s. In the Console, `performance.getEntriesByName('docket:interactive')[0].startTime` is under 2000, and the mark is set once the page is drawn, not before its data | | |
| 39 | PERF-1 | `#/rules/SELL-1` | With the cache still off, open the deep link cold and watch Network | under 2 s to interactive. The requests are `trace.json` and the app's own files; no `activity.json` or `diffs.json` chunk is asked for until a page draws one | | |
| 40 | PERF-1 | `#/plans/build/F1/activity` | Open the activity page, then a rule page and click `Load diff` on a commit | only then does `trace/build/F1/activity.json` (or that commit's `diffs.json`) load; the button shows busy while it waits. Compare the sizes from the `ls` command: the index is not carrying the chunks | | |
| **H** | | | **The acceptance suite, by rule** | | | |
| 41 | AGENT-1 | — | `DOCKET_APP_PORT=4175 npm --prefix src/web run e2e -- tests/web/e2e/U4/agent-1.spec.ts` (the config reuses the preview already on 4175; the specs serve their own fixture trail, not HEAD's) | all passed, 0 failed (8 tests at 792247f, plus any the fix round added) | | |
| 42 | AGENT-2 | — | `DOCKET_APP_PORT=4175 npm --prefix src/web run e2e -- tests/web/e2e/U4/agent-2.spec.ts` | all passed, 0 failed | | |
| 43 | HITL-1 | — | `DOCKET_APP_PORT=4175 npm --prefix src/web run e2e -- tests/web/e2e/U4/hitl-1.spec.ts` | all passed, 0 failed | | |
| 44 | VERIFY-1 | — | `DOCKET_APP_PORT=4175 npm --prefix src/web run e2e -- tests/web/e2e/U4/verify-1.spec.ts` | all passed, 0 failed | | |
| 45 | NAV-2 | — | `DOCKET_APP_PORT=4175 npm --prefix src/web run e2e -- tests/web/e2e/U4/nav-2.spec.ts` | all passed, 0 failed | | |
| 46 | NAV-4 | — | `DOCKET_APP_PORT=4175 npm --prefix src/web run e2e -- tests/web/e2e/U4/nav-4.spec.ts` | all passed, 0 failed | | |
| 47 | PERF-1 | — | `DOCKET_APP_PORT=4175 npm --prefix src/web run e2e -- tests/web/e2e/U4/perf-1.spec.ts` | all passed, 0 failed | | |

Unit tests for the same rules: `npm --prefix src/web run test -- -t "AGENT-1 · "` (and likewise for each rule ID).
All pass.

## Notes

1. **The fix round (all of part F, steps 8 to 10, 19, 22).** These steps describe the behaviour the attempt-2 fixes
   are meant to deliver. If you test at a HEAD before a fix landed, the step fails for that reason; write the SHA and
   which fix was missing.
2. **Step 22, the merge case.** SELL-1's red and green may or may not have a merge commit between them on this trail.
   If they don't, pick a ui rule whose red and green straddle a `Merge pull request` or `merge origin/ui` commit
   (`git log --merges --oneline` shows them) and repeat the step there.
3. **Step 34, the new tab.** Docket opens the path on GitHub rather than inside the app, because the explorer shows no
   file contents. If you'd rather a path result opened a page inside Docket (the commits that touched it), that's a
   product ruling for U7.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: __ of 47 · Steer (if any): ______

Rulings on notes 1 to 3:
- 1 (fix round present at the SHA tested): ______
- 2 (rule used for the merge case): ______
- 3 (path result opens GitHub): ______

Steps not run, or only partly seen, and why:
- ______
