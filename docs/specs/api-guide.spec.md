# API guide spec

Spec for `docs/guides/api/index.html` and `API_UserGuide.pdf` (F7, rebuilt as persona journeys by feat-001/N1). Requirements: `docs/documentation-requirements.md` §3, §4 (LRN-1 to LRN-14), §4b, §6, §8. Format: `docs/specs/guide-format.spec.md`.

**Persona journeys (David, 2026-10-25).** The guide follows two personas: a **developer joining** the project, who clones, runs, tests and learns where a rule lives, and a **servicer driving the API directly**, who calls it with Postman and curl and reads each response. Each step names what the user decides and what the API or the repo gives them (LRN-12), and its shot or captured output frames the outcome (LRN-13). The coverage map in §3 lists every §6 item against its step (LRN-14).

**Citations and receipts are from `main`.** The web app, its launch profile (U9) and its test suites are on `main` now, so the guide cites them there (`src/Uinsure.Policies.Web`, `tests/Uinsure.Policies.Web.Tests`, `Uinsure.Policies.slnLaunch`). Every command and count is reprinted from a run on `main` at the node's HEAD (§4). The guide has no "not on this branch" callout and no count carried over from an earlier branch (the earlier 637 tests and 253 requests are replaced by the new run).

## 1. Question bank

The guide exists to answer these. Each has a home step (§3) and a short answer, which the build replaces with the captured, linked one. 30 questions in two persona groups. The assessor questions of the earlier bank are answered on the developer's journey, since the developer joining is the reader who checks the take-home.

### Developer joining

| # | Question | Step | Short answer |
|---|---|---|---|
| DQ1 | What does it do, and does it meet the brief? | DJ1 | Sell, retrieve, cancel (with quote), renew and claims; all MUST, SHOULD and COULD rules, each with an ID in `docs/requirements.md` |
| DQ2 | Where was the brief unclear, and what was assumed? | DJ1 | The assumptions table (`README.md:151`), one interpretation per rule |
| DQ3 | What is deliberately not done, and is it safe to expose? | DJ1 | No auth, pricing or payment processing; the known limits are listed; the security scope names the gaps |
| DQ4 | How do I build and run it in under five minutes? | DJ2 | .NET SDK 10, `dotnet build`, `dotnet run --launch-profile http`; SQLite, no setup |
| DQ5 | How does the database get its schema, and why SQLite locally and SQL Server in Azure? | DJ3 | One EF Core context, provider switched by configuration; `EnsureCreated` on SQLite; migrations for SQL Server; the app never calls `Migrate()` |
| DQ6 | How do I run every test, and what do they prove? | DJ4 | `dotnet test --solution Uinsure.Policies.slnx`; four .NET projects (Domain, Services, Api, Architecture) and the web suites |
| DQ7 | How can I see that each rule has a test, and run one rule's tests? | DJ4 | `[Trait("Rule", id)]`; `RuleCoverageTests` fails on an untested ID; `--filter-trait "Rule=<id>"`; Test Explorer's Traits grouping |
| DQ8 | How is the solution laid out, and who may reference whom? | DJ5 | Domain (BCL only) <- Services <- Persistence, Api; enforced by architecture tests |
| DQ9 | What happens to a request, from socket to database? | DJ5 | Pipeline in `Program.cs`, then controller, service (load, today, domain, save), repository |
| DQ10 | Where does a rule live? How do I follow one from requirement to test to code? | DJ6 | CANCEL-1b followed through `requirements.md`, the traited tests and `RefundCalculator` |
| DQ11 | How is "today" decided, and why can't I use `DateTime.Now`? | DJ6 | `UkCalendar.Today(TimeProvider)` in Europe/London; an analyser bans the rest |
| DQ12 | How is money rounded? | DJ6 | Only `Money.Round`, 2 dp away from zero; an architecture test limits the suppression to that file |
| DQ13 | How do I add a rule or an endpoint? | DJ7 | Requirement row first, then a red test, domain method, catalog entry, controller action |
| DQ14 | What do the git hooks run before I can commit or push? | DJ7 | Pre-commit: privacy scan and build. Pre-push: Release build, full tests, idempotent migration script, harness self-test |
| DQ15 | Was it built test-first, and how can I check? | DJ8 | Outside-in TDD; red, stub, green commits carry a `TDD:` trailer; the trail is in `docs/trace/`, and Docket (UI guide) shows it |
| DQ16 | Is the Azure part real, and which design choices would I be asked to defend? | DJ8 | Evidence only: Bicep and a pipeline validated locally, never deployed, `az` never run; "Why" callouts on terms, layers, a result type, one place for time and money |

