# F7 receipts: API user guide

Every command in `docs/guides/api/index.html` was run on the F7 branch (HEAD `70a0cec` plus the guide's own files)
on 2026-10-23, on Windows 11, .NET SDK 10.0.402. The output below is pasted from those runs. The checkout path is
replaced by `<repo>`, and nothing else is edited except where an entry says "excerpt". The guide copies only from
this file.

The brief asked for these in `docs/trace/build/F7/`, which agents may not write. They are here, and the
orchestrator can move them.

## R1 SDK version

Command: `dotnet --version`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
10.0.402
```

## R2 Build

Command: `dotnet build Uinsure.Policies.slnx -warnaserror`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
(excerpt: last 6 lines)

Time Elapsed 00:00:12.14

real	0m12.656s
user	0m0.015s
sys	0m0.015s
```

## R3 Test, whole solution

Command: `dotnet test --solution Uinsure.Policies.slnx`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
(excerpt: the summary)
  tests\Uinsure.Policies.Services.Tests\bin\Debug\net10.0\Uinsure.Policies.Services.Tests.dll (net10.0|x64) passed (906ms)
  tests\Uinsure.Policies.Architecture.Tests\bin\Debug\net10.0\Uinsure.Policies.Architecture.Tests.dll (net10.0|x64) passed (1s 511ms)
  tests\Uinsure.Policies.Domain.Tests\bin\Debug\net10.0\Uinsure.Policies.Domain.Tests.dll (net10.0|x64) passed (921ms)
  tests\Uinsure.Policies.Api.Tests\bin\Debug\net10.0\Uinsure.Policies.Api.Tests.dll (net10.0|x64) passed (10s 319ms)

  total: 637
  failed: 0
  succeeded: 637
  skipped: 0
  duration: 10s 753ms

real	0m16.576s
user	0m0.000s
sys	0m0.030s
```

## R3b Test, one project at a time

Command: `dotnet test --project tests/Uinsure.Policies.<Project>.Tests --no-build`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
Domain.Tests    total: 173  failed: 0  succeeded: 173  skipped: 0  duration: 1s 062ms
Services.Tests  total: 65   failed: 0  succeeded: 65   skipped: 0  duration: 1s 077ms
Api.Tests       total: 332  failed: 0  succeeded: 332  skipped: 0  duration: 9s 476ms
Architecture    total: 67   failed: 0  succeeded: 67   skipped: 0  duration: 1s 482ms
```

## R4 One rule by trait

Command: `dotnet test --solution Uinsure.Policies.slnx --no-build -- --filter-trait "Rule=CANCEL-1b"`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
Test run summary: Passed!
  tests\Uinsure.Policies.Services.Tests\bin\Debug\net10.0\Uinsure.Policies.Services.Tests.dll (net10.0|x64) passed (644ms)
  tests\Uinsure.Policies.Architecture.Tests\bin\Debug\net10.0\Uinsure.Policies.Architecture.Tests.dll (net10.0|x64) passed (650ms)
  tests\Uinsure.Policies.Api.Tests\bin\Debug\net10.0\Uinsure.Policies.Api.Tests.dll (net10.0|x64) passed (2s 625ms)
  tests\Uinsure.Policies.Domain.Tests\bin\Debug\net10.0\Uinsure.Policies.Domain.Tests.dll (net10.0|x64) passed (809ms)

  total: 8
  failed: 0
  succeeded: 8
  skipped: 0
  duration: 2s 923ms
```

## R4b Rule coverage

Command: `dotnet test --project tests/Uinsure.Policies.Architecture.Tests --no-build -- --filter-class "*RuleCoverageTests"`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
  total: 11
  failed: 0
  succeeded: 11
```

## R4c Renewal tests (a successful renewal needs a fake clock)

Command: `dotnet test --solution Uinsure.Policies.slnx --no-build -- --filter-trait "Rule=RENEW-4"`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
  total: 13
  succeeded: 13
```

## R5 Run on 5080

Command: `dotnet run --project src/Uinsure.Policies.Api --launch-profile http --no-build`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: running until stopped.

```text
(excerpt: the start-up lines)
      Now listening on: http://localhost:5080
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
info: Microsoft.Hosting.Lifetime[0]
      Hosting environment: Development
info: Microsoft.Hosting.Lifetime[0]
      Content root path: src\Uinsure.Policies.Api
warn: Microsoft.EntityFrameworkCore.Query[20504]
```

## R5b Calls (curl -s -i, in the order run; C = calls the guide uses, F = failures)

Command: `curl against http://localhost:5080`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
### C01 sell
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /policies/GUIDE-001

{"reference":"GUIDE-001","type":"Household","status":"Pending","currentTermNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"hasClaims":false,"autoRenew":true,"policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","addressLine3":null,"postcode":"EX1 1AA"},"terms":[{"termNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"paymentReference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b"}],"payments":[{"reference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b","type":"Card","amount":803.40}],"refunds":[],"claims":[],"cancellation":null}

