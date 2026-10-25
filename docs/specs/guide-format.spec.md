# Guide format spec

Shared by F7 (API guide) and F8 (UI guide). Requirements: `docs/documentation-requirements.md` §4 (LRN, with LRN-6 amended and LRN-12 to LRN-14 added by feat-001), §4b (MAN), §5 (STY).

## Files

| Path | Role |
|---|---|
| `docs/guides/assets/tokens.css` | Docket's tokens, copied unedited from `src/Uinsure.Policies.Web/kit/tokens/tokens.css` (STY-1) |
| `docs/guides/assets/fonts/` | Five Atkinson Hyperlegible latin woff2 files, copied unedited from `origin/ui:docs/ui/stylekit/fonts/`: Next 400, 600, 700 and Mono 400, 700. Renamed to `next-<weight>.woff2` and `mono-<weight>.woff2` only |
| `docs/guides/assets/guide.css` | Imports the tokens, declares the fonts, defines the components below |
| `docs/guides/template.html` | One example of every component, with a comment naming the LRN id it serves |
| `docs/guides/test/index.html` | The template as a test page; `node docs/guides/print.mjs test` proves the pipeline |
| `docs/guides/print.mjs` | Prints `docs/guides/<guide>/index.html` to A4 PDF |

Guide sources use only the classes in `guide.css`. No inline styles except the `left`, `top`, `width` and `height` percentages of a red box and the `left` and `top` percentages of its label.

## Components

| Component | Markup | Serves |
|---|---|---|
| Cover, front sheet | `section.cover`, `section.front > ol > li > strong` | LRN-1 |
| Three layers | `p.headline`, `p.summary`, `details.depth` | LRN-2 |
| Diagram | `figure > svg` using the CSS variables for colour | LRN-4 |
| Steps | `ol.steps > li.step#<id>`, with `div.decide` (what the user decides), `div.gives` (what Docket or the API gives them), `div.see` and `pre.output` for the captured result | LRN-5, LRN-12 |
| Persona journey | `section.journey > h2 + p.summary + ol.steps`; one per persona | LRN-12 |
| Grouped journey | `section.journey.grouped > h3 + ol.steps`, repeated. A journey of more than four steps puts its steps in groups of four or fewer under `h3` labels (LRN-3). The step id (`DJ5`) numbers each step, so a grouped journey draws no counter circle. A step's own sub-sections are `h4`, and its numbered tasks are `ol.run` | LRN-3, LRN-12 |
| Screenshot with red boxes | `figure > div.shot > img + span.box + span.boxlabel`, one `span.box` and `span.boxlabel` pair per step the shot serves. `span.box` is a red outline drawn round the element the step drives from; `span.boxlabel` is the text "Step n" beside it. `left`, `top`, `width` and `height` of the box are percentages of the image, measured from the element's `[data-region]` rectangle; the label's `left` and `top` are derived from the box (above it, or below it when the box touches the top edge). A shot that frames a result (LRN-13) has no box on the result, which is not a step's start | LRN-6, LRN-13 |
| Check your understanding | `table.check` | LRN-7 |
| Comparison table | `table` | LRN-8 |
| Code reference | `div.extract > a.ref` (text `path:line`; `href` is relative to the guide's folder and carries the line as a fragment, for example `../../../src/X.cs#L13`) and `pre` of 3 to 12 real lines | LRN-9 |
| Why callout | `div.callout` with `span.label` "Why": choice, alternative, reason | LRN-10 |
| Troubleshooting | closing `table`: symptom, cause, fix | LRN-11 |
| Rule chip, status callouts | `span.chip`, `div.callout.warn`, `.error`, `.ok` | STY-3 |

### Red box and "Step n" label (LRN-6, amended)

- No numbered circle, no `span.marker`. The red box is the only highlight, drawn in the guide's error red from `tokens.css`, 3 px, with no fill so the element stays readable.
- The label reads exactly `Step n`, where n is the step's number in its journey. The step text under the shot names the same n ("Step 2: type the reference in the box"). A shot that serves several steps carries several box and label pairs, each with its own n, in step order.
- Positions come from region tags: `capture.mjs` reads the `[data-region]` rectangle (or the element inside it that the step names) and writes percentages into the manifest. Where a tool has no region tags (Postman, Visual Studio), the box is measured from the captured pixels, never placed by eye.
- Every `span.box` has one `span.boxlabel`, and every label's n appears in the step list beneath the same figure. The guide check fails on a box with no label, a label with no step, or an n that does not match.

Lists have three items, or four at most (LRN-3); longer ones are grouped under labels.

## Journeys and the coverage map (LRN-12, LRN-14)

A guide is the journeys of its personas, one `section.journey` per persona, each a list of `ol.steps` steps. A step has an id of the form `<persona letter>J<n>` (for example `SJ3`), set as the `id` of its `li.step`. Each step says what the user decides (`div.decide`) and what Docket or the API gives them (`div.gives`), then shows the shot that frames its outcome (LRN-13).

The coverage map lives in the guide's spec, as one fenced block with the info string `coverage`. Each non-blank line not starting with `#` is `feature-id | requirement ref | step id | feature`, split on ` | ` and trimmed. The check script (under `docs/guides/`, run beside `docs/guides/api/check.test.mjs`) fails on a feature whose step id is not a step in the guide's HTML, on a step with no feature, and on a §6 or §7 item with no line.

## Print pipeline

`node docs/guides/print.mjs <api|ui|test>`

- Output: `api` gives `API_UserGuide.pdf`, `ui` gives `UI_UserGuide.pdf` (both at the root), `test` gives `docs/guides/test/test.pdf`.
- A4 portrait, light theme, backgrounds printed, margins 22 mm top, 18 mm bottom, 16 mm sides (STY-2).
- The running header is the page `<title>`; the footer is "Page n of N" (STY-4).
- Page breaks: `break-inside: avoid` on `.step`, `figure`, `.extract`, `.callout`, table rows and the cover.
- Fonts are awaited with `document.fonts.ready` before printing.

### Dependency: Playwright

No new package. `print.mjs` uses the Playwright already installed for the web tests, and looks for the `playwright` package directory in this order:

1. `PLAYWRIGHT_MODULE` (path to the package directory, relative or absolute)
2. `src/Uinsure.Policies.Web/node_modules/playwright`

If neither exists it exits with code 2 and says to run `npm --prefix src/Uinsure.Policies.Web ci`. Chromium must be installed (`npx playwright install chromium`).

## Proof

On the F7 branch the test page was printed with `PLAYWRIGHT_MODULE` pointing at another worktree's installed Playwright. The PDF has four A4 pages, and embeds Atkinson Hyperlegible Next (Regular, SemiBold, Bold) and Mono. The test PDF is not committed.

## Acceptance

1. `node docs/guides/print.mjs test` exits 0 and writes the PDF.
2. The PDF embeds the Atkinson fonts and shows the running header and page numbers.
3. `tokens.css` and the fonts are byte-identical to their `origin/ui` sources.
