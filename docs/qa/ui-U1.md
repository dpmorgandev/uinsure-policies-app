# QA script: ui / U1, overview, requirements matrix and rule page

Rule IDs: NAV-1, MATRIX-1, RULE-1, RULE-2, DATA-4, NAV-3
Branch: feature/ui/U1   Worktree: .claude/worktrees/ui-U1
Commit under test: f880001 (HEAD when this script was written, after attempt 2's reviewer and security PASS. This
script's own commit changes only this file. The rebase (t13) and the trace commit (t14) come before you test, so
record the SHA you test in the sign-off)
App URL: http://localhost:4172 (U1 is position 2 in `ui.dag.yaml`, so its app port is 4172). API: 5082, not used by U1

U1 builds the overview's answer, receipt figures and trail-completeness regions (`#/`), the requirements matrix
(`#/rules`), the rule page (`#/rules/<id>`), the node page's completeness region (`#/plans/<plan>/<node>`) and the
commit page's links-out region (`#/commits/<sha>`). The rest of the node and commit pages shows the not-built-yet
pattern.

The Actual and Pass/Fail columns are empty. The tester wrote these steps from the code and the acceptance suite at
f880001, and did not run them in the app: `npm run trace` and `npm run build` write into `src/web/`, which is
outside the tester's write scope. The figures in the Expected column are counted by hand from the committed files
at f880001 (`docs/trace/requirements-matrix.md`, `docs/plans/active/build.dag.yaml`, `docs/trace/build/**`). Where
a figure could move, the step gives the command that counts it. Notes 1 and 2 name two steps the tester expects to
**fail**, from reading the compiler. Check those steps first.

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node U1)

| Tag | Acceptance item |
|---|---|
| AC1 | The overview answers its question first, with the receipt figures from trace.json |
| AC2 | The matrix lists every rule with its node, tests and status, and filters by node and status (see note 3) |
| AC3 | A rule page shows the rule red before green, each step linked to its commit; links out open the commit and the file on GitHub |
| AC4 | A rule with no node or no tests shows not built yet; an incomplete trail shows its reasons verbatim, never clean |
| AC5 | Every rule chip opens its own rule; the overview draws the search and theme toggle once, and an incomplete node's reasons as rendered text, not raw Markdown (g4-defects.md section 3) |

## Preconditions

- [ ] Node 22 on `PATH` (`node --version`).
- [ ] `npm --prefix src/web ci` done in this worktree.
- [ ] Playwright's Chromium installed, for part F (`npx --prefix src/web playwright install chromium`).
- [ ] Nothing listening on 4172 (`netstat -ano | grep 4172`, no match).
- [ ] Chrome or Edge, with DevTools.
- [ ] The branch pushed (t15). The GitHub links built from the snapshot SHA (file:line links, figure sources)
      answer 404 until the commit they name is on GitHub (note 5).

Commands are for Git Bash, run from the worktree root.

## Run the app on U1's ports

```sh
git rev-parse HEAD                                 # write it down: the snapshot SHA in steps 3, 29 and 30
npm --prefix src/web run trace                     # the trail at HEAD -> src/web/public/trace.json + chunks
npm --prefix src/web run build                     # vite build; copies src/web/public/ into src/web/dist/
npm --prefix src/web run preview -- --port 4172 --strictPort    # leave it running; open http://localhost:4172/
```

The acceptance suite on the same port (part F). It reuses a preview already on 4172, and serves its own fixture
trails to the page, so the live trail doesn't affect it. The path filter is `e2e/U1/`: a bare `U1/` also matches
the worktree's own folder name, `ui-U1/`, and runs every spec.

```sh
DOCKET_APP_PORT=4172 npm --prefix src/web run e2e -- e2e/U1/                      # the whole U1 suite, 124 tests
DOCKET_APP_PORT=4172 npm --prefix src/web run e2e -- e2e/U1/ --grep "RULE-2 · "   # one rule
npm --prefix src/web run test -- -t "RULE-2 · "                                   # one rule's unit tests
```

When you finish: `rm -r src/web/public src/web/test-results`. Neither is git-ignored (note 6). Never stage them.

## Steps

### A. The overview, `#/` (AC1, AC4, AC5)

