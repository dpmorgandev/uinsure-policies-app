# User flows

Drafted 2026-10-19 by the main session; round 2 adds the workbench (FL-10..FL-16). A flow is **one task**, not one person (agentflow
`analyze/flows.md`). Screen IDs are those in `docs/ui/screens.json`. Readers: **R1** the Uinsure
reviewer alone with the link, **R2** David presenting live (`docs/ui-requirements.md` §1). Every screen
appears in at least one flow (coverage at the end).

## FL-1: Was this really test-driven?

Primary reader R1. Requirements: NAV-1, MATRIX-1, RULE-1, RULE-2, VERIFY-1.

`overview` → `matrix` → `rule` (e.g. SELL-5) → `commit` (its red commit) → back → `commit` (its green
commit) → the rule's verify command.

The answer must be visible on `rule` without opening a commit: red before green, with dates, and the test
count (`trail-inventory.md` D1, D8).

## FL-2: Follow a FAIL to its fix

Primary reader R1 and R2. Requirements: LOOP-1, LOOP-2, LOOP-3, LOOP-4, NODE-1.

`overview` → `plan` (build) → `node` (F2) → `loop` (attempt 1 `gate.stub` ok:false; attempt 2 reviewer
FAIL) → `verdict` (A2 reviewer) → `finding` (A2) → `commit` (the `Fixes-Finding: A2/I1` commit) →
`verdict` (A3 reviewer PASS) → `plan` (inv-001, the attempt-3 investigation).

The reference case is real: F2's three attempts and inv-001 (`trail-inventory.md` §4).

## FL-3: Who did what?

Primary reader R1. Requirements: AGENT-1, AGENT-2, NODE-1.

`node` → `activity` (per-agent lanes, filter by agent) → `commit` (trailer agent vs hook-seen agent,
match ✓/✗) → `node`.

Must surface the real mismatch (F1 `0e4fe2f`, hook agent `—`, ✗) rather than hide it.

## FL-4: Where did a human decide?

Primary reader R1. Requirements: HITL-1, NAV-2.

`overview` → `decisions` (every pause 1, pause 2, steer, ruling, sign-off and merge, across nodes) → the
evidence it links to: `node`, `finding` (a D-finding), `rule` (its QA step and sign-off), or `commit`.

## FL-5: Re-verify a claim without the UI

Primary reader R1. Requirements: VERIFY-1, NAV-3.

Any of `rule`, `node`, `commit` → the verify panel → copy the `git log --format=…` command, or open the
commit or PR on GitHub.

## FL-6: Understand how the harness works

Primary reader R1 (first visit) and R2. Requirements: AGENT-3, DATA-2, DATA-3.

`overview` → `about` (how to read the trail: provenance labels, completeness, the compiled-at stamp, the
glossary of gate, verdict, finding, steer) → `harness` (six agents, their skills and never-dos, the
hooks) → `node`.

## FL-7: Present one feature live

Primary reader R2. Requirements: NAV-2, NAV-4, TDD-1.

Search (NAV-4, from any screen) → `node` → `walkthrough` (commits in TDD order) → `rule` → `loop`.
Deep links are pasted into the conversation (NAV-2).

## FL-8: See how the work ran across days

Primary reader R2. Requirements: CTX-1, STATS-1 (both COULD).

`overview` → `sessions` (the context snapshot chain) → `node` at that point; `overview` → `stats`.

## FL-9: Land somewhere that doesn't exist

Any reader. Requirements: NAV-2.

A stale or mistyped deep link → `not-found`, which names what was asked for and links to `overview`,
`matrix` and search.

---

## Workbench flows (round 2)

Readers: **R1** and **R2** as above, plus **R3** someone exercising the API's rules without Postman.
Entity and endpoint IDs are `api-inventory.md`'s; B-entries are `prior-art-workbench.md`'s.

## FL-10: Sell a policy and see it read back

