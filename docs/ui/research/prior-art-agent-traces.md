# Prior art: agent and LLM trace viewers

Researched 2026-10-19 by a read-only web-research subagent (Sonnet). Written to this file by the main
session, lightly condensed for wording; no claim, URL or verification status was added or changed.
Entry IDs: P1–P7.

Method note: each URL below was fetched. Most vendor docs describe the data model and say little about
the UI, so layout claims are marked "verified" only where a fetched page states them. No fetched page
stated colours, typography, density, radius or theme, so every visual fact is `NEEDS CLARIFICATION`.
That includes LangSmith, Braintrust and Phoenix, where only the data model (or nothing about layout)
was verified. Re-check visuals from live screenshots.

## Tools

### P1 Weights & Biases Weave
- URL: https://docs.coreweave.com/weave/guides/tracking/trace-tree (redirected from docs.wandb.ai)
- **Layout (verified):** three panels. A sortable trace list on the left, with tokens, cost and latency
  per row; the trace tree in the centre; details for the selected op on the right. A regex filter sits
  above the tree.
- **Views (verified):** Traces (the default tree with status indicators), Code composition (nested
  boxes), Flame graph, Graph.
- **Detail tabs (verified):** Call (inputs and outputs), Code, Feedback, Scores, Summary, Use.
- **Patterns to take:**
  1. List, then tree, then detail, as three columns: a natural drill from run to step to payload.
  2. "Scrubbers" step through the trace by Timeline, Peers (same type), Siblings or Stack. Peers would
     let a reviewer jump between all gate runs or all reviewer verdicts.
  3. A tab for the code that ran: for us, the diff of a red or green commit.
  4. A regex filter by name or type above the tree.
- **Weaknesses:** six tabs are a lot to scan; "Use" is developer-facing; nothing in the docs links a call
  to a requirement.
- **Visuals:** `NEEDS CLARIFICATION`.

### P2 AgentOps
- URL: https://docs.agentops.ai/v2/usage/dashboard-info
- **Shows (verified):** Session Drilldown (chat-style LLM history plus charts of event types and
  durations), Session Drawer, Session Waterfall, Session Overview.
- **Waterfall (verified):** a timeline of LLM calls, actions, tool calls and errors; selecting an event
  shows its exact prompt and completion.
- **Patterns to take:**
  1. A waterfall of typed events along time: suits red, green and refactor with gates between.
  2. Click an event to see exactly what ran: for us, the command and its output.
  3. An overview across sessions beside a drilldown into one.
- **Weaknesses:** replay isn't documented as a feature; the layout is under-documented.
- **Visuals:** `NEEDS CLARIFICATION`.

### P3 Helicone Sessions
- URL: https://docs.helicone.ai/features/sessions
- **Shows (verified):** one flow from user input to final response; session paths such as
  `/abstract/outline/lesson-1` define parent-child nesting.
- **Duration chart (verified):** requests sharing a path share a colour, showing when each step type runs
  and for how long.
- **Patterns to take:**
  1. Hierarchy from a readable path rather than opaque IDs.
  2. One colour per step type in a duration distribution, with the key shown.
  3. Filter by named session type.
- **Weaknesses:** the tree layout is undocumented; colour-by-path is colour-only encoding.
- **Visuals:** `NEEDS CLARIFICATION`.

### P4 OpenAI Traces dashboard (Agents SDK)
- URL: https://openai.github.io/openai-agents-python/tracing/. The dashboard (platform.openai.com/traces)
  is described only as a place to "debug, visualize, and monitor"; its layout was not verified.
- **Data model (verified):** Trace (workflow_name, trace_id, optional group_id) and spans (Agent,
  Generation, Function, Guardrail, Handoff, …).
- **Patterns to take:**
  1. A small, named, fixed span vocabulary: our six agents map directly.
  2. Guardrail and Handoff as first-class span types: they map to gates and human sign-offs.
  3. `group_id` links related traces into a thread: a TDD cycle can group its commits.
  4. Hiding noisy span types for a compact hierarchy.
- **Weaknesses:** the dashboard UI is unverified; the vocabulary is a framework's, not the domain's.
- **Visuals:** `NEEDS CLARIFICATION`.

### P5 Langfuse
- URLs: https://langfuse.com/docs/observability/features/agent-graphs,
  https://langfuse.com/docs/observability/features/log-levels
- **Agent graph (verified):** aggregated mode has one node per step name with a counter such as
  `retrieve_docs (3/3)`, loops shown as cycles; expanded mode has one node per call, loops unrolled in
  execution order. The toggle sits top-left and persists across traces.
