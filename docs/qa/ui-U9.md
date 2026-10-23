# QA script: ui / U9, Docket ships: Azure Static Web Apps in the Bicep, web CI, Visual Studio launch, README

Rule IDs: none (`rules: []`, an evidence node). The acceptance lines in `docs/plans/active/ui.dag.yaml` are the
contract, tagged AC1 to AC11 below. No test carries a rule tag for U9, so the Rule column reads `—`.
Branch: feature/ui/U9, carried into feature/ui/U10   Worktree: .claude/worktrees/ui-U10
Commit under test: 78f52d2 or later. The work landed in 7910201 (builder), 8f23c27 and ec646d7 (the launch profile,
renamed `Uinsure.Policies.slnLaunch` in round D1, the name Visual Studio reads), be687b6 (the Static Web App
deploy: the token read, the CLI deploy and the site smoke test), and in U10 adb4b3d and 78f52d2 (one-key F5 on a
`Vite dev server` target that opens the default browser, the dev server compiling trace.json on start, and the
SWA CLI installed by `npm ci` from `infrastructure/pipelines/swa-cli/`). Record the SHA you test in the sign-off.
From U10 task t7 on, the web project is `src/Uinsure.Policies.Web` and its tests `tests/Uinsure.Policies.Web.Tests`:
read every `src/web` below as that path when you test at or after that commit.
Ports: Visual Studio F5 uses the profile's fixed ports, the API on 5080 and the dev server on 4170. The CLI run
uses the node's ports, the app on 4183 and the API on 5093 (U9 is position 13 in `ui.dag.yaml`).

**Evidence only.** Nothing in this node is deployed and `az` is never run. Parts C, D and E check files on disk
(Bicep compiled locally, the pipeline YAML schema-checked offline, the README read by eye). They prove the files'
shape, not that Azure would accept them. Parts A and B run the app on this machine.

The Actual and Pass/Fail columns are empty. I wrote the steps from the files at a4da445, brought steps 1, 4–6,
21, 23–25, 28 and 31 and the notes up to 78f52d2, and didn't run them (note 4).

## Acceptance items (from `docs/plans/active/ui.dag.yaml`, node U9)

| Tag | Acceptance item | Steps |
|---|---|---|
| AC1 | `staticwebapp.bicep`, hand-written, wired into `main.bicep` beside the App Service | 15, 16, 20 |
| AC2 | The Static Web App links the App Service as its backend: same-origin `/api`, CSP stays `default-src 'self'` | 16, 20, 21, 30 |
| AC3 | The static build's host settings and deep links (fallback to `index.html`); trace.json compiled before the build | 13, 21, 24 |
| AC4 | `bicep build` and `build-params` pass for dev, test and prod; a web build and deploy stage; the pipeline check passes | 15, 17–19, 23–25 |
| AC5 | No secrets (the deployment token from the resource, never in params); `az` never run; nothing deployed | 22, 25, 27 |
| AC6 | The web app is a `.esproj` in a `web` solution folder; one launch profile starts the API and the web app | 2–7 |
| AC7 | `dotnet build -warnaserror` and `dotnet test --solution` unchanged: the `.esproj` is excluded, no npm | 8, 9 |
| AC8 | The pipeline gains a web build and test stage before the deploy; nothing in `.github/workflows` | 23, 24, 26 |
| AC9 | `infrastructure/README.md` documents the Static Web App, the web stage and the configured-not-tested notes | 28–30 |
| AC10 | `README.md` says what Docket is and how to run it: Visual Studio F5, or the CLI | 1, 10–14, 31 |
| AC11 | Diff scope | 32 |

## Preconditions

- [ ] Visual Studio 2022 or later with the **Node.js development** workload (it loads the JavaScript SDK
      `.esproj`), and the .NET 10 SDK.
- [ ] Node 22.22 or later on `PATH` (jsdom, react-router and undici warn on 22.18).
- [ ] The Bicep CLI (`bicep --version`), and Python with PyYAML and jsonschema for the pipeline check.
- [ ] Nothing else listening on 4170, 5080, 4183 or 5093.
- [ ] Run every command from the worktree root, `.claude/worktrees/ui-U9`, in PowerShell, unless a step says
      `src/web`. The bash forms in Part B work in Git Bash too.

## Steps

