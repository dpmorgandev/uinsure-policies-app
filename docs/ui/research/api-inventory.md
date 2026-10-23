# API data inventory: what the workbench shows

Researched 2026-10-19 (round 2) by a read-only Explore subagent over `docs/requirements.md`, `src/**`,
`tests/**` and `docs/qa/*.md` on the `ui` branch (F3 merged, F4 in progress elsewhere). Written to this
file by the main session, condensed; no field, status code, rule ID or citation was added or changed.
Entry IDs: endpoints E1–E6, entities A1–A16. Paths are repo-relative.

**Updated 2026-10-19 after F4 (renew) merged, approved by David.** A second read-only Explore pass over the
same sources added E6 (renew), A15 (its request) and A16 (its problems), and replaced the "not built"
passages. IDs E1–E5 and A1–A14 are unchanged.

**No full JSON response example exists in the sources read.** Postman holds request bodies and `pm.test`
checks; tests build expected values from literals. Real response values are quoted from the QA scripts,
labelled as such.

## 1. Endpoints (`src/Uinsure.Policies.Api/Controllers/PoliciesController.cs`, `[Route("policies")]`)

| ID | Method + route | Rules | Success | Notes |
|---|---|---|---|---|
| E1 | `POST /policies` | SELL-1..7 | **201**, `Location: /policies/{reference}`, full `PolicyResponse` | `writes` rate limit; body identical to the GET (`RetrieveResponseShapeTests.cs:39-53`) |
| E2 | `GET /policies/{reference}` | GET-1, Status | **200** `PolicyResponse` | reference normalised |
| E3 | `POST /policies/{reference}/cancellation` | CANCEL-1a/1b/1c, 2, 3, 4, 6, 7, COULD-2 | **201** `CancellationResponse`, **no Location** | empty body allowed (means UK today) |
| E4 | `GET /policies/{reference}/cancellation-quote?cancellationDate=yyyy-MM-dd` | COULD-1 + the CANCEL rules | **200** `CancellationQuoteResponse` | date required, strict format; read-only, never saves (`PolicyService.cs:92`) |
| E5 | `POST /policies/{reference}/claims` | COULD-2, 2a, 2b, 2c | **201**, `Location: /policies/{reference}`, `RecordClaimResponse` | `writes` rate limit |
| — | `GET /health/live`, `/health/ready` | — | 200 | not rate limited |
| — | OpenAPI + Scalar | — | — | Development only (`Program.cs:119-123`) |
| E6 | `POST /policies/{reference}/renewals` | RENEW-1/2, 3a, 3b, 4, 5, 6, COULD-3 (+ GET-1 404) | **201**, `Location: /policies/{reference}`, full `PolicyResponse` (A1) | `writes` rate limit; reference normalised; one UK today per request (§8) |

No list or search endpoint; lookup is by reference only.

## 2. Entities

**Global formats** (`Program.cs:52-54`, `TwoDecimalPlacesConverter.cs:7-30`, `Money.cs:5-7`):
- JSON is camelCase; unknown members are rejected; enums are strings only; numbers must be JSON numbers.
- **Money** is written to at least 2 dp, never rounded by the writer: `100` → `100.00`, `527.180` →
  `527.18`, `0.125` stays `0.125`. Refunds are rounded once, 2 dp, `AwayFromZero`.
- **Dates** are `DateOnly` as `yyyy-MM-dd`; `01/11/2026` is a 400. **No timestamps anywhere in any
  response.**

**A1 Policy** (`PolicyResponse.cs:4-20`), exactly 16 members:
- `reference` (upper-cased);
- `type` (`Household` | `BuyToLet`);
- `status` (`Pending` | `Active` | `Expired` | `Cancelled`, derived);
- `currentTermNumber` (1-based);
- `startDate`, `endDate`, `amount`: **of the current term**, not the first;
- `hasClaims`, `autoRenew`;
- `policyholders` (A3[]), `property` (A4), `terms` (A2[], oldest first);
- `payments` (A5[], paid terms only), `refunds` (A6[], empty until cancelled), `claims` (A7[]);
- `cancellation` (A8 | null).

