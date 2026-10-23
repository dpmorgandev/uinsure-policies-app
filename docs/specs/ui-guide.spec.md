# UI guide spec

Spec for `docs/guides/ui/index.html` and `UI_UserGuide.pdf` (F8). Requirements: `docs/documentation-requirements.md` §3, §4, §4b, §5, §7, §8, §9, §10. Format: `docs/specs/guide-format.spec.md`.

**Short form.** On 2026-10-23 David cut F8 to a short form for time. This spec and the guide keep every section of §7 but shorten the ones listed in §6. Paths are post-U10 (`src/Uinsure.Policies.Web`, `tests/Uinsure.Policies.Web.Tests`) and resolve on `feature/ui/U10`, and on `main` once ui merges. The F8 branch has no web app yet.

## 1. Question bank

The guide answers each of these. "In" is the guide section (§3 numbers). 27 questions.

### Assessor (reviewing the take-home)

| # | Question | In | Short answer |
|---|---|---|---|
| A1 | What is Docket, and why is there a UI at all? | 1 | Two halves in one app: the explorer reads the build trail, the workbench drives the API |
| A2 | How do I see it running in five minutes? | 2 | Build the static app, preview it with the API's port behind `/api` |
| A3 | Which screens are there? | 3, 4 | Eighteen explorer screens and seven workbench screens, each shown with a screenshot |
| A4 | How do I check a rule's evidence from the UI? | 5 | Rule page: requirement, tests, commits, verdicts |
| A5 | Can I see that the build was test-first? | 5 | Node walkthrough, loop and commit pages show the red, stub and green commits |
| A6 | How are the screens tested? | 8 | Vitest, Playwright end-to-end, axe, parity with the screen contracts, visual regression |
| A7 | Is the web part deployed? | 2 | No. Static Web Apps evidence only, never deployed |
| A8 | Does it work in both themes and with a keyboard? | 7 | Light, dark, system; axe runs on every screen |
| A9 | What was left out? | front | The short-form list in §6 |

### Developer (joining the code)

| # | Question | In | Short answer |
|---|---|---|---|
| D1 | How is the web project laid out? | 9 | `app/` (explorer, workbench, shell, data), `kit/`, `compiler/`, `public/` |
| D2 | How does `trace.json` get made? | 9 | `compiler/` reads git and the trail files; `npm run trace` |
| D3 | What is the kit and what are the tokens? | 9 | Components and `tokens.css`; the same tokens style this guide |
| D4 | Why are screens "contracts, not code"? | 9 | Static HTML screens in `docs/ui/screens` are agreed first; the app is tested for parity against them |
| D5 | Which code draws a given screen? | 3, 4 | Each screen section gives a `path:line` link |
| D6 | What is a region tag? | 3 | `data-region` and `data-req` on each section; tests and this guide's markers read them |
| D7 | How do I run the unit tests, one spec, or the visual suite? | 8 | `npm run test`, `npx playwright test <file> -g <text>`, the regression folder |
| D8 | How does the app reach the API? | 2 | Same-origin `/api` proxy; `DOCKET_API_PORT` sets the target |
| D9 | How do I update a visual baseline? | 8 | Deliberately, with `--update-snapshots`, never to make a failure go away |

### User (using Docket)

| # | Question | In | Short answer |
|---|---|---|---|
| U1 | How do I sell a policy and then look at it? | 5 | Workbench, Sell a policy, then Open policy |
| U2 | How do I cancel, and see what I will get back? | 5 | Quote a date, then cancel on that date and confirm |
| U3 | How do I make a claim? | 5 | Record a claim: date and description; refund before and after |
| U4 | How do I renew? | 5 | Renew policy; the API refuses outside the 30-day window (RENEW-1, RENEW-2) |
| U5 | How do I read a rule's evidence, a node's walkthrough, a verdict? | 5 | Rule page; node, walkthrough; verdict and findings pages |
| U6 | What does an error look like? | 6 | Problem banner with status, rule id and each violation |
| U7 | What if the API is down? | 6 | The page says the request got no answer; nothing is invented |
| U8 | How do I inspect a request I sent? | 5 | Requests page: log, one exchange, a curl |
| U9 | How do I link to a screen, and switch theme? | 2 | Hash URLs such as `#/rules/CANCEL-1b`; theme toggle in the header |

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

`capture.mjs` measures every `[data-region]` box. All 25 screens carry tags. Regions that **have no tag**, so are not marked:

- the shell: header, jump-to-search, theme toggle, primary nav, footer
- the cancel confirmation dialog (`wb-cancel-confirm`)
- the requests drawer
- the problem banner inside a screen (it sits in the screen's first tagged region)

## 3. Outline

1. What Docket is. 2. Run it. 3. Explorer tour. 4. Workbench tour. 5. Workflows. 6. Error and edge states. 7. Accessibility. 8. Run the tests yourself (MAN-1, 5, 6, 7). 9. Understand it. 10. Troubleshooting.

## 4. Acceptance

1. 27 questions above, each answered in the guide.
2. Each screen has a screenshot, numbered markers from region tags, a key, numbered steps and one code link.
3. Commands that were run show their real output (the Postman CLI run). Commands not run are shown without output and marked.
4. No absolute path, e-mail or private name in the HTML, the shots, the manifest or the PDF.

## 5. Gaps

The renew success path (needs a policy inside its window), a Visual Studio screenshot, Playwright UI mode and trace viewer screenshots: not captured.

## 6. Short form (David, 2026-10-23)

Nothing in §7 is dropped (David, amendment): every screen, workflow, error state and topic is covered, with shortened depth. Not run in this form: Playwright, Vitest and Visual Studio (commands shown, marked not run); one real Postman CLI run is shown.