Open http://localhost:4172/ with DevTools open.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | NAV-1 | `#/` | Read the page from the top, before scrolling | Under the top bar, the first region is "Step 1 · Read the answer": eyebrow `Overview · plan build`, title `Overview`, the question `Was this really test-driven, and was the AI really checked?`, then the answer `29 of 29 rules list a red commit. 21 also list a green commit and 8 list none. 9 of 51 reviewer and security verdicts were FAIL, and each was later followed by a PASS from the same agent on the same node.` Status `Pass 29 of 29 rules`. `Snapshot SHA` reads `HEAD <short SHA>`. Tab: `Overview · Docket` | | |
| 2 | NAV-1 | `#/` | Read "Step 2 · Check the figures" | Six figures, in this order, each labelled `generated`: `29 of 29` rules built (counted from the 29 rows of the requirements matrix); `29 of 29` rules whose own test count passes in full; `9 of 10` nodes done (plan build); `7 of 8` looped nodes needed more than one attempt; `9 of 51` verdicts were FAIL; `23` human decisions on plan build. Nothing is added across rules | | |
| 3 | NAV-1 | `#/` | Hover, then open, each figure's source link | Figures 1 and 2: `docs/trace/requirements-matrix.md`, linked to `…/blob/<snapshot SHA>/docs/trace/requirements-matrix.md`. Figures 3 and 4: `docs/plans/active/build.dag.yaml`, to `…/blob/<snapshot SHA>/docs/plans/active/build.dag.yaml`. Figure 5: `docs/trace/build/*/verdicts/`, and figure 6: `docs/trace/build/*/loop.jsonl`, both to `…/tree/<snapshot SHA>/docs/trace/build`. Every link is to `github.com/dpmorgandev/uinsure-policies-api` and shows the external glyph | | |
| 4 | NAV-1 | shell | Recount figures 5 and 6: `ls docs/trace/build/*/verdicts/*.json \| wc -l`; `grep -l '"verdict": *"FAIL"' docs/trace/build/*/verdicts/*.json \| wc -l`; `grep -oh -e '"event":"pause' -e '"event":"signoff' -e '"event":"merged' docs/trace/build/*/loop.jsonl \| wc -l`. Then figure 3: `grep -cE '^    status: done' docs/plans/active/build.dag.yaml` | `51`, `9` and `23`: the figures of step 2. Then `9`: nine of the ten nodes are done (F7 is pending) | | |
| 5 | NAV-1 | `#/` | Read "Check one rule's order yourself"; copy its command and run it in the worktree | It names SELL-1, red `b716734`, green `7d3f791`. The command is `git log --reverse --format="%h %(trailers:key=TDD,valueonly) %s" b716734^..7d3f791`. Its first line is `b716734 red` and its last commit is `7d3f791 green` (50 commits; git prints each subject on the line after its trailer) | | |
| 6 | NAV-1 | `#/` | Click `Show me the proof: open the requirements matrix, 29 rules with their red and green commits` | `#/rules` opens, and the nav marks `Requirements matrix` as current | | |
| 7 | NAV-1 | `#/` | Read "Step 6 · Find anything". In Console: `[document.querySelectorAll('[role="search"]').length, document.querySelectorAll('[role="radiogroup"]').length, document.querySelectorAll('header [role="search"], header [role="radiogroup"]').length]` | The region says the search and the theme toggle sit in the top bar on every page, and nowhere else. It draws neither of them. Console: `[1, 1, 2]`. One search and one toggle, both in the top bar (AC5) | | |
| 8 | DATA-4 | `#/` | Read "Step 7 · Is every trail complete?" | `Counted from the 10 nodes of the build plan: 8 read OK, 1 have no trail yet, 1 read otherwise (F0a).` One OK banner: `OK: F0b, F1, F1b, F2, F3, F4, F5, F6`. Compare with `grep -A1 '^## Completeness' docs/trace/build/*/README.md`: every node in the banner reads `OK` there, and no other node does | | |
| 9 | DATA-4 | `#/` | Read F0a's group in the same region | `build/F0a Harness`, then the banner `OK (git-only, F0a)`, then the README's own words as rendered text: `Hooks not yet live: witnessed by git and trailers only.` in bold, the `git log` command in monospace, and the whole paragraph as one block. No `**`, no backtick and no list marker left on the page (AC5) | | |
| 10 | DATA-4 | `#/` | Read F7's group in the same region | The not-built-yet pattern, `Node F7 has no commits, gates or verdicts to show.`, and `F7 (Pitch deck) has status pending and no trail, so its completeness is null.` F7 is never counted as OK | | |
| 11 | DATA-4 | `#/` | Read the Gap group in the same region. Click the `COULD-2b` chip, go back, then click `CANCEL-7` | `Gap 8 rules list a red commit and no green commit in the matrix. They are shown as listed, with nothing filled in.` Eight chips: CANCEL-1a, CANCEL-1b, CANCEL-6, CANCEL-7, COULD-2, COULD-2a, COULD-2b, COULD-2c. Each chip opens its own rule: `#/rules/COULD-2b` heads `COULD-2b Claim date within a term's cover`, and `#/rules/CANCEL-7` heads `CANCEL-7 Cancellation date within cover` (AC5) | | |

