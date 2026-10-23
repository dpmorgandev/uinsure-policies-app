# API guide spec

Spec for `docs/guides/api/index.html` and `API_UserGuide.pdf` (F7). Requirements: `docs/documentation-requirements.md` §3, §4, §4b, §6, §8. Format: `docs/specs/guide-format.spec.md`.

Citations are `path:line` at the F7 branch (main for the API). The web app is not on this branch. Its paths, its launch profile (U9) and its test suites are taken after the ui plan lands, using the post-U10 names `src/Uinsure.Policies.Web` and `tests/Uinsure.Policies.Web.Tests`.

## 1. Question bank

The guide exists to answer these. Each has a home section (§3 numbers) and a short answer, which t3 replaces with the captured, linked one. 30 questions.

### Assessor (reviewing the take-home)

| # | Question | Answered in | Short answer |
|---|---|---|---|
| A1 | What does it do, and does it meet the brief? | §1 | Sell, retrieve, cancel (with quote), renew and claims; all MUST, SHOULD and COULD rules, each with an ID in `docs/requirements.md` |
| A2 | How do I build and run it in under five minutes? | §2 | .NET SDK 10, `dotnet build`, `dotnet run --launch-profile http`; SQLite, no setup |
| A3 | How do I run every test, and what do they prove? | §4 | `dotnet test --solution Uinsure.Policies.slnx`; four projects (Domain, Services, Api, Architecture) |
| A4 | How can I see that each rule has a test? | §4 | `[Trait("Rule", id)]` on tests; `RuleCoverageTests` fails on an untested ID |
| A5 | Where was the brief unclear, and what was assumed? | §1 | The assumptions table (`README.md:151`), one interpretation per rule |
| A6 | Was it built test-first? How can I check? | §7 | Outside-in TDD; red, stub, green commits carry a `TDD:` trailer; the trail is in `docs/trace/` |
| A7 | Why SQLite locally and SQL Server in Azure? | §5 | One EF Core context, provider switched by configuration; migrations are SQL Server only |
| A8 | Is the Azure part real? | §6 | Evidence only: Bicep and a pipeline validated locally, never deployed, `az` never run |
| A9 | What is deliberately not done? | §1 | No auth, pricing or payment processing; the known limits are listed |
| A10 | Which design choices would I be asked to defend? | §5 | "Why" callouts: terms for renewals, layers, a result type, one place for time and money |

### Developer (joining the code)

| # | Question | Answered in | Short answer |
|---|---|---|---|
| D1 | How is the solution laid out, and who may reference whom? | §5 | Domain (BCL only) ← Services ← Persistence, Api; enforced by architecture tests |
| D2 | What happens to a request, from socket to database? | §5 | Pipeline in `Program.cs`, then controller, service (load, today, domain, save), repository |
| D3 | Where does a rule live? How do I follow one from requirement to test to code? | §5 | CANCEL-1b followed through `requirements.md`, the traited tests and `RefundCalculator` |
| D4 | How is "today" decided, and why can't I use `DateTime.Now`? | §5 | `UkCalendar.Today(TimeProvider)` in Europe/London; an analyser bans the rest |
| D5 | How is money rounded? | §5 | Only `Money.Round`, 2 dp away from zero; an architecture test limits the suppression to that file |
| D6 | How do errors get their shape and status? | §3, §5 | `ProblemCatalog` and `ResultExtensions` in one place; RFC 9457 |
| D7 | How do I add a rule or an endpoint? | §5 | Requirement row first, then a red test, domain method, catalog entry, controller action |
| D8 | How does the database get its schema? | §2 | `EnsureCreated` on SQLite; EF migrations for SQL Server; the app never calls `Migrate()` |
| D9 | How do I run one rule's tests, or debug one? | §4 | `--filter-trait "Rule=<id>"`; Test Explorer's Traits grouping in Visual Studio |
| D10 | What do the git hooks run before I can commit or push? | §4 | Pre-commit: privacy scan and build. Pre-push: Release build, full tests, idempotent migration script, harness self-test |