### Servicer driving the API

| # | Question | Step | Short answer |
|---|---|---|---|
| SQ1 | How do I try it without writing code? | SJ1, SJ8 | Postman app and Postman CLI collection; the Scalar UI in Development |
| SQ2 | How do I sell a policy? | SJ2 | `POST /policies` with a reference, start date, amount, payment method, policyholders and property |
| SQ3 | How do I look a policy up, and what does its status mean? | SJ3 | `GET /policies/{reference}`; status is derived from today |
| SQ4 | How do I cancel, and how much will I get back? | SJ4 | `POST .../cancellation`; quote first with `GET .../cancellation-quote` |
| SQ5 | How do I record a claim, and what does it do to a refund? | SJ5 | `POST .../claims`; any claim makes later refunds £0 |
| SQ6 | How do I renew, and when can I? | SJ6 | `POST .../renewals` from 30 days before the end date to the end date |
| SQ7 | What does an error look like, and how do I read it? | SJ7 | RFC 9457 body: `type`, `ruleId`, `violations[]`, `traceId` |
| SQ8 | Why did I get 400, 404, 409, 422, 429 or 500? | SJ7 | One status table; the status says what kind of problem it is |
| SQ9 | Why was my duplicate or backdated request refused? | SJ2, SJ7 | SELL-1 is a 409 (case-insensitive); SELL-2 is a 422 (today to today + 60) |
| SQ10 | Which rule decided my refund? | SJ4 | `ruleApplied` on each term: CANCEL-1a, 1b, 1c, COULD-2 or UNPAID-TERM |
| SQ11 | Why do I get several violations at once? | SJ7 | After 400, 404 and 409 (each returned alone), every 422 rule is collected |
| SQ12 | How do I run the whole collection and read the result? | SJ8 | `postman collection run` with the local environment; request and assertion counts |
| SQ13 | What goes wrong when I start, and how do I fix it? | TJ1 | The troubleshooting table: port in use, connection refused, HTTPS rejection, rate limit |
| SQ14 | What does the API give me that I would otherwise build by hand? | SJ2 to SJ7 | Server-side dates and status, refunds per term with the rule that chose them, one error shape, and rate-limit and size guards |

Coverage check for the build: every question's step exists in the guide as an `li.step` id, and the "Check your understanding" tables (LRN-7) restate at least one question per journey.

## 2. Research

### 2.1 What the code does

