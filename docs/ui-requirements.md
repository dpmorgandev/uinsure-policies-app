# Uinsure Policies UI: Requirements

Author: David Morgan · Last updated: 2026-10-19 · Status: **DRAFT** (gate G0 not passed)

This is the **single input** for the UI work: the brief that `requirements.md` §4 reserved ("the React
frontend gets its own brief, mockups and plan DAG later"). The sequence follows agentflow's design
pipeline, run through this repo's own spec format and HITL:

0. **Brief** (this file). David approves it: gate **G0**.
1. **Research → specs** in `.claude/specs/`, each Research → Options → Decision → Contract. The design
   research (prior art, mood, style options, flows, screens, components) is `ui-research.spec.md`. Its
   agent-facing outputs land in `docs/ui/`, because agents never read the specs. Gate **G1**.
2. **Mockups:** 2–3 genuinely divergent directions, as static HTML, judged by screenshot. David picks
   one: gate **G2**.
3. **Stylesheet:** design tokens and the design-system preview page, covering every catalogued
   component. Gate **G3**.
4. **Screens:** every screen in the catalog as kit-only HTML, filled with **real trail data**. David
   signs off: gate **G4**.
5. **Plan the DAG:** `docs/plans/active/ui.dag.yaml` + `ui.plan.md`. David approves by his own commit:
   gate **G5**.
6. **Build:** `/feature ui <node>` per node, with David's two pauses, PRs into the `ui` branch.

Sources: `requirements.md` (the API and the harness it was built with), `Uinsure - Tehcnial Challenge
-Backend.pdf` (the task), `Uinsure---Senior-Software-Engineer---2026.pdf` (the role), and agentflow's
design pipeline (its `/analyze`, `/mockups`, `/stylesheet` and `/screens` stages and their lessons).

---

## 1. Context

**Why a UI.** The take-home asks for an API, and the API is the product. But the interview is "a two-way
technical discussion … to understand the steps & considerations taken", and the role spec asks for AI
"with a critical eye (no AI slop!)", TDD as a non-negotiable, and code reviews that check "whether the
code tells a clear story". The repo already holds the evidence for all of that: every rule traced to its
tests and its red, green and refactor commits, every agent action logged by a hook, every verdict and
finding recorded, every human decision signed. Today it's spread over JSONL, JSON and markdown files that
nobody will read in an interview. The UI makes that evidence **navigable in minutes**.

**Two halves, built in this order:**

1. **The trace explorer** (this plan's first scope): how the API was built, from the trails. Read-only,
   static, and buildable now, while F3–F7 are still in flight.
2. **The policy workbench** (later, a second scope in the same plan): a client for the API itself (sell,
   retrieve, cancel with quote, claims, renew), where every rule violation links back into the explorer.
   It waits on F3 and F4.

**Audiences.**
- **The Uinsure reviewer, alone:** an engineer, Team Lead or Principal Engineer opening the link before
  the interview. They have minutes and no guide. The first screen has to answer "was this really
  test-driven, and was the AI really checked?"
- **David, presenting live:** driving the explorer during the discussion, jumping from a rule to its
  commits, from a FAIL to its fix.
- **Later, the workbench user:** someone exercising the API's rules without Postman.

**What the role spec tells us to show (UI-specific).**
- React SPAs and Node / TypeScript (their frontend stack); MVC is theirs for small internal UIs and was
  rejected here because the explorer must be hostable as static files (see §3, Stack)
- TDD in a second stack
- AI with a critical eye: the trail shows the AI being checked, failed and corrected, not just its output
- Clear communication: a reader who doesn't know the harness can follow it

**Principles.** The five in `requirements.md` §1 hold. Three are added:
- **Show the receipt, not the claim.** Every number and status on screen comes from a file or a git
  fact, and can be traced to it. Nothing is computed for effect.
- **Never show an incomplete trail as clean.** `TRAIL INCOMPLETE` and `not built yet` are first-class
  states, as prominent as `OK`.
- **The evidence is the hero.** Craft serves legibility. No decorative data, no invented metrics, no
  AI-themed styling.

---

## 2. Functional requirements

IDs are this file's own. They never collide with the API's rule IDs, and every UI test carries one (the
TS form of the `Rule` trait is settled in `web-testing.spec.md`). The interpretations are **drafts until
G0**.

**"The trail"** means every file under `docs/trace/`, plus `docs/requirements.md`, `docs/plans/`,
`docs/qa/`, `docs/context/` and `docs/lessons.md` when present, plus the git history of the branch the
explorer is built from (commit subjects, trailers, merges and PR numbers).

### Trail data (the compiler)

| ID | Priority | Requirement | Draft interpretation |
|---|---|---|---|
| DATA-1 | MUST | One compiled data file | A Node script compiles the trail into a versioned `trace.json` at build time. The SPA reads only that file: no runtime reads of the repo, no server |
| DATA-2 | MUST | Provenance labels survive | Every item keeps its label from `docs/trace/README.md`: **generated** (a hook or `render-trace.mjs` wrote it), **recorded** (an agent's judgement stored verbatim), or **written** (by David or the main session). The UI shows the label wherever the item appears |
| DATA-3 | MUST | Compiled-at stamp | `trace.json` records the commit SHA and UTC time it was compiled from. Every screen shows it, so the reader knows the snapshot is not live |
| DATA-4 | MUST | Incomplete is never clean | A node whose README says `TRAIL INCOMPLETE` shows the reasons verbatim. A rule with no node or no tests shows `not built yet`. F0a shows `OK (git-only, F0a)` |
| DATA-5 | MUST | Privacy | The repo goes public. The compiler fails the build if its output matches the privacy denylist (`.claude/hooks/privacy-denylist.txt`), and keeps the redactions already in the trail (`<user>`, `<outside-repo>`) as they are |
| DATA-6 | MUST | The trail is read, never changed | The compiler is read-only over the repo. It writes only its own output |
| DATA-7 | MUST | Bounded to `docs/` and git | The compiler reads `docs/` and git, never `.claude/` (`requirements.md`: nothing in `src/` references `.claude/`). Anything the explorer needs from the harness (the roster, skills, hooks) is emitted into `docs/trace/` by the harness side (`render-trace.mjs`), as a generated file |
| DATA-8 | SHOULD | Tolerates a trail in flight | A node in progress (F3 today) compiles with what exists, shown as in progress. Malformed lines are reported, never silently dropped |

### Navigation and overview

| ID | Priority | Requirement | Draft interpretation |
|---|---|---|---|
| NAV-1 | MUST | Overview answers the question first | The landing screen states, from the data: rules built / total, tests passing, nodes done, attempts and FAILs taken, human decisions recorded. Each figure links to its source screen |
| NAV-2 | MUST | Every entity has a URL | Rules, nodes, commits, verdicts, findings and sessions are each deep-linkable, so David can paste a link into the conversation |
| NAV-3 | MUST | Links out | Commit SHAs link to the commit on GitHub, PR numbers to the PR, file:line references to the file at that SHA |
| NAV-4 | SHOULD | Search | Jump to any rule ID, node, SHA or file path from one input |
| NAV-5 | COULD | Guided tour | A short, optional path through one rule end to end (e.g. SELL-5), for the reader with no guide |

### Requirements traceability

| ID | Priority | Requirement | Draft interpretation |
|---|---|---|---|
| MATRIX-1 | MUST | Interactive requirements matrix | Every rule in `requirements.md` → plan/node → tests (pass/total) → red, green and refactor commits → QA step → sign-off → PR. The same columns as `requirements-matrix.md`, filterable by status and feature |
| RULE-1 | MUST | Rule page | The rule's text and agreed interpretation (from `requirements.md`), its status codes, its tests by name, its commits in TDD order, its QA step and its sign-off |
| RULE-2 | MUST | Red before green, visibly | The rule page shows the red commit before the green one, with dates, and flags any rule where that order doesn't hold |
| RULE-3 | SHOULD | Diffs | The rule's red and green commits show their diffs (from the node packet's `diff.patch` or git) |

### Plans, nodes and the loop

| ID | Priority | Requirement | Draft interpretation |
|---|---|---|---|
| DAG-1 | MUST | Plan DAG view | Each plan's nodes as a dependency graph, coloured by status, each linking to its node page. Shows `build` (F0a–F7), `ui`, and investigations such as `inv-001` |
| NODE-1 | MUST | Node page | Completeness banner first (DATA-4), then rules, tasks with their status, attempts, PR and merge |
| TDD-1 | MUST | Walkthrough timeline | Every commit of the node in order, coloured by TDD step (`scaffold`, `red`, `stub`, `green`, `refactor`) and by `Agent` trailer, with the commit subject in the agent's words |
| LOOP-1 | MUST | Gate timeline | Every `loop.jsonl` event: gate, command, exit code, expected outcome, ok, and the detail line. FAILs stand out |
| LOOP-2 | MUST | Retry ladder | Each attempt as a chain: FAIL → findings → red test → the `Fixes-Finding` commit → re-run verdicts. F2's attempts 1–3 and `inv-001` are the reference case |
| LOOP-3 | MUST | Verdicts | Each reviewer and security verdict rendered from its JSON: verdict, gate refs, head SHA, diff fingerprint, findings. Raw JSON one click away |
| LOOP-4 | MUST | Findings | Each investigator finding: symptom, cause, file:line, fix direction, suggested test, testable or not, and the commit that fixed it |

### Agents and humans

| ID | Priority | Requirement | Draft interpretation |
|---|---|---|---|
| AGENT-1 | MUST | Who touched what | Per node: each commit's `Agent` trailer beside the agent the hook saw make it, with the match ✓/✗ (the README table) |
| AGENT-2 | SHOULD | Agent swimlanes | `activity.jsonl` as per-agent lanes over time: tool, file, command. Shows the six agents and the main session working in sequence |
| AGENT-3 | SHOULD | Harness anatomy | The six agents, their tools, preloaded skills and never-dos, and the hooks and what each guards, from the generated harness file (DATA-7) |
| HITL-1 | MUST | Human decisions | Every point David decided: pause 1, pause 2, steers (D-findings), rulings, sign-offs, merges. One list across nodes, each linked to its evidence. This is the "critical eye" evidence |
| CTX-1 | COULD | Sessions | The `docs/context/` snapshot chain as a timeline across days, showing how work resumed between sessions |
| VERIFY-1 | MUST | Verify it yourself | Beside every claim, the git command that re-checks it without the UI (the commands in `docs/trace/README.md`, filled in for that rule or node) |
| STATS-1 | COULD | Delivery stats | Commits per agent, attempts per node, elapsed time per node from the trail timestamps. Shown as facts, never as scores |

### The policy workbench (second scope, deferred)

Listed now so the explorer's design leaves room for it. Not built in the first scope, and not designed
past the screen catalog until F3 and F4 are merged.

| ID | Priority | Requirement | Draft interpretation |
|---|---|---|---|
| WB-1 | MUST | Sell form | Every field of the sell request, 1–3 policyholders, the reference normalisation preview (SELL-1) |
| WB-2 | MUST | Policy view | By reference: status, current term, terms timeline (cooling-off and renewal windows shaded), holders, property, payments, refunds, claims |
| WB-3 | MUST | Problem details | Every 400/404/409/422 rendered from its ProblemDetails, each violation as a rule chip that links to RULE-1 for that rule |
| WB-4 | SHOULD | Cancel with quote | Quote, then cancel, showing `ruleApplied`, the day counts and the refund maths, and that quote and cancellation agree |
| WB-5 | SHOULD | Claims and renew | Record a claim and see the quote drop to £0; renew inside the window; cheque blocked for auto-renew |
| WB-6 | SHOULD | Send it anyway | A switch that turns off client-side validation, so the API's own violations can be shown |
| WB-7 | COULD | HTTP inspector | The exact request and response of every action |
| WB-8 | COULD | Demo clock | Set "today" to show the date windows live. **Needs a backend change** (a Development-only `TimeProvider` override): a new rule ID in `requirements.md` first |
| WB-9 | COULD | Policy list | **Needs a new endpoint** (`GET /policies`): a new rule ID in `requirements.md` first. Otherwise, recent references kept in the browser |

### Non-functional

| ID | Priority | Requirement | Draft interpretation |
|---|---|---|---|
| A11Y-1 | MUST | WCAG 2.2 AA | Keyboard reachable, visible focus, contrast in both themes, status never by colour alone (every status also has a word or an icon). Checked with axe in the end-to-end tests |
| THEME-1 | MUST | Light and dark | Both themes from the same tokens, following the system setting, with a manual toggle |
| RESP-1 | SHOULD | Works on a laptop and a phone | Designed for 1440 and 1280 wide; usable at 390 wide with no horizontal page scroll (wide tables scroll inside their own container) |
| PERF-1 | SHOULD | Fast from cold | First screen interactive in under 2 s on a laptop from a static host. The data file is split if it grows past a size settled in `trace-data.spec.md` |
| HONEST-1 | MUST | No invented data | No mockup, screen or build may show a number, status or name that isn't in the trail. Placeholder data is labelled as such and never ships. (agentflow's `honestyViolation`: it can't be waived) |
| BRAND-1 | MUST | No Uinsure branding | No Uinsure logo, wordmark, colours copied to imitate, or anything that reads as their product. The UI is David's, named neutrally |
| SEC-1 | MUST | Safe rendering | The trail holds agent-written markdown and command text. It is rendered as text or through a sanitising markdown renderer, never as raw HTML. A strict Content-Security-Policy, no third-party scripts at runtime |

**Out of scope:** authentication, editing the trail, live data (the explorer is a snapshot), the
workbench's backend additions until their rule IDs exist, and any deployment of the API itself.

---

## 3. Delivery requirements

### How it's built

The UI is built by the same harness, through the same loop: tester (red) → builder (stub, green,
refactor) → reviewer + security → David's two pauses → PR. What changes:

- **Outside-in for a UI.** Red is an end-to-end test (Playwright) of the screen against fixture trail
  data, plus component and compiler unit tests. Stub is the route rendering canned content. Green
  replaces the canned content layer by layer (compiler → data loader → components → screen). What
  red, stub and green mean exactly is settled in `web-testing.spec.md`.
- **Fixture trails.** Tests run against small, hand-checked fixture trails (including an incomplete one
  and a FAIL-and-fix one), never against the live `docs/trace/`, so the tests don't change as the build
  plan moves.
- **The screens are the contract.** The G4 sign-off binds the screen HTML. A built screen that drifts
  from its signed-off screen is a FAIL.
- **One design, derived per node.** The app is designed in full at G4 but built node by node, so a
  node is never compared against the full screens, and no screen is designed per node:
  - **Every region of every screen is tagged with the requirement IDs it delivers**
    (`data-req="RULE-1"`). A region with no tag, or a tag that isn't an ID in this file, fails the
    screens gate. Tags name requirements, not nodes: the screens are signed off at G4, before the DAG
    exists at G5, and the DAG maps requirement IDs to nodes.
  - **A script derives each node's reference screens** from the signed-off set: regions whose IDs
    belong to nodes built so far are kept; every other region renders as the one **"not built yet"
    pattern**, and nav entries to unbuilt screens follow one rule. Both are designed once at G4, as
    catalogued components. The last node's reference is the full signed-off set, so the build
    converges on the design David approved.
  - **David sees the node's derived references at pause 1**, beside the stub. A partial screen that
    reads badly is caught there. A real change to the design goes through one supervised edit path and
    a re-sign of the changed screens, never through an agent editing signed-off HTML.
  - **A design fixture is frozen at G4:** the trail compiled at the sign-off SHA. Parity checks run the
    built app against that fixture, so both sides show the same data. Parity is structural first
    (every tagged region present, the catalogued components, token use only), screenshots second. The
    small hand-checked fixtures stay for behaviour tests.
- **David judges, from screenshots.** There is no LLM judge. A script renders every screen at 1440 and
  390 wide in light and dark into one review page, which David reviews at G2, G4 and each pause 2. No
  agent's description of its own pixels counts as evidence (agentflow bug-031; `efficiency.spec.md`
  EFF-8).

### Defects

agentflow verifies a whole app once it exists (`/build-to-spec-verify` → `bugs.yaml` → `/fix-bugs`).
Here the app is built node by node, so most of that verification moves into each node, and what's left
runs once per scope. `requirements.md` §3 already splits defects by when they're found; the UI adds
regressions across nodes and drift in the trail it reads.

| Found | What it is | Route |
|---|---|---|
| In the node, by a gate, reviewer or security | A FAIL | The failure route, counting an attempt |
| In the node, by David (pause 1, pause 2, a PR comment) | A steer, D-finding | The failure route on the same branch, not counting an attempt |
| In the node, on a screen an earlier node built | A regression this node caused | A FAIL in this node. An intended change (say, a token) updates that screen's baseline, approved by David at pause 2 |
| After merge, in a merged node | An escaped defect | `/plan-bug`: `bug-NNN`, its first node a failing test that reproduces it, on `bug/ui/<node>` cut from `ui`, linked to the requirement and to the plan and node that introduced it. Never fixed silently inside the node in flight, whose trailers would then claim work it didn't do. If it blocks that node, David orders them |
| One cause across many screens (a token, a layout primitive) | A systemic defect | One bug, scoped to the shared layer, not one per screen |
| The trail changes shape under the explorer (a build-plan node adds or changes a field) | Upstream drift, not a UI bug | `feat-NNN` extending the compiler, linked to the build-plan change that caused it. The compiler fails loudly on an unknown shape (DATA-8), so drift is found at build time |
| At the end of a scope, by David's end-to-end pass | Anything left | David triages each finding: a `bug-NNN` now (several defects can be nodes of one plan), deferred, or a known limitation stated in the README |

**Gates every node adds** (beside build, test, coverage and scope):
- **Its own screens:** reachability (every route renders), parity against the node's derived reference,
  axe, and the node's walkthrough flows in Playwright.
- **Every screen built so far:** the screenshot and axe checks against the baselines committed when each
  earlier node was signed off, so a later node can't quietly break an earlier one.

**No verify node.** By a scope's last node, the regression gate already checks every screen against
its baseline, and that node's reference is the full signed-off set, so whole-app parity has already
passed. The one thing a verify node would add, the flows that cross screens built by different nodes
(e.g. "follow F2's FAIL to its fix" across the node, loop and findings screens), runs as blocking
Playwright gates on the scope's last node.

**David's end-to-end pass** at the last node's pause 2, using the screenshot review page for every
screen, is the final acceptance, as for every node. Nothing else reviews the whole app, and there is no
gate with an override: a FAIL followed by a merge would make the trail dishonest (agentflow
investigate-023: a gate that degrades to WARN when skipped is not a gate).

`/plan-bug` is specified in `planning.spec.md` and built on first need. A UI defect may be that first
need.

### Branch model

- **`ui`** is the integration branch for this plan, cut from `main` at `ad7b6b0`. It is a ruled
  exception to `requirements.md` §3 ("no develop branch"), recorded in the orchestration amendment.
- **Direct commits to `ui`** are allowed for the design phases (brief, specs, `docs/ui/`, mockups,
  stylesheet, screens) until the `ui` DAG is approved at G5. From then, every change goes through
  `feature/ui/<node>` branches and PRs into `ui`.
- **`ui` → `main`** by a PR David merges, once per releasable scope (the explorer, then the workbench).
- **`ui` takes `main` in** after each build-plan merge (F3, F4, …), so the explorer can render the new
  trails. The git agent rebases UI feature branches onto `origin/ui`, not `origin/main`.
- The harness rules all hold: no push to `main`, David approves every push, PR and comment, David
  merges in the GitHub UI.

### Running in parallel with the build plan

- The design phases (stages 0–4) touch only `docs/`, `.claude/specs/` and design HTML. They run now,
  alongside F3, in the `ui` worktree.
- **Harness changes wait for a safe point.** The F3 session reloads settings and agents live from the
  main checkout's working tree, so new agents, skills and hook rules land through `ui` and reach `main`
  only by a PR David merges between build nodes.
- **Build loops don't overlap** until the orchestration amendment settles the shared generated files
  (`requirements-matrix.md`, `rule-coverage.pending.txt`).

### Agents and skills (proposed; settled in the agents-skills amendment)

- **Reused:** reviewer, investigator, git, with the plan's base branch made a parameter.
- **Extended:** security gains the web checks (XSS through rendered markdown, CSP, supply chain).
- **New for the build:** `web-tester` and `web-builder`, because `skills:` is fixed per agent file and
  the current tester and builder preload .NET skills.
- **New for the design phases:** `ui-designer` (mockups, kit, screens). No reviewer agent: David
  judges from rendered screenshots (`efficiency.spec.md` EFF-8).
- **New skills:** stage skills `/mockups`, `/stylesheet`, `/screens` (main session), plus the
  screenshot review script; preloaded skills `interface-craft`, `react-web`, `web-testing`,
  `trace-data`, `web-security`. Reused: `code-quality`, `requirements-trace`, `verdict-format`, `root-cause`,
  `git-workflow`.
- *Prior art:* agentflow_phase3's `analyze` workers, `mockups`, `stylesheet`, `screens`,
  `visual-review`, `interface-craft` and `mockup-craft` skills. The procedures are ported, not the
  factory machinery (no fingerprint registry, no mobile platform, no auto-merge).

### Porting rule: a ported skill reads this project, nothing else

agentflow's skills are written against a factory layout (`projects/<slug>/docs/analysis/shared/…`,
factory-level `scripts/` and `schemas/`, `brief.md` sections by number, `assets/styles/style-K/`, a
global fingerprint registry, a canonical reference pool). Copied as they are, they would read the wrong
files, or none, and fall back on generic taste. So:

