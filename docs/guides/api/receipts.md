# F7 receipts: API user guide

Every command in `docs/guides/api/index.html` was run on the F7 branch (HEAD `8dbfdef` plus the guide's own files)
on 2026-10-23, on Windows 11 under Git Bash, .NET SDK 10.0.402. The script that ran them is
`docs/guides/api/run-receipts.sh`. Each entry gives the command exactly as it was run, then its output. The checkout
path is replaced by `<repo>`, and nothing else is edited except where an entry says "excerpt". The guide copies
commands and outputs from this file only.

The brief asked for these in `docs/trace/build/F7/`, which agents may not write. They are here, and the
orchestrator can move them.

## R1 SDK version

Command: `dotnet --version`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
10.0.402
```

## R2 Build

Command: `dotnet build Uinsure.Policies.slnx -warnaserror`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: last 6 lines)

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:03.22
```

## R3 Test, whole solution

Command: `dotnet test --solution Uinsure.Policies.slnx`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  <repo>\tests\Uinsure.Policies.Architecture.Tests\bin\Debug\net10.0\Uinsure.Policies.Architecture.Tests.dll (net10.0|x64) passed (1s 445ms)
  <repo>\tests\Uinsure.Policies.Services.Tests\bin\Debug\net10.0\Uinsure.Policies.Services.Tests.dll (net10.0|x64) passed (926ms)
  <repo>\tests\Uinsure.Policies.Domain.Tests\bin\Debug\net10.0\Uinsure.Policies.Domain.Tests.dll (net10.0|x64) passed (1s 045ms)
  <repo>\tests\Uinsure.Policies.Api.Tests\bin\Debug\net10.0\Uinsure.Policies.Api.Tests.dll (net10.0|x64) passed (11s 972ms)

  total: 637
  failed: 0
  succeeded: 637
  skipped: 0
  duration: 12s 325ms
```

## R3a Test, Domain.Tests

Command: `dotnet test --project tests/Uinsure.Policies.Domain.Tests`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 173
  failed: 0
  succeeded: 173
  skipped: 0
  duration: 1s 056ms
```

## R3b Test, Services.Tests

Command: `dotnet test --project tests/Uinsure.Policies.Services.Tests`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 65
  failed: 0
  succeeded: 65
  skipped: 0
  duration: 988ms
```

## R3c Test, Api.Tests

Command: `dotnet test --project tests/Uinsure.Policies.Api.Tests`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 332
  failed: 0
  succeeded: 332
  skipped: 0
  duration: 11s 719ms
```

## R3d Test, Architecture.Tests

Command: `dotnet test --project tests/Uinsure.Policies.Architecture.Tests`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 67
  failed: 0
  succeeded: 67
  skipped: 0
  duration: 1s 559ms
```

## R4 One rule by trait

Command: `dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=CANCEL-1b"`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  <repo>\tests\Uinsure.Policies.Services.Tests\bin\Debug\net10.0\Uinsure.Policies.Services.Tests.dll (net10.0|x64) passed (651ms)
  <repo>\tests\Uinsure.Policies.Architecture.Tests\bin\Debug\net10.0\Uinsure.Policies.Architecture.Tests.dll (net10.0|x64) passed (650ms)
  <repo>\tests\Uinsure.Policies.Domain.Tests\bin\Debug\net10.0\Uinsure.Policies.Domain.Tests.dll (net10.0|x64) passed (767ms)
  <repo>\tests\Uinsure.Policies.Api.Tests\bin\Debug\net10.0\Uinsure.Policies.Api.Tests.dll (net10.0|x64) passed (2s 463ms)

  total: 8
  failed: 0
  succeeded: 8
  skipped: 0
  duration: 2s 772ms
```

## R4b Rule coverage

Command: `dotnet test --project tests/Uinsure.Policies.Architecture.Tests -- --filter-class "*RuleCoverageTests"`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  total: 11
  failed: 0
  succeeded: 11
  skipped: 0
  duration: 1s 155ms
```

## R4c Renewal tests (a successful renewal needs a fake clock)

Command: `dotnet test --solution Uinsure.Policies.slnx -- --filter-trait "Rule=RENEW-4"`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary)
Test run summary: Passed!
  <repo>\tests\Uinsure.Policies.Services.Tests\bin\Debug\net10.0\Uinsure.Policies.Services.Tests.dll (net10.0|x64) passed (641ms)
  <repo>\tests\Uinsure.Policies.Architecture.Tests\bin\Debug\net10.0\Uinsure.Policies.Architecture.Tests.dll (net10.0|x64) passed (733ms)
  <repo>\tests\Uinsure.Policies.Api.Tests\bin\Debug\net10.0\Uinsure.Policies.Api.Tests.dll (net10.0|x64) passed (2s 374ms)
  <repo>\tests\Uinsure.Policies.Domain.Tests\bin\Debug\net10.0\Uinsure.Policies.Domain.Tests.dll (net10.0|x64) passed (717ms)

  total: 13
  failed: 0
  succeeded: 13
  skipped: 0
  duration: 2s 683ms