Example sale request (Postman, `tests/postman/Uinsure.Policies.postman_collection.json:180`):

```json
{ "reference": "{{reference}}", "type": "BuyToLet", "startDate": "{{start30}}", "amount": 412.34, "autoRenew": false, "paymentMethod": "Card",
  "policyholders": [ { "firstName": "Grace", "lastName": "Hopper", "dateOfBirth": "1990-04-12" }, { "firstName": "Alan", "lastName": "Turing", "dateOfBirth": "1992-06-23" } ],
  "property": { "addressLine1": "7 Canal St", "addressLine2": "Flat 3", "addressLine3": "Ancoats", "postcode": "M4 6BX" } }
```

Response as recorded by QA (`docs/qa/build-F2.md:136`): "exactly the 16 members; BuyToLet, `status`
Pending, `currentTermNumber` 1, start 2026-11-18 (today + 30), `endDate` 2027-11-17, 412.34, `autoRenew`
false, Grace Hopper and Alan Turing, 7 Canal St / Flat 3 / Ancoats / M4 6BX; `terms[0]` 2026-11-18 to
2027-11-17, 412.34, linked to the one Card payment; `hasClaims` false, `refunds`/`claims` `[]`,
`cancellation` null."

**A2 Term:** `termNumber`, `startDate`, `endDate` (start + 1 year − 1 day; a 29 Feb start ends 28 Feb),
`amount`, `paymentReference` (**null = unpaid**). Day count = end − start + 1 (365 or 366) (`Term.cs:19-27`).

**A3 Policyholder:** `firstName`, `lastName` (each required, max 100), `dateOfBirth` (required).

**A4 Property:** `addressLine1` (required, max 200), `addressLine2`/`addressLine3` (nullable, max 200),
`postcode` (required, max 8). Missing optional lines come back `null`.

**A5 Payment:** `reference` (`PAY-` + 32 hex), `type` (`Card` | `DirectDebit` | `Cheque`), `amount` (the
full term amount). No term number: join via `terms[].paymentReference`.

**A6 Refund:** on the policy and on a cancellation, `reference` (`REF-` + 32 hex), `type`, `amount`,
`paymentReference` (the payment it reverses, CANCEL-2). **On a quote, no `reference`.** Created only when
the amount > 0 and the term was paid (`Policy.cs:91-99`).

**A7 Claim:** `reference` (`CLM-{policyRef}-{n}`, **computed from position, not stored**), `claimDate`,
`description` (nullable). The E5 response adds `policyReference` and `hasClaims`. QA example
(`docs/qa/build-F3.md:147`): "{CLM-F3-MVEOT2HAYB-1, F3-MVEOT2HAYB, 2026-10-19, "Escape of water from the
boiler", `hasClaims` true}".

**A8 Cancellation summary (on GET):** `cancellationDate`, `ruleApplied`, `totalRefund`. **No per-term
breakdown.**

**A9 Cancellation result (E3):** `reference`, `cancellationDate`, `ruleApplied`, `totalRefund`, `terms`
(A11[]), `refunds` (A6[]).

**A10 Cancellation quote (E4):** as A9 plus `quotedOn` (the UK today it was checked against); its refunds
carry no `reference`.

**A11 Cancellation term line:** `termNumber`, `ruleApplied` (`CANCEL-1a` | `CANCEL-1b` | `CANCEL-1c` |
`COULD-2` | `UNPAID-TERM`), `daysInTerm`, `daysUsed`, `unusedDays`, `refundAmount`. QA example
(`docs/qa/build-F3.md:145`): terms "[{1, CANCEL-1c, 365, 101, 264, 445.11}]", refund "{DirectDebit,
445.11, PAY-7f24722e…}" with no `reference`; the cancel `201` gave "same date, rule, terms and total
445.11".

**A12 Rule problem (404 / 409 / 422)** (`ResultExtensions.cs:9-38`): `type`, `title`, `status`,
`detail`, `instance` (the path as sent), `ruleId`, `traceId`. A 422 adds `violations: [{ruleId,
detail}]`. `application/problem+json`.