- **Log levels (verified):** DEBUG, DEFAULT, WARNING, ERROR, plus a `statusMessage`; filterable by level.
- **Patterns to take:**
  1. Aggregated or expanded: the loop once with an attempt counter, or every pass.
  2. A status level plus a short human message beside it.
  3. A filter by level, such as failures only.
- **Weaknesses:** tree and timeline views unverified; the graph appears only for some observation types.
- **Visuals:** `NEEDS CLARIFICATION`.

### P6 Arize Phoenix
- URLs: https://arize.com/docs/phoenix/tracing/concepts-tracing/what-are-traces,
  https://arize.com/docs/phoenix/tracing/llm-traces
- **Data model (verified):** span kinds CHAIN, RETRIEVER, RERANKER, LLM, EMBEDDING, TOOL, AGENT, DECISION
  (experimental); Guardrail, Evaluator, Prompt listed but not described; key-value attributes; a trace is
  described as "a timeline". Nothing on UI layout.
- **Patterns to take:**
  1. The span kind as a visible badge on every row.
  2. Attributes as a plain key-value list in the detail view.
  3. Sessions and Annotations as separate top-level areas: Annotation maps to human sign-off.
- **Weaknesses:** observability jargon (CHAIN, RERANKER, "span") means nothing to a reader without that
  background.
- **Visuals:** `NEEDS CLARIFICATION`.

### P7 SWE-agent trajectory inspector
- URL: https://swe-agent.com/latest/usage/inspector/
- **Shows (verified):** a `.traj` file per problem instance, in two forms. A CLI pager (h/l step, H/L
  trajectory, `t` searchable list, `v` reduced or full detail, `o` logs, `e` open in editor), and a
  browser inspector (`sweagent inspector --directory --port`), shown in screenshots without a layout
  description.
- **Benchmark marks (verified):** ✅, ❌, ❓ per trajectory.
- **Patterns to take:**
  1. Step-by-step keyboard navigation.
  2. A reduced or full detail toggle, reduced by default.
  3. A pass, fail or unknown mark that carries a glyph, not only colour.
  4. A static trajectory file reviewed offline: the same shape as our read-only explorer.
- **Weaknesses:** maintenance mode (the docs point to mini-swe-agent); layout undocumented; vim keys
  aren't discoverable by a cold visitor.
- **Visuals:** `NEEDS CLARIFICATION`.

## Fetched but not usable
- LangSmith (https://docs.langchain.com/langsmith/observability-concepts,
  https://docs.langchain.com/langsmith/trace-with-langchain): data model only (run, trace, thread, a
  "Trajectory view" flattening a session into messages). Layout unverified.
- OpenHands (https://docs.openhands.dev/usage/how-to/gui-mode): setup only.
- Braintrust: the URL tried returned 404. Nothing verified.
- Devin, Cursor and Claude Code session viewers: not fetched. Nothing claimed.

## Patterns across the category
1. **Tree or list, then detail pane** (Weave; implied elsewhere): structure first, payload second.
2. **Typed spans with a small vocabulary** (Phoenix, OpenAI): scan and filter by type.
3. **Timeline or waterfall** (AgentOps, Weave flame graph, Helicone duration chart): order and cost at a
   glance.
4. **Loop collapsing** (Langfuse aggregated vs expanded): retries are why traces get long.
5. **Reduced or full detail, plus filters** (SWE-agent `v`, Weave regex, Langfuse levels).
6. **Pass/fail marks and a status message** (SWE-agent ✅/❌/❓, Langfuse levels): the verdict where the
   eye lands first.

## What the category converges on
- Built around the generic LLM call: spans labelled "LLM", "generation", "chain", in the framework's
  vocabulary.
- Metrics cluster on tokens, cost and latency, the buyer's concern.
- Inputs and outputs as raw JSON or chat bubbles, with no domain structure.
- An assumed operator who already knows what a span is.
- Visuals: no palette or typography verified for any tool; no default look claimed beyond
  "developer-tool dashboard".

## Opportunities for our explorer
1. **Link each step to the requirement it satisfies.** No fetched doc links a span to a requirement. We
   can trace requirement → test → red, green and refactor commits → verdict.
2. **Show the gate loop natively.** Gates have a command, exit code, expected value and ok flag; Langfuse
   collapses loops into counters but has no "expected vs actual". Show the attempt ladder with each
   receipt.
3. **Typed human decisions.** Annotations (Phoenix) and Handoff (OpenAI) exist, but none models a human
   sign-off as a distinct, attributable event. Make each decision visible: who, what, why.
4. **Role-by-file view.** No fetched page shows which agent touched which file. A matrix of agents by
   files, with commits as cells, fills that gap.
5. **Plain-language, self-explaining entry.** The reader arrives with no guide: use domain words (test,
   gate, verdict, finding), a visible legend, and no span jargon.
