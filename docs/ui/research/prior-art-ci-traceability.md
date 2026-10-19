# Prior art: CI runs, trace waterfalls, test reports and traceability

Researched 2026-10-19 by a read-only web-research subagent (Sonnet). Written to this file by the main
session, lightly condensed for wording; no claim, URL or verification status was added or changed.
Entry IDs: C1–C8.

Verification key: **Fetched** means the page body was read. **Search-only** means only a search snippet
was seen because the fetch failed. The Jaeger trace-view docs, Xray, Grafana and Primer hex pages yielded
nothing usable.

## C1. GitHub Actions run, job and step view (CI runs)
- Fetched: https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows/using-workflow-run-logs;
  colour roles from https://primer.style/foundations/color/overview
- **Shows:** a run page with a job list or graph; a job opens an ordered step list with log output
  ("Set up job" and "Complete job" added to every job); each step shows its duration; a "Search logs" box.
- **Patterns:**
  1. Failed steps auto-expand, passing steps stay collapsed: the evidence is surfaced by default.
  2. Per-step durations inline in the step list.
  3. Line numbers are permalinks, so any evidence line can be linked.
  4. Run → job graph → steps → logs.
- **Avoid:** search covers only expanded steps; status icons aren't described.
- **Visual facts (Primer):** semantic roles success (positive), danger (errors), attention (active or in
  progress), each with muted and emphasis variants; light, dark and high-contrast themes; line heights on
  a 4px grid. Hex values, font family, radius: `NEEDS CLARIFICATION` (the one hex on the page, `#bf3989`,
  is an example base colour, not a status colour).

## C2. Buildkite build page and pipeline graph (CI runs)
- Fetched: https://buildkite.com/docs/pipelines/build-page
- **Shows:** a hierarchical step sidebar; a main area with Summary, Steps, Annotations, Canvas, Table and
  Waterfall views; a resizable step drawer (Log, Artifacts, Environment) docking right, bottom or centre.
- **Patterns:**
  1. One build, several views: Canvas (DAG) for dependencies, Table for durations and states, Waterfall
     for timing.
  2. The sidebar groups by state, failed and waiting first; `f` jumps between failures.
  3. A retry selector switches between attempts of the same step.
  4. Skipped steps hidden by default, with a toggle that shows the skip reason.
- **Avoid:** Canvas is "less useful when zoomed out on large builds"; many modes, so a reader with no
  guide must choose a tab.
- **Visual facts:** `NEEDS CLARIFICATION`.

## C3. Jaeger UI (trace waterfall)
- Fetched: https://www.jaegertracing.io/docs/latest/features/ (and the frontend-ui embed-options page);
  trace-view and comparison pages not covered.
- **Shows:** a React app (the docs cite an 80,000-span trace); a "Deep Dependency Graph" centred on a focal
  service showing only paths through it; embed flags for a trace minimap, a collapsible header and summary,
  a critical-path highlight, a span-tag priority list; a scatter plot above search results.
- **Patterns:**
  1. A minimap overview separate from the detail rows.
  2. The critical path as an optional highlight layer.
  3. A focal-node graph: could scope a feature DAG to one requirement.
  4. Pinned fields first in the detail.
- **Avoid:** span row layout and colours not verifiable from these pages.
- **Visual facts:** `NEEDS CLARIFICATION`.

## C4. Honeycomb trace view (trace waterfall)
- Fetched: https://docs.honeycomb.io/reference/honeycomb-ui/query/trace-waterfall,
  https://docs.honeycomb.io/investigate/analyze/explore-traces
- **Shows:** four areas (trace ID and navigation; a summary bar chart up to 6 dependency levels; the
  waterfall; a span sidebar). Each row has a name, a duration bar and a child-count box; events as circles,
  links as link icons.
- **Patterns:**
  1. Collapse by the child-count box, which then shows the subtree's size.
  2. Zoom into a subtree rescales the timeline; zoomed subtrees have permalinks.
  3. "Highlight errors" turns errors red, with a count and next/previous stepping.
  4. Sidebar tabs (Fields, Events, Links) and a minigraph comparing the span with its peers.
- **Avoid:** everything is span-shaped on one time axis; the sidebar is dense with generic fields.
- **Visual facts:** error spans red, selected row blue, span colours configurable. Hex, fonts, radius:
  `NEEDS CLARIFICATION`.

## C5. Allure Report (test reports)
- Fetched: https://allurereport.org/docs/visual-analytics/, https://allurereport.org/docs/timeline/
- **Shows:** a status pie with percent passed and New, Flaky and Retries counters; trend charts (status
  dynamics; transitions Fixed, Regressed, Malfunctioned); a treemap from epic, feature and story labels; a
  status age pyramid (how long tests stayed failed); a timeline with a lane per worker and one rectangle
  per test coloured by status, with duration and range sliders.