**A13 Validation problem (400)** (`ValidationProblems.cs:10-26`): `title` "One or more validation
errors occurred.", `status`, `instance`, `traceId`, `errors: {key: [messages]}`. **No `ruleId`.**

**A14 Transport and other problems:**
- 429 `/problems/rate-limited`, with `Retry-After`;
- 400 `/problems/https-required`, outside Development;
- 409 `/problems/concurrency`;
- 500, 413 and 408.

None carries a `ruleId`.

## 3. Request bodies

**Sell** (`SellPolicyRequest.cs:20-101`), every top-level field `[Required]` (missing → 400):

| Field | Constraint | Rule |
|---|---|---|
| `reference` | trimmed, upper-cased, `^[A-Z0-9-]{3,20}$` → 400; duplicate → **409** | SELL-1 |
| `type` | `Household` \| `BuyToLet` → else 400 | shape |
| `startDate` | `yyyy-MM-dd`; today ≤ start ≤ today + 60 → else 422 | SELL-2 |
| `endDate` | **must not be sent** (unknown member → 400) | SELL-3 |
| `amount` | number, ≤ 1,000,000.00, ≤ 2 dp → else 400; > 0 → else 422 | shape / SELL-7 |
| `autoRenew` | bool, required | — |
| `paymentMethod` | `Card` \| `DirectDebit` \| `Cheque`; missing → 400 | SELL-6 |
| `policyholders` | 1–3 → else 422 | SELL-4 |
| `policyholders[i].dateOfBirth` | 16+ on the start date → else 422 | SELL-5 |
| `property` | see A4 | shape |
| `hasClaims` | must not be sent → 400 | shape |

The body is capped at 65,536 bytes (413).

**Cancel:** `{ "cancellationDate": date | null }`; no body, `{}` or `null` = UK today. Past → 422
CANCEL-3; after the latest term's end → 422 CANCEL-7; already cancelled → 409 CANCEL-4; unknown field or
a whitespace-only body → 400.

**Quote:** query `cancellationDate` required and exactly `yyyy-MM-dd` (else 400); the same CANCEL-3/4/7
checks; any other query key → 400.

**Claim:** `claimDate` required; `description` optional, max 500 (501 → 400); future → 422 COULD-2a;
outside every term → 422 COULD-2b; cancelled policy → 409 COULD-2c.

**Renew (E6, A15 `RenewPolicyRequest`):** see §8.

## 4. Errors

`type` = `"/problems/" + ruleId.ToLowerInvariant().Replace('/', '-')` (`ProblemCatalog.cs:32`). The
status comes from the violation kind: NotFound 404, Conflict 409, else 422.

| type | title | status | extensions (when alone) |
|---|---|---|---|
| `/problems/get-1` | Policy not found | 404 | `reference` |
| `/problems/sell-1` | Policy reference already exists | 409 | `reference` |
| `/problems/sell-2` | Start date outside the sale window | 422 | `earliest`, `latest` |
| `/problems/sell-4` | Wrong number of policyholders | 422 | `count` |
| `/problems/sell-5` | Policyholder under 16 | 422 | `index` (1-based) |
| `/problems/sell-7` | Policy amount must be greater than zero | 422 | `amount` |
| `/problems/cancel-3` | Cancellation date in the past | 422 | `today` |
| `/problems/cancel-4` | Policy already cancelled | 409 | `cancellationDate` |
| `/problems/cancel-7` | Cancellation date after the end of cover | 422 | `latestEndDate` |
| `/problems/could-2a` | Claim date in the future | 422 | `today` |
| `/problems/could-2b` | Claim date outside cover | 422 | `coverStart`, `coverEnd` |
| `/problems/could-2c` | Claim on a cancelled policy | 409 | `cancellationDate` |
| `/problems/concurrency` | The policy was changed by another request | 409 | no `ruleId` |
| `/problems/rate-limited` | Too many requests. | 429 | `Retry-After` header |
| `/problems/https-required` | HTTPS is required. | 400 | outside Development |

A 500 uses the RFC 9110 type. 413 and 408 have a title and detail but no `type`. The 400 validation
problem uses ASP.NET's default type.

