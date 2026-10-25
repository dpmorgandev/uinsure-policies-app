# Receipts: API user guide

Every command in `docs/guides/api/index.html` was run on the feat-001/N1 branch (HEAD `6bf608d2` plus the guide's
own files) on 2026-10-25, on Windows 11 under Git Bash, .NET SDK 10.0.402. The branch holds the web app and
the Visual Studio launch profile, so these runs replace the earlier ones wholesale. The script that ran them is
`docs/guides/api/run-receipts.sh`. Each entry gives the command exactly as it was run, then its output. The checkout
path is replaced by `<repo>`, and nothing else is edited except where an entry says "excerpt". The guide copies
commands and outputs from this file only. Agents may not write `docs/trace/`, so the receipts live here.

## R1 SDK version

Command: `dotnet --version`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
10.0.402
```

## R2 Build

Command: `dotnet build Uinsure.Policies.slnx -warnaserror`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: last 6 lines)

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:01.49
```

## R3 Test, whole solution

Command: `dotnet test --solution Uinsure.Policies.slnx`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  <repo>\tests\Uinsure.Policies.Services.Tests\bin\Debug\net10.0\Uinsure.Policies.Services.Tests.dll (net10.0|x64) passed (831ms)
  <repo>\tests\Uinsure.Policies.Api.Tests\bin\Debug\net10.0\Uinsure.Policies.Api.Tests.dll (net10.0|x64) passed (7s 682ms)
  <repo>\tests\Uinsure.Policies.Domain.Tests\bin\Debug\net10.0\Uinsure.Policies.Domain.Tests.dll (net10.0|x64) passed (953ms)
  <repo>\tests\Uinsure.Policies.Architecture.Tests\bin\Debug\net10.0\Uinsure.Policies.Architecture.Tests.dll (net10.0|x64) passed (1s 418ms)

  total: 652
  failed: 0
  succeeded: 652
  skipped: 0
  duration: 7s 899ms
```

## R3a Test, Domain.Tests

Command: `dotnet test --project tests/Uinsure.Policies.Domain.Tests`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 173
  failed: 0
  succeeded: 173
  skipped: 0
  duration: 993ms
```

## R3b Test, Services.Tests

Command: `dotnet test --project tests/Uinsure.Policies.Services.Tests`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 65
  failed: 0
  succeeded: 65
  skipped: 0
  duration: 973ms
```

## R3c Test, Api.Tests

Command: `dotnet test --project tests/Uinsure.Policies.Api.Tests`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 335
  failed: 0
  succeeded: 335
  skipped: 0
  duration: 8s 192ms
```

## R3d Test, Architecture.Tests

Command: `dotnet test --project tests/Uinsure.Policies.Architecture.Tests`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 79
  failed: 0
  succeeded: 79
  skipped: 0
  duration: 1s 487ms
```

## R4 One rule by trait

Command: `dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=CANCEL-1b"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  <repo>\tests\Uinsure.Policies.Services.Tests\bin\Debug\net10.0\Uinsure.Policies.Services.Tests.dll (net10.0|x64) passed (632ms)
  <repo>\tests\Uinsure.Policies.Api.Tests\bin\Debug\net10.0\Uinsure.Policies.Api.Tests.dll (net10.0|x64) passed (2s 266ms)
  <repo>\tests\Uinsure.Policies.Domain.Tests\bin\Debug\net10.0\Uinsure.Policies.Domain.Tests.dll (net10.0|x64) passed (874ms)
  <repo>\tests\Uinsure.Policies.Architecture.Tests\bin\Debug\net10.0\Uinsure.Policies.Architecture.Tests.dll (net10.0|x64) passed (627ms)

  total: 8
  failed: 0
  succeeded: 8
  skipped: 0
  duration: 2s 482ms
```

## R4b Rule coverage

Command: `dotnet test --project tests/Uinsure.Policies.Architecture.Tests -- --filter-class "*RuleCoverageTests"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 11
  failed: 0
  succeeded: 11
  skipped: 0
  duration: 1s 162ms