### User (calling the API)

| # | Question | Answered in | Short answer |
|---|---|---|---|
| U1 | How do I sell a policy? | §3 | `POST /policies` with a reference, start date, amount, payment method, policyholders and property |
| U2 | How do I look a policy up, and what does its status mean? | §3 | `GET /policies/{reference}`; status is derived from today |
| U3 | How do I cancel, and how much will I get back? | §3 | `POST .../cancellation`; quote first with `GET .../cancellation-quote` |
| U4 | How do I renew, and when can I? | §3 | `POST .../renewals` from 30 days before the end date to the end date |
| U5 | How do I record a claim, and what does it do to a refund? | §3 | `POST .../claims`; any claim makes later refunds £0 |
| U6 | What does an error look like, and how do I read it? | §3 | RFC 9457 body: `type`, `ruleId`, `violations[]`, `traceId` |
| U7 | Why did I get 400, 404, 409, 422, 429 or 500? | §3 | One status table; the status says what kind of problem it is |
| U8 | How do I try it without writing code? | §4 | Postman app and Postman CLI collection; the Scalar UI in Development |
| U9 | Why was my duplicate or backdated request refused? | §3 | SELL-1 is a 409 (case-insensitive); SELL-2 is a 422 (today to today + 60) |
| U10 | Is it safe to expose? Do I need a key? | §1, §6 | No authentication (out of scope); the security scope names the gaps |

Coverage check for t4: every row above has a section heading id in the guide, and the "Check your understanding" tables (LRN-7) restate at least one question per section.

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

### 2.2 Existing documents to reuse and not contradict

`README.md` (run, assumptions, known limits), `docs/design.md` (endpoints, errors, tests, decisions, security scope), `infrastructure/README.md`, `docs/qa/build-F*.md`. Where the guide repeats a figure from them (637 tests, 109 requests), the figure is re-measured on the F7 branch (§4) and the guide shows the new one.

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

`docs/lessons.md` does not exist on this branch. t3 adds any problem met while capturing the receipts.

### 2.4 Gaps, to settle in t3

1. **U9 Visual Studio launch** (API and web together) and the web test suites are not on this branch. After the ui plan lands, t3 takes the profile name, the paths and the commands from main and cites them there. If they are still absent, the guide says so and gives the API-only profile.
2. **Screenshots** of Postman and Visual Studio are needed for MAN-1 and MAN-3 (LRN-6). They are captured by hand on David's machine; the markers are placed from measured pixel boxes of the captured image, since these tools have no region tags. t3 lists any it cannot capture and leaves a labelled placeholder figure, never an invented one.
3. **SQL Server provider switch** has no running database here. The guide shows the configuration keys and the migration script output, and states that no test runs against SQL Server (`README.md:194`).

## 3. Outline

About 32 pages. Each section has headline, summary, in-depth (LRN-2), at most one diagram (LRN-4), and ends with a "Check your understanding" table (LRN-7). Lists have three or four items (LRN-3).

