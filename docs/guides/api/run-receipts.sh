#!/usr/bin/env bash
# Re-runs every command the API guide shows and writes docs/guides/api/receipts.md.
# Run from the repository root, in Git Bash, with port 5080 free and no policies.development.db:
#   bash docs/guides/api/run-receipts.sh
# The sales use start dates relative to 2026-10-23, the day the guide was captured, so the dates in the
# commands below only fit that day. Each command is run exactly as written here (eval) and recorded as
# `Command:` followed by its output. The guide copies commands and outputs from receipts.md; nothing is retyped.
# Afterwards: node docs/guides/api/fill-guide.mjs copies the HTTP outputs into index.html.
set -u
OUT=docs/guides/api/receipts.md
SHA=$(git rev-parse --short HEAD)
DAY=$(date +%F)
WIN=$(pwd -W)
POSIX=$(pwd)
TMPD=$(mktemp -d)
rm -f src/Uinsure.Policies.Api/policies.development.db*

scrub() {
  tr -d '\r' | sed -e "s|${WIN}|<repo>|g" -e "s|${WIN//\//\\\\}|<repo>|g" -e "s|${POSIX}|<repo>|g" \
    -e "s|${USERPROFILE//\\/\\\\}|<home>|g" -e "s|${HOME}|<home>|g"
}

# entry <id> <title> <command> [filter] [note]
entry() {
  local id="$1" title="$2" cmd="$3" filter="${4:-cat}" note="${5:-}" out code
  out=$(eval "$cmd" </dev/null 2>&1); code=$?
  {
    printf '## %s %s\n\n' "$id" "$title"
    printf 'Command: `%s`\n\n' "$cmd"
    printf 'Date: %s. Branch: feature/build/F7 at %s. Exit code: %s.\n\n' "$DAY" "$SHA" "$code"
    printf '```text\n'
    [ -n "$note" ] && printf '(excerpt: %s)\n' "$note"
    printf '%s\n' "$out" | scrub | eval "$filter"
    printf '```\n\n'
  } >> "$OUT"
}

HTTPF="grep -v -i -E '^(date|server|transfer-encoding|content-length):'"
HTTPN="the Date, Server, Transfer-Encoding and Content-Length headers left out"

cat > "$OUT" <<EOF
# F7 receipts: API user guide

Every command in \`docs/guides/api/index.html\` was run on the F7 branch (HEAD \`${SHA}\` plus the guide's own files)
on ${DAY}, on Windows 11 under Git Bash, .NET SDK $(dotnet --version). The script that ran them is
\`docs/guides/api/run-receipts.sh\`. Each entry gives the command exactly as it was run, then its output. The checkout
path is replaced by \`<repo>\`, and nothing else is edited except where an entry says "excerpt". The guide copies
commands and outputs from this file only.

The brief asked for these in \`docs/trace/build/F7/\`, which agents may not write. They are here, and the
orchestrator can move them.

EOF

entry R1 "SDK version" 'dotnet --version'
entry R2 "Build" 'dotnet build Uinsure.Policies.slnx -warnaserror' 'tail -n 6' 'last 6 lines'
entry R3 "Test, whole solution" 'dotnet test --solution Uinsure.Policies.slnx' "sed -n '/Test run summary/,\$p'" 'the summary'
entry R3a "Test, Domain.Tests" 'dotnet test --project tests/Uinsure.Policies.Domain.Tests' "sed -n '/Test run summary/,\$p'" 'the summary'
entry R3b "Test, Services.Tests" 'dotnet test --project tests/Uinsure.Policies.Services.Tests' "sed -n '/Test run summary/,\$p'" 'the summary'
entry R3c "Test, Api.Tests" 'dotnet test --project tests/Uinsure.Policies.Api.Tests' "sed -n '/Test run summary/,\$p'" 'the summary'
entry R3d "Test, Architecture.Tests" 'dotnet test --project tests/Uinsure.Policies.Architecture.Tests' "sed -n '/Test run summary/,\$p'" 'the summary'
entry R4 "One rule by trait" 'dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=CANCEL-1b"' "sed -n '/Test run summary/,\$p'" 'the summary'
entry R4b "Rule coverage" 'dotnet test --project tests/Uinsure.Policies.Architecture.Tests -- --filter-class "*RuleCoverageTests"' "sed -n '/Test run summary/,\$p'" 'the summary'
entry R4c "Renewal tests (a successful renewal needs a fake clock)" 'dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=RENEW-4"' "sed -n '/Test run summary/,\$p'" 'the summary'

# Start the API (R5) and wait for it.
LOG="$TMPD/api.log"
dotnet run --project src/Uinsure.Policies.Api --launch-profile http > "$LOG" 2>&1 &
for i in $(seq 1 90); do curl -s -o /dev/null http://localhost:5080/health/live && break; sleep 1; done
{
  printf '## R5 Run on 5080\n\n'
  printf 'Command: `%s`\n\n' 'dotnet run --project src/Uinsure.Policies.Api --launch-profile http'
  printf 'Date: %s. Branch: feature/build/F7 at %s. Exit code: running until stopped.\n\n' "$DAY" "$SHA"
  printf '```text\n(excerpt: the start-up lines)\n'
  tr -d '\r' < "$LOG" | scrub | grep -E 'Now listening|Application started|Hosting environment|Content root'
  printf '```\n\n'
} >> "$OUT"

