# awkward-text

`build/F1` stopped after its red commit, with text in its trail that is hostile or hard to lay out. The app
must show it as text, run none of it (SEC-1), and keep the page from scrolling sideways at 390 (RESP-1).

- **Base:** as in `complete/`, but the plan's title is
  `Untrusted <b>fixture</b> <img src=x onerror=window.docketRan=1>`.
- **Commits** (on `feature/build/F1`): c0 plan status (main), c1 red (tester, `TDD: red`, no files).
- **Activity:** four records.
  - Line 2, `main`, `Bash`: `echo <script>window.docketRan=2</script><img src=x onerror=window.docketRan=3>`.
  - Line 3, `tester`, `Bash`: `cat docs/` and one 400-character path segment with no space in it
    (`an-unbroken-path-segment-with-no-spaces-` ten times), then `end.md`.
  - Lines 1 and 4 are the two commits.
- **Loop:** setup, state, `gate.red`.

**Expected in the app:** the plan title and both commands appear as the characters above; no `<b>`,
`<img>` or `<script>` element is made from them, `window.docketRan` is never set, and no
Content-Security-Policy violation is reported. At 390 wide the long command is shown whole and the page
doesn't scroll sideways.

**Expected from `render-trace check build F1`:** exit 1,
`TRAIL INCOMPLETE: rule SELL-1 has no test marker; rule SELL-1 has no red commit before its green commit; rule SELL-1 has no QA step; rule SELL-2 has no test marker; rule SELL-2 has no red commit before its green commit; rule SELL-2 has no QA step; gate.green is missing; gate.integrate is missing`.
The node is mid-loop on purpose.