### C02 get
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","type":"Household","status":"Pending","currentTermNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"hasClaims":false,"autoRenew":true,"policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","addressLine3":null,"postcode":"EX1 1AA"},"terms":[{"termNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"paymentReference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b"}],"payments":[{"reference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b","type":"Card","amount":803.40}],"refunds":[],"claims":[],"cancellation":null}

### C03 quote 2026-11-10 (cooling-off)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","cancellationDate":"2026-11-10","ruleApplied":"CANCEL-1b","totalRefund":803.40,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1b","daysInTerm":365,"daysUsed":10,"unusedDays":355,"refundAmount":803.40}],"refunds":[{"type":"Card","amount":803.40,"paymentReference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b"}],"quotedOn":"2026-10-23"}

### C04 quote 2027-04-30 (pro rata)
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","cancellationDate":"2027-04-30","ruleApplied":"CANCEL-1c","totalRefund":405.00,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1c","daysInTerm":365,"daysUsed":181,"unusedDays":184,"refundAmount":405.00}],"refunds":[{"type":"Card","amount":405.00,"paymentReference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b"}],"quotedOn":"2026-10-23"}

### C05 cancel on 2026-11-10
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","cancellationDate":"2026-11-10","ruleApplied":"CANCEL-1b","totalRefund":803.40,"terms":[{"termNumber":1,"ruleApplied":"CANCEL-1b","daysInTerm":365,"daysUsed":10,"unusedDays":355,"refundAmount":803.40}],"refunds":[{"reference":"REF-82c873b208b34aedb5d6ecde150ddf10","type":"Card","amount":803.40,"paymentReference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b"}]}

### C06 cancel again
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/cancel-4","title":"Policy already cancelled","status":409,"detail":"The policy was already cancelled on 2026-11-10.","instance":"/policies/GUIDE-001/cancellation","traceId":"00-a9d78d5db903240285b4d43b48543cbc-ad5eca82de206571-00","ruleId":"CANCEL-4","cancellationDate":"2026-11-10"}

### C07 get after cancel
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-001","type":"Household","status":"Cancelled","currentTermNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"hasClaims":false,"autoRenew":true,"policyholders":[{"firstName":"Ada","lastName":"Lovelace","dateOfBirth":"1985-12-10"}],"property":{"addressLine1":"1 Example Street","addressLine2":"Exampleton","addressLine3":null,"postcode":"EX1 1AA"},"terms":[{"termNumber":1,"startDate":"2026-11-01","endDate":"2027-10-31","amount":803.40,"paymentReference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b"}],"payments":[{"reference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b","type":"Card","amount":803.40}],"refunds":[{"reference":"REF-82c873b208b34aedb5d6ecde150ddf10","type":"Card","amount":803.40,"paymentReference":"PAY-180270d7cc1c4bd7ba00e24de5b00b1b"}],"claims":[],"cancellation":{"cancellationDate":"2026-11-10","ruleApplied":"CANCEL-1b","totalRefund":803.40}}

### C08 sell second
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /policies/GUIDE-002

{"reference":"GUIDE-002","type":"BuyToLet","status":"Active","currentTermNumber":1,"startDate":"2026-10-23","endDate":"2027-10-22","amount":1200.00,"hasClaims":false,"autoRenew":false,"policyholders":[{"firstName":"Grace","lastName":"Hopper","dateOfBirth":"1990-12-09"}],"property":{"addressLine1":"2 Sample Road","addressLine2":null,"addressLine3":null,"postcode":"EX2 2BB"},"terms":[{"termNumber":1,"startDate":"2026-10-23","endDate":"2027-10-22","amount":1200.00,"paymentReference":"PAY-e05ee368f7b64231a8a02274726d16f7"}],"payments":[{"reference":"PAY-e05ee368f7b64231a8a02274726d16f7","type":"DirectDebit","amount":1200.00}],"refunds":[],"claims":[],"cancellation":null}

