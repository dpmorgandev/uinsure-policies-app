# Style options

Drafted 2026-10-19 by the main session from `docs/ui/research/` (cited by entry ID). Three directions for
the G2 mockups. David picks one at G2 and writes its concept paragraph himself (`efficiency.spec.md`
EFF-9); the "governing idea" lines below are drafts for him to keep, rewrite or discard.

**Token provenance.** Every colour is either **sourced** (a value verified in the research, cited K1, K2
or K3) or **proposed** (chosen here to fit the direction, not from any source). Contrast ratios were
computed by the main session with the WCAG 2.x relative-luminance formula, against the theme's
background and surface. AA needs 4.5:1 for text and 3:1 for graphics and component boundaries.

## Shared constraints (all three directions)

From the research, binding whichever direction is picked:

- **Status is a word, a glyph and a colour, never colour alone** (M1, K3 notes). The five states and
  their glyphs: pass `check`, fail `x`, warn `triangle-alert`, pending `clock`, not built: a dashed
  neutral outline with the words "not built yet" (absence never reads as failure).
- **Status tags are sentence-case adjectives and aren't interactive** (M1). Anything clickable is a link
  styled as one.
- **SHAs, rule IDs, file:line, commands and JSON are set in the mono face**, with tabular figures for
  every count. Tabular-figure support is unverified for every candidate face (T1–T5), so a specimen test
  is required before G2 sign-off.
- **Icons: Lucide (I1, ISC)**, the only set verified for every glyph this brief needs.
- **Tables follow M3 and M4:** a row-header column (the ID), numbers right-aligned, a default sort shown
  in the header, real `<th>`/`<caption>` semantics, sticky headers that never hide focus (WCAG 2.2
  SC 2.4.11, C43).
- **The DAG always has a text equivalent** (an adjacency table) in the same `<figure>`.
- **Departure from the category default.** Both prior-art files name it: dark or neutral chrome,
  green/red/amber dots, a left sidebar, a main canvas, a right drawer, time as horizontal bars, LLM-call
  vocabulary ("span", "generation"). Each direction states how it departs.
- **The avoid list in `mood-type-icons.md` §1 holds everywhere:** no AI gradients, glow, glass, sparkle
  icons, hero sections, emoji, unsourced KPI tiles, decorative or 3D charts, pure-black dark mode.
- **Borders are decorative.** Every proposed border is below 3:1 against its surfaces (1.3–2.0 measured),
  so no component may depend on a border alone to be seen; the search input uses the secondary-text
  colour for its boundary.

## Style 0: Case file

**Chosen at G2 (2026-10-19).** **Concept:** David adopted the draft governing idea below as the concept,
unchanged ("keep your draft governing idea as the concept").

**Governing idea:** the explorer reads like a well-kept case file. Each rule is a matter, each
commit, gate and verdict an exhibit, numbered and dated, and every claim has its exhibit beside it.

**Layout archetype:** a document, not a dashboard. A single reading column (about 72 characters for
prose, wider for tables) with a top bar and breadcrumbs, no left sidebar. Evidence is shown inline as
numbered exhibits; drill-down opens the exhibit in place rather than in a drawer.

**Signature graphic (data-true):** the **chain of custody** strip on each rule: requirement → red commit
→ green commit → refactor → QA step → sign-off → PR, each a linked exhibit with its date and author.
Missing links show as gaps in the chain, never as invented steps.

### Colours

| Token | Light | Source | Dark | Source |
|---|---|---|---|---|
| background | #f7f5f0 | proposed (paper) | #161616 | K2 (Gray 100) |
| surface | #ffffff | proposed | #1f1f1f | proposed |
| textPrimary | #0b0c0c | K1 | #f3f3f3 | K1 (light grey) |
| textSecondary | #484949 | K1 | #b4b4b4 | proposed |
| primary (links) | #1a65a6 | K1 | #8cb4e8 | proposed |
| accent (focus) | #ffdd00 | K1 (with a #0b0c0c underline, GOV.UK style) | #ffdd00 | K1 |
| error / fail | #ca3535 | K1 | #fa4d56 | K2 (inverse) |
| success / pass | #0f7a52 | K1 | #42be65 | K2 (inverse) |
| warn | #8a5a00 | proposed | #e6a23c | proposed |
| border | #cecece | K1 | #4a4a4a | proposed |

**Contrast (on background / surface):** light: text 17.98/19.59, text2 8.29/9.03, link 5.58/6.08, fail
4.73/5.16, pass 4.91/5.35, warn 5.44/5.93. Dark: text 16.31/14.85, text2 8.73/7.95, link 8.45/7.70, fail
5.40/4.91, pass 7.57/6.90, warn 8.27/7.53. **All pass AA as text** in both themes.

