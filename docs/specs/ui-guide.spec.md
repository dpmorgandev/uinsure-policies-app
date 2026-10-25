# UI guide spec

Spec for `docs/guides/ui/index.html` and `UI_UserGuide.pdf` (F8, rebuilt as persona journeys by feat-001/N1). Requirements: `docs/documentation-requirements.md` §3, §4 (LRN-1 to LRN-14), §4b, §5, §7, §8, §9, §10. Format: `docs/specs/guide-format.spec.md`.

**Persona journeys (David, 2026-10-25).** The guide is no longer a feature list with one screenshot per screen. It follows two personas through Docket: a **policy servicer** who works in the workbench, and an **assessor** who works in the explorer. Each step names what the user decides and what Docket gives back (LRN-12), and its shot frames the outcome (LRN-13). The short form of 2026-10-23 is lifted: nothing in §7 is shortened, and the coverage map in §3 proves it (LRN-14). Paths are `src/Uinsure.Policies.Web` and `tests/Uinsure.Policies.Web.Tests`, on `main`.

## 1. Question bank

The guide answers each of these. "Step" is the journey step (§3) that answers it. 29 questions in two persona groups. The developer questions of the earlier bank sit with the assessor, in the journey's last part, "Behind the screens".

### Policy servicer (workbench)

| # | Question | Step | Short answer |
|---|---|---|---|
| SQ1 | How do I start Docket next to the API, and how does it reach it? | SJ1 | Build and preview the static app; `/api` is proxied to the API, and `DOCKET_API_PORT` sets the target |
| SQ2 | How do I sell a policy and then look at it? | SJ2, SJ3 | Workbench, Sell a policy, then Open policy; the policy page shows status, term and payments |
| SQ3 | How do I cancel, and see what I will get back? | SJ4 | Quote a date, then cancel on that date and confirm; the refund per term is shown |
| SQ4 | How do I make a claim, and what does it do to a refund? | SJ5 | Record a claim: date and description; refund before and after |
| SQ5 | How do I renew, and when am I allowed to? | SJ6 | Renew policy; the API refuses outside the 30-day window (RENEW-1, RENEW-2) |
| SQ6 | How do I inspect a request I sent? | SJ7 | Requests page: log, one exchange, a curl |
| SQ7 | What does an error look like? | SJ8 | Problem banner with status, rule id and each violation |
| SQ8 | What if the API is down, or the page does not exist? | SJ8 | The page says the request got no answer; nothing is invented; not-found has a way home |
| SQ9 | How do I link to a screen, and switch theme? | SJ9 | Hash URLs such as `#/rules/CANCEL-1b`; theme toggle in the header |
| SQ10 | What does Docket give me that curl or Postman does not? | SJ2 to SJ7 | Forms that validate as you go, the refund shown before you commit, every call logged with a curl, and the rule behind each refusal one click away |

### Assessor (explorer, and what stands behind it)

| # | Question | Step | Short answer |
|---|---|---|---|
| AQ1 | What is Docket, and why is there a UI at all? | AJ1 | Two halves in one app: the explorer reads the build trail, the workbench drives the API |
| AQ2 | How do I see it running in five minutes? | AJ1 | Build the static app, preview it with the API's port behind `/api` |
| AQ3 | Is every rule evidenced? | AJ2 | The matrix: rule against requirement, tests and commits |
| AQ4 | How do I check a rule's evidence from the UI? | AJ3 | Rule page: requirement, tests, commits, verdicts |
| AQ5 | Can I see that the build was test-first? | AJ4 | Node walkthrough, loop and commit pages show the red, stub and green commits |
| AQ6 | How do I read a verdict and its findings? | AJ5 | Verdict and finding pages |
| AQ7 | What was the wider story: sessions, harness, decisions, numbers? | AJ6 | The sessions, harness, decisions and stats screens |
| AQ8 | Is the web part deployed? | AJ1 | No. Static Web Apps evidence only, never deployed |
| AQ9 | Which screens are there? | AJ1 to AJ6, SJ1 to SJ8 | Every screen folder in `docs/ui/screens`, each on a journey step with a screenshot |
| AQ10 | How is the web project laid out? | AJ7 | `app/` (explorer, workbench, shell, data), `kit/`, `compiler/`, `public/` |
| AQ11 | How does `trace.json` get made? | AJ7 | `compiler/` reads git and the trail files; `npm run trace` |
| AQ12 | What is the kit and what are the tokens? | AJ7 | Components and `tokens.css`; the same tokens style this guide |
| AQ13 | Why are screens "contracts, not code"? | AJ7 | Static HTML screens in `docs/ui/screens` are agreed first; the app is tested for parity against them |
| AQ14 | Which code draws a given screen? | AJ1 to AJ6, SJ1 to SJ8 | Each screen's step gives a `path:line` link |
| AQ15 | What is a region tag? | AJ7 | `data-region` and `data-req` on each section; tests and this guide's red boxes read them |
| AQ16 | How are the screens tested, and how do I run one spec or the visual suite? | AJ7 | Vitest, Playwright end-to-end, axe, parity, visual regression; `npm run test`, `npx playwright test <file> -g <text>` |
| AQ17 | How do I update a visual baseline? | AJ7 | Deliberately, with `--update-snapshots`, never to make a failure go away |
| AQ18 | Does it work in both themes and with a keyboard? | AJ8 | Light, dark, system; axe runs on every screen |
| AQ19 | What does the explorer give me that reading the git log does not? | AJ2 to AJ6 | Each rule joined to its requirement, tests, commits and verdicts, so one click replaces a search |