| Topic | Evidence |
|---|---|
| Six routes on one sealed controller, `[Route("policies")]` | `src/Uinsure.Policies.Api/Controllers/PoliciesController.cs:14` (class at `:15`); sell `:17`, get `:31`, cancel `:38`, quote `:50`, claims `:68`, renew `:83` |
| Rules sit on the aggregate: Sell, QuoteCancellation, Cancel, Renew, RecordClaim | `src/Uinsure.Policies.Domain/Policies/Policy.cs:260`, `:84`, `:110`, `:129`, `:189` |
| Status derived, never stored; current term | `src/Uinsure.Policies.Domain/Policies/Policy.cs:55`, `:52` |
| Refund calculation is pure; `Money.Round` called once | `src/Uinsure.Policies.Domain/Rules/RefundCalculator.cs:12`; `src/Uinsure.Policies.Domain/Common/Money.cs:7` |
| 29 Feb start ends 28 Feb | `src/Uinsure.Policies.Domain/Policies/Term.cs:24` |
| Order in which violations are listed | `src/Uinsure.Policies.Domain/Rules/RuleIds.cs:30` |
| "Today" in Europe/London from `TimeProvider`; service orchestrates | `src/Uinsure.Policies.Services/UkCalendar.cs:7`; `src/Uinsure.Policies.Services/PolicyService.cs:12` |
| SELL-1 checked in the service, returned alone | `src/Uinsure.Policies.Services/PolicyService.cs:14` |
| Provider switch, schema at start-up | `src/Uinsure.Policies.Persistence/PersistenceServiceCollectionExtensions.cs:14`, `:23`, `:37`; Sqlite config `src/Uinsure.Policies.Api/appsettings.Development.json` |
| Unique reference, concurrency token, new `Version` per save, unique-violation to 409 | `src/Uinsure.Policies.Persistence/Configurations/PolicyConfiguration.cs:16`, `:19`; `src/Uinsure.Policies.Persistence/PolicyRepository.cs:45`, `:61` |
| Health: live runs no checks, ready runs the `ready` tag | `src/Uinsure.Policies.Api/Program.cs:126`, `:127`; check registered at `PersistenceServiceCollectionExtensions.cs:31` |
| Pipeline: forwarded headers, exception handler, HTTPS rejection, rate limiter | `src/Uinsure.Policies.Api/Program.cs:83`, `:86`, `:108`, `:36` |
| Strict JSON, body cap 65,536 bytes, unknown query keys rejected | `src/Uinsure.Policies.Api/Program.cs:52`, `:19`; `src/Uinsure.Policies.Api/Filters/RejectUnknownQueryParametersFilter.cs:8` |
| Status, type and title per rule in one place | `src/Uinsure.Policies.Api/Errors/ProblemCatalog.cs:7`; `src/Uinsure.Policies.Api/Errors/ResultExtensions.cs:6`; `src/Uinsure.Policies.Api/Errors/UnexpectedExceptionHandler.cs:10` |
| OpenAPI and Scalar in Development only; App Insights only with a connection string | `src/Uinsure.Policies.Api/Program.cs:121`, `:76` |
| Launch profiles: `https` (7080 and 5080) and `http` (5080) | `src/Uinsure.Policies.Api/Properties/launchSettings.json` |
| Architecture tests: layering, rule coverage | `tests/Uinsure.Policies.Architecture.Tests/LayeringTests.cs:9`; `tests/Uinsure.Policies.Architecture.Tests/RuleCoverageTests.cs:6` |
| A rule test is traited (example) | `tests/Uinsure.Policies.Api.Tests/CancelCoolingOffTests.cs:24` |
| Postman folders: F0b Walking skeleton, F1 Sell, F1b Layered models, F2 Retrieve, F3 Cancel, F4 Renew | `tests/postman/Uinsure.Policies.postman_collection.json:9`, `:71`, `:2319`, `:2660`, `:3528`, `:8552` |
| Hooks | `.githooks/pre-commit`, `.githooks/commit-msg`, `.githooks/pre-push:18-40` |
| Bicep (`main.bicep`, four modules, three `.bicepparam`) and the pipeline | `infrastructure/main.bicep`, `infrastructure/modules/`, `infrastructure/params/`, `infrastructure/pipelines/azure-pipelines.yml` |
| SDK pin | `global.json`: 10.0.100, `rollForward: latestFeature` |

Line numbers above are from the F7 build. The build re-resolves each against `main` at HEAD and corrects the ones that moved; the link check fails on any that do not resolve.

### 2.2 Existing documents to reuse and not contradict

`README.md` (run, assumptions, known limits), `docs/design.md` (endpoints, errors, tests, decisions, security scope), `infrastructure/README.md`, `docs/qa/build-F*.md`. Where the guide repeats a figure from them (test counts, request counts), the figure is re-measured on `main` (§4) and the guide shows the new one.

### 2.3 Material for the troubleshooting table (LRN-11)

From the README and design notes, plus the trail findings:

