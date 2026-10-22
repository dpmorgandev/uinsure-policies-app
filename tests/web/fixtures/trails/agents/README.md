# agents

The `rules` fixture (rules/README.md: its plan, commits, matrix and completeness are unchanged) with what U4's
rules read added to build/F1's trail: who made each commit as the hook saw it, more than one tool in the activity
log, every kind of human decision the loop records, and one context snapshot. U4: AGENT-1, AGENT-2, HITL-1,
VERIFY-1, NAV-2, NAV-4.

## What changes from `rules`

- **`trail/docs/trace/build/F1/activity.jsonl`**, 11 lines (was 9):
  - line 4 (new): `builder` `Edit` of `src/sell.txt`, no command, no commit;
  - line 6: the commit c5 (trailer `Agent: builder`) logged with agent **`main`**: the one commit whose trailer agent
    and hook-seen agent disagree (✗). Every other commit's agents agree (✓);
  - line 7 (new): `reviewer` `Read` of `src/sell.txt`, attempt 1.
  So build/F1's lanes are four agents, in first-seen order: main, tester, builder, reviewer. c0 (build/F0a,
  git-only) has no activity line, so its hook-seen agent is not recorded (null).
- **`trail/docs/trace/build/F1/loop.jsonl`**, 21 lines (was 18): five human decisions, in line order:
  | Line | Event | Kind | Round / at | What |
  |---|---|---|---|---|
  | 5 | `pause1` | pause1 | — | `David: go` |
  | 6 (new) | `steer(D1,pause1)` | steer | D1 at pause1 | `David: change: name the start-date window in the 422 message` |
  | 19 (new) | `pause2` | pause2 | — | `David: tested from docs/qa/build-F1.md` |
  | 20 | `signoff(c9)` | signoff | — | the sign-off line, SHA c9 |
  | 21 (new) | `merged(c9)` | merge | — | `David merged PR #10 in the GitHub UI`, SHA c9 |
  build/F2 records none. (The merge names c9 as its SHA: the fixture has no merge commit of its own.)
- **`trail/docs/trace/build/F1/README.md`**: the "Who touched what" row for c5 reads `| builder | 0 | main | ✗ |`.
- **`base/docs/context/20261018-101500-f1-signed-off.md`** (new): one context snapshot, build/F1, status
  in-progress, next action "David merges PR #10 in the GitHub UI". Its URL is `/#/sessions/20261018-101500-f1-signed-off`.

**Expected, and how it was checked:** worked through by hand from the lines above when the fixture was made; the
line numbers are the files' own, counted in an editor. The `rules` fixture's labels and figures hold except the
decision count (five in build/F1, not two).
