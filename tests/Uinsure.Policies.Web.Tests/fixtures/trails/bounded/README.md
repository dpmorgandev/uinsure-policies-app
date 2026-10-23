# bounded

`build/F1` stopped after its red commit, in a repo that also holds the generated harness file. It proves what
the compiler may read and what it must keep as written.

- **Base:** as in `complete/`, plus `docs/trace/harness.json`: a hand-written file in the shape
  `render-trace.mjs` emits, with one agent `fixture-tester`, one skill `fixture-skill`, one hook
  `.claude/hooks/fixture-hook.mjs` and one script `.claude/scripts/fixture-script.mjs`.
- **Commits** (on `feature/build/F1`): c0 plan status (main), c1 red (tester, `TDD: red`, no files).
- **Activity:** four records. Line 2 is a `Bash` command holding the trail's own `<user>` redaction
  (`node ~/AppData/Local/Temp/claude/C--Users-<user>-Documents-repo/scratch/probe.mjs`); line 3 is a `Read`
  whose file is `<outside-repo>`. Lines 1 and 4 are the two commits.
- **Loop:** setup, state, `gate.red`.
- **`.claude/` is planted by the test, not kept here.** After the replay, the acceptance test writes a
  `.claude/` directory into the replayed repo, with an agent and a settings file whose text appears nowhere
  else, and commits it with the trail. A harness read from there instead of from `docs/trace/harness.json`
  shows up in the output.

**Expected from the compiler:** exit 0. The harness in `trace.json` is the one in `docs/trace/harness.json`
(agent `fixture-tester`), and nothing from the planted `.claude/` reaches any file it writes (DATA-7). The
activity chunk for `build/F1` keeps `<user>` and `<outside-repo>` exactly as written (DATA-5).

**Expected from `render-trace check build F1`:** exit 1,
`TRAIL INCOMPLETE: rule SELL-1 has no test marker; rule SELL-1 has no red commit before its green commit; rule SELL-1 has no QA step; rule SELL-2 has no test marker; rule SELL-2 has no red commit before its green commit; rule SELL-2 has no QA step; gate.green is missing; gate.integrate is missing`.
The node is mid-loop on purpose.