| Symptom | Cause | Source |
|---|---|---|
| "The filename or extension is too long" in architecture tests | Clone path too long on Windows | `README.md:87` |
| "address already in use" on `dotnet run` | Visual Studio or another run holds port 5080 | `README.md` (Visual Studio section) |
| 400 on `GET /policies/{reference}?reference=X` | A query key named like a route parameter is unknown | `docs/design.md` (Errors) |
| 400 `/problems/https-required` | Plain HTTP outside Development | `Program.cs:108` |
| 429 with `Retry-After` | Rate limit per client IP | `Program.cs:36` |
| Postman fails with connection refused | API not started, or `baseUrl` is not `http://localhost:5080` | `tests/postman/local.postman_environment.json` |
| 422 on a sale that worked yesterday | The start date is now in the past (SELL-2) | `docs/requirements.md` SELL-2 |
| 409 `/problems/concurrency` | Two writes on one policy; retry | `PolicyConfiguration.cs:19` |

`docs/lessons.md` is read for anything met while capturing the receipts.

### 2.4 Gaps, to settle in the build

1. **Screenshots** of Postman and Visual Studio are needed for MAN-1 and MAN-3 (LRN-6). They are captured by hand on David's machine; the red boxes are measured from the pixels of the captured image, since these tools have no region tags. Any that cannot be captured stay as a labelled placeholder figure, never an invented one.
2. **SQL Server provider switch** has no running database here. The guide shows the configuration keys and the migration script output, and states that no test runs against SQL Server (`README.md:194`).

(The earlier gap for the launch profile and the web suites is closed: both are on `main`.)

## 3. Journeys, diagrams and coverage map

### 3.1 Outline

About 32 to 40 pages. Front sheet (LRN-1) with five to seven big ideas, then the two journeys, then troubleshooting. Each step is an `li.step` with the id shown, a decision (`div.decide`), what the API or repo gives (`div.gives`), a captured output or shot that frames the outcome, numbered sub-steps with red boxes and "Step n" labels where a screen is shown (LRN-6), and the three layers (LRN-2). Each journey ends with a "Check your understanding" table (LRN-7). Lists have three or four items (LRN-3).

#### Developer joining

| Step | Title | The user decides | The repo or API gives | Outcome framed |
|---|---|---|---|---|
| DJ1 | What you are joining | Whether the brief is met; which assumptions to accept | The brief, four operations and could-haves, rule IDs and where they live, the assumptions table, what is out of scope | The assumptions table; diagram D1 |
| DJ2 | Get it running | SDK, launch profile (`http`, `https`, Visual Studio with the web app) | `dotnet --version`, build, run on 5080, health live and ready, Scalar and OpenAPI | The health responses and Scalar page |
| DJ3 | Choose a database | SQLite locally, or SQL Server | The two config keys, `EnsureCreated`, the migrations and the idempotent script | The script's line count and the config |
| DJ4 | Prove it works | All tests, one project, one rule; Postman CLI or app (see SJ8); the web suites; the harness self-test | Totals per project, the trait filter run, rule coverage, and what each project proves | The test totals and elapsed times; diagram D6 |
| DJ5 | Follow a request | Which layer to read first | Four projects and their reference rules; the pipeline; logging and health | Diagrams D2 and D3 |
| DJ6 | Follow a rule | CANCEL-1b, or any other | Requirement, traited tests and `RefundCalculator` side by side; `TimeProvider` and `Money.Round` | Extracts with `path:line`; diagram D5 |
| DJ7 | Change it safely | Add a rule or an endpoint | The order of work, what pre-commit and pre-push run | A hook run's output |
| DJ8 | How it was built, and how it would ship | How much to trust the trail | Outside-in TDD, the plan DAG, the agent loop and the trail (one page, linking to Docket); the Bicep modules and the pipeline, and why nothing is deployed | Bicep build output; diagram D7 |

#### Servicer driving the API