| § | Title | Content | Receipts to capture (t3) |
|---|---|---|---|
| Front | Cover and front sheet | Five to seven big ideas, each with a bold cue word (LRN-1) | — |
| 1 | What it is | Brief, four operations and could-haves, rule IDs and where they live, assumptions table, out of scope; diagram: the operations on a policy's life | — |
| 2 | Run it | Numbered steps: SDK version from `global.json`; build; run on 5080; health live and ready; Scalar and OpenAPI; the SQLite and SQL Server switch (keys `Database:Provider`, `ConnectionStrings:Policies`); migrations and the idempotent script; the Visual Studio launch (gap 2.4.1) | `dotnet --version`; build; `curl` of both health routes; `dotnet ef migrations script --idempotent` (line count) |
| 3 | Use it, endpoint by endpoint | Sell, retrieve, cancel with quote, renew, claims. For each: request, response, every failure with ID and status, and one worked Postman example. Then the status table (400 to 500) and the evaluation order (400, 404, 409, then all 422s). Comparison table: cancellation outcomes (CANCEL-1a, 1b, 1c, COULD-2, UNPAID-TERM) | One live call per endpoint and one per failure class; a multi-violation 422 |
| 4 | Run the tests yourself | MAN-1 Postman app, MAN-2 Postman CLI, MAN-3 Visual Studio, MAN-4 `dotnet test` (all, one project, one rule), rule coverage, what each project proves, hooks, harness self-test. Points to the UI guide for Playwright and Vitest (MAN-5, MAN-6) and carries the web suite commands once for reference. MAN-7 comparison table with measured durations | `dotnet test` totals per project; a `--filter-trait` run; the Postman CLI summary; the harness self-test; elapsed times |
| 5 | Understand it | Four projects and reference rules (diagram); the request pipeline (diagram); one rule followed from requirement to test to code (CANCEL-1b); `TimeProvider` and `Money.Round`; persistence; logging and health; how to add a rule. "Why" callouts (LRN-10): terms not overwritten dates, one result type and one status mapping, interfaces only at layer seams, no `DateTime.Now`, SQLite locally | Architecture tests run; the extracts (3 to 12 real lines each, LRN-9) |
| 6 | Ship it | Bicep modules, parameter files, the multi-stage pipeline with an approval gate; why none of it is deployed | Bicep build output (version and result) |
| 7 | How it was built | One page: outside-in TDD, the plan DAG, the six agents, the trail; link to Docket (UI guide) for the full story | Counts from `docs/trace/build/` (nodes, findings) |
| 8 | Troubleshooting | The §2.3 table plus anything met in t3 (LRN-11) | — |

## 4. Receipts plan

t3 runs every command on the F7 branch at HEAD and records each in `docs/guides/api/receipts.md` (agents may not write the trace directory), by `docs/guides/api/run-receipts.sh`: the command exactly as run, the date, the exit code and the output pasted from the run. The guide copies from that file only. Required runs:

1. `dotnet --version`, `dotnet build Uinsure.Policies.slnx -warnaserror`
2. API start on 5080, then `curl` on `/health/live`, `/health/ready`, and one request per endpoint and failure class (sell, get, quote, cancel, claim, renew; 400, 404, 409, 422 single and multiple)
3. `dotnet test --solution Uinsure.Policies.slnx`, per project counts and elapsed time
4. `dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=CANCEL-1b"`
5. `postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json`, request count, assertion count and elapsed time
6. `node --test ".claude/hooks/__tests__/*.test.mjs"`
7. `dotnet ef migrations script --idempotent` as the pre-push hook runs it
8. Bicep build, as `infrastructure/README.md` gives it
9. Web suites (`npm --prefix src/Uinsure.Policies.Web run test`), after the ui plan lands (gap 2.4.1)

A number that appears in the guide without a matching line in `receipts.md` fails t4.

The guide check runs with `node --test docs/guides/api/check.test.mjs`.

## 5. Acceptance

1. §1 holds at least 25 questions in three reader groups. Met at 30.
2. Every question's home section exists in the guide and answers it; t4 maps question to heading id.
3. Every item of `docs/documentation-requirements.md` §6 is a section or subsection (§3 table above); MAN-1 to MAN-4 and MAN-7 are covered in full (§4b).
4. Every command shown matches a `receipts.md` entry, and every `path:line` resolves at HEAD (check script, §8.4).
5. The privacy scan passes on the HTML, the assets and the PDF text (no absolute local paths, personal emails or private names; the clone path example is generic).
6. `API_UserGuide.pdf` is printed by `node docs/guides/print.mjs api` from `docs/guides/api/index.html`, A4, 30 to 40 pages, and reprints identically from its HTML.
7. The guide only describes: no change to `src/` or `tests/`.
