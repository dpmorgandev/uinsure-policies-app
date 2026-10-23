# QA script — build / F7 — API user guide

Rule IDs: none (F7 is a docs node; the Rule column carries `—` and the Check column names the acceptance item)
Branch: feature/build/F7   Worktree: .claude/worktrees/build-F7
Commit under test: 18e6b30 (the guide, receipts and PDF were last changed at d7b43af; 6340c22 and 18e6b30 touch only
the plan and the trail. This script's own commit changes only this file. Record the SHA you test in the sign-off)
API URL: http://localhost:5080   Environment: local (`http` launch profile, Development, SQLite file)

You follow `docs/guides/api/index.html` (or `API_UserGuide.pdf`, the same text) from a clean clone, step by step,
and compare each output with what the guide says you will see. Then check the three acceptance items and the four
placeholder figures.

## Acceptance items (from `docs/plans/active/build.dag.yaml`, node F7)

| Tag | Acceptance item |
|---|---|
| AC1 | `docs/specs/guide-format.spec.md` and `docs/specs/api-guide.spec.md` exist; the api-guide spec opens with a question bank of at least 25 reader questions (assessor, developer, user), each answered in the guide |
| AC2 | `API_UserGuide.pdf` at the root is printed by `node docs/guides/print.mjs` from `docs/guides/api/index.html` and covers every item in documentation-requirements §6, in the LRN layout and STY styling |
| AC3 | Every command shown was run on the node branch and every output, count and test number is copied from that run; every `path:line` link resolves at HEAD; the privacy scan passes on the HTML, assets and PDF text |

## Preconditions

- [ ] .NET SDK 10 on `PATH` (`global.json` pins 10.0.100, `rollForward: latestFeature`).
- [ ] Postman CLI on `PATH` (no login needed), Node on `PATH`, and a global `dotnet-ef` (the repo has no tool
      manifest; step 7 needs it).
- [ ] Nothing listening on port 5080.
- [ ] **Clean clone to a short path** (guide §8: a long path breaks the architecture tests on Windows):
      `git clone --branch feature/build/F7 <main checkout> C:\src\up-f7`, then run every step from `C:\src\up-f7`.
      There is no `policies.development.db*` in a fresh clone, so step 4 exercises the first-run schema creation.

Commands are copied from the guide verbatim. Run them in Git Bash.

## Steps

### A. Guide §2 "Run it" (AC3)

| # | Rule | Check | Steps / input | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | — | AC3 · clean tree | `git status --short`; `git log -1 --format=%h` | Nothing printed; the SHA under test | | |
| 2 | — | AC3 · §2 step 1 SDK | `dotnet --version` | 10.0.1xx or later (the guide's run: `10.0.402`) | | |
| 3 | — | AC3 · §2 step 2 build | `dotnet build Uinsure.Policies.slnx -warnaserror` | `Build succeeded.` `0 Warning(s)` `0 Error(s)` | | |
| 4 | — | AC3 · §2 step 3 run | `dotnet run --project src/Uinsure.Policies.Api --launch-profile http` (leave running) | `Now listening on: http://localhost:5080`, `Hosting environment: Development`; a new `src/Uinsure.Policies.Api/policies.development.db` appears | | |
| 5 | — | AC3 · §2 step 4 health, **as printed** | Paste the guide's two lines: `curl -s -ihttp://localhost:5080/health/live` and `curl -s -i http://localhost:5080/health/ready` | Both `HTTP/1.1 200 OK`, `Content-Type: text/plain`, `Healthy`. **Known defect, note 1:** the first line has no space after `-i`, and curl prints its help instead | | |
| 6 | — | AC3 · §2 step 5 OpenAPI and Scalar | The guide's two `curl … -w` lines | `openapi status 200`, `scalar status 200` | | |
| 7 | — | AC3 · §2 Migrations | `dotnet ef migrations script --idempotent --project src/Uinsure.Policies.Persistence --startup-project src/Uinsure.Policies.Api -o migrate.sql`; `wc -l migrate.sql`; then delete `migrate.sql` | A 242-line T-SQL script starting `IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL`; a tool-version warning only if your global `dotnet-ef` is older than 10.0.13 | | |
| 8 | — | AC3 · §3 one call, **as printed** | Paste the guide's first sale (§3, "Sell a policy", the GUIDE-001 `curl -s -i-X POST …` line) | `201 Created`, `Location: /policies/GUIDE-001`. **Known defect, note 1:** as printed, curl answers `option -i-X: is unknown`, exit 2. With the space restored, the guide's 201 body | | |

### B. Guide §4 "Run the tests yourself" (AC3)

| # | Rule | Check | Steps / input | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 9 | — | AC3 · MAN-4 all | `dotnet test --solution Uinsure.Policies.slnx` (API still running) | `total: 637`, `failed: 0`, `succeeded: 637`, `skipped: 0` | | |
| 10 | — | AC3 · MAN-4 one project | `dotnet test --project tests/Uinsure.Policies.<X>.Tests` for Domain, Services, Api, Architecture | 173, 65, 332, 67; each 0 failed | | |
| 11 | — | AC3 · MAN-4 one rule | `dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=CANCEL-1b"` | `total: 8`, `failed: 0`, `succeeded: 8`, `skipped: 0` | | |
| 12 | — | AC3 · rule coverage | `dotnet test --project tests/Uinsure.Policies.Architecture.Tests -- --filter-class "*RuleCoverageTests"` | `total: 11`, `failed: 0`, `succeeded: 11` | | |
| 13 | — | AC3 · MAN-2 Postman CLI | `postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json` | requests 253 / 0; test-scripts 109 / 0; prerequest-scripts 114 / 0; assertions 246 / 0 | | |
| 14 | — | AC3 · MAN-2 one folder | The same with `-i "F3 Cancel"` | requests 87 / 0; test-scripts 33 / 0; prerequest-scripts 33 / 0; assertions 82 / 0 | | |
| 15 | — | AC3 · harness self-test | `node --test ".claude/hooks/__tests__/*.test.mjs"` | `# tests 221`, `# pass 221`, `# fail 0` (about 100 s) | | |
| 16 | — | AC3 · MAN-1 Postman app | Guide §4 MAN-1 steps 1-4: import both files, pick `local`, Run collection | Collection `Uinsure.Policies`, six folders; `local` holds only `baseUrl = http://localhost:5080`; every request passes | | |
| 17 | — | AC3 · MAN-3 Visual Studio | Guide §2 "Visual Studio" (Ctrl+F5 on the `http` profile, after stopping the terminal run), then §4 MAN-3 steps 1-4 | A browser on `/health/live` shows `Healthy`; Test Explorer runs 637 green; Group By → Traits lists `Rule` groups. The guide says it did not run these (§4 callout "Not run here") | | |
| 18 | — | AC3 · stop the API | Ctrl+C in the terminal from step 4; `curl -s -o /dev/null -w "%{http_code}" http://localhost:5080/health/live` | `000` | | |

### C. Acceptance lines

| # | Rule | Check | Steps / input | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 19 | — | AC1 · specs and question bank | Open both specs; count the rows of `api-guide.spec.md` §1; for a sample of five, find the answer at the home section in the guide | Both exist; §1 is first; at least 25 rows in the three groups (there are 30: 10, 10, 10, see note 2); each sampled question is answered where §1 says | | |
| 20 | — | AC2 · reprint | `node docs/guides/print.mjs api`; then `git status --short` and the PDF's page count | The PDF is rewritten from the HTML at the same size (369,701 bytes; only creation metadata differs); A4; 30-40 pages (about 37) | | |
| 21 | — | AC2 · §6 items, layout, styling | Page through the PDF against `docs/documentation-requirements.md` §6, §4, §4b, §5 | Every §6 item is a section or subsection; each section has headline, summary, in depth and a "Check your understanding" table; Docket styling | | |
| 22 | — | AC3 · links and privacy | Click five `path:line` links in the HTML; search the PDF text for a drive letter, a user folder and an `@` | Each opens the cited line at HEAD; no local path, personal email or private name | | |
| 23 | — | AC3 · describes only | `git diff --stat main...HEAD -- src tests` | Nothing printed | | |

### D. The four placeholder figures (AC3: "never an invented one", spec §2.4 gap 2)

| # | Rule | Check | Steps / input | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 24 | — | AC3 · figure 2 | Guide §2 "Visual Studio" | A dashed box labelled `PLACEHOLDER: screenshot to be taken by hand`, caption "Visual Studio's startup toolbar … Placeholder"; no markers drawn | | |
| 25 | — | AC3 · figure 3 | Guide §4 MAN-1 | The same labelled box, "Postman: collection imported, environment "local" selected"; no markers | | |
| 26 | — | AC3 · figure 4 | Guide §4 MAN-1 | The same labelled box, "Postman: Collection Runner results"; no markers | | |
| 27 | — | AC3 · figure 5 | Guide §4 MAN-3 | The same labelled box, "Visual Studio: Test Explorer, grouped by Rule trait"; no markers. `receipts.md` 425 lists the hand captures as placeholders. **Your call:** capture the four (steps 16 and 17 put you on the screens) or accept them as placeholders for this PR | | |

## Exploratory notes / defects

Prepared 2026-10-23 by the tester agent (t6) at 18e6b30. The Actual columns are for your run. Before writing the
script I reproduced the defect in note 1 with curl 8.12.1 (no API needed); nothing else was run for this script.

1. **Defect candidate (AC3): 18 of the guide's 20 `curl -s -i` commands have lost the space after `-i`.** `index.html`
   lines 148, 289, 297 (`-ihttp://…`), 240, 249, 257, 265, 345, 353, 361, 384, 401, 409, 432 (`-i-X POST`) and 305,
   329, 337, 393 (`-i"http://…"`). Pasted as printed, `-ihttp…` makes curl print its help and exit 0, and `-i-X`
   gives `curl: option -i-X: is unknown`, exit 2. Lines 149 and 157 are correct. `receipts.md` R5b (line 135) heads
   the runs `curl -s -i`, so the run was most likely right and the page text was damaged after it. The PDF is printed from this HTML,
   so it carries the same text. The fix is one character per line, then a reprint. If you confirm steps 5 and 8,
   this becomes a finding on F7's failure route.
2. **The spec's own count is stale.** `docs/specs/api-guide.spec.md` lines 9 and 148 say 27 questions; the table
   has 30 (A1-A10, D1-D10, U1-U10). The t2 gate recorded the same. Above 25 either way; only the stated number is wrong.
3. **Fixed dates in §3.** The §3 examples assume today is 2026-10-23 (GUIDE-001 starts 2026-11-01; the GUIDE-002
   cancellation on 2026-10-22 is meant to fail as past). On a later day some outputs differ (quotes, statuses).
   The guide says so in its §3 summary.
4. **`dotnet ef` on a clean machine.** The guide's migration step needs a global `dotnet-ef`; the guide mentions it
   only in the §8 troubleshooting row about the version warning, not as a prerequisite in §2.

## Sign-off

| | |
|---|---|
| Tester | David Morgan |
| Date | |
| Commit signed off | |
| Clean clone path | |
| `dotnet test` result | __ passed / __ failed / __ skipped |
| Postman CLI result | requests __ / __; assertions __ / __ |
| Steps passed | __ of 27 |
| Placeholder figures (steps 24-27) | ☐ Captured  ☐ Accepted as placeholders |
| Defects raised (finding ids) | |
| Verdict | ☐ Reject (findings above)  ☐ Accept F7 |
| Signature | |