### B. The requirements matrix, `#/rules` (AC2)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 12 | MATRIX-1 | `#/` | Click `Requirements matrix` in the primary nav | It is a link now, and opens `#/rules`, marked current (`aria-current="page"`). Tab: `Requirements matrix · Docket`. Eyebrow `Index · requirements matrix`, status `Pass 29 of 29 rules`, and `Snapshot <short SHA>` linked to its commit. The filter summary reads `Showing 29 of 29 rules, no filters set.` | | |
| 13 | MATRIX-1 | `#/rules` | Read the table header, then the Rule column top to bottom. Run `grep -c ' build/F' docs/trace/requirements-matrix.md` | Columns: Rule, Title, Feature, Status, Node, Tests, at the node, Red, Green, Refactor, QA step, Sign-off, PR. These are `requirements-matrix.md`'s columns, plus Title, Feature and Status. 29 rows, the count the command prints, each rule once, in requirements.md's order from SELL-1 to COULD-3. No ui-plan rule (no DATA-, NAV- or WB- row) | | |
| 14 | MATRIX-1 | `#/rules` | Read the SELL-1 and GET-1 rows | SELL-1: `Policy reference must be unique` · Sell · Pass · `build/F1` · `22 of 22` · `b716734` · `7d3f791` · `none recorded` · `docs/qa/build-F1.md#1` · `David 2026-10-18` · `#10`. GET-1: `Retrieve a policy` · Retrieve · Pass · `build/F2` · `59 of 59` · `94a7473` · `92ede9e` · `80d3ee2` · `docs/qa/build-F2.md#1` · `David 2026-10-19` · `#17` | | |
| 15 | MATRIX-1 | `#/rules` | DevTools Network, cleared. Open the Feature filter; choose `Cancel` | Options: Any, Sell, Retrieve, Cancel, Renew, `Could-haves (all in scope)`. With Cancel, 9 rows (CANCEL-1a, CANCEL-1b, CANCEL-1c, CANCEL-2 to CANCEL-7) and `Showing 9 of 29 rules, 1 filter set.` Network: no request. The filter reads the rows already loaded | | |
| 16 | MATRIX-1 | `#/rules` | Open the Status filter; choose `Pass`, with Feature on `Renew`. Then click `Clear filters` | Status options: Any and Pass. Every rule in this snapshot passes, so no other status is offered. Renew and Pass give 6 rows (RENEW-1/2, RENEW-3a, RENEW-3b, RENEW-4, RENEW-5, RENEW-6) and `Showing 6 of 29 rules, 2 filters set.` Clear filters shows all 29 again, and the button goes | | |
| 17 | MATRIX-1 | `#/rules` | Click the `RENEW-1/2` chip; go back; click `COULD-2c` | The address bar shows `#/rules/RENEW-1%2F2`, and the page heads `RENEW-1/2 Renew within 30 days of the end date, not after it`. `#/rules/COULD-2c` heads `COULD-2c No claim on a cancelled policy`. Each chip opens its own rule, the slash ID included | | |
| 18 | MATRIX-1 | `#/rules` | DevTools device toolbar 390 × 844, light and dark. In Console: `document.documentElement.scrollWidth - document.documentElement.clientWidth` | `0`. The table scrolls sideways inside its own frame, never the page. Every cell is readable in both themes | | |
| 19 | NAV-3 | `#/rules` | Hover SELL-1's Red SHA, its PR, its QA step and its Node | Red: `https://github.com/dpmorgandev/uinsure-policies-api/commit/b7167342ed28fdac4f781734ef6b1b288b607141`. PR: `…/pull/10`. QA step: `…/blob/<snapshot SHA>/docs/qa/build-F1.md`. Node: `#/plans/build/F1`, in the app | | |
| 20 | NAV-3 | `#/rules` | Read CANCEL-5's row. Ctrl+F `undefined` | Red `ebe3e84` and Green `285350f` are links, and Refactor reads `none recorded`, not a link. `undefined` has 0 matches on the page. The matrix file holds `undefined` in that cell (`grep -n 'CANCEL-5 ' docs/trace/requirements-matrix.md`), and it names no commit | | |