**How a 422 is assembled** (`ResultExtensions.cs:8-35`):
- the top-level `type`, `title` and `ruleId` come from the first violation, in requirements order;
- `detail` is the message when there's one violation, or "{n} rules failed.";
- **rule-specific extensions are copied up only when exactly one rule fails**;
- `violations[]` entries are `{ruleId, detail}`, with no extensions and **no field path**.

404 and 409 problems come alone, with no `violations`.

**400 per-field shape:** `errors` maps a key to an array of messages.
- Model-state keys are camelCased per segment (`policyholders[0].dateOfBirth`, `property.postcode`).
- JSON-reader keys are `$.`-prefixed (`$.colour`, `$.startDate`, `$.property.county`).
- An unreadable body adds `errors.request`.
- An unknown query key gives `errors[key]` = ["Unknown query parameter."].

**Rule IDs appear in 404, 409 and 422 payloads, never in 400s.**

Examples recorded by QA:
- 409 (`docs/qa/build-F3.md:153`): "`409` /problems/cancel-4, "Policy already cancelled", `instance`
  …/cancellation, `ruleId` CANCEL-4, `cancellationDate` 2026-11-18, `detail` "The policy was already
  cancelled on 2026-11-18.", no `violations`, `traceId`."
- 422 (`:162`): "`422` /problems/could-2a, `ruleId` COULD-2a, `detail` "2 rules failed.", `violations`
  [COULD-2a, COULD-2b]."
- 400 (`docs/qa/build-F2.md:147`): "`errors` {"colour":["Unknown query parameter."]}, `traceId`, no
  `ruleId`."

## 5. Derived values: returned or not

| Value | Returned? | Source |
|---|---|---|
| Status | **yes**, `status` (Cancelled overrides; Pending before the first start; Expired after the last end) | `Policy.cs:51-65` |
| Current term | **yes**, `currentTermNumber` and the policy-level dates and amount (the term covering today, else the latest) | `Policy.cs:48-49` |
| Cooling-off window dates | **no**; seen only afterwards as `ruleApplied` `CANCEL-1b` on a quote or cancel | — |
| Renewal window | **no** on GET or in the 201. Only as `windowStart`/`windowEnd` on a **single-violation** RENEW-1/2 422 | `Policy.cs:141-151`, `ResultExtensions.cs:24-30` |
| Refund amount and `ruleApplied` | **yes**, per term and in total, via E4 (no side effects) or E3; on GET only the A8 summary | `RefundCalculator.cs` |
| Claims effect on refunds | **yes**, indirectly: `hasClaims`, and `ruleApplied` `COULD-2` with `0.00` on every paid term | `RefundCalculator.cs:30-33` |
| Unpaid term | **yes**: `paymentReference` null; `UNPAID-TERM` on cancel lines (takes precedence over COULD-2) | `RefundCalculator.cs:24-28` |
| Day counts | **yes**, on E3/E4 terms only | `RefundCalculator.cs:14-16` |
| Server "today" | **only** as `quotedOn` (E4) and the `today` extension on CANCEL-3 and COULD-2a problems | — |

## 6. Date windows

"Today" is the UK date (Europe/London) from `TimeProvider`, read once per request.

| Window | Definition | Rule |
|---|---|---|
| Sale start | today … today + 60, inclusive | SELL-2 |
| Full refund | cancel date < term start | CANCEL-1a |
| Cooling-off | start … start + 14, inclusive | CANCEL-1b |
| Pro-rata | after start + 14: amount × unused ÷ 365/366, the cancel day counted as used | CANCEL-1c |
| Cancellation date | today ≤ date ≤ latest term end | CANCEL-3, CANCEL-7 |
| Claim date | ≤ today and inside some term | COULD-2a, COULD-2b |
| Renewal | **latest** term's end − 30 … latest end, inclusive (`Policy.cs:12, 141-151`) | RENEW-1/2 |

**Clock override: none.** Production uses `TimeProvider.System` (`Program.cs:58`); only the test
factory swaps in a `FakeTimeProvider`.

## 7. Edge cases a screen must handle

