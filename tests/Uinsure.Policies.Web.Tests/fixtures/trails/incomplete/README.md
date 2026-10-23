# incomplete

`complete/` with three gaps, each of a kind the real trails have had. An incomplete trail must be shown
with every reason, never as clean (DATA-4).

- **No security verdict for A1:** only `A1-reviewer.json` exists, and no `reconciled(A1-security.json)`
  event excuses it.
- **SELL-2 has no QA step:** the QA script has SELL-1's row only.
- **`gate.integrate` never ran:** the loop stops after the reviewer's verdict.

Everything else is as in `complete/`: the same five commits, their activity records, and the red, stub and
green gates.

**Expected:** `render-trace check build F1` → exit 1,
`TRAIL INCOMPLETE: review round A1 lacks a reviewer + security verdict pair; rule SELL-2 has no QA step; gate.integrate is missing`.
Exactly these three reasons, in this order.
