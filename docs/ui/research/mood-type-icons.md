# Mood, references, type and icons

Researched 2026-10-19 by a read-only web-research subagent (Sonnet). Written to this file by the main
session, lightly condensed for wording; no claim, URL, value or verification status was added or changed.
Entry IDs: references M1–M8, typography T1–T5, icon sets I1–I4, colour proof points K1–K3 (renamed from
the agent's P1–P3, which clashed with `prior-art-agent-traces.md`).

## 1. Mood definition

**Primary mood:** calm and exact. Every claim sits next to its evidence, and nothing is trying to impress
the reader. The governing metaphor is left to each creative direction.

*Edited 2026-10-19, approved by David: the agent's sentence named one metaphor ("a calm, exact case
file"), which matched round 1's chosen direction and would have steered every round-2 territory toward
it. The metaphor belongs to the creative director. Keywords and the avoid list are unchanged.*

**Keywords:** evidential, precise, sober, dense-but-legible, quiet, auditable, plain-spoken, durable.

**Avoid:**
- Purple or violet "AI" gradients; aurora or mesh backgrounds.
- Glowing neon, glow shadows, animated shimmer.
- Glassmorphism, heavy blur, floating translucent cards.
- Sparkle, magic-wand and brain icons.
- Three-up feature-card rows, hero sections, marketing slogans.
- Emoji in headings, status or copy.
- Colour as the only status signal.
- Confidence theatre: big-number KPI tiles with no source, "AI-powered" badges.
- Imitating any vendor's brand. The references inform patterns, not looks.
- Decorative charts; 3D or donut charts for evidence.
- Dark mode as pure black with saturated accents.

## 2. Reference designs (fetched and verified)

**M1. GOV.UK Design System, Tag** (https://design-system.service.gov.uk/components/tag/)
- Take: tags pair a word with colour, never colour alone (the page cites WCAG 1.4.1); tag text is an
  adjective in sentence case, not uppercase or a verb; one colour per tag everywhere; tags aren't
  interactive, so statuses aren't links or buttons.
- Relevance: the template for pass, fail, warn, pending and not-built chips.

**M2. GOV.UK Design System, Colour** (https://design-system.service.gov.uk/styles/colour/)
- Take: a small named set of functional colours (text, secondary text, border, focus, link, error,
  success), treated as a fixed vocabulary rather than a freeform scale.
- Relevance: plain, evidential tone.

**M3. IBM Carbon, Data table** (https://carbondesignsystem.com/components/data-table/usage/)
- Take: five row heights (24, 32, 40, 48, 64px), header matching the row size; toolbar and pagination
  following the row size; sort controls in headers, only the sorted column's arrow persistent, unsorted
  arrows on hover.
- Relevance: a dense-table spec, and a density step for the 1440, 1280 and 390 widths.

**M4. GitHub Primer, Data table** (https://primer.style/product/components/data-table/)
- Take: the identifying column as row header (`rowHeader`); numeric columns right-aligned; the table
  labelled via `aria-labelledby` on a real heading; icon-only row actions with an `aria-label` naming the
  row; a default sorted column.
- Relevance: tables of requirement IDs, SHAs and test counts.

**M5. GitHub Primer, Color usage** (https://primer.style/product/getting-started/foundations/color-usage/)
- Take: semantic roles (success, attention, danger, done); foreground, background and border tokens per
  role, with muted and emphasis variants; emphasis backgrounds always paired with an on-emphasis
  foreground.
- Relevance: a status-colour token structure that survives theming.

**M6. Sentry, Issue details** (https://docs.sentry.io/product/issues/issue-details/)
- Take: a header summary, then "highlights" promoted to the top; stack trace, suspect commits and
  breadcrumbs (a timeline before the failure) as distinct sections; searchable tags kept apart from
  non-searchable contexts; a side column of activity and links.
- Relevance: the model for findings with file:line, commits and timelines.

**M7. Linear, UI redesign write-up** (https://linear.app/now/how-we-redesigned-the-linear-ui)
- Take: themes generated from base, accent and contrast inputs in LCH; surfaces separated by elevation;
  lighter text and icons in dark mode; reduced chrome, tight alignment.
- Relevance: compact density and a controlled dark theme. Don't copy its brand look.

**M8. Datawrapper Academy, colour choice** (https://www.datawrapper.de/academy/what-to-consider-when-choosing-colors-for-data-visualization)
- Take: vary lightness, not only hue; seven colours or fewer; grey for secondary annotation so highlights
  stand out; test with a colour-blindness simulator.
- Relevance: honest data graphics for the DAG and timelines.

Not verifiable: FT data journalism and court/audit-report styles (ft.com blocked): `NEEDS
CLARIFICATION`. Stripe's dense-table patterns weren't verified; only its collapsed-by-default nested
fields (https://docs.stripe.com/api) were confirmed.

## 3. Typography candidates

Tabular figures are the key risk: no fetched page confirmed `tnum` except where noted. Check each in a
specimen test.

| ID | Pairing | Licence and source | Fit | Weakness |
|---|---|---|---|---|
| T1 | IBM Plex Sans + Plex Mono | OFL-1.1, https://github.com/IBM/plex | One family (Sans, Mono, Condensed); reads as engineered and institutional | Tabular figures `NEEDS CLARIFICATION`; recognisably IBM-adjacent |
| T2 | Inter + JetBrains Mono | OFL-1.1 (https://github.com/rsms/inter, https://github.com/JetBrains/JetBrainsMono) | Inter lists tabular numbers and a slashed zero; JetBrains Mono ligatures toggle off, with a no-ligature NL variant | Inter is the near-universal default, so it risks looking generic; `tnum` tag not shown on the page |
| T3 | Source Sans 3 + Source Code Pro | OFL-1.1 (https://github.com/adobe-fonts/source-sans, https://github.com/adobe-fonts/source-code-pro) | Neutral UI sans plus a UI-oriented mono; variable and WOFF2 available | Tabular figures `NEEDS CLARIFICATION` |
| T4 | Public Sans + a mono (pair `NEEDS CLARIFICATION`) | OFL (https://github.com/uswds/public-sans) | Neutral, monospaced numerals; a civic tone suits evidential reading | The repo says it is no longer actively maintained; its site is retired |
| T5 | Atkinson Hyperlegible Next + Atkinson Hyperlegible Mono | Free for commercial use under an EULA (https://www.brailleinstitute.org/freefont/); OFL status `NEEDS CLARIFICATION` | Built to tell similar glyphs apart, which suits SHAs and IDs (0/O, 1/l); variable files exist | Download needs an email and EULA acceptance, so self-hosting terms need review; tabular figures `NEEDS CLARIFICATION` |

## 4. Icon sets

| ID | Set | Licence | Count | Style | React package |
|---|---|---|---|---|---|
| I1 | Lucide | ISC | `NEEDS CLARIFICATION` (per-category counts only) | 24px outline | `lucide-react`, tree-shakable |
| I2 | Tabler | MIT | 6,238 (5,184 outline, 1,054 filled) | 24px grid, 2px stroke, adjustable | `@tabler/icons-react` |
| I3 | Phosphor | MIT | 1,248 | Six weights: thin, light, regular, bold, fill, duotone | `@phosphor-icons/react` |
| I4 | Heroicons | MIT | `NEEDS CLARIFICATION` | 24 outline, 24 solid, 20 solid, 16 solid | `@heroicons/react` |

Sources: https://lucide.dev/icons/, https://github.com/tabler/tabler-icons,
https://github.com/phosphor-icons/homepage, https://github.com/tailwindlabs/heroicons. Material Symbols
not researched.

**Lucide coverage (verified on icon pages or the tags index):** `git-commit-horizontal`, `git-branch`,
`git-merge`, `git-pull-request`, `flask-conical`, `shield`, `bug`, `gavel` (tags: justice, law, court,
judgment), `bot`, `clock`, `check`, `external-link`, `file-code`, `chart-gantt` (as a timeline). `user`,
`x` and `triangle-alert` appeared in its popular list. Per-icon coverage for Tabler, Phosphor and
Heroicons is `NEEDS CLARIFICATION`; Lucide is the only set fully verified for this brief.

## 5. Colour proof points (not final picks)

**K1. GOV.UK functional colours** (https://design-system.service.gov.uk/styles/colour/): text #0b0c0c,
secondary text #484949, border #cecece, link #1a65a6, error #ca3535, success #0f7a52, focus #ffdd00,
brand #1d70b8, light grey #f3f3f3 (closest match, not a named token). Mood: stark and plain, with a
yellow focus ring.

**K2. IBM Carbon** (https://carbondesignsystem.com/elements/color/tokens/): Gray 10 #f4f4f4, Gray 100
#161616, Blue 60 #0f62fe, Red 60 #da1e28, Green 50 #24a148 (`support-success`), Yellow 30 #f1c21b
(`support-warning`), Blue 70 #0043ce (`support-info`); inverse (dark-surface) error #fa4d56, success
#42be65. Mood: engineered neutrals with a single blue.

**K3. Okabe-Ito colour-blind-safe palette** (Okabe and Ito 2008, tabulated at
https://clauswilke.com/dataviz/color-pitfalls.html): orange #E69F00, sky blue #56B4E9, bluish green
#009E73, yellow #F0E442, blue #0072B2, vermilion #D55E00, reddish purple #CC79A7, black #000000. For
categorical marks such as DAG node types.

**Status notes (pass, fail, warn, pending, not built):**
- Always pair colour with a word and a distinct shape or glyph (check, x, triangle, clock, dashed
  outline), following M1.
- Separate states by lightness as well as hue (M8).
- Red and green alone can be indistinguishable under some colour-vision deficiencies (Wilke): prefer
  vermilion #D55E00 and bluish green #009E73 (K3) to a pure red/green pair.
- Render not built as a dashed outline in neutral grey, so absence never reads as failure.
- In dark mode, use lighter inverse variants (Carbon's #fa4d56 and #42be65 are the verified examples)
  and check contrast on the real surface colour; other dark values `NEEDS CLARIFICATION`.
- Never use small coloured areas or thin lines as the only signal (Wilke).

## 6. Accessibility patterns

1. **Real table semantics:** `<th>` and `<td>`, `scope="col"` or `"row"`, a `<caption>` (W3C WAI
   Tables, https://www.w3.org/WAI/tutorials/tables/, WCAG 1.3.1). The requirement ID or SHA column is
   the row header (M4); icon-only row actions are labelled with the row name.
2. **Sticky headers must not hide focus:** WCAG 2.2 SC 2.4.11; fix with CSS scroll padding, technique
   C43 (https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html). Matters at 390px.
3. **Sortable columns:** a default sort; sort state shown in the header, not on hover only (M3, M4); never
   colour alone.
4. **Timelines:** an ordered list or table with real timestamps, not an image; every event states its
   status in words (M1). No dedicated timeline accessibility source found: `NEEDS CLARIFICATION`.
5. **DAG diagrams:** a short description plus a long text equivalent (an adjacency list or table) in a
   `<figure>` with `<figcaption>` (W3C complex images, https://www.w3.org/WAI/tutorials/images/complex/).
   For keyboard navigation, the ARIA APG treegrid pattern
   (https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) covers arrow keys, Home/End and expand/collapse;
   adapting it to a DAG with multiple parents is `NEEDS CLARIFICATION`.
