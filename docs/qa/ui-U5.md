# QA script: ui / U5, Sessions, harness anatomy, delivery stats and the guided tour

Rule IDs: CTX-1, AGENT-3, STATS-1, NAV-5
Branch: feature/ui/U5   Worktree: .claude/worktrees/ui-U5
Commit under test: 625a554. That was HEAD when this script was written, after U5's green and gates. This script's
own commit changes only this file. Record the SHA you test in the sign-off.
App URL: http://localhost:4176. U5 is position 6 in `ui.dag.yaml`, so its app port is 4176. U5 needs no API.

U5 builds these pages, all explorer screens read from `trace.json`:

- the sessions timeline (`#/sessions`), from the `docs/context/` snapshot chain (CTX-1);
- the harness anatomy (`#/harness`), from the generated `docs/trace/harness.json` (AGENT-3);
- the delivery stats (`#/stats`), from the build plan's nodes and verdicts (STATS-1);
- the guided tour, the "Follow one rule" step on the about page (`#/about`) (NAV-5).

One region still shows the not-built-yet pattern: a single snapshot open at its own URL (`/sessions/:file`), on the
sessions page.

The Actual and Pass/Fail columns are empty. I wrote these steps from the code and the acceptance suite
(`tests/web/e2e/U5/`) at 625a554, and didn't run them in the app. The acceptance suite runs on fixture trails; this
script runs on the real trail at HEAD, so where a count could move, the step gives the command that counts it.

From reading the code, **four points may need your ruling** (notes 1 to 4). They're flagged in the steps.

## Run the app on U5's ports

Commands are for Git Bash, run from the worktree root, `.claude/worktrees/ui-U5`.

```sh
git status --short; git rev-parse HEAD                  # write both down
npm --prefix src/web run trace                          # the trail at HEAD -> src/web/public/trace.json
npm --prefix src/web run build
npm --prefix src/web run preview -- --port 4176 --strictPort   # leave it running
```

Counts used below, in a second terminal:

```sh
node -e "const h=require('./docs/trace/harness.json');console.log('agents',h.agents.length,'hooks',h.hooks.length,'skills',h.skills.length);console.log(h.provenance)"
node -e "const t=require('./src/web/public/trace.json');console.log('sessions',t.sessions.length);console.log(t.sessions.map(s=>s.ts+' '+s.slug).join('\n'))"
node -e "const t=require('./src/web/public/trace.json');const p=t.plans.find(p=>p.kind==='build');t.nodes.filter(n=>n.plan===p.id).forEach(n=>console.log(n.id,'attempt',n.attempt,'verdicts',t.verdicts.filter(v=>v.plan===n.plan&&v.node===n.id).map(v=>v.round+' '+v.agent+' '+v.verdict).join(', ')))"
ls docs/context/*.md | wc -l                            # snapshots on disk, against the timeline's count
```

