# Component catalog

Drafted 2026-10-19 by the main session from `docs/ui/screens.json` (every component it names is here, 42
in all, checked by script) and the research. Four tiers, as agentflow's `components.md`. G3 approves this list: the
design-system preview must render every component in every state listed (`efficiency.spec.md` EFF-11:
restraint never cuts a state). **Uses** counts screens in `screens.json`.

State shorthand: **pop** populated · **empty** · **load** loading · **err** error · **long** long content
collapsed · **dis** sources disagree · **red** redacted · **nb** not built yet · **live** in flight.

## Primitives

| ID | Purpose | States | Uses | From |
|---|---|---|---|---|
| status-tag | Pass, fail, warn, pending, not built: a word, a Lucide glyph and a colour; sentence case; not interactive | all five values, both themes | 10 | M1, K3 notes |
| tdd-step-tag | The TDD trailer value (`scaffold`, `red`, `stub`, `green`, `refactor`, plus `plan`, `trace`, empty) as a labelled tag, distinct from status-tag so the two channels don't compete | each value, empty | 2 | D8, C opportunity 2 |
| agent-badge | An agent (`main`, `tester`, `builder`, `reviewer`, `security`, `investigator`, `git`) or David: a label and a glyph (`bot` or `user`), never colour alone | each agent, `—` (hook saw none) | 6 | D7, D8, P opportunity 4 |
| rule-chip | A rule ID that links to its rule page; mono | built, nb, unknown ID | 7 | D1, WB-3 later |
| sha-link | A short SHA in mono linking to the commit page, with the full SHA available and an external link to GitHub | pop, rewritten SHA (dis), missing | 6 | D8, D14, C1 |
| file-line-link | `path:line` in mono, linking to the file at that SHA on GitHub | pop, line absent | 2 | D9, D10 |
| redaction-token | `<user>`, `<outside-repo>`, `<root>` shown as a labelled redaction, never stripped | each token | 1 | D7, DATA-5 |
| timestamp | A trail time shown in UK local time with UTC on demand; DD/MM signatures and ISO dates reconciled | pop, missing | 1 | D12, D13 |
| provenance-label | generated, recorded or written, with a one-line meaning | each value | 4 | DATA-2, `docs/trace/README.md` |
| disclosure | Expand and collapse; failures open by default | open, closed | 2 | C1, C4 |
| tabs | The views of one node (node, walkthrough, loop, activity) as linked routes | each tab, git-only (some tabs empty) | 4 | C2 |
| code-block | A command or detail line in mono, wrapping, with copy | pop, long | 1 | D6 |
| theme-toggle | Light, dark, system | each | global | THEME-1 |

## Patterns

| ID | Purpose | States | Uses | From |
|---|---|---|---|---|
| page-header | Title, the entity's status, its key IDs, and the compiled-at stamp | pop, nb, live | 17 | M6 (summary first) |
| breadcrumbs | Plan → node → view path; every level a link | pop | 8 | NAV-2 |
| search | One input jumping to any rule ID, node, SHA or path; keyboard reachable | empty, results, no results | 1 + global | NAV-4, P7 (discoverable keys) |
| filter-bar | Filters for status, feature, agent, attempt | none set, set, no matches | 3 | C2, P5 |
| data-table | Sortable, sticky header, row-header ID column, numbers right-aligned, caption | pop, empty, load, err, long rows | 7 | M3, M4, §6.1–6.3 |
| key-value-list | Labelled fields of one entity | pop, missing values | 4 | P6 |
| markdown-text | Agent- or David-written markdown rendered through a sanitiser, never raw HTML | pop, long | 3 | SEC-1 |
| json-viewer | Raw JSON of a verdict or finding, collapsed by default, copyable | pop, long, malformed | 2 | LOOP-3, P1 |
| diff-viewer | A commit's diff, loaded on demand | load, pop, err, long | 2 | RULE-3, PERF-1 (diffs are the largest payload, D sizes) |
| verify-command | The `git log --format=…` command that re-checks the claim on screen, filled in, with copy | pop | 5 | VERIFY-1, `docs/trace/README.md` |
| empty-state | Says what is absent and why, and where to go | each context | 1 | — |
| receipt-figure | A number with its source one click away (never a bare KPI tile) | pop, nb, live | 2 | NAV-1, the avoid list (no unsourced KPI tiles) |

## Layout

