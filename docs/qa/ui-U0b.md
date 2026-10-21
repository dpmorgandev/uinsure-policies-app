# QA script — ui / U0b — walking skeleton: compiler, trace.json, the app shell, static build

Rule IDs: DATA-1, DATA-3, DATA-5, DATA-6, DATA-7, THEME-1, SEC-1, BRAND-1, HONEST-1, A11Y-1, RESP-1
Branch: feature/ui/U0b   Worktree: .claude/worktrees/ui-U0b
Commit under test: ebe96f4 (HEAD when this script was written, after the A4 round's reviewer and security PASS.
This script's own commit changes only this file. Record the SHA you test in the sign-off)
App URL: http://localhost:4171 (U0b is position 1 in `ui.dag.yaml`, so its app port is 4171). API: 5081, not used by U0b

U0b builds the trail compiler (`npm run trace`: the trail into `src/web/public/trace.json` and its lazy activity
chunks), the data loader, the app shell (route-driven nav, page title, footer stamp, theme) and the not-built-yet
pattern. It builds three screens: the overview (`#/`), how to read this (`#/about`) and a node's activity page
(`#/plans/<plan>/<node>/activity`). Every other route shows the not-built-yet pattern.

The Actual and Pass/Fail columns are empty. The tester wrote the steps from the code and the acceptance suite at
ebe96f4, and did not run them: `npm run trace` and `npm run build` write into `src/web/`, which is outside the
tester's write scope (note 5). The counts below that move with the trail (activity lines, problems) are given as
the command that produces them, not as a number.

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node U0b)

| Tag | Acceptance item |
|---|---|
| AC1 | npm run trace compiles the trail into trace.json, reading only docs/ and git, and fails on a privacy-denylist match |
| AC2 | npm run build then npm run preview serves the app; every nav entry routes, and unbuilt screens show the not-built-yet pattern |
| AC3 | The app shell sets the current nav item, the page title and the footer stamp (compiled-at SHA and UTC time) from the route and trace.json, as g4-defects.md section 1 requires |
| AC4 | Light and dark both render; axe finds no violation; no page scrolls sideways at 390 |
| AC5 | No page shows a raw placeholder (‹nodeId›, ‹ruleId›, ‹planId›, ‹reference›); a loading, error or not-built page makes no snapshot claim (g4-defects.md section 1, section 3) |

## Preconditions

- [ ] Node 22 on `PATH` (`node --version`). Run with: ______
- [ ] `npm --prefix src/web ci` done in this worktree.
- [ ] Playwright's Chromium installed, for part D (`npx --prefix src/web playwright install chromium`).
- [ ] Nothing listening on 4171 (`netstat -ano | grep 4171`, no match).
- [ ] Chrome or Edge, with DevTools, for parts B and C.

Commands are for Git Bash, run from the worktree root.

## Run the app on U0b's ports

```sh
git status --short; git rev-parse HEAD            # write both down before step 1 (step 4 compares them)
npm --prefix src/web run trace                    # the trail at HEAD -> src/web/public/trace.json + chunks
npm --prefix src/web run build                    # vite build; copies src/web/public/ into src/web/dist/
npm --prefix src/web run preview -- --port 4171 --strictPort    # leave it running; open http://localhost:4171/
```

