# G4 defects: what the build must not copy from the screens

Found by a read-only review of every page and screenshot after the screens review (2026-10-20).
The screens stay as written (screens C7). The build reads them for content; this file overrides them
where they are wrong.

## 1. App shell (the frames fixed one screen's state for the whole family)

A screen pastes its family frame unchanged, so these came out the same on every page. The build's app
shell derives each one from the route, never from the page.

- **Current nav item.** The explorer frame marks Requirements matrix current on all 13 explorer screens;
  the workbench frame marks Workbench (wb-home) on all 7. Mark the screen's own section; mark nothing on
  not-found. The workbench needs a way to show which form is open.
- **Document title.** Every page reads "Docket · explorer frame" (or workbench, or node build/F3). Each
  screen gets its own title.
- **Node header, breadcrumb and tabs.** The node frame fixes F3 (title, breadcrumb, header, status, PR,
  completeness banner) and the Node tab current. Loop and activity must mark their own tab; the header
  must be the node shown (F6, F7, F0a pages show F3's). Loading and error pages show no node facts.
- **Inspector drawer ("The requests as sent").** The workbench frame puts a closed drawer after
  `</main>` with `position: sticky; bottom: 0`, so it covers form fields, headings and error titles, and
  it always reads "Closed · 0 requests". Seven pages add a second, open drawer. Build one drawer, as an
  overlay that never covers content, showing the requests this page actually sent. wb-home and
  wb-requests don't list it in the catalog.
- **Footer stamp.** The explorer and workbench frames draw the known snapshot SHA in the "missing" state
  and the UTC toggle pressed, while the header's toggle is not. Draw the SHA as a link (as the node
  frame does), with one toggle state per page.
- **Snapshot claims on failure pages.** Error, loading and not-built pages say nothing was compiled
  while the footer states the snapshot. When nothing was read, the shell makes no snapshot claim.

## 2. Kit (`src/web/kit`): fix first, test first

- **data-table**: its 36rem `max-height` frame clips rows with no scroll cue (harness 7.5 of 9 agents,
  walkthrough #13 of 77, activity 8 of 80 lines, stats loses F7; about 2 rows at 390). Numeric headers
  carry a literal `class="undefined"`.
- **Dark mode contrast**: the current nav item, primary buttons, Search and the theme toggle read as
  disabled. *Measured in U0a and kept (David, 2026-10-20): text on the `#6fc3d6` fill 8.40:1, the fill on
  the page 8.40:1, the current nav item 14.29:1 with its bar. Not a defect; the build keeps the tokens.*

*U0a fixed every other item in this section (`fix(kit)` on `feature/ui/U0a`), measured before and after
on the built kitchen sink.*
- **refund-worked-sum**: `td { text-align: left }` beats `.num { text-align: right }`, so figures sit
  under the wrong headers.
- **request-log** clips its last column at 390; the top-bar search placeholder is cut ("Rule ID, node, S").

## 3. Screens: content errors not to copy

- **Raw placeholders on the page**: `‹nodeId›` (node incomplete), `‹ruleId›`, `‹planId›` (overview, matrix,
  rule, plan not-built), `‹reference›` (wb-home, wb-policy api-unreachable). overview not-built carries
  the rule screen's text.
- **Self-contradiction**: stats gives F6 A2's reviewer FAIL as 09:13:43Z and 09:13:53Z; not-found's header
  says nothing compiled; wb-sell submitting and wb-cancel submitting log no request in flight; wb-sell
  api-error shows a "StartDate required" error beside a filled date.
- **Duplicates**: overview step 6 repeats the search and theme toggle; wb-requests has two filters with two
  counts; wb-cancel submitting shows two busy Cancel buttons.
- **Links**: with one example page per screen, links labelled F1, F4 or F6 open F3, policy links open
  another policy, every rule chip opens GET-1, every sessions slug opens the same page. The build links
  by real id.
- **Presentation**: overview prints F0a's reasons as raw Markdown split across list items; decisions
  shows raw filter ids (`pause1`) on one page and labels on others; wb-requests' eyebrow says "long
  content"; not-found uses the not-built state, not triangle-alert.
- **Missing from the catalog's intent**: wb-cancel never shows a successful cancel or
  `quote-cancel-compare`; wb-sell never uses `inline-error`; stats has no commits-per-agent or elapsed
  time (not in its data).
- **Accessibility**: wb-claim's description and wb-home's reference input have no `<label>`; wb-renew's
  amount `aria-label` differs from its visible label.
- **Unsourced figures (check before reuse)**: wb-requests' timestamps 2026-10-19T17:47:22Z and 17:47:34Z
  are in no fixture file.

## 4. Escalated screens (audit lines, for the record)

activity (126), finding (4; overflow at 390 from an unbroken SHA), wb-renew (2), wb-requests (22): see
the `escalated` events in `loop.jsonl`. Steer D2 exempted four audit false-positive classes; D3 escalated
instead of retrying when the budget ran out.

## Not defects

The catalog's loading, error and empty states have no page per screen by design (SC7; the kit draws
them once). The leftover loading, error and empty pages from waves 1 and 2 are stale and not reviewed.