```

## R4c Renewal tests (a successful renewal needs a fake clock)

Command: `dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=RENEW-4"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  <repo>\tests\Uinsure.Policies.Architecture.Tests\bin\Debug\net10.0\Uinsure.Policies.Architecture.Tests.dll (net10.0|x64) passed (643ms)
  <repo>\tests\Uinsure.Policies.Domain.Tests\bin\Debug\net10.0\Uinsure.Policies.Domain.Tests.dll (net10.0|x64) passed (781ms)
  <repo>\tests\Uinsure.Policies.Api.Tests\bin\Debug\net10.0\Uinsure.Policies.Api.Tests.dll (net10.0|x64) passed (2s 317ms)
  <repo>\tests\Uinsure.Policies.Services.Tests\bin\Debug\net10.0\Uinsure.Policies.Services.Tests.dll (net10.0|x64) passed (683ms)

  total: 13
  failed: 0
  succeeded: 13
  skipped: 0
  duration: 2s 548ms
```

## R12 Web unit tests (Vitest)

Command: `npm --prefix src/Uinsure.Policies.Web run test`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary lines)
 Test Files  63 passed (63)
      Tests  421 passed (421)
   Duration  52.58s (tests 82%, environment 13%, import 5%, transform 1%)
```

## R5 Run on 5080

Command: `dotnet run --project src/Uinsure.Policies.Api --launch-profile http`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: running until stopped.

```text
(excerpt: the start-up lines)
      Now listening on: http://localhost:5080
      Application started. Press Ctrl+C to shut down.
      Hosting environment: Development
      Content root path: <repo>\src\Uinsure.Policies.Api
```

## H1 Health, live

Command: `curl -s -i http://localhost:5080/health/live`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: text/plain
Cache-Control: no-store, no-cache
Expires: Thu, 01 Jan 1970 00:00:00 GMT
Pragma: no-cache

Healthy
```

## H2 Health, ready

Command: `curl -s -i http://localhost:5080/health/ready`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: text/plain
Cache-Control: no-store, no-cache
Expires: Thu, 01 Jan 1970 00:00:00 GMT
Pragma: no-cache

Healthy
```

## O1 OpenAPI description

Command: `curl -s -o /dev/null -w "openapi status %{http_code}\n" http://localhost:5080/openapi/v1.json`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
openapi status 200
```

## O2 Scalar page

Command: `curl -s -o /dev/null -w "scalar status %{http_code}\n" http://localhost:5080/scalar/v1`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
scalar status 200
```

## C01 Sell GUIDE-001

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-001","type":"Household","startDate":"2026-11-01","amount":803.40,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /policies/GUIDE-001

{"reference":"GUIDE-001","type":"Household","status":"Pending","currentTermNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"hasClaims":false,"autoRenew":true,"policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","addressLine3":null,"postcode":"EX1 1AA"},"terms":[{"termNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"paymentReference":"PAY-3e6b82d3846e4b3784ea7086a0066122"}],"payments":[{"reference":"PAY-3e6b82d3846e4b3784ea7086a0066122","type":"Card","amount":803.40}],"refunds":[],"claims":[],"cancellation":null}
```

## F01 Sell the same reference again (409)

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-001","type":"Household","startDate":"2026-11-01","amount":803.40,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/sell-1","title":"Policy reference already exists","status":409,"detail":"A policy with reference 'GUIDE-001' already exists.","instance":"/policies","traceId":"00-c66f182bb0580d5e06ac8fa51900e081-31db072268fc0926-00","ruleId":"SELL-1","reference":"GUIDE-001"}
```

## F02 Sell with a past start date and amount 0 (422, two violations)

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-003","type":"Household","startDate":"2026-10-01","amount":0,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/sell-2","title":"Start date outside the sale window","status":422,"detail":"2 rules failed.","instance":"/policies","traceId":"00-dd425d7c34176da3dd7e592810d2ed7d-55d896e22b406256-00","ruleId":"SELL-2","violations":[{"ruleId":"SELL-2","detail":"The start date must be between 2026-10-25 and 2026-12-24."},{"ruleId":"SELL-7","detail":"The policy amount must be greater than 0."}]}
```

## F03 Sell with only a reference (400)

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GU"}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json; charset=utf-8