Primary reader R3, R2. Requirements: WB-1, WB-2, WB-9.

`wb-home` → `wb-sell` (1 to 3 policyholders; the reference as it will be stored) → submit (E1 `201`) →
`wb-policy` (the same 16 members as the 201 body, A1) → back on `wb-home`, the reference is in recent
policies.

## FL-11: Break a rule and follow it to its evidence

Primary reader R1, R2. Requirements: WB-3, WB-6, RULE-1. **The flow that joins the two halves.**

`wb-sell` → send it anyway on → submit an under-16 policyholder and a start date 61 days out → the error
summary lists SELL-2 and SELL-5 (one 422, "2 rules failed.", A12) → a rule chip → the explorer's `rule`
page for SELL-5 (its tests, red before green, sign-off).

The summary must show the multi-rule limit honestly: with two violations the API returns no field path
and no extensions (`api-inventory.md` §4), so both are listed in the summary, not guessed onto fields.

## FL-12: Quote, then cancel, and check the maths

Primary reader R1, R3. Requirements: WB-4, WB-2.

`wb-policy` → `wb-cancel` → choose a date → quote (E4) → the refund as a worked sum per term with
`ruleApplied` (A11) → cancel, which sends exactly the quoted date (E3) → quote and cancellation compared
→ `wb-policy` (status Cancelled, the gap on the timeline, the refund under payments).

## FL-13: Record a claim and see the refund drop to zero

Primary reader R1, R3. Requirements: WB-5, WB-4.

`wb-policy` → `wb-claim` → the refund quoted before → record the claim (E5) → quoted again: 0.00 under
COULD-2 on every paid term → `wb-policy` (`hasClaims` true, the claim on the timeline).

## FL-14: Renew inside the window

Primary reader R3. Requirements: WB-5. **Designed from `requirements.md` only until F4 merges.**

`wb-policy` → `wb-renew` → the payment method defaults from the current term (RENEW-3a/3b) → Cheque with
auto-renew is refused (COULD-3) → `wb-policy` (a new term on the timeline). Until the endpoint exists,
`wb-renew` shows the api-not-built state.

## FL-15: See exactly what was sent

Primary reader R1, R2. Requirements: WB-7.

Any workbench screen → the inspector drawer (the latest exchange, live) → `wb-requests` → one exchange
(status line, request, response, curl) → copy the curl.

## FL-16: Come back to a policy

Primary reader R2, R3. Requirements: WB-9, WB-2.

`wb-home` → recent policies (this browser only) → `wb-policy`; or open one by reference. A reference that
doesn't exist gives the 404 banner on `wb-policy` (GET-1), naming the reference as the API normalised it.

## Coverage

| Screen | Flows |
|---|---|
| overview | FL-1, FL-2, FL-4, FL-6, FL-8 |
| matrix | FL-1 |
| rule | FL-1, FL-4, FL-5, FL-7 |
| plan | FL-2 |
| node | FL-2, FL-3, FL-4, FL-5, FL-6, FL-7, FL-8 |
| walkthrough | FL-7 |
| loop | FL-2, FL-7 |
| verdict | FL-2 |
| finding | FL-2, FL-4 |
| activity | FL-3 |
| commit | FL-1, FL-2, FL-3, FL-4, FL-5 |
| decisions | FL-4 |
| about | FL-6 |
| harness | FL-6 |
| sessions | FL-8 |
| stats | FL-8 |
| not-found | FL-9 |
| wb-home | FL-10, FL-16 |
| wb-sell | FL-10, FL-11, FL-15 |
| wb-policy | FL-10, FL-12, FL-13, FL-14, FL-16 |
| wb-cancel | FL-12, FL-13 |
| wb-claim | FL-13 |
| wb-renew | FL-14 |
| wb-requests | FL-15 |

24 screens, every one in at least one flow. No orphans. FL-11 crosses from the workbench into the
explorer (`rule`), so `rule` is reached from both halves.