### C. The rule page, `#/rules/<id>` (AC3, AC4)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 21 | RULE-1 | `#/rules/SELL-1` | Open it; read the header | Breadcrumbs `Overview › Requirements matrix › SELL-1`. Eyebrow `Rule · build/F1 · Sell · MUST`. Title `SELL-1 Policy reference must be unique`. Status `Pass 22 of 22`. IDs: Rule `SELL-1`, PR `#10` (a link), Snapshot SHA `HEAD <short SHA>`. Tab `Rule · Docket`. The nav marks Requirements matrix as current | | |
| 22 | RULE-1 | `#/rules/SELL-1` | Read the interpretation under the chip; compare with `sed -n 57p docs/requirements.md` | The third cell of line 57, as rendered text, labelled `written`. The status codes **400** and **409** in bold, as the file marks them, and `^[A-Z0-9-]{3,20}$` in monospace. No `**` and no backtick shown | | |
| 23 | RULE-2 | `#/rules/SELL-1` | Read the answer under the question, then the order line in "Step 2 · Red before green, rung by rung". Check with `grep -n -e b716734 -e 7d3f791 docs/trace/build/F1/walkthrough.md` | Answer: `Yes. Red is rung #3, green is rung #52, and David signed it off on 2026-10-18.` Order line: `Red at #3 sits above green at #52.` No `Out of order` tag. The command shows b716734 at row 3 and 7d3f791 at row 52 | | |
| 24 | RULE-2 | `#/rules/SELL-1` | Read the spine down. Compare with `grep SELL-1 docs/trace/build/F1/walkthrough.md` | One rung per F1 walkthrough row that names SELL-1 with a TDD step, in row order: #3, #25, #26, #44, **#52**, #62, **#64**, #70, #71, #72, #76 (11 rungs; #81, the QA script, has no TDD step). Each has its SHA, its agent, its step and the subject the agent wrote, plus `Committed <yyyy-MM-dd>`. #3 b716734 red, tester, `Committed 2026-10-18`, is a key rung. #52 7d3f791 green, builder, `Committed 2026-10-18`, is also a key rung. Below them: QA step `docs/qa/build-F1.md#1`, sign-off by David on 2026-10-18, and PR #10 `Merged`. **The tester expects this step to fail at f880001: #52 and #64 are missing (note 1)** | | |
| 25 | RULE-2 | `#/rules/SELL-7` | The control for step 24: read the spine | #9 0fbe19e red, then #52 7d3f791 green (a key rung) and #64 f6c64dd green. The order line reads `Red at #9 sits above green at #52.` | | |
| 26 | RULE-2 | `#/rules/CANCEL-1a` | Read the answer and Step 2 | Answer: `The trail does not list both a red and a green commit for this rule, and David signed it off on 2026-10-19.` No order line and no `Out of order` tag: with no green there is no order to judge. Red rung #5 61f73b1, `Committed 2026-10-19` | | |
| 27 | RULE-1 | `#/rules/SELL-1` | Read "Step 3 · Tests". Compare the list with `grep -rn -A3 'Trait("Rule", "SELL-1")' tests --include=*.cs \| grep 'public '` | `Pass 22 of 22`, labelled `generated`. `Tests passing, as the requirements matrix row gives them: 22 of 22.` and a link `docs/trace/requirements-matrix.md:6`. Then the tests by C# method name, each with its file, for example `New_reference_is_sold_with_201_and_its_Location_and_reads_back` `tests/Uinsure.Policies.Api.Tests/SellReferenceTests.cs`. Every method the command finds is listed, and no method traited only with another rule. The list is read at the snapshot, so it can be longer than the 22 counted at F1: 23 SELL-1 traits at f880001 | | |
| 28 | RULE-1 | `#/rules/SELL-1` | Read "Step 4 · QA step and sign-off" | Labelled `written`. QA step `docs/qa/build-F1.md#1`, a link. Sign-off `David 2026-10-18`. `Commit signed off: 0d39041`, linked to `…/commit/0d39041ba87187ae285adf18817bf77efe67ecf5` (F1's `signoff(<sha>)` event) | | |
| 29 | RULE-1 | `#/rules/RENEW-1%2F2` | Read "Step 3 · Tests". Compare with `grep -rn -A3 -E 'Trait\("Rule", "RENEW-[12]"\)' tests --include=*.cs \| grep 'public '` (29 methods at f880001) | `Pass 30 of 30`, then RENEW-1/2's tests by name, the methods traited `RENEW-1` or `RENEW-2` (the requirements-trace convention for a slash ID). **The tester expects this step to fail at f880001, showing `The trail names no tests for this rule.` (note 2)** | | |
| 30 | NAV-3 | `#/rules/SELL-1` | Read "Step 5 · Links out, to GitHub"; hover each link, then open the rule text link | Red `b716734` to `…/commit/b7167342ed28fdac4f781734ef6b1b288b607141`. Green `7d3f791` to `…/commit/7d3f7914e32e01f4a4a3d4a6d75dcfe60f94d668`. No Refactor line. `PR #10` to `…/pull/10`. Rule text `docs/requirements.md:57` to `…/blob/<snapshot SHA>/docs/requirements.md#L57`, which opens on SELL-1's row. Matrix row `docs/trace/requirements-matrix.md:6` to the same SHA, `#L6`. QA script `docs/qa/build-F1.md#1` to `…/blob/<snapshot SHA>/docs/qa/build-F1.md` | | |
| 31 | NAV-3 | `#/rules/CANCEL-5` | Read "Step 5"; Ctrl+F `undefined` | Red `ebe3e84` and Green `285350f` are links, PR #28 too. There is no Refactor line, and `undefined` has 0 matches. Step 2's spine has no rung named `undefined` | | |
| 32 | NAV-3 | `#/rules/GET-1` | Read "Step 5"; hover Refactor and the PR | Red `94a7473`, Green `92ede9e` and Refactor `80d3ee2`, the last to `…/commit/80d3ee281e087e692b3ac9e6bf7728018b688fd8`. `PR #17` to `…/pull/17`. Rule text `docs/requirements.md:69` | | |
| 33 | DATA-4 | `#/rules/DATA-2` | Open it (a ui-plan rule, owned by U3, with no tests yet) | Eyebrow `Rule · ui/U3 · Trail data (the compiler) · MUST`. Status `Not built`. Answer: `This rule is not built yet, so there is no red, green or sign-off to show.` Step 2: not built yet, `Rule DATA-2 has no red, green, refactor, QA step or sign-off to show.`, and `Back to the requirements matrix`. Step 3: `The matrix holds no test count for this rule yet.` Step 4: `no QA step recorded`, `no sign-off recorded`, `Commit signed off: none recorded`. Step 5 holds only the rule text link, `docs/ui-requirements.md:109`. No commit link, no `‹…›` placeholder | | |
| 34 | DATA-4 | `#/rules/WB-8` | Open it (its matrix row says `unmapped`: no node) | Title `WB-8 Demo clock`. The eyebrow names no plan or node. The same not-built answer, Step 2 pattern and gaps as step 33. Nothing is filled in with a default | | |

### D. The node and commit pages (AC3, AC4)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 35 | DATA-4 | `#/plans/build/F0a` | Open it; read the header and Step 1. Run the command Step 1 gives | Tab `Node build/F0a · Docket`. Header `Node · build/F0a`, `F0a Harness`, `Done`, `Attempt 0`. Banner `OK (git-only, F0a)`. The Loop and Activity tabs are marked empty. Step 1: `Completeness is shown in the banner above, in the trail's own words.`, then the README's paragraphs as rendered text, as step 9. Then the command `git log --oneline --grep='(build/F0a)'`, which lists F0a's `plan(build/F0a)` commits | | |
| 36 | DATA-4 | `#/plans/build/F1` | Open it | Banner `OK`, and `Completeness is OK, as the banner above says.` The Rules, Tasks, Attempts and Who touched what regions each say not built yet | | |
| 37 | DATA-4 | `#/plans/build/F7` | Open it | Header `F7 Pitch deck`, `Pending`, `Attempt 0`. No completeness banner: in its place, not built yet, `trail completeness has nothing to show yet.` Step 1: `This node has no trail yet, so it has no completeness value to show.` Nothing reads OK | | |
| 38 | NAV-3 | `#/commits/7d3f791` | Open it; read "Step 4 · Links out"; hover each link. Compare the Rule chips with `git log -1 --format='%(trailers:key=Rule,valueonly)' 7d3f791` | Tab `Commit 7d3f791 · Docket`. The header, trailer and diff regions say not built yet. Commit `7d3f791` to `…/commit/7d3f7914e32e01f4a4a3d4a6d75dcfe60f94d668`. Parent `9e860a1` to `…/commit/9e860a1e6d573f5f515e3591fb8a748eee268bb2`. Node `build/F1`, to `#/plans/build/F1`. Rule: seven chips, SELL-1 to SELL-7, as the command prints them, each opening its own rule. **The tester expects this step to fail at f880001, showing the SELL-7 chip alone (note 1)** | | |
| 39 | NAV-3 | `#/commits/b716734` | Open it; run the verify command it gives | Commit to `…/commit/b7167342ed28fdac4f781734ef6b1b288b607141`. Parent `f58f310`, a link. Node `build/F1`. One Rule chip, `SELL-1`, opening `#/rules/SELL-1`. The command, `git log -1 --format="%h %(trailers:key=TDD,valueonly) %s" b716734`, prints `b716734 red`, with the subject `test(SELL-1): red: unique, normalised reference; 409 on duplicate, 400 off-pattern` on the next line | | |

### E. What the live trail can't show (AC3, AC4)

The live build plan has no `TRAIL INCOMPLETE` node, no rule whose green came before its red, and no rule of
requirements.md that is not built. These cases run only on the fixture trails (`tests/web/fixtures/trails/rules/`
and `two-plans/`). Part F covers them: steps 40 (an out-of-order rule), 44 (an incomplete trail and a not-built
rule) and 41 (a template-literal test title).

### F. The acceptance suite

Run from the worktree root. The suite replays fixture trails into throwaway repos, and never touches this one.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 40 | RULE-2 | shell | `DOCKET_APP_PORT=4172 npm --prefix src/web run e2e -- e2e/U1/ --grep "RULE-2 · "`, then `npm --prefix src/web run test -- -t "RULE-2 · "` | `10 passed`, then every unit test passed (6 at f880001). On the `rules` fixture, GET-1's green c11 came before its red c12. Its page says the order is violated, draws green above red as committed, and marks both rungs `Out of order` in words. SELL-1's order holds, with dates | | |
| 41 | RULE-1 | shell | `DOCKET_APP_PORT=4172 npm --prefix src/web run e2e -- e2e/U1/ --grep "RULE-1 · "`, then `npm --prefix src/web run test -- -t "RULE-1 · "` | `22 passed`, then every unit test passed (11 at f880001). These cover the title, feature, priority, interpretation and status codes, the tests by name (a template-literal title once, marked parameterised), the commits in TDD order, the QA step, the sign-off and its commit, a merged PR, a rule with no QA step or sign-off claiming neither, axe and parity | | |
| 42 | NAV-1 | shell | `DOCKET_APP_PORT=4172 npm --prefix src/web run e2e -- e2e/U1/ --grep "NAV-1 · "`, then `npm --prefix src/web run test -- -t "NAV-1 · "` | `26 passed`, then every unit test passed (9 at f880001): the six figures, each with its value and source, the answer first, the build plan's rules only, re-review rounds counted, the search and toggle once, axe and parity | | |
| 43 | MATRIX-1 | shell | `DOCKET_APP_PORT=4172 npm --prefix src/web run e2e -- e2e/U1/ --grep "MATRIX-1 · "`, then `npm --prefix src/web run test -- -t "MATRIX-1 · "` | `22 passed`, then every unit test passed (12 at f880001): every rule once in order, each column of a row, the Status and Feature filters alone, together and cleared, filtering without a request, the chips, axe and parity | | |
| 44 | DATA-4 | shell | `DOCKET_APP_PORT=4172 npm --prefix src/web run e2e -- e2e/U1/ --grep "DATA-4 · "`, then `npm --prefix src/web run test -- -t "DATA-4 · "` | `26 passed`, then every unit test passed (10 at f880001). F2's `TRAIL INCOMPLETE` reasons are shown verbatim, all five in order, and F2 is never inside the OK banner. CANCEL-1 (no tests) and CANCEL-2 (no node) are not built yet, on the overview, the matrix and their rule pages. F0a reads git-only, as rendered text. F3, with no trail, is not built yet. No raw placeholder. Axe and parity | | |
| 45 | NAV-3 | shell | `DOCKET_APP_PORT=4172 npm --prefix src/web run e2e -- e2e/U1/ --grep "NAV-3 · "`, then `npm --prefix src/web run test -- -t "NAV-3 · "` | `18 passed`, then every unit test passed (8 at f880001): commit, PR, QA-script and file:line links from the matrix, the rule page and the commit page, no link from an `undefined` cell, axe and parity | | |

## Notes

1. **Repeated `Rule:` trailers keep only the last (steps 24, 25 and 38).** `src/web/compiler/git.ts`, `trailersOf`,
   builds the trailer map with `Object.fromEntries`, so a key that appears twice keeps its last value. F1's
   `7d3f791` (row 52) and `f6c64dd` (row 64) each carry seven `Rule:` lines, SELL-1 to SELL-7, so the compiler
   reads each as `Rule: SELL-7` alone. SELL-1's spine then loses its own matrix green (#52) and #64, though its answer
   still names green at #52. SELL-2 to SELL-6 lose the same two rungs, and the commit page of `7d3f791` shows one
   Rule chip. The later nodes write one comma-separated `Rule:` line (for example `285350f`), so only F1 is hit. A
   fixture's trailers are a JSON object in `commits.json`, which can't hold a repeated key, so no fixture has a
   repeated `Rule:` line and the suite is green. The tester read this from the code and did not see
   it in the app. If step 24 fails as predicted, it is a finding for RULE-1 and RULE-2.
2. **RENEW-1/2 lists no tests (step 29).** The compiler matches a test's `[Trait("Rule", "…")]` to the rule ID
   exactly (`compiler/index.ts`: `t.rule === row.id`). The C# tests trait `RENEW-1` and `RENEW-2`, never `RENEW-1/2`
   (the requirements-trace convention), so the page says the trail names no tests while the matrix says 30 of 30.
   The unit test `RULE-1 · a C# test is named by its method…` expects `RENEW-1/2` to have no tests, on a fixture
   that has no RENEW trait, so it doesn't decide the case. Whether a slash ID gathers its parts' tests is your
   ruling.
3. **Filters: by feature, not by node (step 15).** AC2 says "filters by node and status". MATRIX-1's
   interpretation and the signed-off matrix screen say "filterable by status and feature", and the build and its
   tests follow the rule row. The Node column is in the table but has no filter. If AC2's wording is the intent,
   that is a steer.
4. **The figures that could move.** The build plan is finished except F7, so steps 1 to 4 hold unless the trace
   commit (t14) rewrites `docs/trace/requirements-matrix.md` or a build node's trail. Steps 4, 8, 13 and 23 give
   the commands that count them. The matrix line numbers (SELL-1 at 6) are f880001's.
5. **Links to the snapshot SHA.** File links (rule text, matrix row, QA script, figure sources) are built from the
   compiled-at SHA, the branch HEAD you compiled. GitHub serves them only once that commit is pushed. Commit links
   to the build plan's SHAs are on `main` already.
6. **`src/web/public/` and `src/web/test-results/` are not git-ignored.** `src/web/.gitignore` lists `node_modules/`
   and `dist/` only. `npm run trace` writes `public/`, and a Playwright run writes `test-results/`, which is already
   untracked in this worktree. Delete both when you finish. An ignore line is a builder or harness change, not
   this script's.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: __ of 45 · Steer (if any): ______
