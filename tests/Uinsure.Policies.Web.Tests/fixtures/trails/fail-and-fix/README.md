# fail-and-fix

`complete/` up to green, then one round on the failure route, as `build/F1` A1 ran for real.

- **A1 (attempt 1):** the reviewer FAILs at c3 with finding R1 on SELL-2 (a reference differing only in
  case is sold twice); security PASSes.
- **`attempt++`, then `findings(A1)`:** `findings/A1.md` is the investigator's frontmatter (round, source,
  `finding_ids: [I1]`, fingerprint `SELL-2|src/sell.txt|case-sensitive-reference-compare`) and its JSON
  body with finding I1.
- **The route:** c4 plan status (attempt 1 → 2), c5 the finding's red test (tester, `TDD: red`,
  `Fixes-Finding: A1/I1`), c6 the fix (builder, `TDD: green`, `Fixes-Finding: A1/I1`), with
  `gate.finding-red` and `gate.finding-green`.
- **A2 (attempt 2):** reviewer and security PASS at c6; then the QA script (c7) and `gate.integrate`.

**Expected:** `render-trace check build F1` → exit 0, `OK`. The FAIL has its findings file, `A1/I1`
resolves to the finding in it, and every round has its pair. A compiler built on this must show two
rounds, the FAIL kept beside the PASS, I1 with `fixedBy` c5 and c6, and the node at attempt 2.
