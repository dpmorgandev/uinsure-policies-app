# Documentation: Requirements

Owner: David. Written: 2026-10-23. Plan nodes: build **F7** (API user guide) and **F8** (UI user guide). Both are
gated by **F6b** (the ui plan is complete).

This file plays the same role for the user guides that `docs/requirements.md` plays for the API. It says what the
two guides must be. Each guide has a spec in `docs/specs/`, and each guide is built from its spec and printed to a
PDF at the repository root.

F7 was the pitch deck. David replaced it on 2026-10-23: "instead create a full documentation and walkthrough for
the API including how to run the tests, and another for a full user guide with screenshots, steps and screen
highlights for the UI … hold this off to be the last tasks."

---

## 1. Deliverables

| Node | Guide | Spec | Source | PDF |
|------|-------|------|--------|-----|
| F7 | API user guide: documentation and walkthrough, including running every test suite | `docs/specs/api-guide.spec.md` | `docs/guides/api/index.html` | `API_UserGuide.pdf` |
| F8 | UI user guide: Docket's explorer and workbench, with screenshots, steps and screen highlights | `docs/specs/ui-guide.spec.md` | `docs/guides/ui/index.html` | `UI_UserGuide.pdf` |
| F7 | Shared format: layout, components, styling and the print pipeline | `docs/specs/guide-format.spec.md` | `docs/guides/assets/` and `docs/guides/print.mjs` | — |

```text
docs/documentation-requirements.md   this file
docs/specs/                          guide-format.spec.md, api-guide.spec.md, ui-guide.spec.md
docs/guides/assets/                  guide.css (Docket tokens + components), fonts, screenshots, diagrams
docs/guides/api/index.html           F7 source
docs/guides/ui/index.html            F8 source
docs/guides/print.mjs                prints a guide to A4 PDF with Playwright's Chromium
API_UserGuide.pdf, UI_UserGuide.pdf  the printed guides, at the root
```

## 2. When they are built

- **Last.** Both guides describe the finished product. F6b holds them until the ui plan is complete: U4, U7, U8,
  U9 and U10 are merged into `main`, and U10's rename (`src/web` to `src/Uinsure.Policies.Web`, `tests/web` to
  `tests/Uinsure.Policies.Web.Tests`) has landed. Every path, command and screenshot in the guides is the final
  one.
- The DAG only resolves dependencies within one plan. F6b is therefore a node owned by David (§6), which he marks
  done when the ui plan is complete. F7 and F8 both depend on F6b.
- F7 runs before F8, in file order. F8 reuses F7's format files.

## 3. Process

We use the method that built the API: **requirements → spec → document → gates**.

1. **This file**, approved by David at the plan PR.
2. **`guide-format.spec.md`**, written first (F7 t1), because both guides are built on it.
3. **One spec per guide.** Each spec opens with its **question bank**: the questions a reader of the guide will
   arrive with. An assessor asks "how do I run this?"; a new developer asks "where does a rule live?"; a user asks
   "how do I cancel a policy?". The question bank is how the spec carries its reasoning. The guide exists to
   answer every question in it.
4. **The guide** is HTML built from its spec, using only the format spec's components, and printed to PDF.
5. **Gates and review** follow the docs sequence in the planning spec. They run on the guide's own checks (§8).

## 4. Learning layout (LRN)

Both guides use one layout, built to teach and not just to be looked things up in.

| ID | Requirement |
|----|-------------|
| LRN-1 | **Cover and front sheet.** The front sheet is one page with the guide's five to seven big ideas, each starting with a bold cue word. |
| LRN-2 | **Each section answers in three layers:** a one-line headline, a short summary (two to four sentences) and an "in depth" layer. A reader can stop at any layer. |
| LRN-3 | **Lists of three, or at most four.** Longer lists are grouped under labels. |
| LRN-4 | **One diagram per big idea**, drawn as inline SVG in Docket's palette. |
| LRN-5 | **Numbered steps for every task.** Each step gives the action, the exact command or click, and **what you should see**, which is either a real captured output or a screenshot. |
| LRN-6 | **Screen highlights.** A screenshot is overlaid with numbered markers, and a key below it explains each numbered region. The marker positions come from the app's own region tags (`data-region` and the screen contract's regions) wherever they exist, so they are measured and never placed by hand. |
| LRN-7 | **"Check your understanding"** ends each section: a two-column table with the question on the left and the answer on the right. |
| LRN-8 | **Comparison tables** for things that get confused, for example the test projects, the run modes and the cancellation outcomes. |
| LRN-9 | **Code references** give a repo-relative `path:line` link and a short extract of 3 to 12 real lines, so a reader can open the code and see the idea in place. |
| LRN-10 | **"Why" callouts** state each design decision as the choice made, the alternative and the reason. |
| LRN-11 | **Troubleshooting:** a closing table of symptom, cause and fix, built from the problems actually met during the build: the trails' findings, and `docs/lessons.md` where it exists. |

## 5. Styling (STY)