### Typography

**T3: Source Sans 3 + Source Code Pro** (OFL-1.1). Neutral and documentary; both variable. Scale 12 / 14
/ 16 / 20 / 24 / 32 (body 16). Headings in the sans at weight 600, no display sizes above 32.

### Spacing, shape, depth

Base 4; scale 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Radius **none to subtle** (0 for tags and tables, 2px
for buttons). Shadow **flat**: structure from rules (1px lines) and whitespace, not elevation.

### Dials

design_variance 3 · motion_intensity 1 · visual_density 5.

### References

M1, M2 (GOV.UK tags and functional colour as a fixed vocabulary), M6 (Sentry: summary first, then
distinct evidence sections), C1 (failure expanded by default), C8 (a closed set of decisions).

### Rationale and differentiation

- **Why this project:** the reader is an interviewer judging whether the claims are true. A document of
  exhibits answers that directly, and suits an insurance setting, where a claim file is a familiar form.
- **Differentiation move:** the category converges on a sidebar-canvas-drawer dashboard with status dots;
  this direction is a **document with exhibits**, with no sidebar and no drawer.
- **Risk:** long pages on big nodes (F1 has 92 commits); needs good in-page navigation and collapsing.
  Lowest density of the three.

## Style 1: Instrument

**Governing idea (draft):** a precise instrument panel for the build. Dense, quiet, everything in its
place, readable at a glance by someone who reads CI output daily.

**Layout archetype:** a compact console: a narrow left rail of plans and nodes, the main area as tabs
over the same node (overview, walkthrough, loop, activity) following C2's "one dataset, several views",
details expanded inline below the row.

**Signature graphic (data-true):** **agent lanes**: for a node, one horizontal lane per agent (main,
tester, builder, reviewer, security, investigator, git), commits as ticks on their author's lane, gates
as markers between, FAILs expanded by default (C1, C4). The agent is a lane and a label, not a colour,
so status keeps the colour channel (C opportunity 2).

### Colours

| Token | Dark | Source | Light | Source |
|---|---|---|---|---|
| background | #161616 | K2 (Gray 100) | #f4f4f4 | K2 (Gray 10) |
| surface | #262626 | proposed | #ffffff | proposed |
| textPrimary | #f4f4f4 | K2 (Gray 10) | #161616 | K2 (Gray 100) |
| textSecondary | #a8a8a8 | proposed | #525252 | proposed |
| primary (links) | #78a9ff | proposed | #0f62fe | K2 (Blue 60) |
| accent (focus) | #78a9ff | proposed | #0f62fe | K2 (Blue 60) |
| error / fail | #fa4d56 | K2 (inverse) | #da1e28 | K2 (Red 60) |
| success / pass | #42be65 | K2 (inverse) | #198038 | proposed (K2's #24a148 fails text contrast on light) |
| warn | #f1c21b | K2 (Yellow 30) | #8e6a00 | proposed |
| border | #393939 | proposed | #c6c6c6 | proposed |

**Contrast:** dark: text 16.45/13.76, text2 7.61/6.36, link 7.68/6.43, fail 5.40/4.51, pass 7.57/6.33,
warn 10.75/8.99. Light: text 16.45/18.10, text2 7.10/7.81, link 4.55/5.00, fail 4.55/5.00, pass
4.56/5.02, warn 4.53/4.99. **All pass AA as text**, but the light theme's link, fail, pass and warn sit
just above 4.5 on the background: no lighter variants are available.

### Typography

**T1: IBM Plex Sans + Plex Mono** (OFL-1.1). One family; reads as engineered. Compact scale 12 / 13 /
14 / 16 / 20 / 24 (body 14).

### Spacing, shape, depth

Base 4; scale 4 / 8 / 12 / 16 / 24 / 32. Row heights 32px default, 24px compact (M3). Radius **subtle**
(4px). Shadow **subtle**: surfaces separated by tone, lighter in dark mode (M7).

### Dials

design_variance 2 · motion_intensity 2 · visual_density 8.

### References

M3, M4 (dense data tables), M5 (status token roles), M7 (dark theme by tone), C1, C2, C4 (failure-first,
several views, error stepping), P1 (list, tree, detail), P5 (aggregated or expanded loops).

### Rationale and differentiation

- **Why this project:** the most efficient for a reader who knows CI tools, and for David presenting
  live, jumping fast between nodes.
- **Differentiation move:** keeps the console shape but changes its axes: **ordering and role**, not
  pass/fail alone, are primary (agent lanes, the TDD sequence).
