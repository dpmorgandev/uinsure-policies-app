# Component catalog

Drafted 2026-10-19 by the main session from `docs/ui/screens.json` and the research; round 2 adds the
workbench (B-entries in `prior-art-workbench.md`, A- and E-entries in `api-inventory.md`) and one layout
for F7's guide. Every component `screens.json` names is here, checked by script. Four tiers, as
agentflow's `components.md`. This list is the kit's roster: stage 4 builds each one as a React component,
and the kitchen-sink page renders every component in every state listed, or the coverage audit fails
(`efficiency.spec.md` EFF-11: restraint never cuts a state). **Uses** counts screens in `screens.json`
(recomputed by script); **scope** is E (explorer), W (workbench) or both.

State shorthand: **pop** populated · **empty** · **load** loading · **err** error · **long** long content
collapsed · **dis** sources disagree · **red** redacted · **nb** not built yet · **live** in flight.

## Primitives

| ID | Purpose | States | Uses | From |
|---|---|---|---|---|
| status-tag | Pass, fail, warn, pending, not built: a word, a Lucide glyph and a colour; sentence case; not interactive | all five values, both themes | 11 (E+W) | M1, K3 notes |
| tdd-step-tag | The TDD trailer value (`scaffold`, `red`, `stub`, `green`, `refactor`, plus `plan`, `trace`, empty) as a labelled tag, distinct from status-tag so the two channels don't compete | each value, empty | 2 (E) | D8, C opportunity 2 |
| agent-badge | An agent (`main`, `tester`, `builder`, `reviewer`, `security`, `investigator`, `git`) or David: a label and a glyph (`bot` or `user`), never colour alone | each agent, `—` (hook saw none) | 6 (E) | D7, D8, P opportunity 4 |
| rule-chip | A rule ID that links to its rule page; mono | built, nb, unknown ID | 12 (E+W) | D1, WB-3 later |
| sha-link | A short SHA in mono linking to the commit page, with the full SHA available and an external link to GitHub | pop, rewritten SHA (dis), missing | 6 (E) | D8, D14, C1 |
| file-line-link | `path:line` in mono, linking to the file at that SHA on GitHub | pop, line absent | 2 (E) | D9, D10 |
| redaction-token | `<user>`, `<outside-repo>`, `<root>` shown as a labelled redaction, never stripped | each token | 1 (E) | D7, DATA-5 |
| timestamp | A trail time shown in UK local time with UTC on demand; DD/MM signatures and ISO dates reconciled | pop, missing | 1 (E) | D12, D13 |
| provenance-label | generated, recorded or written, with a one-line meaning | each value | 4 (E) | DATA-2, `docs/trace/README.md` |
| disclosure | Expand and collapse; failures open by default | open, closed | 2 (E) | C1, C4 |
| tabs | The views of one node (node, walkthrough, loop, activity) as linked routes | each tab, git-only (some tabs empty) | 4 (E) | C2 |
| code-block | A command or detail line in mono, wrapping, with copy | pop, long | 2 (E+W) | D6 |
| theme-toggle | Light, dark, system | each | global | THEME-1 |
| button | An action. Primary, secondary and destructive; destructive actions (cancel a policy) also need a confirm-dialog. Never hidden in an overflow menu (B4, B6 category default) | primary, secondary, destructive, disabled, submitting, focus | 6 (W) | B4, B10 |
| text-input | A single-line text field, used inside `field` | empty, filled, invalid, disabled, focus | 2 (W) | B9, B10 |
| text-area | Multi-line text with a visible character count against its maximum (claim description, 500) | empty, filled, at limit, invalid | 1 (W) | A7, E5 |
| date-input | A `yyyy-MM-dd` date, the only format the API accepts; shown as typed, never reformatted | empty, filled, invalid format, invalid by rule | 3 (W) | A1, §2 global formats |
| money-input | A decimal amount, at most 2 dp, as a JSON number; never rounded on entry | empty, filled, over 2 dp, invalid by rule | 2 (W) | A1, SELL-7 |
| select | One of a fixed set (policy type, payment method) | each value, invalid | 2 (W) | A1, A5 |
| radio-group | One of a few visible choices | each value, invalid | 1 (W) | B10 |
| switch | On/off with its label stating both states (auto-renew) | on, off, focus | 1 (W) | A1 |
| money | A money value exactly as the API wrote it (at least 2 dp, never re-rounded), tabular figures | pop, zero, negative never shown | 2 (W) | A1–A11 money format |

## Patterns

