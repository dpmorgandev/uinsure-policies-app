# complete

One feature node, `build/F1` (Sell), with rules SELL-1 and SELL-2, run once, cleanly. Cut from the shape
of the real `build/F1` trail: the same event names, verdict envelope and trailers, with two rules and
five commits.

- **Commits** (on `feature/build/F1`): c0 plan status (main), c1 red (tester, `Rule: SELL-1, SELL-2`,
  `TDD: red`, adds the acceptance spec with one `SELL-1 · ` and one `SELL-2 · ` title), c2 stub
  (builder), c3 green (builder), c4 QA script (tester, no `TDD`).
- **Loop:** setup, state, `gate.red` (expect fail, ok), `gate.stub`, `pause1`, `gate.green`, both A1
  verdicts, `gate.integrate`. Attempt 1 throughout.
- **Verdicts:** A1 reviewer PASS covering SELL-1 and SELL-2, A1 security PASS, both at c3.
- **Activity:** one record per commit, with its SHA and subject.
- **QA:** a step row for each rule.

**Expected:** `render-trace check build F1` → exit 0, `OK`. Both rules have red c1 before green c3,
a test marker each, and a QA step; there are no findings and no steers.