| ID | Requirement |
|----|-------------|
| STY-1 | Use Docket's design tokens and type unchanged: the Atkinson Hyperlegible fonts and `tokens.css` from the kit. They are copied into `docs/guides/assets/` and never edited there. |
| STY-2 | Print in the light theme on A4 portrait. Page breaks never split a step, a figure, a "check your understanding" row or a code extract. |
| STY-3 | Components reuse Docket's visual language: rule chips, status colours for callouts, and the mono face for code and commands. |
| STY-4 | Every page carries a running header with the guide title and page numbers. |
| STY-5 | `node docs/guides/print.mjs <guide>` prints the guide with the Playwright Chromium already installed for the web tests. It needs no new dependency. |

## 6. Content: F7, the API user guide (API_UserGuide.pdf)

`api-guide.spec.md` must cover at least the following.

- **What it is:**
  - the brief
  - the four operations and the could-haves
  - the rule IDs and where they are written (`docs/requirements.md`)
  - the assumptions taken where the brief was unclear
- **Run it.** Each of these is given as numbered steps with real output:
  - prerequisites (the .NET SDK version from `global.json`)
  - build
  - run on `http://localhost:5080`
  - health
  - the SQLite and SQL Server provider switch
  - migrations
  - the Visual Studio launch from U9, which starts the API and the web app together
- **Use it, endpoint by endpoint.** For sell, retrieve, cancel (with quote), renew and claims, give:
  - the request and the response
  - every ProblemDetails failure, with its rule ID and status code
  - a worked example from Postman
- **Test it.** Each of these is given as numbered steps with real output:
  - `dotnet test --solution Uinsure.Policies.slnx`, and what each test project proves (Domain, Services, Api,
    Architecture)
  - running a single rule's tests by trait
  - rule coverage
  - the Postman CLI collection run
  - the web test suites (Vitest and Playwright)
  - the harness self-test
  - what pre-commit and pre-push run
- **Understand it:**
  - the four projects and their reference rules
  - the request pipeline
  - where a rule lives, followed from requirement to test to code
  - `TimeProvider` and `Money.Round`
  - persistence
  - logging and health
- **Ship it:** the Bicep and the Azure DevOps pipeline. These are evidence and are never deployed, and the guide
  says why.
- **How it was built**, in one page: outside-in TDD, the plan DAG, the agent loop and the trail. It links to
  Docket for the full story.
- **Troubleshooting** (LRN-11).

## 7. Content: F8, the UI user guide (UI_UserGuide.pdf)

`ui-guide.spec.md` must cover at least the following.

- **What Docket is:** the explorer, which reads the build trail, and the workbench, which drives the API. It also
  covers who each half is for.
- **Run it:**
  - the static build and the dev server
  - running alongside the API
  - Static Web Apps (U9: evidence only, never deployed)
  - the light and dark themes
  - deep links
- **A tour, screen by screen.** Every shipped screen is shown in both halves, explorer and workbench. Each screen
  gets:
  - a screenshot with highlights (LRN-6)
  - what each region shows, and the rule IDs it proves
  - the tasks a user does there, as numbered steps (LRN-5)
  - the code that draws it (LRN-9)
- **Workflows, end to end:**
  - sell a policy, then view it
  - cancel with a quote
  - make a claim
  - renew
  - read a rule's evidence from the requirement to its tests and commits
  - follow a node's walkthrough
  - read a verdict and its findings
  - inspect a request
- **Error and edge states:** the API unreachable, a 4xx answer, a 422 answer, and empty states. Each is shown and
  explained.
- **Accessibility:** keyboard use, themes, and what axe checks.
- **Understand it:**
  - the folder tree after U10
  - the compiler that builds `trace.json`
  - the kit and its tokens
  - the design pipeline from directions to screens, and why screens are contracts
  - how the screens are tested: unit, end-to-end, axe, parity and visual regression
- **Troubleshooting** (LRN-11).

## 8. Acceptance (per guide)

1. The spec opens with a question bank of at least 25 reader questions, grouped by reader: assessor, developer
   and user. Every question is answered in the guide.
2. Every LRN requirement is met.
3. **Receipts, not hand-typed claims.** Every command in the guide was run on the node's branch. Every output,
   count and test number shown is copied from that run, which is recorded in the node's trace. Nothing is typed in
   from memory.
4. Every `path:line` reference resolves at the node's HEAD. A check script lists the links and fails on any that
   don't resolve.
5. Every screenshot is taken from the final app (after U10) and is the right theme and size. The highlight markers
   come from region tags (LRN-6).
6. **The guide is public.** It must contain no local absolute paths, personal emails or private names. The
   pre-commit privacy scan passes on the HTML, the assets and the PDF's text.
7. The PDF prints cleanly: A4, no row split across pages, readable screenshots, and fonts loaded.
8. Pause 2: David follows the QA script `docs/qa/build-F7.md` (or `build-F8.md`), runs the guide's steps himself,
   and signs off.

## 9. Constraints

- The guides only describe. They never change `src/` or `tests/`, and nothing in `src/` or `tests/` references
  `docs/guides/`.
- No new package dependency. Printing reuses the web project's Playwright.
- They stay short enough to be used: about 30 to 40 A4 pages for the API guide and 40 to 50 for the UI guide. The
  front sheet does the summarising.

## 10. Open items

1. Whether the web app's screens carry `data-region` tags for every region the guide needs to highlight is checked
   in `ui-guide.spec.md`. Any region without a tag is highlighted from the screen contract's region map, and the
   gap is listed there.