while IFS= read -r line; do
  [ -z "$line" ] && continue
  id=${line%%@@*}; rest=${line#*@@}; title=${rest%%@@*}; cmd=${rest#*@@}
  case "$id" in
    O*) entry "$id" "$title" "$cmd" ;;
    *) entry "$id" "$title" "$cmd" "$HTTPF" "$HTTPN" ;;
  esac
done <<'CALLS'
H1@@Health, live@@curl -s -i http://localhost:5080/health/live
H2@@Health, ready@@curl -s -i http://localhost:5080/health/ready
O1@@OpenAPI description@@curl -s -o /dev/null -w "openapi status %{http_code}\n" http://localhost:5080/openapi/v1.json
O2@@Scalar page@@curl -s -o /dev/null -w "scalar status %{http_code}\n" http://localhost:5080/scalar/v1
C01@@Sell GUIDE-001@@curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-001","type":"Household","startDate":"2026-11-01","amount":803.40,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'
F01@@Sell the same reference again (409)@@curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-001","type":"Household","startDate":"2026-11-01","amount":803.40,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'
F02@@Sell with a past start date and amount 0 (422, two violations)@@curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-003","type":"Household","startDate":"2026-10-01","amount":0,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'
F03@@Sell with only a reference (400)@@curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GU"}'
C02@@Get, lower-case reference@@curl -s -i http://localhost:5080/policies/guide-001
F04@@Get an unknown reference (404)@@curl -s -i http://localhost:5080/policies/NO-SUCH-POLICY
F05@@Get with an unknown query key (400)@@curl -s -i "http://localhost:5080/policies/GUIDE-001?reference=X"
C03@@Quote 2026-11-10 (cooling-off)@@curl -s -i "http://localhost:5080/policies/GUIDE-001/cancellation-quote?cancellationDate=2026-11-10"
C04@@Quote 2027-04-30 (pro rata)@@curl -s -i "http://localhost:5080/policies/GUIDE-001/cancellation-quote?cancellationDate=2027-04-30"
C05@@Cancel on 2026-11-10@@curl -s -i -X POST http://localhost:5080/policies/GUIDE-001/cancellation -H "Content-Type: application/json" -d '{"cancellationDate":"2026-11-10"}'
C06@@Cancel again (409)@@curl -s -i -X POST http://localhost:5080/policies/GUIDE-001/cancellation
C08@@Sell GUIDE-002, starting today@@curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-002","type":"BuyToLet","startDate":"2026-10-23","amount":1200.00,"autoRenew":false,"paymentMethod":"DirectDebit","policyholders":[{"firstName":"Grace","lastName":"Hopper","dateOfBirth":"1990-12-09"}],"property":{"addressLine1":"2 Sample Road","postcode":"EX2 2BB"}}'
F08@@Cancel for yesterday (422)@@curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/cancellation -H "Content-Type: application/json" -d '{"cancellationDate":"2026-10-22"}'
C09@@Claim for today@@curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/claims -H "Content-Type: application/json" -d '{"claimDate":"2026-10-23","description":"Burst pipe"}'
C10@@Quote after the claim@@curl -s -i "http://localhost:5080/policies/GUIDE-002/cancellation-quote?cancellationDate=2027-04-30"
F06@@Claim for tomorrow (422)@@curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/claims -H "Content-Type: application/json" -d '{"claimDate":"2026-10-24"}'
F07@@Claim on the cancelled policy (409)@@curl -s -i -X POST http://localhost:5080/policies/GUIDE-001/claims -H "Content-Type: application/json" -d '{"claimDate":"2026-11-10"}'
C11@@Renew too early (422)@@curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/renewals -H "Content-Type: application/json" -d '{"amount":1250.00}'
CALLS