- **Every ported skill opens with a Reads / Writes block** naming exact repo-relative paths in this
  project (`docs/ui-requirements.md`, `docs/ui/research/…`, `docs/ui/styles.md`, …). Its body refers
  only to paths in that block.
- **No foreign references.** No agentflow path, factory script, schema, brief section number, project
  slug, absolute path or home-relative path. Each factory script a skill relied on is either ported into
  this repo under the same discipline, replaced by a manual step, or cut, and the skill says which.
- **A mechanical check, not a review.** The harness self-test lints every skill under `.claude/skills/`:
  each repo path it mentions must exist or be listed as one of its Writes, and a denylist (`agentflow`,
  `projects/`, `~/`, drive letters, `brief.md §`) must not match. It runs in `node --test` with the
  other hook tests, so a bad port fails before any agent loads it.
- **Our skills only.** The design agents get no `Skill` tool and preload only this repo's skills, so
  they can't reach for a user-level or plugin taste skill (`frontend-design`, `design-taste-frontend`)
  in place of the ported method (`requirements.md` §3: all skills are our own).
- **Research must be cited, and the citations checked.** Every style option, mockup direction and
  screen names the `docs/ui/research/` entries it draws on (by entry ID). A post-stage check fails the
  stage if a citation doesn't resolve, or if a research entry the stage was required to use is never
  cited (agentflow's concept-survival gate, run outside the agent).
- **The trail proves what was read.** The activity hook already logs each design agent's file
  operations, and redacts anything outside the repo to `<outside-repo>`. A design-stage gate fails if a
  design agent touched `<outside-repo>`, or never read the research files its stage depends on.

### Repository layout (additions)

```text
src/web/             the SPA (Vite, React, TypeScript) and the trail compiler
tests/               web test location settled in web-testing.spec.md, so "the builder can't edit
                     tests" stays a path rule
docs/ui-requirements.md   this file
docs/ui/             design-phase outputs the agents read: research/, styles.md, flows.md,
                     screens.json, components.md, mockups/, screens/, design-system preview
docs/plans/active/   ui.dag.yaml + ui.plan.md (at G5)
docs/trace/ui/<node>/     the UI plan's trails, same format as build
```

### Stack (proposed; settled in `web-architecture.spec.md`)

- Vite, React and TypeScript (strict), React Router, no state library, typed data loading from
  `trace.json`
- Styling from design tokens (W3C DTCG `tokens.json` → CSS custom properties); the CSS approach is
  settled in `design-system.spec.md`
- Vitest + Testing Library, Playwright with axe
- Hosting: static. GitHub Pages serves only public repos on GitHub Free, so until David makes the repo
  public the explorer runs locally (`vite preview`). Enabling Pages is a repo setting: David's alone.
  An Azure Static Web Apps resource can join the F5 Bicep as evidence

---

## 4. Analysis: what it must produce

Each spec has the four sections **Research → Options → Decision → Contract**. Agents act on the
Contracts, distilled into contract-only skills, and on the files in `docs/ui/`.

| # | Spec (`.claude/specs/`) | Must settle |
|---|---|---|
| 1 | `ui-research.spec.md` | <ul><li>**Prior art:** agent and LLM trace viewers, CI run views, span waterfalls, requirements-traceability and test-report tools. Per tool: real URL, the pattern worth taking, weaknesses, real colours and fonts (unverified items marked `NEEDS CLARIFICATION`, never invented)</li><li>**Mood:** primary mood, keywords, an explicit avoid list, 5+ real references</li><li>**Style options:** 2–3, each with the 9 colour tokens, type (with mono), spacing, radius, shadow, the three dials (variance, motion, density), a differentiation move and a "why this project" line</li><li>**Assets:** icon set, fonts, no Uinsure branding</li><li>**Flows:** one per task, not per person; every screen in at least one flow</li><li>**Screen catalog:** id, route, components, icons, flows, the trail data each reads, and its states</li><li>**Component catalog:** four tiers (primitive, pattern, layout, project-specific)</li></ul>Outputs to `docs/ui/` |
| 2 | `trace-data.spec.md` | <ul><li>Every source file and its schema (loop, activity, verdicts, findings, packets, README, matrix, plans, QA, context, git trailers)</li><li>The `trace.json` schema and versioning</li><li>Provenance labels, the compiled-at stamp, incomplete and in-flight trails</li><li>The privacy pass</li><li>The harness file emitted by `render-trace.mjs` (DATA-7)</li><li>Size and splitting</li></ul> |
| 3 | `web-architecture.spec.md` | <ul><li>`src/web/` layout, routing, data loading, error boundaries</li><li>Import boundaries and how they're enforced (lint rules)</li><li>Where the workbench plugs in later (OpenAPI-generated types, CORS)</li><li>Banned APIs and approved packages, the same discipline as the API</li></ul> |
| 4 | `design-system.spec.md` | <ul><li>Tone and voice (not a layout)</li><li>Tokens for both themes, type scale, spacing, radius, shadow, motion</li><li>The component tiers approved at G3</li><li>Accessibility floor</li><li>The anti-slop list and the asset and icon rules</li></ul> |
| 5 | `screens.spec.md` | **Derived from `ui-research`:** its Research section cites the flows, screen catalog and component catalog by entry ID, and adds nothing the research doesn't support. <ul><li>Flows and navigation</li><li>Every screen: route, data, components, and its states (loading, empty, error, in flight, incomplete)</li><li>Deep-link scheme (NAV-2)</li><li>Region tagging: the `data-req` convention and the gate that rejects an untagged region</li><li>The "not built yet" pattern and the nav rule for unbuilt screens</li><li>The derivation script: node → its reference screens</li><li>The design fixture frozen at G4</li><li>The supervised edit path and re-sign after G4</li></ul> |
| 5b | `ui-defects.spec.md` | **Researched from** agentflow's `build-to-spec-verify`, `parity-verify`, `fix-bugs`, `bug-investigator` and `systemic-fixer`, `planning.spec.md`'s `/plan-bug`, and Playwright's screenshot comparison. Its Options weigh what to run per node against what to run once per scope. <ul><li>The defect table in §3, made exact: who raises each kind, the route, the ID, the branch</li><li>The per-node gates: own screens, then every screen built so far</li><li>Baselines: where they live, when they're committed, who approves a change</li><li>Systemic defects: how one bug is scoped to the shared layer</li><li>Upstream drift: the compiler's failure and the `feat-NNN` it raises</li><li>The cross-node flow gates on a scope's last node, and the optional whole-app review and its triage</li><li>What `/plan-bug` needs for a UI defect</li></ul> |
| 6 | `web-testing.spec.md` | <ul><li>What red, stub and green mean for a UI</li><li>Test types and what each proves</li><li>Fixture trails</li><li>The TS form of the `Rule` trait and the coverage check over this file's IDs</li><li>Where web tests live</li><li>Screenshot and axe checks; the QA script template for UI nodes</li></ul> |
| 7 | `web-deployment.spec.md` | <ul><li>Build and static hosting (local preview until public; GitHub Pages after)</li><li>Base paths and deep links on a static host</li><li>Optional Azure Static Web Apps evidence in F5</li></ul> |
| 7b | `efficiency.spec.md` | agentflow's costly lessons as rules (`EFF-n`), each with its mechanical leg and the spec that owns it; the dispatch budget per stage; the machinery explicitly not built. Drafted 2026-10-19 from LESSONS, DECISIONS, RESEARCH and all 98 plan files |
| 8 | Amendments | <ul><li>`agents-skills`: the new agents and skills</li><li>`guardrails`: path rules for `src/web/` and the web tests; the harness lock covers the new agents</li><li>`traceability`: this file's IDs in the matrix; `render-trace.mjs` reads TS test tags and emits the harness file</li><li>`orchestration`: the `ui` branch model, base branch per plan, no overlapping loops</li><li>`planning`: the `ui` plan ID (beside `build`, `feat-NNN`, `bug-NNN`, `inv-NNN`)</li></ul> |

**Order:** `efficiency` (first: it binds how the others are run) → `ui-research` → `trace-data` → `web-architecture` → `design-system` → `screens` →
`ui-defects` → `web-testing` → `web-deployment` → amendments. Mockups (G2) start once `ui-research` is
decided. `screens` and `ui-defects` are drafted from the research, not from this file alone: each one's
Research section cites `ui-research` entries, and a spec that cites none isn't ready for G1.

**Draft feature list** (settled at G5):
- **U0a** harness extension: agents, skills, hook rules (owner David, in-session, no loop)
- **U0b** walking skeleton: compiler → `trace.json` → one screen → static build
- **U1** overview, matrix and rule page
- **U2** DAG, node page and walkthrough
- **U3** loop, verdicts, findings and the retry ladder
- **U4** agents, human decisions and verify-it-yourself
- **U5** sessions, harness anatomy and stats (cuttable)
- **U6** hosting (cuttable)
- **W1+** the workbench, after F3 and F4 merge

The last node of each scope carries the cross-node flow gates (see Defects).

**Cut order:** U6, then U5, then the COULD rows.

**Guard against over-building:** every spec, agent and skill must be used by U0a, U0b or U1. Anything
that isn't is cut.

---

## 5. Research inputs

Carried over from agentflow_phase3 (`LESSONS.md`, `DECISIONS.md`, `brief-template.md`):

- **Judge by screenshot** (bug-031): "judge mockups by SCREENSHOT, never by agent self-report."
- **A judge must be calibrated** (feat-106): a vision judge must reproduce David's own pairwise ordering
  on labelled examples before its scores are trusted. agentflow's needed three rounds and still inverted
  it, so this project has no judge: David's eye is the gate.
- **Method beats grading** (feat-106): encode the craft method as a skill the generator runs, with
  worked exemplars, rather than relying on a downstream grader.
- **A skipped gate is not a gate** (investigate-023): a quality gate that degrades to WARN when its
  measuring loop didn't run has failed.
- **Gate outside the agent** (investigate-010): a stage that writes several dependent artifacts needs a
  deterministic post-stage check that runs whether or not the agent reached its last step.
- **Tone, not layout, in the brief** (`brief-template.md` §2): a brief that dictated a layout produced
  four "divergent" directions that were the same. This file describes the tone and the evidence, and
  leaves layout to the directions.
- **Research drives distinctness** (feat-089): references come from the domain and its real prior art
  first, the generic design-system pool only as a fallback.

---

## 6. Open items

1. **Rule ID scheme.** Short area prefixes (`DATA-1`, `RULE-1`, …) as drafted, or one family prefix
   (`UI-DATA-1`) so the matrix can tell UI rules from API rules at a glance?
2. **Deadline.** `requirements.md` gives Monday 2026-10-19. The UI needs its own date, and the cut order
   above depends on it.
3. **Name.** The explorer's neutral name (BRAND-1).
4. **F7 overlap.** Does the explorer replace, feed or sit beside the F7 pitch deck?
5. **Workbench backend additions** (WB-8 demo clock, WB-9 list endpoint): accepted as new API rule IDs,
   or the workbench stays inside the current API?
