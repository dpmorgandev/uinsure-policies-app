# QA script: ui / U3, Loop, verdicts, findings and the retry ladder

Rule IDs: LOOP-1, LOOP-2, LOOP-3, LOOP-4, DATA-2
Branch: feature/ui/U3   Worktree: .claude/worktrees/ui-U3
Commit under test: written at ca3f1a3 (8b95cd4), revised at f8c3471 for LOOP-4. ca3f1a3 was HEAD at attempt 3's
gates (every node's rule tests, 488 of 488, on the merged HEAD, `loop.jsonl:64`). Since then the only source change is
the root-cause split in `src/web/compiler/plans.ts` (red ed3f62d, a4935b5 and 55e5364; green 4ab971f and 3b25c3c). Check
with `git diff --stat ca3f1a3 HEAD -- src/web`, which lists that one file. So this revision rewrites part D's LOOP-4
steps (35, 36 and 40, and new steps 43 to 46), notes 4 and 10, step 50's U3 figures and part G's LOOP-4 counts. The
other steps' behaviour is as written at ca3f1a3. Only U3's own figures moved, because U3's trail grew. This script's own
commit changes only this file. Record the SHA you test in the sign-off.
App URL: http://localhost:4174. U3 is position 4 in `ui.dag.yaml`, so its app port is 4174. API: 5084, not used by U3.

U3 builds these pages:

- the loop page (`#/plans/<plan>/<node>/loop`): the attempt ladder (LOOP-2) and the gate timeline (LOOP-1), under the
  node header with its Loop tab current;
- the verdict page (`#/plans/<plan>/<node>/verdicts/<round>/<agent>`), with its raw JSON (LOOP-3);
- the finding round page (`#/plans/<plan>/<node>/findings/<round>`) and its "Fixed by" region (LOOP-4);
- the node page's Attempts region, the same ladder with each attempt's steps behind a control (LOOP-2);
- the plan page's investigation body, for `inv-*` plans (LOOP-2);
- the about page's provenance labels (DATA-2);
- the compiler's loop events, verdicts, findings, `inv-*` questions and hypotheses, and each item's provenance.

These regions still show the not-built-yet pattern: the node page's "who touched what", and the about page's
"re-verify with git" and guided tour. Those are U4's.

The Actual and Pass/Fail columns are empty. Unlike U1's and U2's scripts, I checked most values in the Expected column
in a browser. I compiled the trail at ca3f1a3 in a scratch clone outside the repo. I then served the worktree's
existing `src/web/dist` with that `trace.json`. That build is from 17:17Z, after the last source change, f5f98c8. I read
the pages headlessly with Playwright. Nothing was written into the worktree. The console snippets below are the ones I
ran. Figures for done nodes (build/*, ui/U0b, U1, U2, W1) are stable. U3's own figures move with its trail, and those
steps give the command that counts them.

I did not check the revision's figures in a browser. Review runs beside it in this worktree, so I built nothing there.
Instead I ran the compiler's own `splitRootCause` (plans.ts at f8c3471) in Node over every finding the compiler reads,
148 of them, and read the three fields it returns. The compiler can't read ui/U0b A4, whose file holds two JSON blocks,
or ui/DK D1 and D2, which are prose. The finding page draws those fields as they come (`Finding.tsx:84-87`). A
null field draws as `no "<name>:" marker in the recorded text`. Every one of the 148 keeps every character of its
recorded text, except the marker words and colons where it splits.

I expect **five steps to fail, from five causes (notes 1 to 5)**, and **four steps to need your ruling (notes 1, 6
and 7)**. The steps carry them in bold, so check those first. Step 45 is a **known issue (note 10)**, not a failure:
it is tech debt you ruled onto U7. Mark it `Known issue` and don't file it. Notes 1 to 4 show a real trail wrongly
today, which is the test inv-007 used for "blocking". Note 4 is new at f8c3471. The A4 fix (3b25c3c) stopped a real
marker splitting when it follows a closing quote, so ten markers that split at ca3f1a3 now don't. Note 5 is a
SHOULD (RESP-1) and a kit fix. Note 8 lists carries that aren't U3's to fix. One of them is a plan line the
orchestrator owes.

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node U3)

| Tag | Acceptance item |
|---|---|
| AC1 | The loop shows every gate with its command, exit code, expectation and detail; FAILs stand out |
| AC2 | The retry ladder shows each attempt and what changed next |
| AC3 | Each verdict renders from its JSON with gate refs, head SHA and findings, the raw JSON one click away; each finding shows the commit that fixed it |
| AC4 | Every item keeps its provenance label |

## Preconditions

- [ ] Node 22 on `PATH` (`node --version`).
- [ ] `npm --prefix src/web ci` done in this worktree.
- [ ] Playwright's Chromium installed, for part G (`npx --prefix src/web playwright install chromium`).
- [ ] Nothing listening on 4174 (`netstat -ano | grep ":4174 "`, no match).
- [ ] Chrome or Edge, with DevTools.
- [ ] The branch pushed (t13). Links built from the snapshot SHA (the raw JSON's "Read from" link, the finding page's
      file link) answer 404 on GitHub until that commit is pushed. Links to build-plan SHAs already resolve.

Run the commands in Git Bash, from the worktree root, `.claude/worktrees/ui-U3`.

## Run the app on U3's ports

```sh
git status --short; git rev-parse --short HEAD     # write the SHA down: the snapshot SHA on the finding and about pages
npm --prefix src/web run trace                     # the trail at HEAD -> src/web/public/trace.json + chunks
npm --prefix src/web run build                     # vite build; copies src/web/public/ into src/web/dist/
npm --prefix src/web run preview -- --port 4174 --strictPort    # leave it running; open http://localhost:4174/
```

The acceptance suite (part G) reuses a preview that is already running on 4174. It serves its own fixture trails
(`retry-ladder` and `p0-reconciled`, `tests/web/fixtures/trails/`), so the live trail doesn't affect it. Filter by the
path `e2e/U3/`: a bare `U3/` also matches the worktree's folder, `ui-U3/`, and runs every spec.

```sh
DOCKET_APP_PORT=4174 npm --prefix src/web run e2e -- e2e/U3/ --grep "LOOP-1 · "    # one rule's acceptance tests
npm --prefix src/web run test -- -t "LOOP-1 · "                                   # one rule's unit tests
```

When you finish, run `rm -r src/web/public src/web/test-results`. Neither folder is git-ignored (note 8), so never
stage them.

## Console snippets

Paste these into the DevTools Console on the page the step names. The steps refer to them by S-number.

```js
// S1: the gate timeline: how many rows, the rows by result, and the rows drawn as failed.
rows = [...document.querySelectorAll('[data-region="gate-timeline"] [data-kind]')];
c = {}; rows.forEach((r) => { const k = r.dataset.result ?? 'state'; c[k] = (c[k] ?? 0) + 1; });
[rows.length, JSON.stringify(c), rows.filter((r) => r.dataset.result === 'failed').map((r) => r.getAttribute('aria-label')).join('; ')]

// S2: the loop page's steps per attempt, as marker(stage). On the loop page only: the node page keeps them behind a control.
[1, 2, 3].map((n) => [...(document.querySelector(`ol[aria-label="Steps of attempt ${n}"]`)?.children ?? [])].map((li) => `${li.firstElementChild.textContent}(${li.dataset.stage})`).join(' '))

// S3: the ladder's verdict steps that say their file is missing.
[...document.querySelectorAll('[data-region="attempt-ladder"] p')].map((p) => p.textContent).filter((t) => t.endsWith('the verdict file is not in the trail.'))

// S4: how far the page scrolls sideways (0: it doesn't).
document.documentElement.scrollWidth - document.documentElement.clientWidth

// S5: the provenance labels on the page, in page order.
[...document.querySelectorAll('main [data-provenance]')].map((e) => e.dataset.provenance).join(', ')

// S6: on a finding page, each card's Symptom, Cause and Fix direction: its length, then its first and last 60 characters.
[...document.querySelectorAll('.s-findingitem article')].map((card) => card.querySelector('h3').textContent + '\n' + [...card.querySelectorAll('dt')].filter((dt) => ['Symptom', 'Cause', 'Fix direction'].includes(dt.textContent)).map((dt) => { const t = dt.nextElementSibling.textContent; return `  ${dt.textContent} (${t.length}): ${t.slice(0, 60)} … ${t.slice(-60)}`; }).join('\n')).join('\n')
```

How the finding page reads a recorded `root_cause` at f8c3471 (LOOP-4): the text splits at `Symptom:`, `Cause:` and
`Fix direction:`, and a marker may carry a qualifier in brackets, as in `Cause (kit):`. A marker counts only at the start
of the text, or after `.`, `!` or `?` and a space, or after a new line. It doesn't count inside double quotes, backticks
or curly quotes. Text before the first marker opens the Symptom. A repeated marker's text joins its field, in order. A
qualifier stays at the front of its field's text, without its colon, for example `(kit) VerdictFinding.severity …`.
Only the marker words themselves are dropped. A field with no marker reads `no "<name>:" marker in the recorded text`.
Text with no marker at all is kept whole as the Cause.

## Steps

### A. The gate timeline, `#/plans/<plan>/<node>/loop` (AC1)

build/F2 is the reference case (LOOP-2 names it). Open http://localhost:4174/ with DevTools open.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | LOOP-1 | `#/plans/build/F2` | Open F2 from the plan page, then click the `Loop` tab | `#/plans/build/F2/loop` opens. Node header `F2 Retrieve`, `Done`, Attempt `3`, PR `#17`. The `Loop` tab is current, and the nav marks `Plan`. Tab title `Node build/F2 · Docket`. Two regions, in this order: the ladder, which opens `Question. Which gate failed, and did the attempt after it pass the same gate?`, then `Gate and state events, in log order` | | |
| 2 | LOOP-1 | `#/plans/build/F2/loop` | Read the timeline's intro, then run S1. Count with `git show HEAD:docs/trace/build/F2/loop.jsonl \| grep -c -e '"event":"gate\.' -e '"event":"state('` (prints `38`) | 38 rows in log order, each marked attempt·line, from `1·2 state(in_progress)` to `3·56 gate.integrate`. S1: `[38, '{"state":4,"expected-fail":6,"failed":1,"held":27}', '1·4 gate.stub: Gate failed']`. The intro names what isn't listed: setup, attempt++, findings, pause1, verdicts and the investigation. Those are the other 20 lines (1, 5, 6, 8, 21 to 24, 26, 36, 37, 45, 46, 49, 51 to 54, 57 and 58) | | |
| 3 | LOOP-1 | `#/plans/build/F2/loop` | Read row 1·4. Compare with `git show HEAD:docs/trace/build/F2/loop.jsonl \| sed -n 4p` | `gate.stub`, tagged `Gate failed` in the fail colour, with the note `Recorded as ok false: a result the loop acts on, not an error in this page.` Exit `2`, Expected `every GET-1 test fails`, ok `false`. Head `305789d`, linked to `…/commit/305789df2125abfa6ff2e8ba2b0aa9805789008c`. The detail is the line's own text, from `25 total, 13 failed, 12 passed.` to `David: fix (a), accept (b) as pinned.` Below it, in its own block with a Copy button, is the command: `dotnet build -warnaserror; dotnet test --project tests/Uinsure.Policies.Api.Tests --output Detailed -- --filter-trait Rule=GET-1` | | |
| 4 | LOOP-1 | `#/plans/build/F2/loop` | Read rows 1·3 and 2·18 | 1·3 `gate.red`: `Failed as expected`, in the pass colour. Exit `2`, Expected `fail`, ok `true`, and no ok-false note. 2·18 `gate.stubs`: `Failed as expected`. Exit `1`, Expected `no match`, ok `true`. A non-zero exit with ok true is a failure the gate wanted, so neither stands out as a FAIL | | |
| 5 | LOOP-1 | `#/plans/build/F2/loop` | Read rows 3·48 and 3·25 | 3·48 `gate.integrate`: `Gate held`, Exit `0`, Expected `pass`, ok `true`, Head `6add9a9`. The detail reads `No detail recorded in the log.` (the line's detail is empty), and the command is `git rebase origin/main (no-op, c4b6231 an ancestor); dotnet test --solution Uinsure.Policies.slnx`. 3·25 `state(investigating)`: `State change`, with no exit, expectation, ok or command, and `No detail recorded in the log.` | | |
| 6 | LOOP-1 | `#/plans/build/F2/loop` | Above the ladder, click `Read the FAIL at line 4 in the gate timeline` | The page scrolls to row 1·4 and focuses it. The address bar stays `#/plans/build/F2/loop`: the link doesn't change the route. It is the only `Attempt n: … failed` line on the page | | |
| 7 | LOOP-1 | `#/plans/ui/W1/loop` | Run S1. Check with `git show HEAD:docs/trace/ui/W1/loop.jsonl \| grep -n '"ok":false' \| cut -d: -f1` (prints `11 59 65 83 101 106`) | S1: `[80, '{"state":3,"held":67,"expected-fail":4,"failed":6}', '1·11 gate.green: Gate failed; 3·59 gate.e2e: Gate failed; 3·65 gate.integrate: Gate failed; 3·83 gate.e2e: Gate failed; 4·101 gate.integrate: Gate failed; 4·106 gate.e2e-regression: Gate failed']`. Above the ladder there are six `Attempt n: <gate> failed` lines, one for each, and each jumps to its row | | |
| 8 | LOOP-1 | `#/plans/build/F1/loop` | Run S1, and read above the ladder | `[45, '{"state":6,"expected-fail":9,"held":30}', '']`. No gate in F1's log came back ok false, so no `Attempt n: … failed` line is drawn. F1's attempt 1 failed on its verdicts instead (step 18) | | |
| 9 | LOOP-1 | `#/plans/build/F0a/loop` | Open F0a, then click its `Loop` tab, which is marked `empty` | Header `F0a Harness`, `OK (git-only, F0a)`. The ladder reads `No loop log · build/F0a has no loop.jsonl, so there is no attempt to draw.` It then gives F0a's git-only reasons as text, the command `git log --oneline --grep='(build/F0a)'` and `Open the node page`. The timeline reads `No events · build/F0a has no loop.jsonl, so there is no gate or state event to list. A node with gates shows each event's command, exit code, expected outcome, ok and detail here.` Nothing is invented | | |
| 10 | LOOP-1 | `#/plans/build/F9/loop` | Type the URL (no such node) | `not built yet · Node build/F9 has no commits, gates or verdicts to show.`, then `Back to the overview`. No node header, no ladder and no timeline | | |

### B. The retry ladder: the loop page, the node page and the investigation (AC2)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 11 | LOOP-2 | `#/plans/build/F2/loop` | Read the ladder from top to bottom, then run S2 | Three rungs, oldest first, and one branch. `Attempt 1` reads `Failed at gate.stub`, and `Attempt 2` reads `Reviewer FAIL at A2`. Then `Investigation inv-001` steps off the spine. `Attempt 3` reads `Reviewer PASS at A3.2`, with `Reviewed more than once in this attempt: rounds A3, A3.2. Each round keeps its own step.` S2 gives attempt 1 as `1·2(gate) 1·3(gate) 1·4(gate)`. Attempt 2 has 18 steps, from `2·6(findings) #9(fix commit) 2·7(gate)` to `2·21(verdict) 2·22(verdict)`. Attempt 3 has 33 steps, starting `3·26(findings) #26(red test) #27(red test) #28(red test) #29(red test) 3·28(gate) #30(red test) #31(fix commit) #32(fix commit) 3·29(gate) #33(fix commit)` | | |
| 12 | LOOP-2 | `#/plans/build/F2/loop` | Read the turn under attempt 1, then the start of attempt 2 | Under attempt 1: `1 → 2 on gate.stub FAIL at 305789d; failure route round A1` (line 5). Attempt 2 opens with `2·6` `Findings` `Round A1`, where `A1` links to `#/plans/build/F2/findings/A1`. Next comes `#9` `Fix commit`: `8988ed8`, `stub`, `builder`, `fix(GET-1): canned status and term number match no expected value`, `Fixes-Finding: A1/I1, A1/I2`. #9 links to `#/commits/8988ed8`. Then `2·7 gate.stub` reads `Failed as expected`: the re-run at aee97ab, exit 2, ok true. This is the chain: FAIL, findings, fix, re-run | | |
| 13 | LOOP-2 | `#/plans/build/F2/loop` | Read the end of attempt 2, then the branch | 2·21 and 2·22 are verdict cards, each `Round A2`. Security is `PASS`, with no findings. Reviewer is `FAIL`, with Rules missing `GET-1`, R1 `P1` route tester, and R2 to R6 `P2`. Each card has `Open the security verdict A2` or `Open the reviewer verdict A2`. Under the rung: `2 → 3 on reviewer FAIL at 8ea8f60 (A2)`. Then comes the branch `Investigation inv-001`, with `Steps off the spine when attempt 3 opens.` and its why, `attempt 3 stop; parent build/F2. …`. It has three entries: `3·24 investigation.opened(inv-001)`, `3·25 state(investigating)` (`No detail recorded in the log.`) and `3·27 state(in_progress)` (`inv-001 hand-back: recommendations 1-3 accepted by David; …`). Then `Rejoins the spine at attempt 3.` and `Open the investigation plan inv-001` | | |
| 14 | LOOP-2 | `#/plans/build/F2/loop` | Read attempt 3 | `3·26` Findings `Round A2`. Then the red tests `#26 357e108`, `#27 02e49a2`, `#28 ef7d2e6` and `#29 2753a64`, each `red` `tester` and trailed `Fixes-Finding: A2/I1`, `A2/I3`, `A2/I4` and `A2/I5`. Then `3·28 gate.finding-red` (`Failed as expected`), `#30 6947971` (A2/I6), the fixes `#31 8be3aed` (`A2/I1, A2/I2`) and `#32 0e107fd` (A2/I3), `3·29 gate.green` and `#33 af38b4b` (A2/I4). Then the A3 verdicts at 3·36 and 3·37 (both PASS; the reviewer has R1 `P2`) and the A3.2 verdicts at 3·45 and 3·46 (both PASS). The last attempt has no turn line. **Ruling (note 6): #30 is drawn below 3·28, and #33 below 3·29. A commit is placed after the gate whose head it is, so the gate reads as if it ran before its own commit** | | |
| 15 | LOOP-2 | `#/plans/build/F2` | Read the node page's Attempts region. Click `Show the steps of attempt 2` | The same ladder, with steps behind a control. `Attempt 1` `Failed at gate.stub`, `3 steps in this attempt.`; `Attempt 2` `Reviewer FAIL at A2`, `18 steps`; then the inv-001 branch, shown in full; then `Attempt 3` `Reviewer PASS at A3.2`, `33 steps`. The turn lines are those of steps 12 and 13. The control opens attempt 2's 18 steps in place. Under the ladder is the command `git log --oneline --grep='(build/F2)'`. "Who touched what" still says not built yet | | |
| 16 | LOOP-2 | `#/plans/inv-001` | On F2's loop, click `Open the investigation plan inv-001`. Read Step 3, and compare with `git show HEAD:docs/plans/active/inv-001.plan.md \| sed -n 10,16p` | `#/plans/inv-001` opens. Step 3, `Read the investigation`, shows the Question: `Why does the reviewer FAIL build/F2 at attempt 2, and is each cause in the code, the tests, or the orchestrator's briefs?` The Hypothesis runs from `Both F2 FAILs share one cause:` to `or a test seeds hasClaims true.`, as written. Findings and Recommendations read `not read from the plan file`, the gap the signed-off plan screen draws. An investigation is now reachable by a link (U2's note 9) | | |
| 17 | LOOP-2 | `#/plans/build` | Read Step 3 | `This plan is not an investigation, so this body is empty. An inv-* plan shows its question, hypothesis, findings and recommendations in these rows.` Then four rows, each `none: not an investigation plan`. U2's header and graph above it are unchanged | | |
| 18 | LOOP-2 | `#/plans/build/F1/loop` | Read the rungs | `Attempt 1` reads `Security FAIL at A1`: no gate failed, so the first FAIL verdict (line 39) names the rung. Its steps include the findings rounds D1 and D2 and both A1 verdicts. The turn under it is line 41, `attempt 1 -> 2: reviewer FAIL + security FAIL at 762c994 (round A1); …`. `Attempt 2` reads `Reviewer PASS at A2` | | |
| 19 | LOOP-2 | `#/plans/ui/U3` | Read the turn line under each attempt in Attempts. Compare with `git show HEAD:docs/trace/ui/U3/loop.jsonl \| grep -n '"event":"attempt++"' \| cut -c1-200` | Each turn sits under the attempt it ends. Attempt 1 reads `gate.stub ok false at edc078a: 1 illegal pass (LOOP-1 axe on the canned loop page)` (line 5). Attempt 2 reads `reviewer FAIL A2 at 8d31cbc` (line 33). **I expect this to fail at ca3f1a3. Attempt 1 reads `reviewer FAIL A2 at 8d31cbc`, attempt 2 has no turn line, and line 5's text appears nowhere (note 2).** On `#/plans/ui/W1` the same shift shows. Attempt 1 reads line 30's `reviewer FAIL at attempt 2 (A2: R1-R3 P1, R4-R6 P2)`, attempt 2 reads line 84's `attempt 3 -> 4: …`, and attempt 3 has none | | |
| 20 | LOOP-2 | `#/plans/ui/U0b/loop` | Read attempts 4 and 5, then run S3. List the files with `git ls-tree --name-only HEAD docs/trace/ui/U0b/verdicts/` | Six files are listed (A4, A5 and A5.2, each reviewer and security). Each verdict step draws its card from its file, as `#/plans/ui/U0b/verdicts/A4/reviewer` does. **I expect this to fail. S3 lists 6 steps, each `verdict(<agent>,<verdict>,verdicts/A<n>-<agent>.json): the verdict file is not in the trail.` (note 3).** For a control, run S3 on `#/plans/build/F0b/loop`. It lists 3 F0b files, `D1-security.json`, `D1-reviewer.json` and `A1-reviewer.json`, which really are absent. For them the sentence is true | | |
| 21 | LOOP-2 | `#/plans/ui/W1` | Read the tag on each rung in Attempts | `Attempt 1` `Failed at gate.green`; `Attempt 2` `Reviewer FAIL at A2`; then the branch `Investigation inv-006`; `Attempt 3` `Failed at gate.e2e` (rounds A3 and A3.2); `Attempt 4` `Failed at gate.integrate`. **Ruling (note 6): W1's A4 verdicts are both PASS, and W1 was signed off in attempt 4. Its log ends `signoff(35976c9…)`. Its last rung still says it failed, because a rung is tagged with the attempt's first ok-false gate (line 101).** U2 has the same pattern: its attempt 2 reads `Failed at gate.e2e-regression` | | |
| 22 | LOOP-2 | `#/plans/ui/U3/loop` | Read the branch and attempt 3 | The branch `Investigation inv-007` comes before attempt 3: `3·34 investigation.opened(inv-007)`, then `3·36 state(in_progress)` with inv-007's decision, then `Open the investigation plan inv-007`. Attempt 3's steps start `3·35` Findings `Round A2`, then red test `686b318` (A2/I1), `3·37`, red test `2bd3d3f` (A2/I2), `3·38`, fix `807a977` (A2/I2), `3·39`, fix `d5e42b1` (A2/I1), then `3·40` (run S2). Until t12 renders U3's walkthrough, these markers are short SHAs rather than `#n`. Each of these commits shows the agent `—` (note 8). Attempts 2 and 3 are both tagged `Failed at gate.e2e-regression` (lines 23 and 46, note 6) | | |
| 23 | LOOP-2 | `#/plans/build/F2/loop` at 390 | Set the DevTools device toolbar to 390 × 844, then run S4. Then open `#/plans/build/F2`, click `Show the steps of attempt 2`, and run S4 again | `0` both times (RESP-1: no page scroll at 390 wide). **I expect this to fail. S4 gives `47` on F2's loop page (F1's too), `29` on U3's and `65` on F2's node page with attempt 2 open. In a ladder step, the security verdict card's rule chips (`API3:2023` … `NET:logging`) don't wrap (note 5).** The verdict, finding, plan and about pages give `0` | | |

### C. Verdicts, `#/plans/<plan>/<node>/verdicts/<round>/<agent>` (AC3)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 24 | LOOP-3 | `#/plans/build/F2/verdicts/A2/reviewer` | On F2's loop, click `Open the reviewer verdict A2`. Compare with `git show HEAD:docs/trace/build/F2/verdicts/A2-reviewer.json` | Tab `Verdict · Docket`, and the nav marks `Plan`. Breadcrumbs `Plans / build / F2 / Loop / reviewer A2`. Eyebrow `Verdict · build/F2 · reviewer`, title `Reviewer verdict A2`. Status `FAIL`, Round `A2`, Attempt `2`. The verdict card shows `F2` `FAIL`, Agent `reviewer` and Round `A2`. Head `8ea8f60` links to the commit `8ea8f604d6be272a478d5938d0a05f3c31d6f874`. Rules covered `none`, Rules missing `GET-1`. Findings: R1 `P1` route tester, R2 to R4 `P2` route builder, R5 and R6 `P2` route tester, each with its `what` | | |
| 25 | LOOP-3 | `#/plans/build/F2/verdicts/A2/reviewer` | Read Base, Diff fingerprint and Gate refs. Count with `git show HEAD:docs/trace/build/F2/verdicts/A2-reviewer.json \| sed -n '/gate_refs/,/]/p' \| grep -c '@'` (prints `15`) | Base `b2584f7`. Diff fingerprint `f12391cb7cd302ea019c672f9879cd8d32081225`. 15 gate refs in the file's order. Each shows the gate, its SHA linked to the commit, and what the verdict adds. They start `gate.red b7d5b5a (attempt 1)`, `gate.stub 305789d (attempt 1, ok:false)` and `gate.stub aee97ab (attempt 2)`, and end `gate.vulnerable 803c898` | | |
| 26 | LOOP-3 | `#/plans/build/F2/verdicts/A2/reviewer` | Read the Findings region. Hover R1's file link | Six findings, R1 to R6. R1's tag `P1` is in the fail colour; R2 to R6 `P2` are in the warn colour. Each has Rule `GET-1` as a chip to `#/rules/GET-1`, the file, `Why it matters` (verbatim) and `Routed to`. R1's file is `src/Uinsure.Policies.Api/Contracts/PolicyMappings.cs:37`, linked at the verdict's head: `…/blob/8ea8f604d6be272a478d5938d0a05f3c31d6f874/src/Uinsure.Policies.Api/Contracts/PolicyMappings.cs#L37` | | |
| 27 | LOOP-3 | `#/plans/build/F2/verdicts/A2/reviewer` | In Raw JSON, click `Raw JSON: reviewer verdict A2 (112 lines)`. Check with `git show HEAD:docs/trace/build/F2/verdicts/A2-reviewer.json \| wc -l` (prints `112`) | Closed until clicked; one click opens the stored file. It starts `{`, `"v": 1,`, `"ts": "2026-10-18T22:49:34Z",`: the file's own text and layout, not a re-serialisation. Above it: `recorded`, then `Read from docs/trace/build/F2/verdicts/A2-reviewer.json at the snapshot.` That link goes to the file at the snapshot SHA | | |
| 28 | LOOP-3 | `#/plans/build/F2/verdicts/A3/reviewer` | On F2's loop, open in turn `Open the reviewer verdict A3`, `Open the security verdict A2` and `Open the reviewer verdict A3.2` | A3 reviewer: `PASS`, Attempt `3`, Head `af38b4b`, Base `c4b6231`, fingerprint `62863841f3ead8e813974b9413751007248bd891`. Covered `GET-1`, nothing missing, and one finding: R1 `P2` at `tests/postman/Uinsure.Policies.postman_collection.json:3486`, route tester. A PASS can carry a finding. A2 security: `PASS`, 10 rules covered (`API3:2023` to `NET:logging`), and `This verdict lists no findings.` A3.2 reviewer: `PASS`, Head `143e5ba`, 16 gate refs, no findings | | |
| 29 | LOOP-3 | `#/plans/ui/U3/verdicts/A2/reviewer` | On U3's loop, attempt 2, click `Open the reviewer verdict A2` | `FAIL`, Head `8d31cbc`, Base `3c7b146`, fingerprint `9415dacf86aead16a6ad6f380ace8f0d11791a8a`, 20 gate refs. Covered `LOOP-1, LOOP-2, LOOP-4, DATA-2`, missing `LOOP-3`. R1 `P1` at `src/web/app/explorer/verdict/Verdict.tsx:115`, then R2 to R4 `P2`. These are the findings attempt 3 answered | | |
| 30 | LOOP-3 | `#/plans/ui/U3/verdicts/A2/security` | Open it, then click S1's Rule chip | `PASS`, with 12 covered (`W1` to `W8`, `API8:2023`, `API10:2023`). S1 is `P2`, at `src/web/kit/primitives/sha-link/ShaLink.tsx:61`. The `API8:2023` chip opens `#/rules/API8%3A2023`, which reads `requirements.md in this snapshot has no rule with that ID.` That is honest, but a security category is drawn as a rule chip. Your call whether that matters | | |
| 31 | LOOP-3 | `#/plans/build/F2/verdicts/A9/reviewer` | Type the URL (no such round) | `not built yet · reviewer verdict A9 of build/F2 has nothing to show yet.`, then `Back to the loop`. Nothing invented | | |
| 32 | LOOP-3 | shell | `grep -rlE '"severity": *"P0"' docs/trace/*/*/verdicts/` | Prints nothing: no verdict file in the trail holds a P0, so A2/I1's fix can't be seen in the running app. Step 56 proves it on the `p0-reconciled` fixture. On a verdict page and on its ladder rung, R1 must read `P0`, never `P2`, in the fail tone | | |

### D. Findings, `#/plans/<plan>/<node>/findings/<round>` (AC3)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 33 | LOOP-4 | `#/plans/build/F2/findings/A1` | On F2's loop, attempt 2, click `A1`. Compare with `git show HEAD:docs/trace/build/F2/findings/A1.md` | Tab `Finding · Docket`. Breadcrumbs `Plans / build / F2 / Findings A1`. Eyebrow `Finding round · build/F2`, title `Round A1: findings on node F2`. Status `Fix commit recorded for each`, Rule `GET-1`, Attempt `2`, and Snapshot SHA your short SHA. Then `recorded`, with `Finding text from docs/trace/build/F2/findings/A1.md`. Then `Source: gate.stub (ok:false) at 305789df2125abfa6ff2e8ba2b0aa9805789008c, docs/trace/build/F2/loop.jsonl:4.` | | |
| 34 | LOOP-4 | `#/plans/build/F2/findings/A1` | Read I1's card | The line above it reads `I1 · rule GET-1 · layer api · attempt 2 · testable`. The card is headed `I1` `Testable`. Symptom: `5 RetrieveStatusTests rows pass on the stub (…)`. Cause: from `src/Uinsure.Policies.Api/Contracts/PolicyMappings.cs:32 hard-codes the status as PolicyStatus.Active.` Files: three, each linked to GitHub at 305789d, the commit the round's source names. Fix direction: `the canned status must be a value that no GET-1 test expects. …`. Then the Suggested test. Fixed by `8988ed8`, `Fixes-Finding: A1/I1`, `fix(GET-1): canned status and term number match no expected value (then 92ede9e)` | | |
| 35 | LOOP-4 | `#/plans/build/F2/findings/A1` | Read I2's card, then run S6. Compare with I2's `root_cause` in the file | I2's recorded text has no `Symptom:` or `Cause:` marker, only `Fix direction:`. The text before that marker opens the Symptom, all 1,643 characters of it, from `Checking David's ruling turned up a false premise.` to `… and no finding is raised for them.` Cause reads `no "Cause:" marker in the recorded text`, which is true. Fix direction (246 characters) runs from `the canned currentTermNumber must be a value that no GET-1 test expects (the tests expect only 1 and 2).` to `… they are not.` Every word of the recorded text is on the card, and only the words `Fix direction:` are dropped. Its files, suggested test and fixed-by (8988ed8, then 92ede9e) show too. At ca3f1a3 this step failed (note 4 then); at f8c3471 it passes | | |
| 36 | LOOP-4 | `#/plans/build/F2/findings/A2` | Read I2's card, then run S6 | `I2 · rule GET-1 · layer api · attempt 3 · untestable`. The card is headed `Untestable`, with `Why untestable: A source comment has no runtime behaviour, so no test can observe whether it is true; it is checked at refactor and review.` It has no Suggested test. Fixed by `8be3aed`, `fix(GET-1): map stored HasClaims, make comments true`. Symptom (228 characters) runs from `src/Uinsure.Policies.Api/Contracts/PolicyResponse.cs:3-4 says status and currentTermNumber are 'canned for now (stub step)'.` to `… the current term's index.` and stops there. Cause (557) opens with its qualifier, `(classification: code) the comment was written at the t2 stub (packet/diff.patch:242-243).`, and ends `Not a recurrence of A1.` Fix direction (149) reads `make the PolicyResponse header say what is true at HEAD, …`. At ca3f1a3 this step failed (note 4 then); at f8c3471 it passes | | |
| 37 | LOOP-4 | `#/plans/build/F2/findings/A2` | Read "Fixed by". Cross-check with `git log --format='%h %(trailers:key=Node,valueonly,separator=;) %(trailers:key=Fixes-Finding,valueonly,separator=;)' HEAD \| grep ' F2 A2/'` | One row per finding, each commit linked to its commit page, oldest first. I1: `357e108`, `8be3aed`. I2: `8be3aed`. I3: `02e49a2`, `0e107fd`. I4: `ef7d2e6`, `af38b4b`. I5: `2753a64`. I6: `6947971`. The command lists the same 8 commits. `Raw JSON: fixedBy for each finding in round A2` opens the same map | | |
| 38 | LOOP-4 | `#/plans/build/F1/findings/A1` | Read the status and "Fixed by". Then run `git log --format='%h %(trailers:key=Node,valueonly,separator=;) %(trailers:key=Fixes-Finding,valueonly,separator=;) %s' HEAD \| grep ' F1 I[0-9]'` | Status `5 of 7 have a fix commit recorded`, in warn. I2 and I3 read `No fix commit recorded`, both on their cards and in the region. I5 is `Untestable` with its reason, fixed by `5ed781a`. **Ruling (note 1). The command lists six commits whose trailers carry no round, among them b033471 (`Fixes-Finding: I2`), 3d3afb0 (`I3`) and d1fa6dd (`I1` to `I7`). The compiler matches only `A<n>/<id>`, so a bare id never counts. Should a bare id count for the round in force?** | | |
| 39 | LOOP-4 | `#/plans/ui/U1/findings/D2` | On U1's loop, click the `D2` findings round. Check with `git log --format='%h %(trailers:key=Node,valueonly,separator=;) %(trailers:key=Fixes-Finding,valueonly,separator=;)' HEAD \| grep ' U1 .*D2/'` (9 commits) | Each of I1 to I6 lists the commits whose trailer names `D2/<id>`. For example, I1 is fixed by `4dfaa8e` and `b70c382`, and I6 by `bf29f59`, `b70c382` and `f64c03f`. **I expect this to fail at ca3f1a3. Status reads `0 of 6 have a fix commit recorded`, and every row reads `No fix commit recorded`, though the command lists 9 commits trailed `D2/I1` to `D2/I6` (note 1).** `#/plans/ui/W1/findings/A3.2` fails the same way: `0 of 4`, though 42ec881 is trailed `A3.2/I1, A3.2/I2`. So does `#/plans/build/F5/findings/A2.4`: `0 of 4`, though 51907bd is trailed `A2.4/I1, A2.4/I2` | | |
| 40 | LOOP-4 | `#/plans/ui/U3/findings/A2` | On U3's loop, click the `A2` findings round | Status `2 of 5 have a fix commit recorded`. Rule `LOOP-3, DATA-2, LOOP-1, LOOP-4, API8:2023`, Attempt `3`. I1 is fixed by `686b318` and `d5e42b1`, and I2 by `2bd3d3f` and `807a977`. I3, I4 and I5 read `No fix commit recorded`, which is true. inv-007 routed I3 and I4 to U7, and I5 was already a U7 line (note 8). Run S6. I1's Symptom opens with the sentence written before its marker, `Layer: the kit, with a screen part. It is recorded as 'api' because …`, then reads on into `a verdict finding recorded as P0 is drawn as P2 …`. I1's Cause opens `(kit) VerdictFinding.severity is typed 'P1' \| 'P2'`. I3's and I4's Causes each hold both causes in their recorded order: `(screen) …`, then `(kit) …` (I3's starts `(screen) resultOf maps event.ok === null to 'waived'`). I5's Symptom opens `Layer: the kit primitives.` and then `(security S1, P2, verdict PASS) …`. No row reads `no "Cause:" marker` | | |
| 41 | LOOP-4 | `#/plans/build/F2/findings/A1` | Click `Open the loop for F2 to see the gate or verdict that raised these findings` | F2's loop opens. Row 1·4 is the FAIL that raised round A1: the way back from a finding to its FAIL | | |
| 42 | LOOP-4 | `#/plans/build/F2/findings/A9` | Type the URL (no such round) | `not built yet · findings A9 of build/F2 has nothing to show yet.`, then `Back to the loop` | | |
| 43 | LOOP-4 | `#/plans/ui/U3/findings/A3` | Open U3's round A3, then run S6. Compare with `git show HEAD:docs/trace/ui/U3/findings/A3.md` | Status `2 of 6 have a fix commit recorded`. Rule `LOOP-4, LOOP-3, DATA-2, LOOP-2, API8:2023`. I1 is fixed by `ed3f62d` and `4ab971f`, and I2 by `a4935b5` and `4ab971f`. I3 to I6 read `No fix commit recorded`, which is true: they were carried to U7. I1's Symptom opens `Reviewer R1 (P1), part 1 of 2.`, the text written before its marker. I2's Cause opens `the marker pattern at src/web/compiler/plans.ts:233 matches only the exact words 'Symptom:', 'Cause:' and 'Fix direction:'.` That sentence is whole: markers quoted in the middle of a sentence are words, not split points (A4/I1's fix). A qualifier stays at the front of its field: I1's and I2's Fix directions open `(compiler, in the node)`, and I3's opens `(U7)` | | |
| 44 | LOOP-4 | `#/plans/ui/U3/findings/A4` | Open U3's round A4, then run S6 | Status `1 of 2 have a fix commit recorded`. I1 is fixed by `55e5364` and `3b25c3c`, and I2 reads `No fix commit recorded` (a U7 line). I1's Symptom runs from `This is reviewer R1 (P1).` to `… and the quoted marker words are lost.` It keeps `a quoted '"Symptom:"'` whole. I1's Cause opens `at 61c63e9 the marker pattern in splitRootCause …` and keeps `every 'Symptom:', 'Cause:' or 'Fix direction:' anywhere in the text` whole. These two cards are the A4 cause, now fixed: a marker that a sentence quotes stays in the sentence | | |
| 45 | LOOP-4 | `#/plans/ui/U3/findings/D1` | Open U3's round D1, then run S6. Then open `#/plans/ui/U3/findings/A5` and run S6 again | **Known issue, not a defect: mark it `Known issue` and don't file it (note 10).** D1's recorded text has no marker at all, so the right card would keep it whole as the Cause. Today it splits inside the single-quoted example `'Done. Cause: x'`. Symptom (2,011 characters) runs from `Steer D1 is reviewer A4 R1, already diagnosed as A4/I1 …` to `… would still split, for example 'Done.` Cause (347) reads `x'. No test covers this. (2) Three things on the regression gate. …` and ends `… the ones ruled intended at 5fa2f55.` Fix direction reads `no "Fix direction:" marker in the recorded text`. The word `Cause:` from the example is on neither row. A5's I1 shows the same split, at the same example: its Symptom ends `the text after 'Done.`, and its Cause opens `x' shows as Cause, and Fix direction is empty. opensASentence …`. A5's other cards split as written | | |
| 46 | LOOP-4 | `#/plans/build/F1/findings/D2` | Read I2's card, then run S6. Compare with `git show HEAD:docs/trace/build/F1/findings/D2.md \| grep -o ".\{60\}' Fix direction: .\{40\}"` | I2's Fix direction holds the text after its `Fix direction:` marker, `read back the single policyholder, …`, and its Cause stops before that marker. **I expect this to fail at f8c3471 (note 4). Fix direction reads `no "Fix direction:" marker in the recorded text`. The Cause (1,061 characters) runs on through `… Rule: '16 or older on the start date (a 16th birthday on the start date passes), else 422.' Fix direction: read back the single policyholder, …` to `… apply I1's full sold-policy read-back.`** I3, I4 and I5 show the same: each real `Fix direction:` follows a quoted rule that ends `.'`. I8's real `Cause:` is the same case, so its Cause row reads `no "Cause:" marker`. `#/plans/build/F6/findings/A2` shows the same for the `Cause:` of I1, I8, I9, I10 and I13. Ten cards in all. At ca3f1a3 each of these ten markers was a split point | | |