| ID | Purpose | States | Uses | From |
|---|---|---|---|---|
| app-shell | Page frame: top bar, navigation, main, footer; layout per the chosen style | 1440, 1280, 390 | global | RESP-1 |
| top-bar | App name, search, theme toggle | pop | global | — |
| primary-nav | Overview, requirements, plans, decisions, about (a rail in Style 1, a top bar in Styles 0 and 2) | each active item | global | `styles.md` |
| footer | Compiled-at SHA and time, provenance link, repo link | pop | global | DATA-3 |
| compiled-at-stamp | The snapshot's SHA and UTC time, on every screen | pop | global | DATA-3 |

## Project-specific compositions

| ID | Purpose | States | Uses | From |
|---|---|---|---|---|
| rule-evidence | **The signature region.** A rule's evidence in TDD order: requirement → red → green → refactor → QA step → sign-off → PR, red before green provable at a glance. Rendered per style: custody chain (0), TDD ticks on agent lanes (1), chronology (2). Missing steps show as gaps | pop, nb, partial (no refactor), order violated (flagged), pinned tests | 1 | RULE-2, C opportunity 1, P opportunity 1 |
| completeness-banner | `OK`, `OK (git-only, F0a)` or `TRAIL INCOMPLETE: <reasons>` verbatim, always first | each value, live | 2 | DATA-4, D completeness vocabulary |
| not-built-yet | The one pattern for an unbuilt rule, node or region: dashed neutral outline and the words "not built yet"; also the derived-reference placeholder (`ui-requirements.md` §3) | rule, node, region, nav entry | 3 | K3 notes, DATA-4 |
| sources-disagree | Two sources that conflict, both shown, the event-derived value first, each with its source (e.g. README "merge pending" vs `merged(…)`) | pop | 3 | `trail-inventory.md` §4 stale headers |
| gate-row | One loop event: gate, command, exit code against expected, ok, detail; `ok:false` on `gate.stub` read as expected, not an error | ok, not ok, expected-fail, waived, state event | 1 | D6, P opportunity 2 |
| attempt-ladder | Attempts as a chain: FAIL → findings → red test → `Fixes-Finding` commit → re-run verdicts; aggregated or expanded | one attempt, several, same-attempt re-review (A3, A3.2), escalation (inv-001) | 2 | LOOP-2, P5, C2 retry selector |
| verdict-card | A verdict: PASS or FAIL, agent, round, head SHA, rules covered and missing, findings with severity and route | PASS, FAIL, no findings, lost (F0b A1, reconciled) | 1 | D9, C8 |
| finding-card | One finding: symptom and cause, files, fix direction, suggested test, testable or untestable reason, fixed-by commit | testable, untestable, unfixed, long | 1 | D10, M6, C6 |
| agent-lanes | Per-agent lanes of activity over time, with a table as its text equivalent | pop, one agent, empty, git-only | 1 | AGENT-2, P opportunity 4 |
| human-decision-row | One decision: who, what, when, where, linking to its evidence | pause 1, pause 2, steer, ruling, sign-off, merge | 2 | HITL-1, P opportunity 3, C6 |
| dag-graph | A plan's nodes and dependencies, status per node, inside a `<figure>` with the dag-table as its text equivalent | pop, live, nb nodes | 2 | DAG-1, C2 Canvas, C3 focal node, §6.5 |
| dag-table | The DAG as an adjacency table (node, depends on, status, rules) | pop | 2 | §6.5 |

## Coverage

- Every component named in `screens.json` (42) is catalogued here.
- **Requirements with no screen region**, and where they live instead:
  - NAV-4 search: the global `search` component.
  - NAV-5 guided tour (COULD): **not designed**; cut unless time allows.
  - THEME-1: `theme-toggle`, global.
  - DATA-1, DATA-5, DATA-6, DATA-8: the compiler, no UI; DATA-7: the `harness` screen's data.
  - RESP-1, PERF-1, A11Y-1, HONEST-1, BRAND-1, SEC-1: cross-cutting; checked by the per-node gates
    (`efficiency.spec.md` EFF-12) and at each review.
  - WB-1 to WB-9: the workbench scope, deferred.
- **Icons:** 17 verified in Lucide (`mood-type-icons.md` §4); 8 more the screens need are listed under
  `iconsToVerify` in `screens.json` (search, copy, sun, moon, info, arrow-left, chevron-down, list-tree)
  and must be checked before G3.