## Steps

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | NAV-5 | `#/about` | Open http://localhost:4176/#/about and scroll to `Step 4 · Follow one rule` | the tab reads `How to read this · Docket`. The step reads "Optional. Pick any rule and read it down the five screens below, in this order." and lists five stops, in order: `Overview`, `Requirements matrix`, `Rule`, `Walkthrough`, `Commit`, each a link with one line on what to read there | | |
| 2 | NAV-5 | `#/about` | Click `Start the tour: open the requirements matrix and pick a rule` | the requirements matrix opens (`#/rules`), tab `Requirements matrix · Docket` | | |
| 3 | NAV-5 | `#/about` | Go back. Click the stops `Overview` and `Requirements matrix` in turn, going back after each | `Overview` opens `#/`; `Requirements matrix` opens `#/rules` | | |
| 4 | NAV-5 | `#/about` | Click `Rule`, then go back and click `Walkthrough`, then go back and click `Commit` | `Rule` opens the first built rule's page (`#/rules/<id>`), with its red and green. `Walkthrough` opens a node's numbered commits (`#/plans/<plan>/<node>/commits`). `Commit` opens that walkthrough's first commit (`#/commits/<sha>`). Write down the rule and the node: see note 1 | | |
| 5 | NAV-5 | `#/about` | Toggle dark, then shrink the window to 390 px wide (DevTools device bar) | the tour reads in both themes and at 390 with no sideways scroll; each stop stays a link | | |
| 6 | CTX-1 | `#/sessions` | Open http://localhost:4176/#/sessions | the tab reads `Sessions · Docket`; the primary nav marks `How to read this` current (`aria-current="page"`). The header `Sessions`, eyebrow `About · context snapshot chain`, asks "Where did work stand at each hand-off, and what was said to come next?". Its answer names the last snapshot by position and slug and quotes its next action. The ids read `Latest snapshot` and `Snapshot ref` (`HEAD` and the short SHA). See note 2 on how you get here | | |
| 7 | CTX-1 | `#/sessions` | Read the timeline under `Snapshot timeline, in the order the chain holds them` | one block per UTC day, oldest first, each headed with the date, "(UTC date)" and the range of positions it holds (`#1 to #n`). The positions run on across days without a gap or a restart. The day count and the per-day split match the `sessions` command above | | |
| 8 | CTX-1 | `#/sessions` | Read one row in each day's table | columns `Ref`, `Snapshot`, `Saved`, `Plan · node`, `Status`, `Next action`. Each row's values match its file in `docs/context/` (front matter). Where two days meet, the last row of the earlier day carries the next action that the first row of the later day picks up: this is how work resumed between sessions | | |
| 9 | CTX-1 | `#/sessions` | Find a snapshot that records no plan or node, or no status or next action, if any (the `sessions` command shows `null`s) | it reads `no plan or node recorded` or `not recorded`, never a guessed plan such as `build`. If no snapshot has such a gap, write "none in this trail" | | |
| 10 | CTX-1 | `#/sessions` | Compare the timeline's count with `ls docs/context/*.md \| wc -l` | if the timeline holds fewer, each missing file is a snapshot with no dated front matter: it is not in the timeline and is listed in the compile's problems (`node -e "console.log(require('./src/web/public/trace.json').problems)"`), not guessed into a day | | |
| 11 | CTX-1 | `#/sessions` | Scroll below the timeline | the region `one snapshot, open at its own URL (/sessions/:file)` shows as not built yet | | |
| 12 | CTX-1 | `#/sessions` | Toggle dark, then 390 px | readable in both themes; the tables scroll inside their own frame at 390, with no sideways scroll of the page | | |
| 13 | AGENT-3 | `#/harness` | Open http://localhost:4176/#/harness | the tab reads `Harness · Docket`; `How to read this` is marked current. The header `Harness`, eyebrow `About · Harness`, asks "What is each agent allowed to touch, and which hooks stand guard over them?" and answers "`<a>` agents and `<h>` hooks, counted from the harness file." with the counts of the `agents`/`hooks` command above | | |
| 14 | AGENT-3 | `#/harness` | Read the id `Harness file (DATA-7)` | the harness file's provenance, word for word as the command above prints it ("generated by .claude/scripts/render-trace.mjs from .claude/ at tree …") | | |
| 15 | AGENT-3 | `#/harness` | Read `Agents and their tools` | one row per agent in the harness file, in file order: `Rung` (#1…), `Agent` (a badge for a known agent, the name in code otherwise), `Model · tools` and `What it is dispatched for`. Spot-check two rows against `docs/trace/harness.json` | | |
| 16 | AGENT-3 | `#/harness` | Read `Preloaded skills and never-dos, per agent` | both lines say the harness file does not hold this: "not in the harness file: it does not say which skill each agent preloads" and "not in the harness file: no never-do list is recorded for any agent". See note 3 | | |
| 17 | AGENT-3 | `#/harness` | Read `Skills on disk, not mapped to agents` | "`<s>` skills, counted from the harness file, in file order." with the `skills` count above, then each skill by name with its description | | |
| 18 | AGENT-3 | `#/harness` | Read `Hooks and what each guards` | one row per hook in file order: `Rung`, `Hook file`, `Gates it names` (gate IDs joined by ` · `, or `none named`), `Purpose, as the file holds it`. Spot-check `guard-agent.mjs` and `gate-red.mjs` against `docs/trace/harness.json` | | |
| 19 | AGENT-3 | `#/harness` | Toggle dark, then 390 px | readable in both themes, agent badges legible; no sideways scroll of the page | | |
| 20 | STATS-1 | `#/stats` | Open http://localhost:4176/#/stats | the tab reads `Delivery stats · Docket`; the nav marks `Overview` current. The header `Delivery stats`, eyebrow `Overview · build plan`, asks "How many attempts did each node take, and which agent's FAIL sent it round again?". Its answer names the node(s) with the most attempts and the count of FAIL verdicts, matching the build-plan command above | | |
| 21 | STATS-1 | `#/stats` | Read `Attempts per node` | one row per build-plan node, in plan order (`#1 F0a`, …): `First to last verdict (UTC)`, `Verdicts by round` (e.g. "A1: reviewer PASS, security PASS."), `Attempts`, and `Last verdict` (`PASS at A<n>` or `FAIL at A<n>`). A node with no verdict reads "No verdicts recorded for <node>." and `none recorded`, never a zero. Spot-check F1 and one node with more than one attempt against the command above | | |
| 22 | STATS-1 | `#/stats` | Read `Every FAIL verdict, and whose it was` | one row per FAIL verdict, in plan order then stamp: `Node · round`, stamp, the agent's badge, attempt, `FAIL`. Or "No FAIL verdict is recorded for the build plan." if the command shows none | | |
| 23 | STATS-1 | `#/stats` | Read `Not in this page's data`, and search the page (Ctrl+F) for "score", "rank", "grade" and "%" | `Commits per agent` and `Elapsed time per node` show as gaps with their reasons, not as zeros. No score, rank, grade or percentage appears anywhere: the figures are facts. See note 4 | | |
| 24 | STATS-1 | `#/stats` | Toggle dark, then 390 px | readable in both themes; the PASS and FAIL tags carry their words, not colour alone; no sideways scroll of the page | | |
| 25 | NAV-5 | — | `DOCKET_APP_PORT=4176 npm --prefix src/web run e2e -- tests/web/e2e/U5/nav-5.spec.ts` (the config reuses the preview already on 4176; the specs serve their own fixture trail, the `complete` trail with `tests/web/fixtures/overlays/u5/`, not HEAD's) | 7 passed | | |
| 26 | CTX-1 | — | `DOCKET_APP_PORT=4176 npm --prefix src/web run e2e -- tests/web/e2e/U5/ctx-1.spec.ts` | 10 passed | | |
| 27 | AGENT-3 | — | `DOCKET_APP_PORT=4176 npm --prefix src/web run e2e -- tests/web/e2e/U5/agent-3.spec.ts` | 11 passed | | |
| 28 | STATS-1 | — | `DOCKET_APP_PORT=4176 npm --prefix src/web run e2e -- tests/web/e2e/U5/stats-1.spec.ts` | 11 passed | | |

## Notes

1. **NAV-5, one rule end to end (step 4).** The tour's `Rule` stop links the first built rule in `trace.json`, and its
   `Walkthrough` and `Commit` stops link the first node that has a walkthrough. Nothing ties the two together, so the
   tour may show rule X's page and then a node that doesn't hold rule X. The rule asks for "one rule end to end (e.g.
   SELL-5)". If the rule and node you wrote down in step 4 don't belong together, that is your ruling: accept it as a
   path through the five screens, or call it a defect (or a U7 acceptance line).
2. **Reaching the U5 pages (steps 6, 13, 20).** I found no link to `#/sessions`, `#/harness` or `#/stats` anywhere in
   `src/web/app/`: the nav marks `How to read this` or `Overview` current on them, but you get there only by typing the
   URL. Check whether the about page or the overview links them; if not, rule whether that is acceptable for U5.
3. **AGENT-3, preloaded skills and never-dos (step 16).** The rule asks for each agent's preloaded skills and
   never-dos. The page shows both as "not in the harness file", because `harness.json` holds neither per agent. That is
   honest (HONEST-1, DATA-7), but it leaves part of AGENT-3 unshown. The fix would be in `render-trace.mjs` (harness),
   not in the screen. Your ruling.
4. **STATS-1, commits per agent and elapsed time (step 23).** The rule asks for commits per agent and elapsed time per
   node. The page shows attempts and verdicts, and draws both of those figures as gaps. Commits per agent: the screen's
   note says its data holds no commits, but `trace.json` does carry `commits[]` with an `agent` per commit, so this
   figure looks derivable. Elapsed time: the page shows first and last verdict stamps and deliberately works out no
   duration from them. Your ruling on whether STATS-1 is met.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: __ of 28 · Steer (if any): ______

Rulings on notes 1 to 4:
- 1 (tour, one rule): ______
- 2 (reaching the pages): ______
- 3 (skills and never-dos): ______
- 4 (commits per agent, elapsed time): ______

Steps not run, or only partly seen, and why:
- ______
