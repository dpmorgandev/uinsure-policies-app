# in-flight

A node caught mid-loop, as `/feature` leaves it between the stub and pause 1 (U2: DATA-8, RULE-3). Nothing
the trace step writes exists yet: no README, no walkthrough, no verdicts. Each log has one malformed line,
cut off mid-write as an interrupted append leaves it. Cut from the real loop and activity line shapes.

## The plan (`base/docs/plans/active/build.dag.yaml`)

| Node | Status | Attempt | Depends on | Rules | Trail |
|---|---|---|---|---|---|
| F1 Sell | in_progress | 1 | none | SELL-1 | in flight: loop and activity only |
| F2 Retrieve | pending | 0 | F1 | GET-1 | none |

## The commits (on `feature/build/F1`)

| Id | Date (UTC) | Agent | TDD | Rule | Subject | Files |
|---|---|---|---|---|---|---|
| c1 | 2026-10-21 09:00 | main | | | plan(build/F1): F1 pending → in_progress | none |
| c2 | 2026-10-21 10:00 | tester | red | SELL-1 | test(SELL-1): red: a sale with a new reference answers 201 | adds `tests/web/e2e/F1/sell.spec.ts` |
| c3 | 2026-10-21 11:00 | builder | stub | SELL-1 | feat(SELL-1): stub: the canned sale | changes `src/sell.txt` |

`base/src/sell.txt` reads `the sale is not implemented`; c3 replaces that line with `the canned sale`, so
c3's diff has one removed line and one added line.

## The trail (`trail/docs/trace/build/F1/`)

- `loop.jsonl`: five lines. Line 4 is malformed (a gate line cut off after `"event":"gate.st`); lines 1 to 3
  and 5 are setup, `state(in_progress)`, `gate.red` ok and `gate.stub` ok.
- `activity.jsonl`: four lines. Line 3 is malformed (an Edit record cut off inside its `file` value); lines
  1, 2 and 4 record c1, c2 and c3.

## The facts a test reads

- F1 is in progress and its completeness is not decided: there is no README to say OK or TRAIL INCOMPLETE.
  It has a trail (a loop and an activity log), so it is not a node with no trail.
- Two lines are malformed: `docs/trace/build/F1/loop.jsonl` line 4 and `docs/trace/build/F1/activity.jsonl`
  line 3. The compile still succeeds; each is reported by its file and line, and kept, never dropped.
- F1's commits so far, oldest first: c1, c2, c3. None has a walkthrough row yet.
- F2 is pending and waits for F1.

**Expected, and how it was checked:** read off the files as written. The current compiler keeps a line that
is not a JSON object as `raw` and reports it as `<file>:<line> the line is not a JSON object`.
