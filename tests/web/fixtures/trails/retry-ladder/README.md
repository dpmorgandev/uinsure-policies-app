# retry-ladder

`build/F1` over three attempts, cut from the shapes of `build/F2` (attempts 1 to 3 and `inv-001`, LOOP-2's
reference case) and `build/F3` (the stub gate that came back `ok:false`, round A1 from a gate). It proves the
loop, verdict and finding screens (U3: LOOP-1, LOOP-2, LOOP-3, LOOP-4, DATA-2).

- **Attempt 1:** `gate.red` (exit 2, expect `fail`, ok true: failed as expected) at c1, then `gate.stub`
  **ok false** at c2, log line 4 (exit 1: the second sale answered 500). The only gate in the log that came
  back ok false.
- **Attempt 2:** `attempt++` (line 5, detail `1 → 2 on gate.stub FAIL at <c2 short> …`), then
  `findings(docs/trace/build/F1/findings/A1.md)` (line 6). Round A1's source is the gate, its JSON in a
  ```` ```json ```` fence as F3's is: **I1** (SELL-2, api, testable, a suggested test) and **I2** (SELL-1, tests,
  **untestable**, with its reason, no fix commit). Then c4, I1's red test (`TDD: red`,
  `Fixes-Finding: A1/I1`, `gate.finding-red` line 7), and c5, its fix (`TDD: stub`, `Fixes-Finding: A1/I1`;
  `gate.stub` re-run line 8, exit 1, ok true). `pause1` (line 9), c6 green (`gate.green` line 10), then
  the re-run verdicts: **A2 security PASS** (line 11) and **A2 reviewer FAIL** (line 12), at head c6.
- **The A2 reviewer FAIL** (`verdicts/A2-reviewer.json`): base c0, head c6, diff fingerprint
  `7c2e9a41d06b38f5e1a4c9d27b80f63e5a1d4c98`, five gate refs in recorded order (`gate.red@c1 (attempt 1)`,
  `gate.stub@c2 (attempt 1, ok:false)`, `gate.finding-red@c4`, `gate.stub@c5`, `gate.green@c6`), SELL-1
  covered and **SELL-2 missing**, findings **R1** (P1, `src/sell.txt:1`, route tester) and **R2** (P2,
  `tests/web/e2e/F1/sell.spec.ts:4`, route builder), each with its `what` and `why`.
- **Attempt 3:** `attempt++` (line 13, `2 → 3 on reviewer FAIL at <c6 short> (A2)`), then
  `investigation.opened(inv-001)` (line 14): the investigation steps off the spine before attempt 3 and
  rejoins it. `state(investigating)` (line 15, no detail), `findings(…/A2.md)` (line 16: round A2's source is
  the reviewer, its JSON bare after the frontmatter, as F2's is: **I1**, SELL-2, services, testable),
  `state(in_progress)` (line 17, with the hand-back detail). c8, the red test (`Fixes-Finding: A2/I1`,
  line 18), and c9, the fix (`TDD: green`, `Fixes-Finding: A2/I1`, `gate.green` line 19). Then **A3
  security and reviewer PASS** at c9 (lines 20, 21), no findings, nothing missing; c10 the QA script
  (`gate.qa` line 22) and `gate.integrate` (line 23, **no detail**).
- **`docs/plans/active/inv-001.plan.md`** (in `base/`): the investigation's plan, `parent: build/F1`, with its
  Question and Hypothesis, in the form of the real `inv-001.plan.md`.
- **Every finding's text** is `root_cause` with its own `Symptom:`, `Cause:` and `Fix direction:` markers, as
  the real rounds write it; no structured `symptom` or `fix_direction` field.

Each commit has its own date, in log order, and an activity record, so the trail is complete.

The gate and state events of the log, in order, as `<attempt>·<line> <event>`: 1·2 `state(in_progress)`,
1·3 `gate.red`, 1·4 `gate.stub` (ok false), 2·7 `gate.finding-red`, 2·8 `gate.stub`, 2·10 `gate.green`,
3·15 `state(investigating)`, 3·17 `state(in_progress)`, 3·18 `gate.finding-red`, 3·19 `gate.green`,
3·22 `gate.qa`, 3·23 `gate.integrate`. The other eleven events (setup, `attempt++`, `findings`, `pause1`,
`verdict`, `investigation.opened`) are not gate or state events.

**Expected:** `render-trace check build F1` → exit 0, `OK`.