| ID | Purpose | States | Uses | From |
|---|---|---|---|---|
| page-header | Title, the entity's status, its key IDs, and the compiled-at stamp | pop, nb, live | 24 (E+W) | M6 (summary first) |
| breadcrumbs | Plan → node → view path; every level a link | pop | 8 (E) | NAV-2 |
| search | One input jumping to any rule ID, node, SHA or path; keyboard reachable | empty, results, no results | 1 + global | NAV-4, P7 (discoverable keys) |
| filter-bar | Filters for status, feature, agent, attempt | none set, set, no matches | 4 (E+W) | C2, P5 |
| data-table | Sortable, sticky header, row-header ID column, numbers right-aligned, caption | pop, empty, load, err, long rows | 8 (E+W) | M3, M4, §6.1–6.3 |
| key-value-list | Labelled fields of one entity | pop, missing values | 5 (E+W) | P6 |
| markdown-text | Agent- or David-written markdown rendered through a sanitiser, never raw HTML | pop, long | 3 (E) | SEC-1 |
| json-viewer | Raw JSON of a verdict or finding, collapsed by default, copyable | pop, long, malformed | 3 (E+W) | LOOP-3, P1 |
| diff-viewer | A commit's diff, loaded on demand | load, pop, err, long | 2 (E) | RULE-3, PERF-1 (diffs are the largest payload, D sizes) |
| verify-command | The `git log --format=…` command that re-checks the claim on screen, filled in, with copy | pop | 5 (E) | VERIFY-1, `docs/trace/README.md` |
| empty-state | Says what is absent and why, and where to go | each context | 3 (E+W) | — |
| receipt-figure | A number with its source one click away (never a bare KPI tile) | pop, nb, live | 2 (E) | NAV-1, the avoid list (no unsourced KPI tiles) |
| field | Label, hint, inline error and input, in GOV.UK order (error after hint, before the input), wired with `aria-describedby` and `aria-invalid` | plain, with hint, invalid, required | 4 (W) | B9, B10 |
| form-section | A titled group of fields (policy, policyholders, property) | pop, with errors | 1 (W) | B3 |
| repeatable-group | 1 to 3 policyholders: add and remove, numbered as the API's 1-based `index` | one, two, three (add hidden), invalid member | 1 (W) | SELL-4, SELL-5 `index` |
| constraint-hint | The server's constraint beside a field (`^[A-Z0-9-]{3,20}$`, today … today + 60, ≤ 2 dp), the check "send it anyway" turns off | pop, violated | 1 (W) | B8 |
| error-summary | Every problem in one list at the top, focused on arrival, each item linking to its field where it has one and carrying a rule chip where it has a rule | one, several, 400 (field keys), 422 single (extensions), 422 multi (no field path: listed, not placed) | 4 (W) | B9, B10, opportunity 1, A12, A13 |
| inline-error | One message under its field, the same words as the summary | one, several on one field | 1 (W) | B9 |
| problem-banner | A record-level problem (404, 409, 429, 500, API unreachable): title, detail, rule chip, the extension values (e.g. `cancellationDate`), never parsed from `detail` | each status, unreachable | 3 (W) | B9 "can't fix", opportunity 2, A12, A14 |
| request-log | Requests this browser sent, newest first: method, path, status, duration; filterable; the source of recent policies | pop, empty, filtered | 2 (W) | B6, opportunity 6, WB-7 |
| http-exchange | One request and its response: status line (code, time, size), headers, bodies, a copyable curl | 2xx, problem, unreachable, long | 1 (W) | B6, B7, B8 |
| confirm-dialog | Confirms an irreversible action, naming exactly what will happen (the quoted date and refund) | open, submitting | 1 (W) | B5 |
| document-page | Long-form reading layout for the F7 guide and the `about` page: headings, prose, figures, callouts | pop, long | 1 (E) | `ui-requirements.md` §6 item 4 (F7 in this style) |

## Layout

| ID | Purpose | States | Uses | From |
|---|---|---|---|---|
| app-shell | Page frame: top bar, navigation, main, footer; layout per the chosen style | 1440, 1280, 390 | global | RESP-1 |
| top-bar | App name, search, theme toggle | pop | global | — |
| primary-nav | Overview, requirements, plans, decisions, about (a rail in Style 1, a top bar in Styles 0 and 2) | each active item | global | `styles.md` |
| footer | Compiled-at SHA and time, provenance link, repo link | pop | global | DATA-3 |
| compiled-at-stamp | The snapshot's SHA and UTC time, on every screen | pop | global | DATA-3 |
| inspector-drawer | A docked, resizable bottom drawer on workbench screens: the latest request and response, live as each is sent | closed, open, one request, problem | global (W) | B6 Workbench pane, WB-7 |

## Project-specific compositions