## 2. Research

Cited files only (`path:line` is the line of the component's export).

| Topic | Source |
|---|---|
| Routes (hash routing) | `src/Uinsure.Policies.Web/app/shell/App.tsx:14` |
| Shell, header, theme toggle, search | `src/Uinsure.Policies.Web/app/shell/Frame.tsx:56` |
| Explorer screens | `app/explorer/overview/Overview.tsx:134`, `about/About.tsx:156`, `matrix/Matrix.tsx:152`, `rule/Rule.tsx:309`, `plan/Plan.tsx:32`, `node/Node.tsx:27`, `walkthrough/Walkthrough.tsx:43`, `commit/Commit.tsx:83`, `loop/Loop.tsx:63`, `activity/Activity.tsx:123`, `verdict/Verdict.tsx:182`, `finding/Finding.tsx:124`, `sessions/Sessions.tsx:52`, `harness/Harness.tsx:30`, `decisions/Decisions.tsx:42`, `stats/Stats.tsx:161` |
| Workbench screens | `app/workbench/home/WorkbenchHome.tsx:32`, `sell/SellPolicy.tsx:129`, `policy/PolicyView.tsx:325`, `cancel/CancelPolicy.tsx:64`, `claim/RecordClaim.tsx:84`, `renew/RenewPolicy.tsx:61`, `requests/RequestLogPage.tsx:23` |
| Not found | `app/shell/NotFound.tsx:9` |
| Region tags | `app/shell/Rung.tsx:19` (explorer), `app/workbench/home/WorkbenchHome.tsx:60` (workbench) |
| Scripts | `src/Uinsure.Policies.Web/package.json:6` |
| Launch (U9) | `Uinsure.Policies.slnLaunch:1` |
| Playwright config | `src/Uinsure.Policies.Web/playwright.config.ts:1` |

Facts taken from the running app (U10): the static build is served by `vite preview`, and `/api` is proxied to the API. A new policy cannot be renewed on the real clock (the window opens 30 days before the end date, a year out), so the renew shot is the API's RENEW-1 and RENEW-2 refusal.

### 2.1 Region-tag audit (§10.1)

`capture.mjs` measures every `[data-region]` box. All screens carry tags. Regions that **have no tag**, so cannot take a red box from a tag:

- the shell: header, jump-to-search, theme toggle, primary nav, footer
- the cancel confirmation dialog (`wb-cancel-confirm`)
- the requests drawer
- the problem banner inside a screen (it sits in the screen's first tagged region)

For these, `capture.mjs` boxes the nearest tagged ancestor, or measures the element by its accessible name; it never places a box by eye (guide-format spec).

## 3. Journeys and coverage map

### 3.1 Outline

Front sheet (LRN-1), then the two journeys, then troubleshooting. Each step is one `li.step` with the id shown, the decision (`div.decide`), what Docket gives (`div.gives`), the shot that frames the outcome, numbered sub-steps with red boxes and "Step n" labels (LRN-6), and one `path:line` link. Each journey ends with a "Check your understanding" table (LRN-7).

#### Policy servicer: the workbench

| Step | Title | The user decides | Docket gives | Outcome the shot frames |
|---|---|---|---|---|
| SJ1 | Open the workbench | Build and preview, or the dev server; which API port | The workbench home with the API reachable; the run modes side by side | Home page with its API status |
| SJ2 | Sell a policy | Reference, start date, payer, policyholders, property | Field-level validation, then the new policy's reference | The sell form submitted and the 201 result at the page end |
| SJ3 | Read the policy | Which policy to open | Status, current term, payments and the actions available | The whole policy page, down to its last section |
| SJ4 | Quote a cancellation, then cancel | The date to quote; whether to confirm | The refund per term and the rule that decided it (CANCEL-1a to 1c, UNPAID-TERM); a confirm dialog | The quote result, then the cancelled policy |
| SJ5 | Record a claim | The date and description | The refund before and after the claim (COULD-2) | The claim form and the changed refund |
| SJ6 | Renew | Whether to renew now | The window and the API's refusal (RENEW-1, RENEW-2) outside it; the success path is a gap (§5) | The refusal banner with its rule ids |
| SJ7 | Inspect what you sent | Which exchange to open | The request log, one exchange and a curl to repeat it | The exchange with status, body and curl |
| SJ8 | When it goes wrong | Whether to fix the input, retry or stop | A problem banner with status, rule id and each violation; "no answer" when the API is down; not-found; empty states | A 422 banner, the no-answer page, an empty state |
| SJ9 | Make it yours | Theme; a link to share | Light, dark and system themes; hash deep links | The same screen in both themes |

#### Assessor: the explorer

| Step | Title | The user decides | Docket gives | Outcome the shot frames |
|---|---|---|---|---|
| AJ1 | What Docket is and where to start | Which half is for them; run or read | The overview, the about page, who each half is for, and the deployment evidence (Static Web Apps, never deployed) | The overview with the counts |
| AJ2 | Is every rule evidenced? | Which rule to look at | The matrix of rules against requirement, tests and commits | The matrix to its last row |
| AJ3 | Follow one rule | CANCEL-1b, or any other | The rule page from requirement to tests and commits, then a commit | The rule page end and a commit page |
| AJ4 | Was it built test-first? | Which node to walk | The plan picture, the node, its walkthrough, loop and activity: red, stub and green in order | The plan picture and the walkthrough end |
| AJ5 | Read a verdict and its findings | Whether a node passed | The verdict, each finding and the commit that fixed it | A verdict with a finding opened |
| AJ6 | The wider story | What to read next | Sessions, harness, decisions and stats screens | Each screen at its end |
| AJ7 | Behind the screens | How deep to go | The folder tree, the compiler and `trace.json`, the kit and tokens, the design pipeline and screen contracts, and the five kinds of test | The folder tree and a test run's result |
| AJ8 | Accessibility | Keyboard or pointer; theme | Keyboard paths, themes and what axe checks | A focused element in each theme |

#### Closing

| Step | Title | Content |
|---|---|---|
| TJ1 | Troubleshooting | Symptom, cause, fix, from the trail's findings and `docs/lessons.md` (LRN-11) |

### 3.2 Coverage map (LRN-14)

The map is the fenced block below, read by the check script. Form: one line per feature, `feature-id | requirement ref | step id | feature`, split on ` | ` and trimmed. Lines starting with `#` and blank lines are ignored. A feature-id is a letter and a number (`W` what it is, `R` run, `F` workflow, `E` error and edge, `Y` accessibility, `U` understand, `X` troubleshooting) or `T-<screen folder>` for the tour. The check fails if a step id is not an `li.step` id in the guide's HTML, if a journey step has no feature line, if a screen folder under `docs/ui/screens` (not starting with `_`) has no `T-` line, or if a §7 bullet has no line.

```coverage
# what Docket is (section 7, bullet 1)
W1 | 7 what | AJ1 | the explorer, which reads the build trail
W2 | 7 what | SJ1 | the workbench, which drives the API
W3 | 7 what | AJ1 | who each half is for
# run it (bullet 2)
R1 | 7 run | SJ1 | the static build
R2 | 7 run | SJ1 | the dev server
R3 | 7 run | SJ1 | running alongside the API
R4 | 7 run | AJ1 | Static Web Apps (evidence only, never deployed)
R5 | 7 run | SJ9 | the light and dark themes
R6 | 7 run | SJ9 | deep links
# a tour, screen by screen (bullet 3): each screen's step gives its shot, regions and rule ids, tasks, and code link
T-overview | 7 tour | AJ1 | explorer overview
T-about | 7 tour | AJ1 | explorer about
T-matrix | 7 tour | AJ2 | rule matrix
T-rule | 7 tour | AJ3 | rule page
T-commit | 7 tour | AJ3 | commit page
T-plan | 7 tour | AJ4 | plan picture
T-node | 7 tour | AJ4 | node page
T-walkthrough | 7 tour | AJ4 | node walkthrough
T-loop | 7 tour | AJ4 | loop page
T-activity | 7 tour | AJ4 | node activity
T-verdict | 7 tour | AJ5 | verdict page
T-finding | 7 tour | AJ5 | finding page
T-sessions | 7 tour | AJ6 | sessions
T-harness | 7 tour | AJ6 | harness
T-decisions | 7 tour | AJ6 | decisions
T-stats | 7 tour | AJ6 | stats
T-not-found | 7 tour | SJ8 | not found
T-wb-home | 7 tour | SJ1 | workbench home
T-wb-sell | 7 tour | SJ2 | sell a policy
T-wb-policy | 7 tour | SJ3 | policy view
T-wb-cancel | 7 tour | SJ4 | cancel a policy
T-wb-claim | 7 tour | SJ5 | record a claim
T-wb-renew | 7 tour | SJ6 | renew a policy
T-wb-requests | 7 tour | SJ7 | request log
# workflows, end to end (bullet 4)
F1 | 7 workflow | SJ2 | sell a policy, then view it (continues at SJ3)
F2 | 7 workflow | SJ4 | cancel with a quote
F3 | 7 workflow | SJ5 | make a claim
F4 | 7 workflow | SJ6 | renew
F5 | 7 workflow | AJ3 | read a rule's evidence from requirement to tests and commits
F6 | 7 workflow | AJ4 | follow a node's walkthrough
F7 | 7 workflow | AJ5 | read a verdict and its findings
F8 | 7 workflow | SJ7 | inspect a request
# error and edge states (bullet 5)
E1 | 7 error | SJ8 | the API unreachable
E2 | 7 error | SJ8 | a 4xx answer
E3 | 7 error | SJ8 | a 422 answer
E4 | 7 error | SJ8 | empty states
# accessibility (bullet 6)
Y1 | 7 access | AJ8 | keyboard use
Y2 | 7 access | AJ8 | themes
Y3 | 7 access | AJ8 | what axe checks
# understand it (bullet 7)
U1 | 7 understand | AJ7 | the folder tree after U10
U2 | 7 understand | AJ7 | the compiler that builds trace.json
U3 | 7 understand | AJ7 | the kit and its tokens
U4 | 7 understand | AJ7 | the design pipeline, and why screens are contracts
U5 | 7 understand | AJ7 | how the screens are tested: unit, end-to-end, axe, parity, visual regression
# troubleshooting (bullet 8)
X1 | 7 trouble | TJ1 | troubleshooting table
```

The check script also lists the folders of `docs/ui/screens` and fails on one with no `T-` line. The earlier spec counted eighteen explorer and seven workbench screens; the folders now number seventeen explorer (including not-found) and seven workbench. If the folders differ from the lines above, the map is corrected, not the check.

## 4. Acceptance

1. 29 questions above, each answered at its journey step.
2. Each screen has a screenshot that frames its outcome (LRN-13), red boxes with "Step n" labels from region tags (LRN-6), numbered steps whose n matches, and one code link. No step's only shot is the top of the page unless the outcome is there.
3. Every step names what the user decides and what Docket gives (LRN-12), and every §7 feature is a line in the coverage map with a step that exists (LRN-14); the check script passes.
4. Commands that were run show their real output (the Postman CLI run, Vitest, Playwright). Commands not run are shown without output and marked.
5. No absolute path, e-mail or private name in the HTML, the shots, the manifest or the PDF.

## 5. Gaps

The renew success path (needs a policy inside its window), a Visual Studio screenshot, Playwright UI mode and trace viewer screenshots: not captured. The matrix screen's Step 3 re-sign is deferred to its own plan (feat-001, Out).

## 6. Short form lifted (feat-001, 2026-10-25)

The 2026-10-23 short form no longer applies: depth is full for every item of §7. Commands that cannot be run on the reprint machine (Visual Studio) are shown without output and marked; Playwright and Vitest are run and their output shown.