- **Multiple terms:**
  - Created through the API by renewing (E6). Until term 2 starts, the policy-level dates and amount stay
    on term 1; the new term is `terms[last]` (`RenewTermTests.cs:59-86`).
  - `currentTermNumber` may differ from the latest term.
  - Cancel and quote list every term: a current term at CANCEL-1c and a future one at CANCEL-1a, with
    different refund methods (`Domain.Tests/CancelRefundMethodTests.cs:32-50`).
  - An ended term gets 0 unused days.
- **Unpaid term:** `paymentReference` null, missing from `payments[]`; its cancel line is `UNPAID-TERM`,
  `0.00`, with no refund.
- **Cancelled, then retrieved:**
  - `status` Cancelled (even if it was Pending);
  - `cancellation` holds date, rule and total; `refunds` holds the records;
  - a further cancel or quote → 409 CANCEL-4, and a claim → 409 COULD-2c, before any date rule;
  - a cancel on the last day of cover → `totalRefund` 0.00, `refunds` `[]`.
- **Expired:** can't be cancelled (CANCEL-7 alone).
- **Cheque with auto-renew:** accepted at sale. At renewal, COULD-3 refuses it, whether sent or
  defaulted from the current term (§8).
- **Unknown query parameters → 400** on every action, including names that match route, body or
  special parameters (`?reference=`, `?cancellationToken=`). Keys are matched case-insensitively;
  `?REFERENCE=X` comes back keyed `reference`.
- **Reference normalisation:** route and body references are trimmed and upper-cased. On a 404,
  `detail` and `reference` name the upper-cased value, but `instance` echoes the path as sent. A
  malformed reference on GET is a 404, not a 400.
- **Concurrent writes:** the loser gets 409 `/problems/concurrency`, "Retry the request."; a retry is
  accepted.
- **Rate limits:** 100/min global and 10 writes/min per IP by default (Development: 10000 and 1000); a
  429 carries `Retry-After`.

## 8. Renew (F4): E6, A15, A16

**E6** `POST /policies/{reference}/renewals` (`PoliciesController.cs:83-106` → `PolicyService.Renew`
`:99-116` → `Policy.Renew` `:129-186`). **201**, `Location: /policies/{normalised reference}`, and the body
is the full **A1** policy (no new shape). The same 16 members.

**A15 `RenewPolicyRequest`** (`RenewPolicyRequest.cs:6-25`):

