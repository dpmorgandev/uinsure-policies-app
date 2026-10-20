# privacy-hit

`build/F1` stopped after its red commit, with two values in its trail that the privacy denylist refuses.
The compiler must fail on them, naming each file and line and never the value (DATA-5).

- **Commits** (on `feature/build/F1`): c0 plan status (main), c1 red (tester, `TDD: red`, no files).
- **Activity:** three records. Line 2 is a `Bash` command, `echo {{privacy-hit:token}}`.
- **Loop:** setup, state, `gate.red`. Line 3's `detail` reads `the log was read from {{privacy-hit:path}}`.
- **The hits are placed by the test, not committed here.** A literal hit in this folder would be refused by
  the repo's own pre-commit privacy scan, so the trail holds two placeholders that `replay.mjs` leaves alone
  (they aren't `{{cN}}`). The acceptance test replaces them after the replay, from parts, then commits the
  trail:
  - `{{privacy-hit:token}}` becomes a GitHub token shape: `ghp_` and 36 letters and digits.
  - `{{privacy-hit:path}}` becomes an absolute Windows user path: a drive, `Users`, a name and a file.

- **The compiler's unit tests place other values too** (`tests/web/unit/compiler/data-5.test.ts`): an
  upper-case token, an allowed and a refused address, a value only an added pattern refuses, each in the
  token's place with a clean path in the other, so each proves one side of the denylist's format.

**Expected from the compiler:** exit 1, two problems listed, `docs/trace/build/F1/activity.jsonl` line 2
and `docs/trace/build/F1/loop.jsonl` line 3; neither value appears in its output, and it writes no
`trace.json`.

**Expected from `render-trace check build F1`** (on the replay, placeholders in place):
exit 1, `TRAIL INCOMPLETE: rule SELL-1 has no test marker; rule SELL-1 has no red commit before its green commit; rule SELL-1 has no QA step; rule SELL-2 has no test marker; rule SELL-2 has no red commit before its green commit; rule SELL-2 has no QA step; gate.green is missing; gate.integrate is missing`.
The node is mid-loop on purpose: the fixture is about the compiler's privacy pass, not a clean trail.