| Step | Title | The user decides | The API gives | Outcome framed |
|---|---|---|---|---|
| SJ1 | Make a first call | Postman app, curl or Scalar; the base URL | A healthy API and the Scalar page | `curl` of `/health/ready`; the Postman import |
| SJ2 | Sell a policy | Reference, start date, amount, method, policyholders, property | `201` with `Location`, and the failures SELL-1 and SELL-2 | The request, the 201 body, the 409 and 422 bodies |
| SJ3 | Look it up | Which reference | The policy with derived status and current term | The `GET` response; the 404 |
| SJ4 | Quote, then cancel | The date; whether to go ahead | The refund per term and `ruleApplied`; the cancel result | Quote then cancel responses; diagram D5 (shared with DJ6) |
| SJ5 | Record a claim | The date and description | The claim, and what it does to later refunds | The claim response, then a re-quote at £0 |
| SJ6 | Renew | Whether to renew inside the window | The new term, or RENEW-1 and RENEW-2 outside it | The refusal body; the window arithmetic |
| SJ7 | Read an error | Fix the input, retry or stop | The RFC 9457 body, the status table, the evaluation order, a multi-violation 422 | A multi-violation response; diagram D4 |
| SJ8 | Run the whole collection | App or CLI | Request and assertion counts, elapsed time | The Postman CLI summary; the Collection Runner |

#### Closing

| Step | Title | Content |
|---|---|---|
| TJ1 | Troubleshooting | The §2.3 table plus anything met during the build (LRN-11) |

### 3.2 Diagrams (LRN-4: one per big idea)

Seven diagrams, inline SVG in Docket's palette. D1 to D3 exist; D4 to D7 are the four missing ones.

| Id | Big idea | Shows | Status |
|---|---|---|---|
| D1 | A policy's life | The operations on a policy; status derived from today | exists (figure 1) |
| D2 | Four projects | Who may reference whom | exists (figure 6) |
| D3 | The request pipeline | Forwarded headers to controller, service and repository, in `Program.cs` order | exists (figure 7) |
| D4 | Errors in order | The evaluation order (400, 404, 409, then all 422s) mapped to status | new |
| D5 | Cancellation outcomes | CANCEL-1a, 1b, 1c, COULD-2 and UNPAID-TERM as a decision flow | new |
| D6 | What each test proves | Domain, Services, Api, Architecture and the web suites against what each can catch | new |
| D7 | How it was built | The red, stub, green loop and the trail it leaves | new |

### 3.3 Coverage map (LRN-14)

The map is the fenced block below, read by the check script. Form: one line per feature, `feature-id | requirement ref | step id | feature`, split on ` | ` and trimmed. Lines starting with `#` and blank lines are ignored. A feature-id is a letter and a number (`W` what it is, `R` run, `E` endpoint, `T` test it, `U` understand, `S` ship, `H` how built, `X` troubleshooting). The check fails if a step id is not an `li.step` id in the guide's HTML, if a journey step has no feature line, or if a §6 bullet has no line.

