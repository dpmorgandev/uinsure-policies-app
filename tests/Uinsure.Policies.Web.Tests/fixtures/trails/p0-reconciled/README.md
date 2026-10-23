# p0-reconciled

`retry-ladder` (see its README) with two values that fixture never holds, each one the case behind a U3 finding of
round A2. Everything else (`base/`, `commits.json`, `files/`, the activity log, the findings rounds, the other three
verdicts) is a byte-for-byte copy of `retry-ladder`, so every fact in that README holds here unless this one says otherwise.

- **A P0 verdict finding** (U3 A2/I1, LOOP-3): in `verdicts/A2-reviewer.json`, **R1** has severity **P0** where
  `retry-ladder` has P1. The verdict schema allows P0 (P0: the rule or acceptance is broken). R2 stays P2. Loop line
  12, the A2 reviewer verdict event, gives R1 as P0 in its detail. The verdict page and attempt 2's verdict step on
  the loop ladder must both draw R1 as **P0**, never as P2, with a tone at least as severe as P1's.
- **A reconciled loop line** (U3 A2/I2, DATA-2): loop line **13**, inserted after the A2 verdicts and before the
  `attempt++` to 3, has `source` **`reconciled`** and every other line has `source` `orchestrator`. It is cut from
  the real `build/F0b` shape (`reconciled(activity.jsonl)`, no head, detail `redactCommand re-applied: 0 of 7
  command records changed`, 7 being the activity records before its time). Its event is neither a gate nor a state,
  so the gate timeline doesn't list it. The loop page's source sentence must name line 13 as reconciled and must not
  say every event was recorded by the orchestrator.

Inserting line 13 moves `retry-ladder`'s lines 13 to 23 down by one: attempt 3 runs from `attempt++` at line 14 to
`gate.integrate` at line 24. The gate and state events, as `<attempt>·<line> <event>`, are: 1·2
`state(in_progress)`, 1·3 `gate.red`, 1·4 `gate.stub` (ok false), 2·7 `gate.finding-red`, 2·8 `gate.stub`, 2·10
`gate.green`, 3·16 `state(investigating)`, 3·18 `state(in_progress)`, 3·19 `gate.finding-red`, 3·20 `gate.green`,
3·23 `gate.qa`, 3·24 `gate.integrate`.

**Expected:** `render-trace check build F1` → exit 0, `OK`, as for `retry-ladder`: a reconciled line is a normal
part of a trail, and a severity is not checked.