### C09 claim
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /policies/GUIDE-002

{"reference":"CLM-GUIDE-002-1","policyReference":"GUIDE-002","claimDate":"2026-10-23","description":"Burst pipe","hasClaims":true}

### C10 quote after claim
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"reference":"GUIDE-002","cancellationDate":"2027-04-30","ruleApplied":"COULD-2","totalRefund":0.00,"terms":[{"termNumber":1,"ruleApplied":"COULD-2","daysInTerm":365,"daysUsed":190,"unusedDays":175,"refundAmount":0.00}],"refunds":[],"quotedOn":"2026-10-23"}

### C11 renew too early
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/renew-1-2","title":"Outside the renewal window","status":422,"detail":"A policy can be renewed from 2027-09-22 to 2027-10-22.","instance":"/policies/GUIDE-002/renewals","traceId":"00-213bda48b9797f9d89d00d5dc2d03ae6-7a8067215543b9d2-00","ruleId":"RENEW-1/2","windowStart":"2027-09-22","windowEnd":"2027-10-22","violations":[{"ruleId":"RENEW-1/2","detail":"A policy can be renewed from 2027-09-22 to 2027-10-22."}]}

### F01 duplicate 409
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/sell-1","title":"Policy reference already exists","status":409,"detail":"A policy with reference 'GUIDE-001' already exists.","instance":"/policies","traceId":"00-35dbb41576bf3a12eb853c86d9b85070-a4bbb08391adcac3-00","ruleId":"SELL-1","reference":"GUIDE-001"}

### F02 multiple 422
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/sell-2","title":"Start date outside the sale window","status":422,"detail":"2 rules failed.","instance":"/policies","traceId":"00-247ad89a1cb98197b9d4db31f6821a2d-0d65be4b8c3254f6-00","ruleId":"SELL-2","violations":[{"ruleId":"SELL-2","detail":"The start date must be between 2026-10-23 and 2026-12-22."},{"ruleId":"SELL-7","detail":"The policy amount must be greater than 0."}]}

### F03 400 missing fields
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json; charset=utf-8

{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"instance":"/policies","errors":{"type":["The Type field is required."],"amount":["The Amount field is required."],"property":["The Property field is required."],"autoRenew":["The AutoRenew field is required."],"startDate":["The StartDate field is required."],"paymentMethod":["The PaymentMethod field is required."],"policyholders":["The Policyholders field is required."]},"traceId":"00-a5eb6750da9764cda9cbdbd1bc236837-14df225b286f368b-00"}

### F04 404
HTTP/1.1 404 Not Found
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/get-1","title":"Policy not found","status":404,"detail":"No policy with reference 'NO-SUCH-POLICY'.","instance":"/policies/NO-SUCH-POLICY","traceId":"00-58d2590d72cf26ebb8f68a942433649a-16b49e0ead98e59b-00","ruleId":"GET-1","reference":"NO-SUCH-POLICY"}

### F05 400 unknown query key
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json; charset=utf-8

{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"instance":"/policies/GUIDE-001","errors":{"reference":["Unknown query parameter."]},"traceId":"00-36aa14f3cb34839de8f2a0d87fbb67b1-cba103a7aeeda6a8-00"}

### F06 claim in the future 422
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/could-2a","title":"Claim date in the future","status":422,"detail":"The claim date cannot be in the future.","instance":"/policies/GUIDE-002/claims","traceId":"00-ec8b21a601d7b77acf50a481648bfb42-6173c6107c515c84-00","ruleId":"COULD-2a","today":"2026-10-23","violations":[{"ruleId":"COULD-2a","detail":"The claim date cannot be in the future."}]}

### F07 claim on cancelled 409
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/could-2c","title":"Claim on a cancelled policy","status":409,"detail":"The policy was cancelled on 2026-11-10, so a claim cannot be recorded.","instance":"/policies/GUIDE-001/claims","traceId":"00-12f616a40a6b6fef44134544f72526c7-e8072e5c20eb56f1-00","ruleId":"COULD-2c","cancellationDate":"2026-11-10"}