```

## R5 Run on 5080

Command: `dotnet run --project src/Uinsure.Policies.Api --launch-profile http`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: running until stopped.

```text
(excerpt: the start-up lines)
      Now listening on: http://localhost:5080
      Application started. Press Ctrl+C to shut down.
      Hosting environment: Development
      Content root path: <repo>\src\Uinsure.Policies.Api
```

## H1 Health, live

Command: `curl -s -i http://localhost:5080/health/live`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

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

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

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

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
openapi status 200
```

## O2 Scalar page

Command: `curl -s -o /dev/null -w "scalar status %{http_code}\n" http://localhost:5080/scalar/v1`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
scalar status 200
```

## C01 Sell GUIDE-001

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-001","type":"Household","startDate":"2026-11-01","amount":803.40,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /policies/GUIDE-001

{"reference":"GUIDE-001","type":"Household","status":"Pending","currentTermNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"hasClaims":false,"autoRenew":true,"policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","addressLine3":null,"postcode":"EX1 1AA"},"terms":[{"termNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"paymentReference":"PAY-3097e50a8db548459a30f7565f15e490"}],"payments":[{"reference":"PAY-3097e50a8db548459a30f7565f15e490","type":"Card","amount":803.40}],"refunds":[],"claims":[],"cancellation":null}
```

## F01 Sell the same reference again (409)

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-001","type":"Household","startDate":"2026-11-01","amount":803.40,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/sell-1","title":"Policy reference already exists","status":409,"detail":"A policy with reference 'GUIDE-001' already exists.","instance":"/policies","traceId":"00-91d2bcb7ac25f9cf4fc1f04a1dbf689a-2f45dea6f9ebeaf5-00","ruleId":"SELL-1","reference":"GUIDE-001"}
```

## F02 Sell with a past start date and amount 0 (422, two violations)

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-003","type":"Household","startDate":"2026-10-01","amount":0,"autoRenew":true,"paymentMethod":"Card","policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","postcode":"EX1 1AA"}}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/sell-2","title":"Start date outside the sale window","status":422,"detail":"2 rules failed.","instance":"/policies","traceId":"00-ae4c0ef28ad55e1fe676f5d306edc8f4-c63f419321bfdf33-00","ruleId":"SELL-2","violations":[{"ruleId":"SELL-2","detail":"The start date must be between 2026-10-23 and 2026-12-22."},{"ruleId":"SELL-7","detail":"The policy amount must be greater than 0."}]}
```

## F03 Sell with only a reference (400)

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GU"}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json; charset=utf-8