{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"instance":"/policies","errors":{"type":["The Type field is required."],"amount":["The Amount field is required."],"property":["The Property field is required."],"autoRenew":["The AutoRenew field is required."],"startDate":["The StartDate field is required."],"paymentMethod":["The PaymentMethod field is required."],"policyholders":["The Policyholders field is required."]},"traceId":"00-c2886f2666a7438187caa51ab61cddfb-48e9f97bb9de687a-00"}
```

## F09 Sell a duplicate reference with a past start date (409 wins over 422)

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"guide-001","type":"Household","startDate":"2026-10-01","amount":803.40,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/sell-1","title":"Policy reference already exists","status":409,"detail":"A policy with reference 'GUIDE-001' already exists.","instance":"/policies","traceId":"00-4d0b5ba6bc8277c1394cc0a338b74ec1-568966fb0d263905-00","ruleId":"SELL-1","reference":"GUIDE-001"}
```

## C02 Get, lower-case reference

Command: `curl -s -i http://localhost:5080/policies/guide-001`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","type":"Household","status":"Pending","currentTermNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"hasClaims":false,"autoRenew":true,"policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","addressLine3":null,"postcode":"EX1 1AA"},"terms":[{"termNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"paymentReference":"PAY-3e6b82d3846e4b3784ea7086a0066122"}],"payments":[{"reference":"PAY-3e6b82d3846e4b3784ea7086a0066122","type":"Card","amount":803.40}],"refunds":[],"claims":[],"cancellation":null}
```

## F04 Get an unknown reference (404)

Command: `curl -s -i http://localhost:5080/policies/NO-SUCH-POLICY`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 404 Not Found
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/get-1","title":"Policy not found","status":404,"detail":"No policy with reference 'NO-SUCH-POLICY'.","instance":"/policies/NO-SUCH-POLICY","traceId":"00-f6e3a7d7f44869b8afdd1f8d48d80df5-6cb564719bf094d1-00","ruleId":"GET-1","reference":"NO-SUCH-POLICY"}
```

## F05 Get with an unknown query key (400)

Command: `curl -s -i "http://localhost:5080/policies/GUIDE-001?reference=X"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json; charset=utf-8

{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"instance":"/policies/GUIDE-001","errors":{"reference":["Unknown query parameter."]},"traceId":"00-313edcd565faceb8728a5f80b0f095fe-e0d5b258e3099dbc-00"}
```

## C03 Quote 2026-11-10 (cooling-off)

Command: `curl -s -i "http://localhost:5080/policies/GUIDE-001/cancellation-quote?cancellationDate=2026-11-10"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","cancellationDate":"2026-11-10","ruleApplied":"CANCEL-1b","totalRefund":803.40,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1b","daysInTerm":365,"daysUsed":10,"unusedDays":355,"refundAmount":803.40}],"refunds":[{"type":"Card","amount":803.40,"paymentReference":"PAY-3e6b82d3846e4b3784ea7086a0066122"}],"quotedOn":"2026-10-25"}
```

## C04 Quote 2027-04-30 (pro rata)

Command: `curl -s -i "http://localhost:5080/policies/GUIDE-001/cancellation-quote?cancellationDate=2027-04-30"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","cancellationDate":"2027-04-30","ruleApplied":"CANCEL-1c","totalRefund":405.00,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1c","daysInTerm":365,"daysUsed":181,"unusedDays":184,"refundAmount":405.00}],"refunds":[{"type":"Card","amount":405.00,"paymentReference":"PAY-3e6b82d3846e4b3784ea7086a0066122"}],"quotedOn":"2026-10-25"}
```

## C05 Cancel on 2026-11-10

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-001/cancellation -H "Content-Type: application/json" -d '{"cancellationDate":"2026-11-10"}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","cancellationDate":"2026-11-10","ruleApplied":"CANCEL-1b","totalRefund":803.40,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1b","daysInTerm":365,"daysUsed":10,"unusedDays":355,"refundAmount":803.40}],"refunds":[{"reference":"REF-f85cc5de8f26490fa92129ad1fa4e8c5","type":"Card","amount":803.40,"paymentReference":"PAY-3e6b82d3846e4b3784ea7086a0066122"}]}
```