### Part A: Visual Studio, API and web together (AC6, AC7, AC10)

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | — | `src/web` | `npm ci` | Exits 0. No `npm run trace` is needed for F5: the dev server compiles `trace.json` from git history each time it starts (step 5) | | |
| 2 | — | Visual Studio | Open `Uinsure.Policies.slnx`. Look at Solution Explorer | A `web` solution folder holds `Docket.Web`, loaded (not "unloaded" or "incompatible"). `src`, `tests` and the other folders are as before | | |
| 3 | — | Visual Studio | Open the startup-project dropdown on the toolbar | A profile named **API and web** is listed. Choose it | | |
| 4 | — | Visual Studio | Solution → Configure Startup Projects | Multiple startup projects: `Uinsure.Policies.Api` set to Start with the `http` target, `Docket.Web` set to Start with the `Vite dev server` target, nothing else started | | |
| 5 | — | Visual Studio | F5 | No "unable to launch the previously selected debugger" message. The API starts on `http://localhost:5080` and opens its own browser tab on `/health/live`, which answers healthy. The dev server compiles `trace.json` first, then prints `Local: http://localhost:4170/` and opens Docket on it in your default browser (Vite's `--open`; not an Edge debug window, and no debugger is attached to it) | | |
| 6 | — | `http://localhost:4170/` | Use the browser tab F5 opened on it. Then open `#/workbench/sell`, sell `QA-U9-VS` (start today, amount `365.00`, Card), DevTools Network open | The explorer overview renders from trace.json. The sell sends `POST /api/policies`, answered 201 by the API on 5080 through the dev server's proxy (the API's console logs `POST /policies`) | | |
| 7 | — | Visual Studio | Stop debugging (Shift+F5) | Both the API and the Vite console stop. Nothing is left listening on 5080 or 4170 | | |
| 8 | — | Visual Studio, then shell | Build → Rebuild Solution; then `dotnet build Uinsure.Policies.slnx -warnaserror` | The VS Output window shows `Docket.Web` skipped and no `npm` line. The CLI build ends with 0 warnings and 0 errors and prints no `npm` and no `Docket.Web` line | | |
| 9 | — | shell | `dotnet test --solution Uinsure.Policies.slnx` | Every test passes, the same projects as before U9. No Vitest or Playwright run starts | | |

### Part B: the command line, as `README.md` gives it, on the node's ports (AC3, AC10)

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 10 | — | shell 1 | `dotnet run --project src/Uinsure.Policies.Api --urls http://localhost:5093` | `Now listening on: http://localhost:5093`. `curl http://localhost:5093/health/live` answers 200 | | |
| 11 | — | shell 2, `src/web` | `npm ci`, `npm run trace`, `npm run build` | Each exits 0. `dist/` holds `index.html`, `kitchen-sink.html` and `assets/` | | |
| 12 | — | shell 2, `src/web` | `$env:DOCKET_API_PORT=5093; npm run preview -- --port 4183 --strictPort` (bash: `DOCKET_API_PORT=5093 npm run preview -- --port 4183 --strictPort`) | `Local: http://localhost:4183/` | | |
| 13 | — | `http://localhost:4183/` | Open it, then `#/workbench/sell`, sell `QA-U9-CLI` as in step 6 | The overview renders (trace.json was compiled before the build). `POST /api/policies` answers 201 from the API on 5093 | | |
| 14 | — | `README.md` | Compare steps 10–13 with the README's "From the command line" block | The README's commands are the ones run here, with its default ports (5080, 4173) where this script uses the node's (5093, 4183). Its note that `DOCKET_API_PORT` changes the proxy target held in step 13 | | |