{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"instance":"/policies","errors":{"type":["The Type field is required."],"amount":["The Amount field is required."],"property":["The Property field is required."],"autoRenew":["The AutoRenew field is required."],"startDate":["The StartDate field is required."],"paymentMethod":["The PaymentMethod field is required."],"policyholders":["The Policyholders field is required."]},"traceId":"00-e32452ddfd4cc23700224f35dde2abbd-03e4a11a2900ca04-00"}
```

## C02 Get, lower-case reference

Command: `curl -s -i http://localhost:5080/policies/guide-001`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","type":"Household","status":"Pending","currentTermNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"hasClaims":false,"autoRenew":true,"policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","addressLine3":null,"postcode":"EX1 1AA"},"terms":[{"termNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"paymentReference":"PAY-3097e50a8db548459a30f7565f15e490"}],"payments":[{"reference":"PAY-3097e50a8db548459a30f7565f15e490","type":"Card","amount":803.40}],"refunds":[],"claims":[],"cancellation":null}
```

## F04 Get an unknown reference (404)

Command: `curl -s -i http://localhost:5080/policies/NO-SUCH-POLICY`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 404 Not Found
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/get-1","title":"Policy not found","status":404,"detail":"No policy with reference 'NO-SUCH-POLICY'.","instance":"/policies/NO-SUCH-POLICY","traceId":"00-18751e52339248f459d2c8c79be8848f-c14b0110d7ae5084-00","ruleId":"GET-1","reference":"NO-SUCH-POLICY"}
```

## F05 Get with an unknown query key (400)

Command: `curl -s -i "http://localhost:5080/policies/GUIDE-001?reference=X"`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json; charset=utf-8

{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"instance":"/policies/GUIDE-001","errors":{"reference":["Unknown query parameter."]},"traceId":"00-43d622863ad1154be23cf704eebdc71d-cd2f3a032894236d-00"}
```

## C03 Quote 2026-11-10 (cooling-off)

Command: `curl -s -i "http://localhost:5080/policies/GUIDE-001/cancellation-quote?cancellationDate=2026-11-10"`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","cancellationDate":"2026-11-10","ruleApplied":"CANCEL-1b","totalRefund":803.40,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1b","daysInTerm":365,"daysUsed":10,"unusedDays":355,"refundAmount":803.40}],"refunds":[{"type":"Card","amount":803.40,"paymentReference":"PAY-3097e50a8db548459a30f7565f15e490"}],"quotedOn":"2026-10-23"}
```

## C04 Quote 2027-04-30 (pro rata)

Command: `curl -s -i "http://localhost:5080/policies/GUIDE-001/cancellation-quote?cancellationDate=2027-04-30"`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","cancellationDate":"2027-04-30","ruleApplied":"CANCEL-1c","totalRefund":405.00,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1c","daysInTerm":365,"daysUsed":181,"unusedDays":184,"refundAmount":405.00}],"refunds":[{"type":"Card","amount":405.00,"paymentReference":"PAY-3097e50a8db548459a30f7565f15e490"}],"quotedOn":"2026-10-23"}
```

## C05 Cancel on 2026-11-10

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-001/cancellation -H "Content-Type: application/json" -d '{"cancellationDate":"2026-11-10"}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","cancellationDate":"2026-11-10","ruleApplied":"CANCEL-1b","totalRefund":803.40,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1b","daysInTerm":365,"daysUsed":10,"unusedDays":355,"refundAmount":803.40}],"refunds":[{"reference":"REF-0315317e778347a59596fbd840baa39a","type":"Card","amount":803.40,"paymentReference":"PAY-3097e50a8db548459a30f7565f15e490"}]}
```

## C06 Cancel again (409)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-001/cancellation`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/cancel-4","title":"Policy already cancelled","status":409,"detail":"The policy was already cancelled on 2026-11-10.","instance":"/policies/GUIDE-001/cancellation","traceId":"00-e6603ec7f754b61da89d65e5fa52cc34-cc7f775c4fed4be0-00","ruleId":"CANCEL-4","cancellationDate":"2026-11-10"}
```

## C08 Sell GUIDE-002, starting today

Command: `curl -s -i -X POST http://localhost:5080/policies -H "Content-Type: application/json" -d '{"reference":"GUIDE-002","type":"BuyToLet","startDate":"2026-10-23","amount":1200.00,"autoRenew":false,"paymentMethod":"DirectDebit","policyholders":[{"firstName":"Grace","lastName":"Hopper","dateOfBirth":"1990-12-09"}],"property":{"addressLine1":"2 Sample Road","postcode":"EX2 2BB"}}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /policies/GUIDE-002