### E. Provenance labels (AC4)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 47 | DATA-2 | `#/about` | In the nav, click `How to read this`. Read Step 1, run S5, and compare with `sed -n 1,20p docs/trace/README.md` | Tab `How to read this · Docket`. Eyebrow `Docket · how the trail is made`. Status `<n> gaps, counted from problems in trace.json` (19 at ca3f1a3). Snapshot SHA `HEAD <short SHA>`, and the compiled-at stamp is labelled `generated`. "Read the labels" shows three labels in this order, each with its meaning and how to read it. `generated`: `a hook or render-trace.mjs wrote it, never an agent producing the code` and `The compiled-at stamp in the header above is generated.` `recorded`: `a hook stored an agent's judgement verbatim; the agent can't alter it afterwards` and `A reviewer or security verdict is recorded: …`. `written`: `by David or the main session` and `Text authored by a person or the main session carries this label. …`. S5: `generated, generated, recorded, written`. They are the README's three kinds: generated, recorded and written | | |
| 48 | DATA-2 | `#/plans/build/F2/verdicts/A2/reviewer` | Run S5 | `recorded, recorded`: one label under the header, one in Raw JSON. Every verdict page is the same | | |
| 49 | DATA-2 | `#/plans/build/F2/findings/A1` | Run S5 | `generated, recorded`. The first is the compiled-at stamp. The second labels the findings, beside `Finding text from docs/trace/build/F2/findings/A1.md` | | |
| 50 | DATA-2 | `#/plans/ui/U3/loop` | Read the sentence after `Markers read attempt · log line.` Compare with `git show HEAD:docs/trace/ui/U3/loop.jsonl \| grep -n '"source":"reconciled"' \| cut -d: -f1`. Then open `#/plans/build/F0b/loop` and `#/plans/build/F2/loop` | U3 at f8c3471: `Source: the loop log of ui/U3, log lines 1 to 126. Events are recorded as orchestrator, except line 29 is reconciled; line 106 is reconciled.` The command prints `29` and `106`. The last line number grows with U3's trail (`git show HEAD:docs/trace/ui/U3/loop.jsonl \| wc -l`). F0b: `… except line 48 is reconciled; line 49 is reconciled; line 50 is reconciled; line 54 is reconciled; line 63 is reconciled; line 65 is reconciled.` F2: `Every event is recorded as orchestrator.` No page says every event was recorded by the orchestrator when one wasn't (A2/I2's fix). F1's sentence lists its 15 reconciled lines (56, 57 and 60 to 72) one by one: right, but long | | |
| 51 | DATA-2 | `#/plans/build/F2/loop` | Run S5 | **Ruling (note 7). S5 gives `generated`, once: the node header's compiled-at stamp. trace.json labels each of the 38 timeline rows `generated` and each ladder verdict card `recorded`, but none of them carries a label on the page. The signed-off loop screen has none either** | | |

### F. Themes and widths

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 52 | LOOP-1 | `#/plans/build/F2/loop` | At 1440, set the theme toggle to Light, then to Dark | In both themes, row 1·4's `Gate failed` tag and its ok-false note stand out from the held rows. The `Failed as expected` rows don't. Code blocks, details and the ladder's verdict cards are readable. The suite checks contrast with axe (part G) | | |
| 53 | LOOP-3 | `#/plans/build/F2/verdicts/A2/reviewer` | At 390 × 844, in light and then dark, run S4 | `0`. The card, gate refs and findings stack, and long paths wrap. Compare step 23, where the same card inside a ladder step doesn't wrap | | |
| 54 | LOOP-4 | `#/plans/build/F1/findings/D2` | At 390 × 844, run S4. Scroll the page | `0`. F1's D2 is the longest real round (12 findings), and each card's files and fix direction wrap | | |

### G. The acceptance suite

Run from the worktree root, with the preview on 4174. The suite replays fixture trails into throwaway repos and never
touches this one. `retry-ladder` is build/F1 over three attempts, cut from F2's shape, with inv-001 before attempt 3.
`p0-reconciled` is the same trail with the A2 reviewer's R1 at P0 and loop line 13 recorded as `reconciled`. At
f8c3471 I listed these tests (`--list`) but didn't run them. The orchestrator's last all-nodes gate, at 048d497
(`loop.jsonl:117`), passed 486 of 489 rule tests at two workers. It records the 3 failures as setup timeouts under
load, and each passed when run again at one worker. I ran the unit tests per rule at f8c3471, and every one passed.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 55 | LOOP-1 | shell | `DOCKET_APP_PORT=4174 npm --prefix src/web run e2e -- e2e/U3/ --grep "LOOP-1 · "`, then `npm --prefix src/web run test -- -t "LOOP-1 · "` | `23 passed`, then `14 passed`. They cover every gate and state event in log order, with the others left out. The FAIL at line 4 shows its exit, expectation, ok false, detail, command and head link. A gate that failed as expected isn't drawn as a FAIL, and line 4 is the only failed row. A line with no detail says so. The ladder's FAIL link jumps to the row. F0a has no loop log. The Loop tab reaches the page. Also axe in both themes and widths, and parity | | |
| 56 | LOOP-3 | shell | Same, with `"LOOP-3 · "` | `27 passed`, then `10 passed`. They cover the A2 reviewer FAIL: agent, round, attempt, head, base, fingerprint, covered and missing rules, five gate refs in order, and each finding's severity, file at the head, why and route. They cover raw JSON closed until one click, the A3 PASS, the A2 security PASS and the breadcrumbs. They also prove the **P0 case on `p0-reconciled`**: P0 on the card, in the findings region (fail tone) and on the ladder, never P2. Plus axe and parity | | |
| 57 | LOOP-2 | shell | Same, with `"LOOP-2 · "` | `26 passed`, then `10 passed`. They cover one rung per attempt, with outcomes, turns, findings, red test, fix commit (Fixes-Finding A1/I1, A2/I1) and the re-run verdicts. They cover inv-001 stepping off and rejoining at attempt 3, the node page's chain, the way back to the FAIL, and inv-001's question and hypothesis. Plus axe and parity. The fixture's `attempt++` lines carry the attempt they start, as build logs do, so note 2 doesn't show here | | |
| 58 | LOOP-4 | shell | Same, with `"LOOP-4 · "` | `22 passed`, then `24 passed`. They cover round A1's two findings in order: rule, layer, symptom, cause and fix direction from their markers, files linked, testable with a suggested test, untestable with its reason, and the source. Fixed-by covers I1 by c4 then c5, I2 with none, and A2's I1 by c8 then c9. Since ca3f1a3 they also cover the split itself: a sentence before `Symptom:` opens the symptom (on the page too), a repeated marker joins its field, a qualified marker such as `Cause (kit):` splits and keeps its qualifier, text with no marker is kept whole as the cause, and a marker quoted in double quotes, or in single quotes mid-sentence, stays words. Plus axe and parity. Every fixture round is `A<n>`, so note 1 doesn't show here. No fixture or unit test holds a single-quoted marker after a sentence end (note 10) or a real marker after a closing quote (note 4) | | |
| 59 | DATA-2 | shell | Same, with `"DATA-2 · "` | `11 passed`, then `4 passed`. They cover the about page's three labels and its generated stamp, the verdict's recorded labels and file, and the finding round's recorded and generated labels. On `p0-reconciled`, the loop page names line 13 as reconciled and never says every event was the orchestrator's. Plus axe and parity | | |

## Notes

1. **A fix commit is found only for a round named `A<n>` (steps 38 and 39).** `compiler/index.ts:289` matches a
   finding to a commit only when the trailer reads `A<n>/<id>`. `fixesFinding` (`:72`) parses only `/^A(\d+)\//`, so
   three kinds of trailer never match. A steer round's `D2/I3` doesn't. A re-review round's `A3.2/I1` or `A2.4/I1`
   doesn't either. And a bare `I2` keeps no round. At ca3f1a3, ten rounds read `No fix commit recorded` for every
   finding, 44 findings in all: build/F1 D1 and D2, F6 D1, F0b D1, ui/U0b D1, U1 D1, D2 and D3, build/F5 A2.4 and
   ui/W1 A3.2. That includes findings a commit names exactly. The fixture's rounds are A1 to A3 only. Step 39 is a
   failure. The bare ids (step 38) are your ruling, because `I2` alone doesn't say which round it means. The
   trace-data skill names `compiler/aliases.ts` as the home for `Fixes-Finding` forms, and that file doesn't exist.
2. **On a ui node, each attempt's turn line sits one rung early (step 19).** `Ladder.tsx` takes the turn under rung
   n from the `attempt++` event whose attempt is n + 1. The build logs write `attempt++` with the attempt it starts:
   F2's line 5 is attempt 2, `1 → 2 …`. Every ui log writes it with the attempt it ends: U3's lines 5 and 33 are
   attempts 1 and 2, and U0b, U1, U2 and W1 do the same. So on every ui node, a rung shows the next attempt's turn, the
   last rung before the end shows none, and the first turn line isn't shown anywhere. The fix could match each turn by
   its position in the log, between rung n's last event and rung n + 1's first. Or the log convention could be made
   one. Choosing between them is part of the fix.
3. **U0b's ladder says six verdict files are missing when they're in the trail (step 20).** U0b's loop lines 78, 79,
   101, 102, 129 and 130 name their files relative to the node, as `verdicts/A4-security.json`. `verdictStep` looks
   the file up by exact match against the compiled path, `docs/trace/ui/U0b/verdicts/A4-security.json`, so it finds
   nothing. It then says `the verdict file is not in the trail`, which is false: the verdict pages render those files.
   That breaks HONEST-1. F0b's three misses are real.
4. **A real marker after a closing quote is not a split point (step 46).** This note is new at f8c3471. At
   ca3f1a3, note 4 was a different fault: text before the first marker was dropped, and a qualified marker such as
   `Cause (kit):` was misfiled. 4ab971f fixed that (A3/I1 and A3/I2), and steps 35, 36 and 40 now pass. 3b25c3c then
   made a marker count only where it opens the text or a sentence, and not inside a quotation (A4/I1). The
   sentence-start check (`opensASentence`, `compiler/plans.ts:232-237`) accepts a marker only after `.`, `!` or `?`
   and white space, or after a new line (`:234`). A sentence that ends inside a quotation, `… else 422.' Fix
   direction: …`, puts a quote mark between the `.` and the space, so the real marker that follows is read as words.
   Its text stays in the field before it, and its own row reads `no "<name>:" marker in the recorded text`. That is
   false: the marker is in the recorded text. HONEST-1 forbids it. The trail holds this shape 10 times, all after
   `.'`: the `Fix direction:` of build/F1 D2 I2 to I5, and the `Cause:` of F1 D2 I8 and F6 A2 I1, I8, I9, I10 and
   I13. It is the mirror of note 10. Note 10 is a marker inside single quotes that splits when it shouldn't. This is a
   marker after single quotes that doesn't split when it should. U7's fix direction for note 10 (A5/I1) counts single
   quotes at word boundaries, but it doesn't touch `:234`, so it would not fix this. No fixture or unit test holds the
   shape. I have not checked it with the reviewer or the investigator, and it isn't in any findings file at f8c3471.
   Across all 148 findings at f8c3471, every character is kept except the marker words and colons where the text
   splits. 15 cards show the Symptom gap: build/F5 A1/I7 and A2.4/I1 to I4, and F6 A3/I1 to I6 and D1/I1 to I4. Their text has
   no marker the split reads, so each is kept whole as the Cause. Some of them write `SYMPTOM:` in capitals, and the
   markers are case-sensitive, as with F6 A2's `FIX DIRECTION:`. 31 cards show the Cause gap and 37 the Fix direction
   gap. Apart from the ten above and D1/I1 (note 10), no gap is drawn where the text holds that marker.
5. **The loop page scrolls sideways at 390 (step 23).** In a ladder step, the kit verdict card's rule chips
   (`kit-verdict-card__chips`) don't wrap. A security verdict covers about ten IDs, and that row is wider than the
   step. On the verdict page the card has the full width and wraps (step 53). RESP-1 is a SHOULD, and this is a kit
   fix (`/kit-gap`, verdict-card) or a U7 line. The fixture's security verdict covers short IDs, so the U3 width tests
   don't see it.
6. **A rung's tag is its first ok-false gate, and a commit follows the gate that ran at it (steps 14, 21 and 22).**
   `outcomeOf` tags an attempt with its first gate that came back ok false, and only falls back to its verdicts when
   no gate failed. So W1's attempt 4 reads `Failed at gate.integrate`, though W1 passed review and was signed off in
   it. U2's attempt 2 reads `Failed at gate.e2e-regression`, a change ruled intended. U3's attempts 2 and 3 read the
   same, whatever the A3 verdicts say. The loop's question is "which gate failed, and did the attempt after it pass the
   same gate?". The tag answers the first half, but it reads as how the attempt ended. Separately, a fixing commit is
   placed after the event whose head it is. A gate then sits above the commit it checked, as with F2's #30 under 3·28.
   Both are your ruling: keep as built, or tag by how the attempt ended and place a commit before its gate.
7. **Loop events and the ladder's verdict cards show no provenance label (step 51).** trace.json gives every event
   `provenance: generated` and every verdict and finding `recorded`. DATA-2 says "the UI shows the label wherever the
   item appears". The verdict and finding pages show `recorded`. The loop page and the node page's Attempts show
   events and verdict cards with no label, only the source sentence. The source sentence gives the log's own `source`
   field (orchestrator or reconciled), which is not one of DATA-2's three labels. The signed-off loop screen has no
   label either, so the screen matches its reference. You decide whether DATA-2 is met where the item is the page's
   subject, or whether the loop page needs labels. Labels would change the screen and its reference.
8. **Carried, not U3's to fix.**
   - On a ui ladder, the commits by `web-tester` and `web-builder` show the agent `—`, whose hidden text reads `no
     agent recorded, the hook saw none`. This is U2's note 2 (`shell/agents.ts`). On U3's own ladder, all five commit
     steps show it.
   - GitHub links have no `rel="noreferrer"`. That's A2/I5, already U7's first acceptance line.
   - inv-007 routed A2/I3 (an ok-less gate drawn `Waived`) and A2/I4 (a null testable drawn `Untestable`) to U7. It
     said the lines would be added "when U3 integrates after U2". U3 has integrated U2 (6f29830), but U7's acceptance
     in `ui.dag.yaml` at ca3f1a3 holds neither line. The orchestrator owes them. No real trail holds either value
     today: no gate line lacks `ok`, and no finding lacks `testable`.
   - `src/web/public/` and `src/web/test-results/` are still not git-ignored. That's a U7 line.
9. **What moves after this script.** The trace commit renders U3's walkthrough and README. The short-SHA markers on
   U3's ladder become `#n`, U3's loop gains lines, and the about page's gap count may change. U3's ladder now has five
   attempts and the A3 to A5.2 verdicts, so steps 19 and 22 describe it only as far as attempt 3. The note 2 shift
   holds on the later rungs too: U3's turn lines are 5, 33, 68 and 87, each written with the attempt it ends. The
   figures for build/F1, F2, F0a, F0b and F5, and for ui/U0b, U1, U2 and W1, come from done nodes and stay as written.
10. **Known issue, carried to U7: a single-quoted marker after a sentence end still splits (step 45).** This is
    `findings/A5.md` I1 (reviewer A5 R1, P1, LOOP-4). David ruled that U3 lands with it as tech debt, and its fix is the
    U7 line at `ui.dag.yaml:453` (77f25aa). `opensASentence` counts double quotes, backticks and curly quotes as open
    quotations, but not straight single quotes, because an apostrophe is the same character. So in `'Done. Cause: x'`,
    the `Cause:` follows `. ` and no double quote is open, and it splits. U3's own D1 card has exactly this shape, and
    so does A5's I1, which quotes it. The text isn't lost: the marker word `Cause:` is dropped, and the rest moves into
    the wrong field. When you see it, record `Known issue: A5/I1, U7` in Actual and don't file a defect. A marker inside
    single quotes that splits on any other card is the same issue, not a new one. A real marker after a closing
    quote that doesn't split is note 4, a failure.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: __ of 59 · Expected failures confirmed (steps 19, 20, 23, 39, 46; notes 1–5): ______ ·
Known issue seen as described (step 45; note 10, A5/I1 on U7): ______ ·
Rulings (steps 14, 21, 38, 51; notes 1, 6 and 7): ______ · Steer (if any): ______