## C06 Cancel again (409)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-001/cancellation`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/cancel-4","title":"Policy already cancelled","status":409,"detail":"The policy was already cancelled on 2026-11-10.","instance":"/policies/GUIDE-001/cancellation","traceId":"00-834ec333bb3c73ca16050e9cfab120e9-fece7dd538b051d0-00","ruleId":"CANCEL-4","cancellationDate":"2026-11-10"}
```

## C08 Sell GUIDE-002, starting today

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-002","type":"BuyToLet","startDate":"2026-10-25","amount":1200.00,"autoRenew":false,"paymentMethod":"DirectDebit","policyholders":[{"firstName":"Grace","lastName":"Hopper","dateOfBirth":"1990-12-09"}],"property":{"addressLine1":"2 Sample Road","postcode":"EX2 2BB"}}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /policies/GUIDE-002

{"reference":"GUIDE-002","type":"BuyToLet","status":"Active","currentTermNumber":1,"startDate":"2026-10-25","endDate":"2027-10-24","amount":1200.00,"hasClaims":false,"autoRenew":false,"policyholders":[{"firstName":"Grace","lastName":"Hopper","dateOfBirth":"1990-12-09"}],"property":{"addressLine1":"2 Sample Road","addressLine2":null,"addressLine3":null,"postcode":"EX2 2BB"},"terms":[{"termNumber":1,"startDate":"2026-10-25","endDate":"2027-10-24","amount":1200.00,"paymentReference":"PAY-0bcdeff62189401c98fed43d783c842e"}],"payments":[{"reference":"PAY-0bcdeff62189401c98fed43d783c842e","type":"DirectDebit","amount":1200.00}],"refunds":[],"claims":[],"cancellation":null}
```

## F08 Cancel for yesterday (422)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/cancellation -H "Content-Type: application/json" -d '{"cancellationDate":"2026-10-24"}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/cancel-3","title":"Cancellation date in the past","status":422,"detail":"The cancellation date cannot be in the past.","instance":"/policies/GUIDE-002/cancellation","traceId":"00-a01771ccb715cac17879cc146f9658d3-e89072f53e919917-00","ruleId":"CANCEL-3","today":"2026-10-25","violations":[{"ruleId":"CANCEL-3","detail":"The cancellation date cannot be in the past."}]}
```

## C07 Quote GUIDE-002 for 2027-04-30, before any claim

Command: `curl -s -i "http://localhost:5080/policies/GUIDE-002/cancellation-quote?cancellationDate=2027-04-30"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-002","cancellationDate":"2027-04-30","ruleApplied":"CANCEL-1c","totalRefund":581.92,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1c","daysInTerm":365,"daysUsed":188,"unusedDays":177,"refundAmount":581.92}],"refunds":[{"type":"DirectDebit","amount":581.92,"paymentReference":"PAY-0bcdeff62189401c98fed43d783c842e"}],"quotedOn":"2026-10-25"}
```

## C09 Claim for today

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/claims -H "Content-Type: application/json" -d '{"claimDate":"2026-10-25","description":"Burst pipe"}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /policies/GUIDE-002

{"reference":"CLM-GUIDE-002-1","policyReference":"GUIDE-002","claimDate":"2026-10-25","description":"Burst pipe","hasClaims":true}
```

## C10 Quote after the claim

Command: `curl -s -i "http://localhost:5080/policies/GUIDE-002/cancellation-quote?cancellationDate=2027-04-30"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-002","cancellationDate":"2027-04-30","ruleApplied":"COULD-2","totalRefund":0.00,"terms":[{"termNumber":1,"ruleApplied":"COULD-2","daysInTerm":365,"daysUsed":188,"unusedDays":177,"refundAmount":0.00}],"refunds":[],"quotedOn":"2026-10-25"}
```