{"reference":"GUIDE-002","type":"BuyToLet","status":"Active","currentTermNumber":1,"startDate":"2026-10-23","endDate":"2027-10-22","amount":1200.00,"hasClaims":false,"autoRenew":false,"policyholders":[{"firstName":"Grace","lastName":"Hopper","dateOfBirth":"1990-12-09"}],"property":{"addressLine1":"2 Sample Road","addressLine2":null,"addressLine3":null,"postcode":"EX2 2BB"},"terms":[{"termNumber":1,"startDate":"2026-10-23","endDate":"2027-10-22","amount":1200.00,"paymentReference":"PAY-bd2f5c1b560b40928acfb2eabb9c087f"}],"payments":[{"reference":"PAY-bd2f5c1b560b40928acfb2eabb9c087f","type":"DirectDebit","amount":1200.00}],"refunds":[],"claims":[],"cancellation":null}
```

## F08 Cancel for yesterday (422)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/cancellation -H "Content-Type: application/json" -d '{"cancellationDate":"2026-10-22"}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/cancel-3","title":"Cancellation date in the past","status":422,"detail":"The cancellation date cannot be in the past.","instance":"/policies/GUIDE-002/cancellation","traceId":"00-6562c7bacca957c9f794d8d3952cee59-080ec87a332c5a22-00","ruleId":"CANCEL-3","today":"2026-10-23","violations":[{"ruleId":"CANCEL-3","detail":"The cancellation date cannot be in the past."}]}
```

## C09 Claim for today

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/claims -H "Content-Type: application/json" -d '{"claimDate":"2026-10-23","description":"Burst pipe"}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /policies/GUIDE-002

{"reference":"CLM-GUIDE-002-1","policyReference":"GUIDE-002","claimDate":"2026-10-23","description":"Burst pipe","hasClaims":true}
```

## C10 Quote after the claim

Command: `curl -s -i "http://localhost:5080/policies/GUIDE-002/cancellation-quote?cancellationDate=2027-04-30"`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-002","cancellationDate":"2027-04-30","ruleApplied":"COULD-2","totalRefund":0.00,"terms":[{"termNumber":1,"ruleApplied":"COULD-2","daysInTerm":365,"daysUsed":190,"unusedDays":175,"refundAmount":0.00}],"refunds":[],"quotedOn":"2026-10-23"}
```

## F06 Claim for tomorrow (422)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/claims -H "Content-Type: application/json" -d '{"claimDate":"2026-10-24"}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/could-2a","title":"Claim date in the future","status":422,"detail":"The claim date cannot be in the future.","instance":"/policies/GUIDE-002/claims","traceId":"00-6d27cc934ee58f1a3f06f5185118d5a8-ced53f2c946ff9b2-00","ruleId":"COULD-2a","today":"2026-10-23","violations":[{"ruleId":"COULD-2a","detail":"The claim date cannot be in the future."}]}
```

## F07 Claim on the cancelled policy (409)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-001/claims -H "Content-Type: application/json" -d '{"claimDate":"2026-11-10"}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/could-2c","title":"Claim on a cancelled policy","status":409,"detail":"The policy was cancelled on 2026-11-10, so a claim cannot be recorded.","instance":"/policies/GUIDE-001/claims","traceId":"00-1bb27aca1ef8cf790d622dc20ee4a181-48576e10390ebdb5-00","ruleId":"COULD-2c","cancellationDate":"2026-11-10"}
```

## C11 Renew too early (422)