### Part C: the Bicep, compiled locally (AC1, AC2, AC4, AC5). Evidence only: nothing is deployed

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 15 | — | shell | `bicep build infrastructure/main.bicep --stdout > $null; $LASTEXITCODE` | `0`, and no diagnostic line on the console | | |
| 16 | — | shell | `bicep build infrastructure/main.bicep --stdout \| Select-String "Microsoft.Web/staticSites"` | Two types: `Microsoft.Web/staticSites` and `Microsoft.Web/staticSites/linkedBackends` (inside the nested `web` deployment). The outputs include `webSiteName` and `webHostName` | | |
| 17 | — | shell | `bicep build-params infrastructure/params/dev.bicepparam --stdout > $null; $LASTEXITCODE` | `0`, no diagnostic. The file ends `param webLocation = 'westeurope'` | | |
| 18 | — | shell | The same for `infrastructure/params/test.bicepparam` | `0`, no diagnostic, `webLocation` `westeurope` | | |
| 19 | — | shell | The same for `infrastructure/params/prod.bicepparam` | `0`, no diagnostic, `webLocation` `westeurope` | | |
| 20 | — | `infrastructure/modules/staticwebapp.bicep`, `main.bicep` | Read them | `stapp-<suffix>`, SKU Standard (a linked backend isn't on Free), and a `linkedBackends` child `api` whose `backendResourceId` is `app.outputs.appId` and whose region is the workload `location`. The module sits in `main.bicep` beside `module app`, on the resource group. No parameter carries a token | | |
| 21 | — | `infrastructure/web/staticwebapp.config.json` | Read it | `navigationFallback` rewrites to `/index.html`, excluding `/assets/*`, `/*.json`, `/*.ico` and `/kitchen-sink.html`. The header CSP starts `default-src 'self'` and matches the app's (`base-uri 'self'; form-action 'none'; object-src 'none'`), plus `frame-ancestors 'none'`. `Referrer-Policy: no-referrer` and `X-Content-Type-Options: nosniff` are set as global headers. Note 2 on deep links | | |
| 22 | — | shell | `git grep -niE "password\|secret\|token\|@secure\|keyvault" -- infrastructure/main.bicep infrastructure/modules/staticwebapp.bicep infrastructure/params infrastructure/web` | Only the comment lines already in the params ("Not a secret"). No value, no `@secure()` parameter, no token in a param file | | |

### Part D: the pipeline, schema-checked offline (AC4, AC5, AC8). Evidence only: the pipeline has never run

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 23 | — | shell | `python -I infrastructure/pipelines/check-pipeline.py; $LASTEXITCODE` | `pipeline check passed`, then `0`. The check now asserts the chain Build → Web → dev → test → prod, the Web stage's commands, and the deploy's token step, CLI deploy and site smoke test in that order (note 1) | | |
| 24 | — | `infrastructure/pipelines/azure-pipelines.yml` | Read the `Web` stage | `dependsOn: Build`, hosted agent, full-depth checkout. Steps in order: `npm ci`, typecheck, lint, CSS lint, unit, `npm run trace`, build, Playwright against the API started on the agent, then `dist/` plus `staticwebapp.config.json` packaged; `infrastructure/pipelines/swa-cli` published as the `swa-cli` artifact and the package as the `web` artifact. The `dev` template stage has `dependsOn: Web` | | |
| 25 | — | `infrastructure/pipelines/stage-template.yml` | Read `Deploy_<env>`, after "Deploy app" | `Deploy infrastructure` sets `webSiteName` and `webHostName` from the outputs. Then three steps in this order. **Read the Static Web App deployment token:** `az staticwebapp secrets list --name "$(webSiteName)" --resource-group "$(resourceGroupName)" --query properties.apiKey`, on the ARM connection, set as `swaDeploymentToken` with `issecret=true`. **Deploy web:** `npm ci --prefix $(Pipeline.Workspace)/swa-cli --ignore-scripts` (the CLI, `@azure/static-web-apps-cli` 2.0.2, from its lockfile, never `npx --yes`), then `swa-cli/node_modules/.bin/swa deploy $(Pipeline.Workspace)/web --env production`, with the token only in the step's `env` as `SWA_CLI_DEPLOYMENT_TOKEN`, never on the command line. **Smoke test the site root:** `curl --fail` against `https://$(webHostName)/`, with retries. The `/health/ready` smoke test stays last | | |
| 26 | — | shell | `git ls-files .github` | Nothing: no file under `.github/workflows`. Every pipeline and IaC file is under `infrastructure/` | | |
| 27 | — | shell | `git grep -nE "(^\|[^[:alnum:]_-])az (deployment\|webapp\|staticwebapp\|login\|group\|sql\|account\|resource)" -- src tests .githooks` | Nothing. `az` appears only in the never-run `stage-template.yml` and as string needles in `check-pipeline.py` | | |

### Part E: the READMEs, read by eye (AC2, AC9, AC10). Evidence only

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 28 | — | `infrastructure/README.md` § The Static Web App | Read it beside steps 20–25 | It states the Standard plan and linked backend, the host settings file, the token read at deploy time (the step names "Read the Static Web App deployment token" and "Deploy web", `swaDeploymentToken` with `issecret=true`, the token only in `SWA_CLI_DEPLOYMENT_TOKEN`), the Web stage and its `web` artifact, the deploy of it and the step "Smoke test the site root", a "Configured, not tested" bullet (the CLI installed by `npm ci` from `pipelines/swa-cli/`; Node 22.22 or later on the deploy agents) and a "Known mismatch" bullet, in the voice of the App Service sections. Every claim matches a file in step 25. One wording to check: the "No secret in the repo" bullet still says the CLI is "run with `npx`", where step 25 installs it with `npm ci` (note 1) | | |
| 29 | — | `infrastructure/README.md` § Shape and § The pipeline | Read them | Five modules, `staticwebapp` among them; `webLocation` `westeurope` because Static Web Apps isn't offered in `uksouth`; the Web stage listed as stage 2 | | |
| 30 | — | `infrastructure/README.md`, "Known mismatch" | Read it | It says the linked backend forwards `/api/...` unchanged while the API's routes have no `/api` prefix (the dev and preview proxies strip it), so the deployed site wouldn't reach the API without a path base. It is stated as not fixed in U9. Decide: accept as documented, or a defect | | |
| 31 | — | `README.md` § Docket (the web app) | Read it | It says what Docket is (the trail explorer and the workbench), gives the Visual Studio route (the **API and web** profile, F5, ports 5080 and 4170, Docket opened in the default browser by Vite's `--open`, `trace.json` compiled each time the dev server starts, `npm ci` once first) and the CLI block from Part B | | |

### Part F: diff scope (AC11)

| # | Rule | Where | Action | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| 32 | — | shell | `git fetch origin; git diff --name-only origin/ui...HEAD` | Only `README.md`, `Uinsure.Policies.slnx`, `Uinsure.Policies.slnLaunch`, `infrastructure/**`, `src/web/Docket.Web.esproj`, `src/web/.vscode/launch.json`, `tests/Uinsure.Policies.Architecture.Tests/LaunchProfileTests.cs`, `docs/trace/ui/U9/**`, `docs/qa/ui-U9.md` and `docs/plans/active/ui.dag.yaml`. No app runtime file under `src/web/app/` or `src/web/kit/` | | |

## Run commands (the node's ports)

```sh
# the API, shell 1
dotnet run --project src/Uinsure.Policies.Api --urls http://localhost:5093
# the web app, shell 2
cd src/web
npm ci
npm run trace
npm run build
DOCKET_API_PORT=5093 npm run preview -- --port 4183 --strictPort     # http://localhost:4183/
```

Visual Studio F5 uses the profile's ports (API 5080, dev server 4170), not these.

## Notes

1. **The Static Web App deploy (steps 23, 25 and 28).** At a4da445 the README described a deploy the pipeline
   didn't have. be687b6 added it to `stage-template.yml`: the token step, the CLI deploy of the `web` artifact
   and the site smoke test, in that order; 78f52d2 moved the CLI from a pinned `npx` run to `npm ci` from
   `infrastructure/pipelines/swa-cli/package-lock.json`, published as the `swa-cli` artifact, so every package is
   pinned with its integrity hash. `check-pipeline.py` now asserts each of these (one token step with
   `issecret=true` against `$(webSiteName)`, one CLI step installed by `npm ci` from its lockfile and never
   `npx --yes`, the token only through `env`, a `curl --fail` of `https://$(webHostName)/`, and their order), so
   step 23 fails if any is removed. The README's step names and variables match the YAML, except the "run with
   `npx`" parenthetical in its "No secret in the repo" bullet, which predates 78f52d2: step 28 fails on that
   phrase until it's reworded. Nothing here has run against Azure.
2. **Deep links.** The app routes by hash (`#/workbench/...`), so a refreshed deep link requests `/` and the
   `navigationFallback` rule only matters for a path URL. Nothing here can serve the config locally (the Vite
   preview doesn't read `staticwebapp.config.json`), so step 21 is a reading.
3. **Smaller observations.** The solution's `/infrastructure/modules/` folder doesn't list `staticwebapp.bicep`,
   and `infrastructure/web/staticwebapp.config.json` isn't in any solution folder, so neither shows in Solution
   Explorer (78f52d2 lists both in the solution). `src/web/public/` is ignored since 955cad3, so the
   `trace.json` that steps 5 and 11 write doesn't show in `git status`.
4. **I didn't run these steps.** Visual Studio, the build, the trace compile and the API are outside what I run
   at the QA step. The expected text is from the files at a4da445, and at 78f52d2 for the steps the header
   names. Bicep's version and the test counts are
   yours to record.

## Sign-off

David: ______ · SHA tested: ______ · date: ______

Steps passed: ___ of 32 · Steer (if any): ______

Steps not run, or only partly seen, and why:
- ______

Decision: ☐ sign off U9   ☐ steer (write it above)   ☐ defect (step numbers)