## F06 Claim for tomorrow (422)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/claims -H "Content-Type: application/json" -d '{"claimDate":"2026-10-26"}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/could-2a","title":"Claim date in the future","status":422,"detail":"The claim date cannot be in the future.","instance":"/policies/GUIDE-002/claims","traceId":"00-4fedf139ee97b7cda5a2a3956fa771af-fb8571469aaaa359-00","ruleId":"COULD-2a","today":"2026-10-25","violations":[{"ruleId":"COULD-2a","detail":"The claim date cannot be in the future."}]}
```

## F07 Claim on the cancelled policy (409)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-001/claims -H "Content-Type: application/json" -d '{"claimDate":"2026-11-10"}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/could-2c","title":"Claim on a cancelled policy","status":409,"detail":"The policy was cancelled on 2026-11-10, so a claim cannot be recorded.","instance":"/policies/GUIDE-001/claims","traceId":"00-4e27ceb1f25124890d8c893d7ce77f63-167e582836c17253-00","ruleId":"COULD-2c","cancellationDate":"2026-11-10"}
```

## C11 Renew too early (422)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/renewals -H "Content-Type: application/json" -d '{"amount":1250.00}'`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/renew-1-2","title":"Outside the renewal window","status":422,"detail":"A policy can be renewed from 2027-09-24 to 2027-10-24.","instance":"/policies/GUIDE-002/renewals","traceId":"00-73c6ea53cc4839eb91533522a86cf489-a3ab46fc4cd1126d-00","ruleId":"RENEW-1/2","windowStart":"2027-09-24","windowEnd":"2027-10-24","violations":[{"ruleId":"RENEW-1/2","detail":"A policy can be renewed from 2027-09-24 to 2027-10-24."}]}
```

## R6 Postman CLI, one folder (reused F8 receipt, not run on this machine)

Command: `postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json -i "F2 Retrieve"`

Date: 2026-10-23. Branch: feature/build/F8. Exit code: 0. Reused and not rerun: the Postman CLI stops on this machine with a Private Cloud manifest error. The F8 run added `--env-var baseUrl=http://localhost:5096`, because its API was on that port. The output is from `docs/guides/ui/run-output.json`.

```text
(excerpt: the summary table)
---------------------------------------------------------------------
|                         |           executed |             failed |
--------------------------+--------------------+---------------------
|              iterations |                  1 |                  0 |
--------------------------+--------------------+---------------------
|                requests |                 25 |                  0 |
--------------------------+--------------------+---------------------
|            test-scripts |                 14 |                  0 |
--------------------------+--------------------+---------------------
|      prerequest-scripts |                 19 |                  0 |
--------------------------+--------------------+---------------------
|              assertions |                 26 |                  0 |
---------------------------------------------------------------------
| total run duration: 1867 ms                                       |
---------------------------------------------------------------------
```

## R10 Run with no launch profile (a problem met while capturing)

Command: `dotnet run --project src/Uinsure.Policies.Api --no-launch-profile`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 127.

```text
(excerpt: the exception line)
Unhandled exception. Microsoft.Extensions.Options.OptionsValidationException: Database:Provider must be Sqlite or SqlServer.
```

## R7 Harness self-test

Command: `node --test ".claude/hooks/__tests__/*.test.mjs"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
(excerpt: the summary)
1..234
# tests 234
# suites 0
# pass 234
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 57214.6363
```

## R8a Install the EF tools at the runtime's version

Command: `dotnet tool update --global dotnet-ef --version 10.0.13`

Date: 2026-10-25. Branch: feature/feat-001/N1 at a9c3f83b. Exit code: 0.

```text
Tool 'dotnet-ef' was successfully updated from version '9.0.9' to version '10.0.13'.
```

## R8 Idempotent migration script

Command: `dotnet ef migrations script --idempotent --project src/Uinsure.Policies.Persistence --startup-project src/Uinsure.Policies.Api -o migrate.sql`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 947b66ba. Exit code: 0.

```text
Build started...
Build succeeded.
```

## R8b Length of the migration script, in lines

Command: `wc -l < migrate.sql`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 947b66ba. Exit code: 0.

```text
242
```

## R8c First lines of the migration script

Command: `head -n 9 migrate.sql`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 947b66ba. Exit code: 0.

```text
(excerpt: the byte-order mark on line 1 dropped)
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO
```

## R9a Bicep version