Command: `curl -s -i -X POST http://localhost:5080/policies/GUIDE-002/renewals -H "Content-Type: application/json" -d '{"amount":1250.00}'`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the Date, Server, Transfer-Encoding and Content-Length headers left out)
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/renew-1-2","title":"Outside the renewal window","status":422,"detail":"A policy can be renewed from 2027-09-22 to 2027-10-22.","instance":"/policies/GUIDE-002/renewals","traceId":"00-b0407f4d1b0fceb966cb48e996653a64-31b36277c47ed14d-00","ruleId":"RENEW-1/2","windowStart":"2027-09-22","windowEnd":"2027-10-22","violations":[{"ruleId":"RENEW-1/2","detail":"A policy can be renewed from 2027-09-22 to 2027-10-22."}]}
```

## R6 Postman CLI, whole collection

Command: `postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary table)
|              iterations |                  1 |                  0 |
--------------------------+--------------------+---------------------
|                requests |                253 |                  0 |
--------------------------+--------------------+---------------------
|            test-scripts |                109 |                  0 |
--------------------------+--------------------+---------------------
|      prerequest-scripts |                114 |                  0 |
--------------------------+--------------------+---------------------
|              assertions |                246 |                  0 |
---------------------------------------------------------------------
| total run duration: 17.1 s                                        |
---------------------------------------------------------------------
| total data received: 128.5 KB (approx)                            |
---------------------------------------------------------------------
| average response time: 22 ms [min: 10 ms, max: 97 ms, s.d.: 8 ms] |
---------------------------------------------------------------------
Postman credentials are required for publishing run details to Postman cloud.
Please specify it by using the `postman login` command
```

## R6b Postman CLI, one folder

Command: `postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json -i "F3 Cancel"`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary table)
|              iterations |                  1 |                 0 |
--------------------------+--------------------+--------------------
|                requests |                 87 |                 0 |
--------------------------+--------------------+--------------------
|            test-scripts |                 33 |                 0 |
--------------------------+--------------------+--------------------
|      prerequest-scripts |                 33 |                 0 |
--------------------------+--------------------+--------------------
|              assertions |                 82 |                 0 |
--------------------------------------------------------------------
| total run duration: 5.6 s                                        |
--------------------------------------------------------------------
| total data received: 46.15 KB (approx)                           |
--------------------------------------------------------------------
| average response time: 20 ms [min: 8 ms, max: 53 ms, s.d.: 6 ms] |
--------------------------------------------------------------------
Postman credentials are required for publishing run details to Postman cloud.
Please specify it by using the `postman login` command
```

## R10 Run with no launch profile (a problem met while capturing)

Command: `timeout 60 dotnet run --project src/Uinsure.Policies.Api --no-launch-profile`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 127.

```text
(excerpt: the exception line)
Unhandled exception. Microsoft.Extensions.Options.OptionsValidationException: Database:Provider must be Sqlite or SqlServer.
```

## R7 Harness self-test

Command: `node --test ".claude/hooks/__tests__/*.test.mjs"`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
(excerpt: the summary)
1..221
# tests 221
# suites 0
# pass 221
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 94372.4579
```

## R8 Idempotent migration script

Command: `dotnet ef migrations script --idempotent --project src/Uinsure.Policies.Persistence --startup-project src/Uinsure.Policies.Api -o migrate.sql`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
Build started...
Build succeeded.
The Entity Framework tools version '9.0.9' is older than that of the runtime '10.0.13'. Update the tools for the latest features and bug fixes. See https://aka.ms/AAc1fbw for more information.
```

## R8b Length of the migration script, in lines

Command: `wc -l < migrate.sql`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
242
```

## R8c First lines of the migration script

Command: `head -n 9 migrate.sql`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
﻿IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO
```

## R9 Bicep build

Command: `bicep build infrastructure/main.bicep --outfile main.json`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text

```

## R9b Length of the compiled template, in lines

Command: `wc -l < main.json`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

```text
780
```

## R11 Trail counts

Command: `for n in F0a F0b F1 F1b F2 F3 F4 F5 F6; do echo "$n findings=$(ls docs/trace/build/$n/findings 2>/dev/null | wc -l) verdicts=$(ls docs/trace/build/$n/verdicts 2>/dev/null | wc -l)"; done`

Date: 2026-10-23. Branch: feature/build/F7 at 8dbfdef. Exit code: 0.

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
```

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