entry R6 "Postman CLI, whole collection" 'postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json' "sed -n '/iterations/,\$p'" 'the summary table'
entry R6b "Postman CLI, one folder" 'postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json -i "F3 Cancel"' "sed -n '/iterations/,\$p'" 'the summary table'

# Stop the API: the process that holds port 5080.
PID=$(netstat -ano | grep -E ':5080 .*LISTENING' | awk '{print $NF}' | head -1)
[ -n "$PID" ] && taskkill //F //T //PID "$PID" > /dev/null 2>&1
sleep 2

entry R10 "Run with no launch profile (a problem met while capturing)" 'timeout 60 dotnet run --project src/Uinsure.Policies.Api --no-launch-profile' "grep -m1 'OptionsValidationException'" 'the exception line'

entry R7 "Harness self-test" 'node --test ".claude/hooks/__tests__/*.test.mjs"' "grep -E '^(1\\.\\.|# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms))'" 'the summary'
entry R8 "Idempotent migration script" 'dotnet ef migrations script --idempotent --project src/Uinsure.Policies.Persistence --startup-project src/Uinsure.Policies.Api -o migrate.sql'
entry R8b "Length of the migration script, in lines" 'wc -l < migrate.sql'
entry R8c "First lines of the migration script" 'head -n 9 migrate.sql'
rm -f migrate.sql
entry R9 "Bicep build" 'bicep build infrastructure/main.bicep --outfile main.json'
entry R9b "Length of the compiled template, in lines" 'wc -l < main.json'
rm -f main.json

entry R11 "Trail counts" 'for n in F0a F0b F1 F1b F2 F3 F4 F5 F6; do echo "$n findings=$(ls docs/trace/build/$n/findings 2>/dev/null | wc -l) verdicts=$(ls docs/trace/build/$n/verdicts 2>/dev/null | wc -l)"; done'

cat >> "$OUT" <<'EOF'
## Observed while capturing

- On the first read of a policy, the log shows one warning: `EntityFrameworkCore.Query[20504]`, "Compiling a query
  which loads related collections for more than one collection navigation ... no 'QuerySplittingBehavior' has been
  configured". It is a performance note, not a failure, and nothing in the code configures it.
- The README says the collection has 109 requests. The Postman CLI counts 253 requests, 109 test scripts and 246
  assertions (R6).
- The repository has no tool manifest (`.config/dotnet-tools.json`): `dotnet tool restore` printed "Cannot find a
  manifest file", yet `.githooks/pre-push` runs it before `dotnet ef`. `dotnet ef` ran from a globally installed
  tool, version 9.0.9, with a version warning (R8). The exit code of the restore was not captured.
- R10 ran with `--no-launch-profile` only. With no launch profile the run is not Development and has no
  `Database:Provider`, so start-up fails. The guide's fix is to use `--launch-profile http`.

## Not run

- The web suites (Vitest, Playwright) and the Visual Studio U9 launch profile: the ui plan is not on this branch.
- Postman app and Visual Studio screenshots: hand captures; the guide shows labelled placeholders.
- A successful renewal over HTTP: it needs a policy near its end date, and the API runs on the real clock, so it is
  covered by the acceptance tests (R4c).
- 429 and 500 over HTTP: covered by the acceptance tests; not provoked live.
EOF

rm -f src/Uinsure.Policies.Api/policies.development.db*
rm -rf "$TMPD"