- **Patterns:**
  1. Tests grouped by requirement-like labels in a treemap, colour showing success rate.
  2. Status transitions across runs as a first-class idea.
  3. Hover for title and times; click for detail.
  4. The same status colours in every chart.
- **Avoid:** many chart types compete for attention; the test result page layout wasn't verified.
- **Visual facts:** "the more green … the better"; charts shift from green toward red as success falls.
  Exact values: `NEEDS CLARIFICATION`.

## C6. ReportPortal (test reports)
- Fetched: https://reportportal.io/docs/ (marketing-level overview only).
- **Shows:** configurable widget dashboards; results in the suite hierarchy with logs and screenshots on
  each test case; failures triaged as product bug, automation issue or system issue, with AI-assisted
  analysis; previous runs one click away.
- **Patterns:**
  1. A failure carries a human triage label: the shape our findings and sign-offs need.
  2. Evidence sits with the item, not in a separate area.
  3. The hierarchy mirrors the test plan.
- **Avoid:** widget dashboards need setup, so a cold link shows nothing meaningful.
- **Visual facts:** `NEEDS CLARIFICATION`.

## C7. Jama Connect Trace View, Coverage Explorer and Impact Analysis (traceability)
- **Search-only.** The Jama help page returned 403, the older Trace View URL 404; the Xray pages also gave
  nothing usable. Source:
  https://support.jamasoftware.com/hc/en-us/articles/40781365974541-Using-Trace-View-Coverage-Explorer-Impact-Analysis-in-Jama-Connect
- **Shows (snippet only):** Trace View covers upstream and downstream relationships; Coverage Explorer and
  Impact Analysis are separate views.
- **Pattern:** separate views for "what covers this" and "what does this affect".
- **Avoid:** one third-party blog claims the classic Trace Matrix was removed (unconfirmed).
- **Visual facts:** `NEEDS CLARIFICATION`. **Don't rely on this entry**: fetch the Jama or Xray docs
  before borrowing anything.

## C8. GitHub pull request review (traceability and review)
- Fetched: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews
- **Shows:** review decisions (Comment, Approve, Request changes), inline line comments, suggestions,
  required approvals before merge. The checks and Files changed tabs aren't described.
- **Patterns:**
  1. Verdicts are a small closed set.
  2. A merge gate shown as a requirement, not just a status.
  3. Comments anchored to a line of the change.
- **Avoid:** nothing links checks to requirements; checks are per commit, with no per-rule view.
- **Visual facts:** see C1 (Primer).

## Patterns across these categories
1. **Auto-expand the failure, collapse the rest** (C1, C2, C4): default views that show only the problem
   suit a reader with no guide.
2. **A summary strip above a detail list that rescales** (C3 minimap, C4 summary and zoom).
3. **Several views of the same data** (C2 Canvas, Table, Waterfall; C5): DAG for dependencies, table for
   comparison, waterfall for time.
4. **One status vocabulary everywhere** (C5, Primer roles): learnt once, read the same in every view.
5. **Group by requirement-like labels** (C5 treemap, C6 hierarchy): the label is the entry point.
6. **Evidence is a permalink** (C1 line numbers, C4 zoomed subtrees): every claim links to the exact line,
   commit or span.
7. **Humans label outcomes in a closed set** (C6 defect types, C8 review decisions).

## What these tools converge on
- Dark or neutral chrome with green, red and amber status dots or bars.
- A left list or sidebar, a main canvas, a right or bottom drawer for detail.
- Time as horizontal bars in the status palette.
- Small status icons and dense tabular rows.
- This is the default look to depart from consciously: a TDD story needs ordering and role, not only
  pass/fail.

## Opportunities for our explorer
1. **Red-before-green per requirement.** None shows an ordered red, green, refactor sequence for one rule.
   Allure's status transitions are the nearest analogue, and they compare runs, not steps within a
   requirement. Make the per-rule sequence the primary row.
2. **Author agent as a second channel.** CI tools encode status only. Encode the walkthrough by TDD step
   and mark the agent separately (shape, label or lane), so the two don't compete.
3. **Matrix cells that drill to evidence.** No verified matrix-to-evidence pattern exists here (C7 was
   thin). Link each cell (rule × tests, SHAs, QA step, sign-off, PR) to its gate receipt, commit or
   verdict, with permalinks as in C1 and C4.
4. **One time axis across gates, verdicts and sign-offs.** Buildkite and Honeycomb show time but not human
   sign-off or root-cause findings. Put them on one timeline with expected-versus-actual exit codes, and
   show the failure first as in C1.
