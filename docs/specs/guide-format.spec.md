# Guide format spec

Shared by F7 (API guide) and F8 (UI guide). Requirements: `docs/documentation-requirements.md` §4 (LRN), §4b (MAN), §5 (STY).

## Files

| Path | Role |
|---|---|
| `docs/guides/assets/tokens.css` | Docket's tokens, copied unedited from `origin/ui:src/web/kit/tokens/tokens.css` (STY-1) |
| `docs/guides/assets/fonts/` | Five Atkinson Hyperlegible latin woff2 files, copied unedited from `origin/ui:docs/ui/stylekit/fonts/`: Next 400, 600, 700 and Mono 400, 700. Renamed to `next-<weight>.woff2` and `mono-<weight>.woff2` only |
| `docs/guides/assets/guide.css` | Imports the tokens, declares the fonts, defines the components below |
| `docs/guides/template.html` | One example of every component, with a comment naming the LRN id it serves |
| `docs/guides/test/index.html` | The template as a test page; `node docs/guides/print.mjs test` proves the pipeline |
| `docs/guides/print.mjs` | Prints `docs/guides/<guide>/index.html` to A4 PDF |

Guide sources use only the classes in `guide.css`. No inline styles except the `left` and `top` percentages of a marker.

## Components

| Component | Markup | Serves |
|---|---|---|
| Cover, front sheet | `section.cover`, `section.front > ol > li > strong` | LRN-1 |
| Three layers | `p.headline`, `p.summary`, `details.depth` | LRN-2 |
| Diagram | `figure > svg` using the CSS variables for colour | LRN-4 |
| Steps | `ol.steps > li.step`, with `div.see` and `pre.output` for the captured result | LRN-5 |
| Screenshot with markers | `figure > div.shot > img + span.marker`; `left` and `top` are percentages measured from region tags | LRN-6 |
| Check your understanding | `table.check` | LRN-7 |
| Comparison table | `table` | LRN-8 |
| Code reference | `div.extract > a.ref` (text `path:line`; `href` is relative to the guide's folder and carries the line as a fragment, for example `../../../src/X.cs#L13`) and `pre` of 3 to 12 real lines | LRN-9 |
| Why callout | `div.callout` with `span.label` "Why": choice, alternative, reason | LRN-10 |
| Troubleshooting | closing `table`: symptom, cause, fix | LRN-11 |
| Rule chip, status callouts | `span.chip`, `div.callout.warn`, `.error`, `.ok` | STY-3 |

Lists have three items, or four at most (LRN-3); longer ones are grouped under labels.

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
2. `src/Uinsure.Policies.Web/node_modules/playwright` (the name after the ui plan's U10 rename)
3. `src/web/node_modules/playwright` (this branch's layout)

If none exists it exits with code 2 and says to run `npm --prefix src/web ci` (`src/Uinsure.Policies.Web` after U10). Chromium must be installed (`npx playwright install chromium`).

## Proof

On the F7 branch the test page was printed with `PLAYWRIGHT_MODULE` pointing at another worktree's installed Playwright. The PDF has four A4 pages, and embeds Atkinson Hyperlegible Next (Regular, SemiBold, Bold) and Mono. The test PDF is not committed.

## Acceptance

1. `node docs/guides/print.mjs test` exits 0 and writes the PDF.
2. The PDF embeds the Atkinson fonts and shows the running header and page numbers.
3. `tokens.css` and the fonts are byte-identical to their `origin/ui` sources.