| ID | Purpose | States | Uses | From |
|---|---|---|---|---|
| rule-evidence | **The signature region.** A rule's evidence in TDD order: requirement → red → green → refactor → QA step → sign-off → PR, red before green provable at a glance. Rendered per style: custody chain (0), TDD ticks on agent lanes (1), chronology (2). Missing steps show as gaps | pop, nb, partial (no refactor), order violated (flagged), pinned tests | 1 (E) | RULE-2, C opportunity 1, P opportunity 1 |
| completeness-banner | `OK`, `OK (git-only, F0a)` or `TRAIL INCOMPLETE: <reasons>` verbatim, always first | each value, live | 2 (E) | DATA-4, D completeness vocabulary |
| not-built-yet | The one pattern for an unbuilt rule, node or region: dashed neutral outline and the words "not built yet"; also the derived-reference placeholder (`ui-requirements.md` §3) | rule, node, region, nav entry | 4 (E+W) | K3 notes, DATA-4 |
| sources-disagree | Two sources that conflict, both shown, the event-derived value first, each with its source (e.g. README "merge pending" vs `merged(…)`) | pop | 4 (E+W) | `trail-inventory.md` §4 stale headers |
| gate-row | One loop event: gate, command, exit code against expected, ok, detail; `ok:false` on `gate.stub` read as expected, not an error | ok, not ok, expected-fail, waived, state event | 1 (E) | D6, P opportunity 2 |
| attempt-ladder | Attempts as a chain: FAIL → findings → red test → `Fixes-Finding` commit → re-run verdicts; aggregated or expanded | one attempt, several, same-attempt re-review (A3, A3.2), escalation (inv-001) | 2 (E) | LOOP-2, P5, C2 retry selector |
| verdict-card | A verdict: PASS or FAIL, agent, round, head SHA, rules covered and missing, findings with severity and route | PASS, FAIL, no findings, lost (F0b A1, reconciled) | 1 (E) | D9, C8 |
| finding-card | One finding: symptom and cause, files, fix direction, suggested test, testable or untestable reason, fixed-by commit | testable, untestable, unfixed, long | 1 (E) | D10, M6, C6 |
| agent-lanes | Per-agent lanes of activity over time, with a table as its text equivalent | pop, one agent, empty, git-only | 1 (E) | AGENT-2, P opportunity 4 |
| human-decision-row | One decision: who, what, when, where, linking to its evidence | pause 1, pause 2, steer, ruling, sign-off, merge | 2 (E) | HITL-1, P opportunity 3, C6 |
| dag-graph | A plan's nodes and dependencies, status per node, inside a `<figure>` with the dag-table as its text equivalent | pop, live, nb nodes | 2 (E) | DAG-1, C2 Canvas, C3 focal node, §6.5 |
| dag-table | The DAG as an adjacency table (node, depends on, status, rules) | pop | 2 (E) | §6.5 |
| term-timeline | **The workbench's signature.** One dated ruler for a policy: each term (start, end, amount, paid or unpaid), payments, claim dates, the cancellation date. Only dates the API returned; no computed windows (cooling-off, renewal), which are asked of the API through a quote instead | one term, several, unpaid term, cancelled (gap after the date), with claims | 1 (W) | B1 segments and gap, opportunity 4, A2, A5, A7, A8 |
| refund-worked-sum | The refund per term as a worked sum from the API's own fields: `amount × unusedDays ÷ daysInTerm = refundAmount`, with `ruleApplied` as a rule chip; CANCEL-1a/1b full, COULD-2 and UNPAID-TERM zero, each in words | CANCEL-1a, 1b, 1c, COULD-2, UNPAID-TERM, several terms, total | 2 (W) | B3, B4, B5, opportunity 3, A10, A11 |
| quote-cancel-compare | The quote beside the cancellation it led to, field by field, agreeing or not | agree, differ | 1 (W) | B4 (same date preview to commit), WB-4 |
| reference-preview | The reference as the API will store it (trimmed, upper-cased) as the user types | pop, invalid pattern | 1 (W) | SELL-1, A1 |
| send-anyway-toggle | Turns off client-side checks so the API's own problems show; while on, a persistent notice says so, and each response's violations are lined up with the client check that would have caught them | off, on, on with a response | 1 (W) | B10 (warn, don't disable), opportunity 5, WB-6 |
| recent-policies | References this browser sold or opened, from the request log in local storage; says plainly that it is this browser only | pop, empty, storage unavailable | 1 (W) | WB-9, B6, Hoppscotch history |

## Coverage

- Every component `screens.json` names is catalogued here (checked by script), plus `document-page`
  for F7, which no screen in the catalog uses yet except `about`.
- **Requirements:** `.claude/scripts/design/coverage.mjs` passes: every ID in `ui-requirements.md` §2 is
  on a screen region, or is listed in `screens.json` `app.notOnScreens` with its reason and how it is
  verified instead (the compiler's DATA rules and the cross-cutting RESP, PERF, HONEST, BRAND, SEC).
  WB-8 is cut.
- **Icons:** 17 verified in Lucide (`mood-type-icons.md` §4). The rest the screens need are in
  `screens.json` `iconsToVerify` and are checked against the installed `lucide-react` before G3.