- **Risk:** this is **the closest to the category default** the research tells us to depart from, and
  Plex with Carbon's greys and blue reads IBM-adjacent (T1, K2). It would need its signature graphic to
  carry the distinctness.

## Style 2: Chronology

**Governing idea (draft):** one time axis tells the whole story. Gates, commits, verdicts, findings and
human decisions sit on a single line, so cause and order are visible without reading a log.

**Layout archetype:** time-first. Each node page is a horizontal chronology with rules as rows and events
as marks along it; human decisions run full height as vertical markers; selecting a mark opens its
evidence below the axis. Lists and tables are secondary views of the same events.

**Signature graphic (data-true):** the **red-before-green chronology**: per rule, its red and green
commits plotted on the node's real timeline (from trail timestamps), the gap between them visible, gates
and verdicts on the same axis, David's pauses and sign-off as full-height lines. Only events in the trail
are plotted; nothing is interpolated between them.

### Colours

| Token | Light | Source | Dark | Source |
|---|---|---|---|---|
| background | #ffffff | proposed | #111314 | proposed |
| surface | #f3f3f3 | K1 (light grey) | #1b1e20 | proposed |
| textPrimary | #0b0c0c | K1 | #f3f3f3 | K1 |
| textSecondary | #484949 | K1 | #b1b4b6 | proposed |
| primary (links) | #0072B2 | K3 (blue) | #56B4E9 | K3 (sky blue) |
| accent (focus) | #0072B2 | K3 | #56B4E9 | K3 |
| fail (graphic) | #D55E00 | K3 (vermilion) | #E8783A | proposed (lightened vermilion) |
| pass (graphic) | #009E73 | K3 (bluish green) | #2BB58E | proposed (lightened bluish green) |
| warn (graphic) | #E69F00 | K3 (orange) | #E69F00 | K3 |
| warn (text, light only) | #8a5a00 | proposed | — | — |
| border | #cecece | K1 | #3a3f42 | proposed |

**Contrast:** light: text 19.59/17.65, text2 9.03/8.14, link 5.19/4.67, **fail 3.87/3.49, pass
3.42/3.08, warn 2.25/2.03**. Dark: text 16.79/15.10, text2 8.94/8.04, link 8.07/7.26, fail 6.37/5.73,
pass 7.19/6.47, warn 8.27/7.44. **In the light theme the Okabe-Ito status colours fail AA as text and
warn fails even the 3:1 graphics bar**, so in light they colour glyphs and timeline marks only (fail and
pass meet 3:1), status words stay in textPrimary, and warn marks need a dark outline or the darker text
variant. Dark passes everything.

### Typography

**T5: Atkinson Hyperlegible Next + Atkinson Hyperlegible Mono**, chosen for telling similar glyphs apart
in SHAs and IDs (0/O, 1/l). **Blocking:** its licence is an EULA with OFL status `NEEDS CLARIFICATION`,
and self-hosting terms need checking (T5). If it fails, fall back to T3. Scale 12 / 14 / 16 / 18 / 24 /
32 (body 16).

### Spacing, shape, depth

Base 4; scale 4 / 8 / 12 / 16 / 24 / 32 / 48. Radius **subtle** (2px). Shadow **flat**; the axis and its
gridlines in textSecondary at low weight carry the structure (M8: grey for secondary annotation).

### Dials

design_variance 5 · motion_intensity 2 · visual_density 7.

### References

K3 and M8 (colour-blind-safe categorical colour, lightness variation, grey annotation), C4 and C3
(summary strip over a rescaling detail, minimap), C5 (status transitions, the timeline lanes), P2 (a
waterfall of typed events), P opportunity 2 and C opportunity 4 (gates, verdicts and sign-offs on one
time axis).

### Rationale and differentiation

- **Why this project:** TDD is a claim about **order**. A time axis proves red came before green without
  asking the reader to compare SHAs, which is the single question the interviewer most needs answered.
- **Differentiation move:** CI and trace tools put time on spans or jobs; this puts **requirements on the
  rows and human decisions on the axis**, which no tool in the research does (P opportunities 1 and 3,
  C opportunities 1 and 4).
- **Risks:** the timeline is the hardest component to make accessible (no dedicated timeline source was
  found, `mood-type-icons.md` §6.4), so its text equivalent is mandatory; it's the most build effort of
  the three; the font licence is unresolved.

## For the G2 mockups

Each direction is mocked on **two screens**: `overview` and `rule` (the rule page carries every
signature graphic: the custody chain, the lanes' TDD ticks, the chronology), in light and dark, at 1440
and 390 wide, with real trail data (SELL-5 and GET-1 from `trail-inventory.md`). That is 2–3 directions ×
2 screens, inside the `efficiency.spec.md` budget.