| Field | Rule | Failure |
|---|---|---|
| `amount` (required JSON number) | missing or null → "The Amount field is required."; a string → `$.amount`; > 1,000,000.00 or > 2 dp → 400. ≤ 0 → **RENEW-5**. 0.01 and 1,000,000.00 accepted | 400 / 422 |
| `paymentMethod` (optional, `Card` \| `DirectDebit` \| `Cheque`) | **RENEW-3a:** absent on an auto-renew policy → the **current** term's method. **RENEW-3b:** any method sent when `autoRenew` is false. **COULD-3:** an effective Cheque on an auto-renew policy, sent or defaulted. JSON `null` counts as absent | 422 |
| any other member (e.g. `startDate`) | unknown member (the tests tag it RENEW-4: a renewal can't choose its start) | 400 |
| no body / malformed JSON | "A request body with an amount is required." / 400 | 400 |

**Order:**
1. Shape 400.
2. 404 GET-1.
3. **RENEW-6 409 alone** (cancelled, even with a future cancellation date).
4. RENEW-1/2, RENEW-3b, RENEW-5 and COULD-3 collected into one 422.
5. A concurrency 409 on save.

**RENEW-4:** the new term starts at latest end + 1 and runs 1 year − 1 day; its payment is the full amount,
or none if unpaid.

**A16, renew problems** (`ProblemCatalog.cs:23-27`; extensions only when a single rule fails):

| type | title | status | extensions |
|---|---|---|---|
| `/problems/renew-1-2` | Outside the renewal window | 422 | `windowStart`, `windowEnd` |
| `/problems/renew-3b` | Payment method sent for an unpaid renewal | 422 | — |
| `/problems/renew-5` | Renewal amount must be greater than zero | 422 | `amount` |
| `/problems/renew-6` | Cancelled policy cannot be renewed | **409** | `cancellationDate` |
| `/problems/could-3` | Cheque not allowed for auto-renewal | 422 | `paymentMethod` |

Recorded by QA (`docs/qa/build-F4.md`):
- step 26: "Renewal `422` `application/problem+json`: /problems/renew-1-2, "Outside the renewal window",
  `status` 422, `detail` "A policy can be renewed from 2027-09-18 to 2027-10-18.", `instance`
  /policies/QA-F4-WIN/renewals, `traceId` set, `ruleId` RENEW-1/2, `windowStart` 2027-09-18, `windowEnd`
  2027-10-18, `violations` = [{RENEW-1/2, the same text}]";
- step 28: "`422` /problems/renew-1-2, `ruleId` RENEW-1/2, `detail` "3 rules failed.", `violations` =
  [{RENEW-1/2, …}, {RENEW-5, …}, {COULD-3, …}] in that order. Top level has none of `windowStart`,
  `windowEnd`, `amount`, `paymentMethod`";
- step 32: "Renewal `409` /problems/renew-6, "Cancelled policy cannot be renewed", `detail` "The policy was
  cancelled on 2026-11-18, so it cannot be renewed.", … `cancellationDate` 2026-11-18, … no
  `violations`."

**No recorded success response exists.** Every live success needs a clock inside the window (a policy sold
today becomes renewable about 11 months later), so QA covers them by tests with a fake clock and
describes them in prose only (build-F4.md:17-23, 202-207, 215). A design fixture for a renewed policy
must come from those tests, not from a live call.

**CANCEL-5** (`requirements.md:82`) has no branch of its own. Every term runs through
`RefundCalculator.ForTerm`:
- a future term is refunded in full as CANCEL-1a;
- a past term refunds 0.00;
- an unpaid term is `UNPAID-TERM` 0.00.

`tests/Uinsure.Policies.Api.Tests/CancelRenewedPolicyTests.cs` covers it. One example: term 1 at
CANCEL-1c 17.36 plus term 2 at CANCEL-1a 512.66, a total of 530.02, with two refunds.

**Renew edge cases:**
- **Outside the window:** this covers every freshly sold policy.
- **Renewing twice:** the next window is about 11 months away.
- **Cheque with auto-renew:** refused, whether the method was sent or defaulted.
- **`autoRenew` false:** sending any `paymentMethod` → RENEW-3b, and the new term is unpaid.
- **Cancelled:** 409, before any other check.
- **Multiple 422s lose the window dates.**
- **After success:** the body still shows term 1 as current.
- **Also:** 404, 429, and a concurrency 409.

## 9. Gaps a workbench would want filled

1. **No CORS.** A browser app on another origin is blocked; it needs the same origin or a proxy.
2. **No list or search** (exact reference only).
3. **Renew gives no help in advance** (§8): no "renewable now", no next-term dates, no resolved default
   payment method (it has to be joined from the current term's `paymentReference` to `payments[].type`),
   and no paid or unpaid flag on a term beyond a null `paymentReference`.
4. **No window dates:** no cooling-off end, renewal window, "cancellable until", or server today on GET.
   The renewal window appears only on a single-rule RENEW-1/2 422.
5. **The GET's cancellation is thin:** the per-term breakdown is returned once, in the E3 201, and can't
   be fetched again.
6. **Payments and refunds join terms only via `paymentReference`.**
7. **No timestamps or audit:** no sold, created or cancelled-at time; no payment or refund date.
8. **Multi-rule 422s drop extensions, and `violations[]` has no field path**, so a form can't highlight
   the offending policyholder when SELL-4 and SELL-5 fail together.
9. **No concurrency token** (Version or ETag), though a stale-write 409 exists.
10. **Claim references are positional;** claims carry no amount, status or recording date.
11. **No update endpoints** (autoRenew, holders, property).
12. **Two 409 `detail` texts differ from the contract's examples** (left for a ruling,
    `docs/qa/build-F3.md:263-267`); a UI should read the `cancellationDate` extension, not parse `detail`.