### F08 cancel before today 422
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json; charset=utf-8

{"type":"/problems/cancel-3","title":"Cancellation date in the past","status":422,"detail":"The cancellation date cannot be in the past.","instance":"/policies/GUIDE-002/cancellation","traceId":"00-c2f67c1eb0a0ef7fe6d5bedfb01d5b1a-f90b9a508fffe405-00","ruleId":"CANCEL-3","today":"2026-10-23","violations":[{"ruleId":"CANCEL-3","detail":"The cancellation date cannot be in the past."}]}

### F09 http only openapi
openapi status 200


### F10 scalar
scalar status 200


```

## R6 Postman CLI, whole collection

Command: `postman collection run tests/postman/Uinsure.Policies.postman_collection.json -e tests/postman/local.postman_environment.json`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
(excerpt: the summary table)
---------------------------------------------------------------------
|                         |           executed |             failed |
--------------------------+--------------------+---------------------
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
| total run duration: 17.7 s                                        |
---------------------------------------------------------------------
| total data received: 128.5 KB (approx)                            |
---------------------------------------------------------------------
| average response time: 21 ms [min: 11 ms, max: 76 ms, s.d.: 7 ms] |
---------------------------------------------------------------------
Postman credentials are required for publishing run details to Postman cloud.
Please specify it by using the `postman login` command

```

## R6b Postman CLI, one folder

Command: `postman collection run ... -i "F3 Cancel"`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
(excerpt: the summary table)
--------------------------------------------------------------------
|                         |           executed |            failed |
--------------------------+--------------------+--------------------
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
| total run duration: 5.1 s                                        |
--------------------------------------------------------------------
| total data received: 46.15 KB (approx)                           |
--------------------------------------------------------------------
| average response time: 16 ms [min: 8 ms, max: 25 ms, s.d.: 2 ms] |
--------------------------------------------------------------------
Postman credentials are required for publishing run details to Postman cloud.
Please specify it by using the `postman login` command
```

## R7 Harness self-test

Command: `node --test ".claude/hooks/__tests__/*.test.mjs"`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

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
# duration_ms 100183.7204
```

## R8 Idempotent migration script

Command: `dotnet ef migrations script --idempotent --project src/Uinsure.Policies.Persistence --startup-project src/Uinsure.Policies.Api -o <file>`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
The tool printed: The Entity Framework tools version '9.0.9' is older than that of the runtime '10.0.13'.
Script length: 242 lines.
(first 9 lines)
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

## R9 Bicep build

Command: `bicep build infrastructure/main.bicep --outfile <file>`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
Bicep CLI version 0.48.1 (cec7951cf6)
(no output; the compiled template has 780 lines)
```

## R10 Run with no launch profile (a problem met while capturing)

Command: `dotnet run --project src/Uinsure.Policies.Api --launch-profile http --no-launch-profile --no-build`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: non-zero (unhandled exception, not captured).

```text
Unhandled exception. Microsoft.Extensions.Options.OptionsValidationException: Database:Provider must be Sqlite or SqlServer.
```

## R11 Trail counts

Command: `ls docs/trace/build/<node>/findings docs/trace/build/<node>/verdicts`

Date: 2026-10-23. Branch: feature/build/F7 at 70a0cec. Exit code: 0.

```text
F0a findings=0 verdicts=0
F0b findings=2 verdicts=5
F1  findings=3 verdicts=4
F1b findings=1 verdicts=4
F2  findings=2 verdicts=6
F3  findings=1 verdicts=6
F4  findings=0 verdicts=6
F5  findings=2 verdicts=12
F6  findings=4 verdicts=8
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

## Not run

- The web suites (Vitest, Playwright) and the Visual Studio U9 launch profile: the ui plan is not on this branch.
- Postman app and Visual Studio screenshots: hand captures; the guide shows labelled placeholders.
- A successful renewal over HTTP: it needs a policy near its end date, and the API runs on the real clock, so it is
  covered by the acceptance tests (R4c).
- 429 and 500 over HTTP: covered by the acceptance tests; not provoked live.