The acceptance suite on the same port (part D; it reuses a preview already on 4171, and serves its own fixture
trails to the page, so the live trail doesn't affect it):

```sh
DOCKET_APP_PORT=4171 npm --prefix src/web run e2e -- U0b/        # the whole U0b suite
DOCKET_APP_PORT=4171 npm --prefix src/web run e2e -- --grep "DATA-5 · "   # one rule
npm --prefix src/web run test                                     # the compiler and loader unit tests
```

When you finish: `rm -r src/web/public`. It is not git-ignored (note 5). Never stage it.

## Steps

### A. The compiler (AC1)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | DATA-1 | shell | `npm --prefix src/web run trace; echo "exit $?"` | `exit 0`. Nothing printed but npm's two header lines (`> trace`, `> node compiler/index.ts --ref HEAD`). `ls src/web/public/trace/ui/U0b/` → `activity.json` | | |
| 2 | DATA-1 | shell | `node -p "require('./src/web/public/trace.json').schemaVersion"` | `1.0.0`: one versioned file | | |
| 3 | DATA-3 | shell | `node -p "JSON.stringify(require('./src/web/public/trace.json').compiledAt)"`, then `git rev-parse HEAD` | `{"ref":"HEAD","sha":"<40 hex>","utc":"<yyyy-MM-ddTHH:mm:ss…Z>"}`. `sha` is exactly `git rev-parse HEAD`; `utc` is the time of step 1, in UTC. Write down the first 7 characters of `sha` and the `utc` for steps 13 to 16 | | |
| 4 | DATA-6 | shell | `git status --short` and `git rev-parse HEAD` again; compare them with the lines written down before step 1 | the same lines and the same SHA, plus one new line, `?? src/web/public/`. Nothing tracked has changed: the compiler wrote only its own output | | |
| 5 | DATA-7 | shell | `grep -rn "\.claude" src/web/compiler/` and `grep -n "docs/trace" src/web/compiler/index.ts` | `.claude` appears once, in the comment at `index.ts:1` ("never .claude/"); no path under it is read. The two files it reads from the harness side are under `docs/trace/`: `privacy-denylist.txt` (line 30) and `harness.json` (line 31) | | |
| 6 | DATA-7 | shell | `node -p "require('./src/web/public/trace.json').harness.provenance"`, then `node -p "require('./docs/trace/harness.json').provenance"` | the same string, from `docs/trace/harness.json` (at ebe96f4: `generated by .claude/scripts/render-trace.mjs from .claude/ at tree 94623e0`). The harness index is the generated `docs/` copy, never read from `.claude/` | | |

### B. The running app: shell, data and stamp (AC2, AC3)

Open http://localhost:4171/ with DevTools open, and Network → "Disable cache" ticked.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 7 | BRAND-1 | `#/` | Look at the top bar and the browser tab | the top bar names the app **Docket**, as a link to `#/`. The tab reads `Overview · Docket`. No Uinsure logo, wordmark or colours made to imitate theirs | | |
| 8 | BRAND-1 | `#/about`, `#/plans/ui/U0b/activity` | Open each; read the tab and the page | tabs `How to read this · Docket` and `Node ui/U0b · Docket`. "Uinsure" appears only as trail data: the build plan's title `Uinsure Policies API build` on the about page, paths in the activity commands (`Uinsure.Policies.slnx`) and the footer's repository link. It is never the app's name, a logo or a picture | | |
| 9 | HONEST-1 | `#/` | Read the primary nav; Tab through it | `Overview` and `How to read this` are links. `Requirements matrix`, `Plan`, `Human decisions` and `Workbench` each say "not built yet", aren't links, and Tab skips them | | |
| 10 | DATA-1 | `#/`, then `#/plans/ui/U0b/activity` | DevTools Network, filter cleared: reload `#/`, then open the activity page | every request goes to `localhost:4171`: the page, its JS and CSS, the font files, `trace.json`, and on the activity page `trace/ui/U0b/activity.json`. Nothing goes to `/api`, `/docs`, `/src`, `/.claude` or any other host | | |
| 11 | DATA-1 | `#/plans/build/F1/activity` | Open it; Network | one more request, `trace/build/F1/activity.json`. `trace.json` isn't fetched again: the shell read it once | | |
| 12 | A11Y-1 | `#/`, `#/about` | Look at the nav on each; in Elements, inspect the current entry | the page's own entry is marked by a bar as well as colour, and carries `aria-current="page"`: Overview on `#/`, How to read this on `#/about`. The activity page marks none (its Plan entry isn't built) | | |
| 13 | DATA-3 | `#/` | Read the footer; hover the SHA link | the short SHA from step 3, linked to `https://github.com/dpmorgandev/uinsure-policies-api/commit/<full SHA>`, and the time as `yyyy-MM-dd HH:mm:ss UTC`, the same instant as step 3's `utc` | | |
| 14 | DATA-3 | `#/` | Read "Step 5 · Check the snapshot" | `This page is a snapshot, not live. It was compiled from HEAD at <short SHA>, on <utc>.`: the values of step 3 | | |
| 15 | DATA-3 | `#/about` | Read "Step 5 · Check the stamp" | `Ref: HEAD`, `Commit: <full SHA>`, `Time: <utc>`, as step 3. Below it, one line per plan in trace.json with its title and node count (for example `build`, Uinsure Policies API build) | | |
| 16 | DATA-3 | `#/plans/ui/U0b/activity`, `#/no-such-page` | Read the footer on each | the same stamp as step 13. Every page shows it, so the snapshot is never mistaken for live | | |
| 17 | HONEST-1 | `#/about` | Read the gap line under step 5; run `node -p "require('./src/web/public/trace.json').problems.length"` | `No gaps in the trail` when the count is 0; otherwise `Warn <count> gaps in the trail` (or `1 gap`), with one line for each problem as `<file>:<line>: <reason>`. Nothing is listed that isn't in `problems` | | |
| 18 | HONEST-1 | `#/plans/ui/U0b/activity` | Read the node header and the tabs | breadcrumb `Plans › ui › U0b`; eyebrow `Node · ui/U0b`; title `U0b Walking skeleton: compiler, trace.json, the app shell, static build`; status `In progress`; `Attempt 5` (the DAG's `attempt`); the Activity tab is the current one. Nothing from F3 or another node | | |
| 19 | HONEST-1 | `#/plans/ui/U0b/activity` | Read the table's caption; run `git show HEAD:docs/trace/ui/U0b/activity.jsonl \| grep -c .` | caption `Activity events for ui/U0b, <count> lines. Sorted by the Line column, ascending.`, with the count from the command (1300 at ebe96f4). The working copy's `activity.jsonl` has more lines, not yet committed; they don't appear, because the compile reads HEAD | | |
| 20 | HONEST-1 | `#/plans/ui/U0b/activity` | Compare rows 1 and 2 with `git show HEAD:docs/trace/ui/U0b/activity.jsonl \| head -2` | Line 1: Attempt `1`, Agent `main`, Tool `Bash`, command `git stash push -u -m "u0b-t1-scaffold-aside"`, Commit `—`, TDD trailer `—`. Line 2: the same, with `git stash list --format='%H %gs'`. A dash means the log holds no value for that column. No value is filled in | | |
| 21 | DATA-5 | `#/plans/ui/U0b/activity` | Ctrl+F `<user>`; look at line 533 | its command shows `…/C--Users-<user>-Documents-Jobs-uInsure-…` with the trail's redaction `<user>` kept as written. No real user name, email or local path shows anywhere on the page | | |
| 22 | SEC-1 | `#/plans/ui/U0b/activity` | Ctrl+F `<th scope` (line 725) and `<footer` (lines 732, 734); inspect those cells in Elements | each command shows as literal text (`<th scope=…`, `<footer.*`, `<footer[^>]*>…`). The cell holds a text node only: no `th` or `footer` element is made from the trail. Console: no CSP violation, no error | | |
| 23 | SEC-1 | any | Elements → `<head>`; Network, filter JS, then Font | `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'">`. Every script and every font comes from `localhost:4171`: no third-party script, and the fonts are self-hosted | | |

### C. Not built, loading, failure, theme, keyboard, widths (AC2, AC4, AC5)

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 24 | HONEST-1 | `#/plans/ui/U0b/matrix`, `#/rules/SELL-1`, `#/workbench`, `#/no-such-page` | Open each | the kit's not-built-yet pattern, naming the route (for example `/plans/ui/U0b/matrix`), with a `Back to the overview` link. Tab: `Not built yet · Docket`. No `‹…›` placeholder on any. The main content states nothing about a snapshot; the footer still shows the real stamp, because trace.json was read (note 1) | | |
| 25 | HONEST-1 | `#/`, `#/about`, `#/plans/ui/U0b/activity` | With the preview running: `mv src/web/dist/trace.json src/web/dist/trace.json.off`, then reload each | each page shows a `Could not load` tag and a reason naming `trace.json` (preview answers a missing file with the app's own HTML, so the reason may be a JSON parse error, not HTTP 404). Footer: `No snapshot: trace.json hasn't been read.`. No commit link, no time, no `Snapshot compiled from` and no node header. Afterwards: `mv src/web/dist/trace.json.off src/web/dist/trace.json` and reload | | |
| 26 | HONEST-1 | `#/` | DevTools Network throttling `Slow 3G`, reload; then set it back to `No throttling` | while trace.json is read, `Loading` with `trace.json is being read.` and the footer's `No snapshot…` line. The stamp appears only when the file has loaded | | |
| 27 | THEME-1 | `#/` | With the toggle on System: DevTools ⋮ → More tools → Rendering → "Emulate CSS media feature prefers-color-scheme": `dark`, then `light`. In Console: `document.documentElement.dataset.theme` | the page follows the setting both ways, without a reload; `data-theme` reads `dark`, then `light`. A fresh load under `dark` doesn't flash light first | | |
| 28 | THEME-1 | `#/`, then `#/about` | With the system on light: top-bar toggle → Dark; open How to read this from the nav; then System; then set the system to dark and choose Light | Dark wins over the light system and stays dark on the about page, with Dark still checked. System hands back to the system (light). Light wins over the dark system. Both themes come from the same tokens (note 3) | | |
| 29 | A11Y-1 | `#/` | Click the address bar, then Tab | the first stop is `Skip to the content`; Enter moves focus to the main content. Every later stop shows a visible focus ring: the top bar's link, search and theme radios, the nav links, the overview's own controls and the footer links. Arrow keys move between the theme radios | | |
| 30 | A11Y-1 | `#/about`, `#/plans/ui/U0b/activity` | Read in light, then in dark | every status shows a word and a glyph as well as a colour (the legend's Pass, Fail, Warn, Pending, Not built; the node's In progress). Text is readable on its background in both themes | | |
| 31 | RESP-1 | `#/`, `#/about`, `#/plans/ui/U0b/activity` | DevTools device toolbar at 390 × 844, light and dark. In Console: `document.documentElement.scrollWidth - document.documentElement.clientWidth` | `0` on every page. On the activity page, long commands wrap inside their cells and the table scrolls in its own frame, never the page | | |
| 32 | RESP-1 | the same three | The same at 1440 × 900 and 1280 × 800 | `0` on every page | | |
| 33 | RESP-1 | `#/no-such-page`, `#/plans/ui/U0b/matrix`, then `#/` | Finding D1 (David's footer steer). At 1440 × 900 and 1280 × 800, light and dark. In Console: `[document.querySelector('footer').getBoundingClientRect().bottom, innerHeight, document.documentElement.scrollHeight]` | on the two short pages the footer sits on the window's bottom edge, with no bare canvas below it: the first two numbers within 1px, and the third no more than `innerHeight`. On `#/`, which is taller than the window, the footer follows the content and ends the page | | |

### D. The acceptance suite: what the running app can't show (AC1, AC4)

Run from the worktree root. The suite replays fixture trails (`tests/web/fixtures/trails/`) into throwaway repos, and
never touches this one.

| # | Rule | Route | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 34 | DATA-5 | shell | `DOCKET_APP_PORT=4171 npm --prefix src/web run e2e -- --grep "DATA-5 · "` | `3 passed`: a denylist hit fails the compile, named by file and line and never by the matched text; every hit is listed, not only the first; `<user>` and `<outside-repo>` are kept as written | | |
| 35 | DATA-6 | shell | `DOCKET_APP_PORT=4171 npm --prefix src/web run e2e -- --grep "DATA-6 · "` | `2 passed`: after a compile, the files, the index and the refs are as they were; run with write access to `src/web/public/` alone, it writes only trace.json and its chunks | | |
| 36 | DATA-7 | shell | `DOCKET_APP_PORT=4171 npm --prefix src/web run e2e -- --grep "DATA-7 · "` | `2 passed`: it compiles with read access to `docs/` and git only; the harness in trace.json is `docs/trace/harness.json`'s, and nothing from `.claude/` reaches the output | | |
| 37 | A11Y-1 | shell | `DOCKET_APP_PORT=4171 npm --prefix src/web run e2e -- --grep "A11Y-1 · "` | `13 passed`: axe finds no violation on the overview, the about page, the activity page, the read-failure page and a not-built page, light and dark, at 1440 and 390; plus the keyboard, focus, current-entry and parity tests | | |
| 38 | THEME-1 | shell | `DOCKET_APP_PORT=4171 npm --prefix src/web run e2e -- --grep "THEME-1 · "` | every test passed, 0 failed: the system setting both ways, no light flash on a dark first load, the toggle, and tokens-only colour on all three screens in both themes | | |

## Notes

1. **Not-built pages show the footer stamp (AC5, step 24).** g4-defects.md §1 names the contradiction where a page
   says nothing was compiled while the footer states a snapshot, and requires: "When nothing was read, the shell
   makes no snapshot claim". The build reads it that way. Loading and read-failure pages make no claim, in the
   body or the footer (steps 25 and 26). A not-built page, once trace.json has been read, says nothing about a
   snapshot in its body, and its footer gives the real stamp (`Frame.tsx`: the stamp shows whenever trace.json is
   ready). No test asserts the not-built footer either way. If you read AC5 as "a not-built page has no stamp
   at all", that is a steer: step 24 fails and the stamp rule changes.
2. **The overview draws the search and the theme toggle twice**: once in the top bar, and again in its "Step 6 ·
   Find anything" region, the region its derived reference tags NAV-4 THEME-1. Both toggles drive the same
   choice. g4-defects.md §3 lists this duplicate, and U1's acceptance removes it ("the overview draws the search
   and theme toggle once"). U0b keeps the region for parity. The search box doesn't search: NAV-4 isn't U0b's.
3. **The theme choice is held while the page is open, not stored.** Light or Dark holds across in-app navigation
   (step 28). A reload goes back to System. THEME-1 asks for the system setting and a manual toggle, and doesn't ask
   for the choice to be kept across reloads.
4. **The counts that move.** The trail grows with every commit and every loop event, so steps 17 and 19 give the
   command that produces each number, at the SHA you test. 1300 U0b activity lines is ebe96f4's count.
5. **`src/web/public/` is not git-ignored.** `src/web/.gitignore` lists `dist/` but not `public/`, so after
   step 1 `git status` shows `?? src/web/public/`: live-trail output, privacy-scanned but generated. Delete it when
   you finish and never stage it. For the same reason, the tester could not run these steps: the compile and the
   build write into `src/web/`, outside its write scope. A `public/trace.json` and `public/trace/` ignore line
   would close the gap. That is a builder or harness change, not this script's.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: ______ of 38 · Steer (if any): ______