Command: `bicep --version`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
Bicep CLI version 0.48.1 (cec7951cf6)
```

## R9 Bicep build

Command: `bicep build infrastructure/main.bicep --outfile main.json`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text

```

## R9b Length of the compiled template, in lines

Command: `wc -l < main.json`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
905
```

## R11 Trail counts

Command: `for n in $(ls docs/trace/build); do echo "$n findings=$(ls docs/trace/build/$n/findings 2>/dev/null | wc -l) verdicts=$(ls docs/trace/build/$n/verdicts 2>/dev/null | wc -l)"; done`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 6bf608d2. Exit code: 0.

```text
F0a findings=0 verdicts=0
F0b findings=2 verdicts=5
F1 findings=3 verdicts=4
F1b findings=1 verdicts=4
F2 findings=2 verdicts=6
F3 findings=1 verdicts=6
F4 findings=0 verdicts=6
F5 findings=2 verdicts=12
F6 findings=4 verdicts=8
F7 findings=4 verdicts=4
F8 findings=3 verdicts=6
```

## R13 The pre-push hook

Command: `sh .githooks/pre-push < /dev/null; echo "pre-push exit $?"`

Date: 2026-10-25. Branch: feature/feat-001/N1 at 947b66ba. Exit code: 0.

```text
(excerpt: the last 12 lines)
  <repo>\tests\Uinsure.Policies.Architecture.Tests\bin\Release\net10.0\Uinsure.Policies.Architecture.Tests.dll (net10.0|x64) passed (1s 486ms)
  <repo>\tests\Uinsure.Policies.Api.Tests\bin\Release\net10.0\Uinsure.Policies.Api.Tests.dll (net10.0|x64) passed (7s 591ms)
  <repo>\tests\Uinsure.Policies.Services.Tests\bin\Release\net10.0\Uinsure.Policies.Services.Tests.dll (net10.0|x64) passed (924ms)

  total: 652
  failed: 0
  succeeded: 652
  skipped: 0
  duration: 7s 828ms
Build started...
Build succeeded.
pre-push exit 0
```

## Observed while capturing

- On the first read of a policy, the log shows one warning: `EntityFrameworkCore.Query[20504]`, "Compiling a query
  which loads related collections for more than one collection navigation ... no 'QuerySplittingBehavior' has been
  configured". It is a performance note, not a failure, and nothing in the code configures it.
- The repository has no tool manifest (`.config/dotnet-tools.json`): `dotnet tool restore` printed "Cannot find a
  manifest file" and exited 0, so `.githooks/pre-push` goes on to `dotnet ef`, which then needs a globally installed
  tool. The first capture ran with a global tool at version 9.0.9, which printed a version warning. R8a updates it to
  10.0.13, the runtime's version, so R8 and R13 print no warning. Each entry's own line gives the sha it ran at.
- At 6bf608d2 (the commit R1 to R12 were captured at), one architecture test failed:
  `WebProjectLocationTests.No_live_tracked_file_names_the_old_web_paths`, because `docs/guides/ui/run-output.json:45`
  quoted an e2e test title that names the old web test folder. That file belongs to the UI guide, not this one.
  R3, R3d and R13 (the hook runs the whole suite) were run then with that one quoted path changed in the working tree
  (and restored afterwards), so they show the suite as it stands once the UI guide's file is corrected. Run as
  committed at 6bf608d2, R3 printed total 652, failed 1, succeeded 651, and R3d printed total 79, failed 1, succeeded 78.
  Commit da7ac832 fixed the file, so the suite passes as committed from there on.
- R10 ran with `--no-launch-profile` only. With no launch profile the run is not Development and has no
  `Database:Provider`, so start-up stops with an error. The guide's fix is to use `--launch-profile http`.

## Not run

- The Postman CLI (R6 is the F8 receipt), the Postman app and Visual Studio screenshots: hand captures; the guide
  shows labelled placeholders.
- The Playwright end-to-end suite: it is the UI guide's evidence and takes about an hour.
- A successful renewal over HTTP: it needs a policy near its end date, and the API runs on the real clock, so it is
  covered by the acceptance tests (R4c).
- 429 and 500 over HTTP: covered by the acceptance tests; not provoked live.
