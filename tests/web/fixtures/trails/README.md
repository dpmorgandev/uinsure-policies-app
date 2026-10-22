# Fixture trails

Small, hand-checked trails for the behaviour tests (web-testing.spec C3). Each folder is a repo in
pieces, replayed by `replay.mjs` into a fresh git repo, so the trail compiler is tested on git at a ref,
the same way it reads the real one. The live `docs/trace/` is never a test input.

## The form

```text
<name>/
  README.md      what it proves, what it is cut from, and the expected check label
  base/          the repo before the node: docs/requirements.md, docs/plans/active/<plan>.dag.yaml,
                 docs/trace/privacy-denylist.txt
  commits.json   { date, branch, commits: [{ id, subject, trailers, files, date? }] }, in order; a trailer's
                 value is a string, or an array written as one line per item (a repeated key)
  files/         the content each commit adds, by repo path
  trail/         docs/trace/<plan>/<node>/: loop, activity, verdicts, findings, written last
```

- **Replay:** `base/` is committed and becomes `origin/main`. Each commit is made on `branch` with its
  trailers (`--allow-empty` when it lists no files), at its own `date` when it has one, else at the
  fixture's `date`. Then `trail/` is written, uncommitted,
  as at `/feature`'s trace step, where `render-trace check` runs. `replay(fixture, dir, { trail: false })`
  stops before it.
- **Repeated trailer keys:** `"Rule": ["SELL-1", "SELL-2"]` writes `Rule: SELL-1` then `Rule: SELL-2`, as a real
  body does (build/F1's domain green carries seven `Rule:` lines, and its fix commits up to seven
  `Fixes-Finding:` lines). A string value is one line.
- **SHAs:** `{{c3}}` in any file becomes commit `c3`'s SHA, and `{{c3:7}}` its short form. A file only
  names commits made before it is placed.
- **`.fixture`:** a path ending `.fixture` loses the suffix when placed. Test files carry it, so this
  repo's own rule-tag walker never counts a fixture's `SELL-1 · ` titles as real markers.
- **The denylist:** every base holds `docs/trace/privacy-denylist.txt`, a byte-for-byte copy of the committed
  `.claude/hooks/privacy-denylist.txt`, as `render-trace.mjs` emits it into a real trail. The compiler reads
  the list from there alone (DATA-5, DATA-7), and fails without it. The pre-commit privacy scan skips an
  exact copy of the list, so a change to the committed list is copied into every base in the same change.
- **Checked by hand and by the real tool:** each README's label is what `render-trace check build F1`
  printed on the replayed repo when the fixture was made. A compiler test asserts its own fields from the
  README's facts, not from re-running the harness.

## The fixtures

| Folder | Proves |
|---|---|
| `complete/` | A clean node: red, stub, green, QA, one PASS pair, every gate ok |
| `incomplete/` | An incomplete trail is shown with every reason, never as clean (DATA-4) |
| `fail-and-fix/` | A reviewer FAIL, its findings, a red test and a fix carrying `Fixes-Finding`, then a PASS |
| `privacy-hit/` | Two denylisted values in the trail fail the compile, each named by file and line, never by value (DATA-5); the test places them |
| `bounded/` | The harness comes from `docs/trace/harness.json`, never `.claude/` (DATA-7); the trail's own `<user>` and `<outside-repo>` stay as written (DATA-5) |
| `awkward-text/` | Markup in a plan title and in commands renders as text and runs nothing (SEC-1); a 400-character unbroken command doesn't widen the page (RESP-1) |
| `rules/` | A rendered trail across four nodes: a git-only F0a, a clean F1 with a FAIL fixed, an F2 TRAIL INCOMPLETE with green before red, an unstarted F3, and a rule no node owns; the README, matrix and per-commit dates as `render-trace.mjs` writes them (NAV-1, MATRIX-1, RULE-1, RULE-2, DATA-4, NAV-3) |
| `rereview/` | Same-attempt re-reviews named `A<n>.<m>-<agent>.json` (A1.2 with a reviewer FAIL, A2.2 a PASS pair) beside `A1` and `A2`: eight verdicts, one FAIL, each round kept verbatim (NAV-1) |
| `requirements-shapes/` | The rule tables of `requirements.md` and `ui-requirements.md` as each writes them (a heading's priority tag or a Priority column, `RENEW-1/2`, a dash note row, a heading with no tag), and C# test sources traited per rule, `RENEW-1/2`'s by its parts `RENEW-1` and `RENEW-2` (MATRIX-1, RULE-1, NAV-3) |
| `real-trailers/` | Commit bodies as the real trail writes them: a body that repeats `Rule:` and `Fixes-Finding:`, a `Rule: none` sentinel, and a slash rule's commits trailed by the slash ID and by its parts (U1 D3: RULE-2, RULE-1, NAV-3) |
| `two-plans/` | Both plans' rules, each read against its own matrix (`requirements-matrix.md`, `ui-requirements-matrix.md`): a `RENEW-1/2` row, `undefined` refactor cells, a `signoff(<sha>)` and a `merged(<sha>)` event, and a template-literal test title in a loop, each cut from the real file (MATRIX-1, NAV-1, RULE-1, NAV-3) |
| `plans/` | Three plans of three kinds: a `build` DAG whose file order is neither alphabetical nor the graph's layer order, with a branch and a join; a `ui` DAG; an investigation `inv-001.plan.md` with no DAG. Each node's `depends_on`, `rules`, `pr`, `acceptance` and one-line `tasks` (DAG-1, NODE-1) |
| `in-flight/` | A node mid-loop, between the stub and pause 1: a loop and an activity log, each with one line cut off mid-write, and no README, walkthrough or verdicts yet; its stub commit changes one line of a file (DATA-8, RULE-3) |

`replay.d.mts` types `replay.mjs` for the TypeScript tests that import it.

A test that needs a case none of these has (a git-only node, an in-flight node, a malformed line, a
privacy hit, a lost verdict) adds a fixture in its red commit, in this form.
