# Prior art: the policy workbench

Researched 2026-10-19 (round 2) by a read-only web-research subagent. Written to this file by the main
session, lightly condensed for wording; no claim, URL, value or verification status was added or changed.
Entry IDs: B1–B10. All ten were fetched (page body read); none rests on a search snippet alone.

Scope: four categories. Policy administration and insurance back office; payment, subscription and refund
consoles; API clients and consoles; form validation and error presentation. The workbench requirements
served are named per entry (`docs/ui-requirements.md` WB-1..WB-9).

---

## Policy administration and insurance back office

### B1 Socotra: transactions, terms and segments

- **URLs:** https://docs.socotra.com/docs/learning/transactions-and-billing (Fetched);
  https://docs.socotra.com/docs/getting-started/execute-policy-transactions (Fetched)
- **Pattern:** every policy change is a **transaction, created then issued**: a draft that "won't go into
  effect until it's issued". The types are issuance, change (endorsement), cancellation, renewal and
  reversal. A policy is made of **terms** split into **segments** ("time slices within a term where policy
  values differ"). Renewal "adds a new term". Cancellation leaves a **"gap" segment** for the uncovered
  remainder. A worked HO3 example cancels about a month in, "reduces charges by $452.36", and shows the
  matching ledger debit.
- **Serves:** WB-2 (a term timeline with segments, a gap for a cancelled remainder, a new term on renewal);
  WB-4 (draft then issue maps to quote then cancel).
- **Weaknesses:** API docs, no screens, so no layout can be confirmed. The proration formula isn't on the
  page. Locator plumbing is heavier than this API needs.
- **Colours / fonts:** `NEEDS CLARIFICATION`

### B2 Guidewire PolicyCenter: Cloud API cancellation job

- **URL:** https://docs.guidewire.com/cloud/is/202603/cloudapibf/cloudAPI/PolicyCenter/job-types/cancellations-reinstatements/c_cancellations.html
  (Fetched, the first ~100k of ~101k characters)
- **Pattern:** a cancellation is a **job** with `cancellationReasonCode`, `cancellationSource` and
  `jobEffectiveDate`. It starts **Quoted** and resolves by a named verb: `bind-and-issue`,
  `pending-cancel`, `reschedule`, `rescind`, `withdraw`.
- **Serves:** WB-4: the quote is a state you can inspect before you commit; confirming is a separate act.
- **Weaknesses:** API only; no screen confirmed. The refund method (pro rata, short rate, flat) is in an
  Application Guide that wasn't reached. Take the quoted-then-bound shape, not the five verbs.
- **Colours / fonts:** `NEEDS CLARIFICATION`

### B3 FintechOS Core Policy Admin: policy cancellation (user guide)

- **URL:** https://docs.fintechos.com/DJs/CorePolicyAdmin/3.3.0/UserGuide/Content/PolicyCancellation.htm (Fetched)
- **Pattern:** the only source found that describes a cancellation **screen** field by field. Tabs: Change
  Request and Policy Details → **Premium Returned** → Request Approval. Premium Returned lays the inputs
  beside the result: Policy Start/End Date, Last Payment Date, Interval Until Due Date, Premium Amount,
  Paid Amount, **Returned Premium Amount**. The earned premium is written out in prose:
  "Premium Amount / 12 * (12 – No. of uninsured months)". It is 0 inside a 15-day window, and the full
  premium if there are claims. Statuses: Draft, In Progress, In Approval, Approved, Declined, Cancelled.
- **Serves:** WB-4 (the refund as a worked sum from named inputs, with the cooling-off and claims branches
  explicit); WB-2 (statuses).
- **Weaknesses:** the returned amount "can be manually changed", an override Docket must never offer. The
  approval workflow and beneficiary IBAN are out of scope. The flow is long and tab-gated, and fields
  appear only "after the minimum information is entered".
- **Colours / fonts:** `NEEDS CLARIFICATION`

## Payment, subscription and refund consoles

### B4 Stripe Billing: cancel, proration preview, refunds

- **URLs:** https://docs.stripe.com/billing/subscriptions/cancel (Fetched);
  https://docs.stripe.com/billing/subscriptions/prorations (Fetched); https://docs.stripe.com/refunds (Fetched)
- **Pattern:**
  - **The cancel dialog asks two questions in order.** When to end: "immediately, at the end of the
    period, or on a custom day". What to refund: "a prorated amount, refund the last payment in full, or
    provide no refund".
  - **Proration is a two-line table with a total:** "Unused time on original 10 USD plan (credit)
    −5 USD", "Remaining time on new 20 USD plan (debit) +10 USD", total +5 USD. Line descriptions name
    the date ("Unused time on Silver plan after 01 Sep 2020").
  - **Preview, then commit with the same date:** the preview invoice takes `proration_date`, and the
    update passes the same value "so that the proration is calculated at the same time".
  - **Refunds:** "you can't refund a total greater than the original charge amount". There is a reason
    picker, with a note required for Other. A refund has a status lifecycle (`pending`, `succeeded`,
    `failed`, `canceled`, `requires_action`), and the payment has a Timeline of refunds.
- **Serves:** WB-4 (credit and debit lines; the quote date carried to the commit); WB-2 (the payments and
  refunds panel).
- **Weaknesses:** proration "down to the second" by default (Docket works in `DateOnly` days). Classic and
  flexible billing modes give different answers, which argues for showing the formula, not just the
  number. Primary actions hide in ⋯ menus.
- **Colours / fonts:** `NEEDS CLARIFICATION`

### B5 Chargebee: subscription cancellations

- **URL:** https://www.chargebee.com/docs/billing/2.0/subscriptions/cancellations (Fetched)
- **Pattern:** named timing options ("Cancel immediately", "Cancel at end of current term", "Cancel on a
  specific date" up to 1,830 days ahead, "Cancel at end of subscription billing term"), and named credit
  options ("Don't issue credits", "Issue prorated credits", "Issue full credits"). The irreversible action
  is stated plainly: "Decommission this subscription".
- **Serves:** WB-4: name the refund basis in words beside the figure.
- **Weaknesses:** settings docs; whether the cancel flow previews an amount is unconfirmed. Too many
  options for a single-product API: show one basis, labelled.
- **Colours / fonts:** `NEEDS CLARIFICATION`

## API clients and consoles

### B6 Stripe Workbench: Logs, Errors, Inspector, API Explorer

- **URLs:** https://docs.stripe.com/workbench/overview (Fetched); https://docs.stripe.com/workbench/guides (Fetched)
- **Pattern:**
  - **Logs filter** by date, HTTP status, method, endpoint, source, API version, **error code**, **error
    type** and **error parameter** (e.g. `line_items[*][price]`), with a Succeeded/Failed filter.
  - **Errors tab:** error types with counts on the left; choosing one shows Occurrences, Path and Source,
    and the related logs.
  - **Inspector:** a **Data map** of related objects, with tabs Overview (JSON), **Logs** (the requests
    that touched this object) and Events. You can also filter logs by resource ID.
  - **Workbench pane:** a resizable bottom pane, opened anywhere with `~`.
  - **API Explorer:** fills in the shell command from the parameters, with "Print SDK request".
- **Serves:** WB-7 (a docked inspector: every request recorded, filterable by status and by the field an
  error points at); WB-2 (the requests that touched this policy); WB-9.
- **Weaknesses:** logs need a manual "Refresh logs"; Docket's inspector should append live. The Overview
  tab's KPI graphs are the unsourced-tile pattern the brief rules out.
- **Colours / fonts:** `NEEDS CLARIFICATION`

### B7 Postman: response viewer

- **URL:** https://learning.postman.com/docs/sending-requests/response-data/responses/ (Fetched)
- **Pattern:** a status line of code, time (ms) and size, each with a hover breakdown. Status gives "a short
  description"; time gives "a graph with information on how long each event in the process took"; size
  splits body and headers. Tabs: Body (format, search, JSONPath filter), Preview, Headers, Cookies, Test
  Results (passed/total, filterable).
- **Serves:** WB-7: a compact status line with details on demand; Test Results maps to "which rules this
  response asserted".
- **Weaknesses:** the page doesn't say whether request and response sit side by side or stacked, so
  neither is claimed. Too many tabs for a workbench.
- **Colours / fonts:** `NEEDS CLARIFICATION`

### B8 Swagger UI: "Try it out" configuration

- **URL:** https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/ (Fetched)
- **Pattern:** off by default: `tryItOutEnabled`, `displayRequestDuration` ("request duration (in
  milliseconds)"), `requestSnippetsEnabled` (otherwise "the legacy curl snippet is used"),
  `showCommonExtensions` (shows `pattern`, `maxLength`, `minimum` beside parameters).
  `defaultModelRendering` switches between "example" and "model".
- **Serves:** WB-7 (duration and a copyable curl per request); WB-1 and WB-6 (the server's constraints shown
  beside each field, as the client-side checks that "send it anyway" turns off).
- **Weaknesses:** the default layout is a long accordion of operations, not a task form. The default code
  theme `"agate"` is dark and pulls toward the dark-IDE category look.
- **Colours / fonts:** `NEEDS CLARIFICATION`

## Form validation and error presentation

### B9 GOV.UK Design System: error summary and error message

- **URLs:** https://design-system.service.gov.uk/components/error-summary/ (Fetched);
  https://design-system.service.gov.uk/components/error-message/ (Fetched);
  https://design-system.service.gov.uk/styles/colour/ (Fetched)
- **Pattern:**
  - **The summary** sits at the top of `main`, below a back link and above the `<h1>`, headed "There is
    a problem". Focus moves to it. Every error links to its field (for a date group, the first field in
    error). The page `<title>` is prefixed "Error: ".
  - **The inline message** goes after the label and hint, before the input. A red border ties it to its
    question.
  - **Wording:** "say what went wrong and how to fix it", the same in the summary and inline. Avoid
    "invalid", "valid", "please", "sorry", "oops". "Don't clear form fields."
  - **Not for what the user can't fix:** the error message component isn't for problems the user "can't
    fix", such as eligibility or service problems.
- **Serves:** WB-3 and WB-1. RFC 9457 `errors[].pointer` → summary link and inline message. The "can't fix"
  rule splits field-level 400/422 problems from object-level 404/409 ones (a banner, not a field).
- **Weaknesses:** built for citizens, so there's no place for a rule ID or HTTP status. Silent on several
  errors on one field.
- **Colours (stated):** error `#ca3535`, focus `#ffdd00`, text `#0b0c0c`, secondary text `#484949`, border
  `#cecece`, link `#1a65a6`, success `#0f7a52` (current values; older Frontend releases differ). These
  match K1 in `mood-type-icons.md`.
- **Fonts:** `NEEDS CLARIFICATION` (typeface page not fetched)

### B10 GitHub Primer: forms and validation

- **URL:** https://primer.style/product/ui-patterns/forms/ (Fetched)
- **Pattern:**
  - **When to validate:** on submit by default. Inline only after a field has changed *and* lost focus,
    then re-validate on each keystroke once it's invalid. "Don't attempt to validate an input before the
    user is done with it."
  - **On submit:** with 3 or more errors, a focused banner summary with anchor links; with fewer, focus
    the first invalid input.
  - **Wiring:** `aria-describedby` and `aria-invalid="true"`; one message per checkbox or radio group; no
    live regions, manage focus instead.
  - **Don't disable a form that can't be saved:** show a notice, and a dialog if the user submits anyway.
- **Serves:** WB-1, WB-3; WB-6 (warn rather than disable is the nearest precedent for submitting a known-bad
  request).
- **Weaknesses:** nothing on mapping server errors to fields. The 3-error threshold is a judgement call.
- **Colours / fonts:** `NEEDS CLARIFICATION`

---

## Supporting references (fetched, not numbered)

- **RFC 9457** (https://www.rfc-editor.org/rfc/rfc9457.html): members `type`, `title`, `status`, `detail`,
  `instance`. The example's `errors` extension holds objects with `detail` and a JSON Pointer `pointer`.
  Dereferencing a `type` URI "SHOULD provide human-readable documentation". Consumers "SHOULD NOT
  automatically dereference" it, *except* "in a debugging tool". The workbench is one, so linking `type`
  to a rule's evidence page is within the spec.
- **IBM Carbon forms pattern** (https://carbondesignsystem.com/patterns/forms-pattern/): validate on blur.
  After a server submit, an inline notification plus inline errors. Disable the primary button on short
  forms until valid (not long ones), and after submit to stop duplicates.
  **Carbon colour tokens** (https://carbondesignsystem.com/elements/color/tokens/, White theme): error
  `#da1e28`, success `#24a148`, warning `#f1c21b`, info `#0043ce`, focus `#0f62fe`, text `#161616`, border
  `#c6c6c6`. Fonts `NEEDS CLARIFICATION`.
- **Hoppscotch** (REST and history docs): history saved on Send, click to restore, favourites and a filter.
  Fits WB-9 and WB-7. Pane layout and history row contents aren't documented.

## Opportunities for the workbench

1. **A ProblemDetails violation as a three-way link.** Each `errors[]` item appears once in a GOV.UK-style
   summary that moves focus to the field (B9, B10), once inline under the field it points at, and as a
   rule-ID chip linking to the rule's evidence page in the explorer (allowed "in a debugging tool",
   RFC 9457). No tool joins field, rule and evidence.
2. **Field-level versus object-level problems.** From B9's "can't fix" rule: 400/422 problems that carry a
   `pointer` go on fields; 404/409 problems (not found, outside the window, already cancelled) go in a
   banner on the record.
3. **The cancel quote as a worked sum, carried to the commit.** Stripe's dated credit and debit lines and
   same-date commit (B4), FintechOS's inputs beside the result (B3), Chargebee's basis in words (B5). The
   quote shows `premium × unused days ÷ term days = refund`, the cooling-off branch called out, and Cancel
   resends exactly the quoted date, so the sum can be checked by hand.
4. **A term timeline with segments.** Socotra's model (B1): terms, a gap for a cancelled remainder, a new
   term on renewal. One dated ruler marks the cooling-off and renewal windows, today and claim dates, and
   answers "can I renew or cancel now?" before anything is sent.
5. **"Send it anyway" as an inspector mode.** Warn rather than disable (B10), constraints beside fields
   (B8), filter by error parameter (B6). The toggle drops client checks, still logs the request, and lines
   up the response's violations against the client rules that would have caught them: evidence that client
   and server agree.
6. **Per-policy request history.** Stripe Inspector's "Logs for this object" (B6) plus Hoppscotch's restore
   from history. Each policy view lists every request that touched it, with status, duration (B8) and a
   copyable curl. Recent policies (WB-9) come from the same log.

## Category default

- a list-and-detail split with a left rail (Stripe Errors and Inspector, FintechOS, Hoppscotch);
- tabs as the main structure (Postman, Inspector, FintechOS);
- actions in ⋯ overflow menus (Stripe);
- status as coloured badges;
- JSON in a monospace block, often in a dark highlight theme (Swagger's `agate`);
- red as the one error signal on a neutral grey and white base, with a blue focus or link (GOV.UK's yellow
  focus is the outlier);
- KPI graphs on a console's overview tab (Stripe Workbench).

**Ways to depart:** verbs inline rather than in ⋯ menus; one dated timeline rather than tabs for the policy
view; a light, paper-like JSON view; errors carried by structure (summary, links, rule IDs) not colour
alone; no overview metrics.

## Method note

- **Verified:** the body of every Fetched URL, as returned by a fetch tool that summarises pages. Quoted
  strings come from that output. The Guidewire page was cut off at ~100k of ~101k characters.
- **Not verified:**
  - any screen layout for Socotra, Guidewire, Postman or Hoppscotch: their public docs are API or text
    docs, and no screenshot was seen, so side-by-side versus stacked panes is not claimed;
  - Guidewire's policy summary page and refund method;
  - whether Chargebee's cancel flow previews an amount.
- **Not researched:** Duck Creek, Applied Epic, Recurly, Insomnia (depth over breadth; FintechOS stood in
  as the second back office with a described screen).
- **Colours:** only GOV.UK and Carbon state hex values. No font is stated on any fetched page.
- Stripe's Dashboard and Workbench are described from Stripe's docs, not from using the product logged in.