```coverage
# what it is (section 6, bullet 1)
W1 | 6 what | DJ1 | the brief
W2 | 6 what | DJ1 | the four operations and the could-haves
W3 | 6 what | DJ1 | the rule IDs and where they are written
W4 | 6 what | DJ1 | the assumptions taken where the brief was unclear
# run it (bullet 2)
R1 | 6 run | DJ2 | prerequisites: the .NET SDK version from global.json
R2 | 6 run | DJ2 | build
R3 | 6 run | DJ2 | run on http://localhost:5080
R4 | 6 run | DJ2 | health
R5 | 6 run | DJ3 | the SQLite and SQL Server provider switch
R6 | 6 run | DJ3 | migrations
R7 | 6 run | DJ2 | the Visual Studio launch from U9
# use it, endpoint by endpoint (bullet 3): request, response, every failure with rule ID and status, a Postman example
E1 | 6 use | SJ2 | sell
E2 | 6 use | SJ3 | retrieve
E3 | 6 use | SJ4 | cancel, with the quote
E4 | 6 use | SJ6 | renew
E5 | 6 use | SJ5 | claims
E6 | 6 use | SJ7 | every ProblemDetails failure, status table and evaluation order
# test it (bullet 4)
T1 | 6 test | DJ4 | dotnet test, and what each test project proves
T2 | 6 test | DJ4 | a single rule's tests by trait
T3 | 6 test | DJ4 | rule coverage
T4 | 6 test | SJ8 | the Postman CLI collection run
T5 | 6 test | DJ4 | the web test suites (Vitest and Playwright)
T6 | 6 test | DJ4 | the harness self-test
T7 | 6 test | DJ7 | what pre-commit and pre-push run
T8 | 6 test | SJ1 | trying it without code: the Postman app, curl and Scalar (MAN-1)
# understand it (bullet 5)
U1 | 6 understand | DJ5 | the four projects and their reference rules
U2 | 6 understand | DJ5 | the request pipeline
U3 | 6 understand | DJ6 | where a rule lives, from requirement to test to code
U4 | 6 understand | DJ6 | TimeProvider and Money.Round
U5 | 6 understand | DJ3 | persistence
U6 | 6 understand | DJ5 | logging and health
# ship it (bullet 6)
S1 | 6 ship | DJ8 | the Bicep and the Azure DevOps pipeline, evidence only and never deployed, and why
# how it was built (bullet 7)
H1 | 6 how | DJ8 | outside-in TDD, the plan DAG, the agent loop and the trail, linking to Docket
# troubleshooting (bullet 8)
X1 | 6 trouble | TJ1 | troubleshooting table
```

## 4. Receipts plan

The build runs every command on `main` at the node's HEAD and records each in `docs/guides/api/receipts.md` (agents may not write the trace directory), by `docs/guides/api/run-receipts.sh`: the command exactly as run, the date, the exit code and the output pasted from the run. The guide copies from that file only. Required runs:

1. `dotnet --version`, `dotnet build Uinsure.Policies.slnx -warnaserror`
2. API start on 5080, then `curl` on `/health/live`, `/health/ready`, and one request per endpoint and failure class (sell, get, quote, cancel, claim, renew; 400, 404, 409, 422 single and multiple)
3. `dotnet test --solution Uinsure.Policies.slnx`, per project counts and elapsed time
4. `dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=CANCEL-1b"`
5. `postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json`, request count, assertion count and elapsed time
6. `node --test ".claude/hooks/__tests__/*.test.mjs"`
7. `dotnet ef migrations script --idempotent` as the pre-push hook runs it
8. Bicep build, as `infrastructure/README.md` gives it
9. Web suites (`npm --prefix src/Uinsure.Policies.Web run test`), now on `main`

A number that appears in the guide without a matching line in `receipts.md` fails the check. This replaces the earlier receipts file wholesale: the 637 tests, the 253 requests and the 12.3 s are not carried over.

The guide check runs with `node --test docs/guides/api/check.test.mjs`; the coverage check runs beside it.

## 5. Acceptance

1. §1 holds at least 25 questions in two persona groups. Met at 30.
2. Every question's step exists in the guide and answers it; the build maps question to `li.step` id.
3. Every item of `docs/documentation-requirements.md` §6 is a line in the coverage map with a step that exists (LRN-14); MAN-1 to MAN-4 and MAN-7 are covered in full (§4b).
4. Every command shown matches a `receipts.md` entry, and every `path:line` resolves at HEAD (check script, §8.4).
5. Every screenshot frames its outcome (LRN-13) and draws red boxes with "Step n" labels (LRN-6); each diagram of §3.2 is present, one per big idea (LRN-4).
6. The guide has no "not on this branch" callout and no count from before the reprint.
7. The privacy scan passes on the HTML, the assets and the PDF text (no absolute local paths, personal emails or private names; the clone path example is generic).
8. `API_UserGuide.pdf` is printed by `node docs/guides/print.mjs api` from `docs/guides/api/index.html`, A4, 30 to 40 pages, and reprints identically from its HTML.
9. The guide only describes: no change to `src/` or `tests/`.
