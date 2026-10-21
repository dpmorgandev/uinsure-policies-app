# requirements-shapes

The rule tables as the two real requirements files write them, and a test source in the real C# shape, for the
compiler's rule fields (U1: MATRIX-1, RULE-1, NAV-3). No `trail/`: nothing here needs a README, walkthrough
or matrix, so every rule's matrix row and status stay null.

## The two table shapes (`base/docs/`)

| File | Heading | Header row | Cut from |
|---|---|---|---|
| `requirements.md` | `### Sell (MUST-1)`: the feature, then its priority tag | `\| ID \| Rule \| Agreed interpretation \|` | `docs/requirements.md` §2 |
| `ui-requirements.md` | `### Navigation and overview`: no priority | `\| ID \| Priority \| Requirement \| Draft interpretation \|` | `docs/ui-requirements.md` §2 |

The awkward rows of the real files are kept:

- `RENEW-1/2`: one row, one ID as written, naming two rules.
- `| — | Status | … |` under Retrieve: a note, not a rule.
- `### Could-haves (all in scope)`: a heading with no priority tag.
- `### Data (appendix, plus our additions)`: a list that names rule IDs in prose, and holds no rule.

## The rules, each as its file gives it

| ID | Title | Feature | Priority | Source |
|---|---|---|---|---|
| SELL-1 | Policy reference must be unique | Sell | MUST | `docs/requirements.md` line 13 |
| GET-1 | Retrieve a policy | Retrieve | MUST | `docs/requirements.md` line 19 |
| RENEW-1/2 | Renew within 30 days of the end date, not after it | Renew | SHOULD | `docs/requirements.md` line 26 |
| COULD-1 | Quote the cancellation refund without cancelling | Could-haves (all in scope) | none | `docs/requirements.md` line 32 |
| NAV-1 | Overview answers the question first | Navigation and overview | MUST | `docs/ui-requirements.md` line 12 |
| NAV-4 | Search | Navigation and overview | SHOULD | `docs/ui-requirements.md` line 13 |

The feature is the heading's name, never the node: F1 (`Sell and retrieve`) owns SELL-1 and GET-1. A heading
without a `(<PRIORITY>-<n>)` tag is the feature whole, and its rules have no priority (null). The
interpretation is the last cell as written, Markdown and all.

## The commits

| Id | Date (UTC) | Node | Agent | TDD | Rule | Adds |
|---|---|---|---|---|---|---|
| c0 | 2026-10-15 12:00 | F1 | main | | | |
| c1 | 2026-10-15 13:00 | F1 | tester | red | SELL-1, GET-1 | `tests/Fixture.Api.Tests/RetrieveTests.cs` |

`RetrieveTests.cs` (stored as `.cs.fixture`, so the repo's own rule-coverage check never counts its traits)
holds three methods: `Retrieve_of_an_unknown_reference_answers_404` traited GET-1;
`A_reference_sold_in_lower_case_is_retrieved_in_upper_case`, a theory traited SELL-1 and GET-1; and
`The_client_is_created`, plumbing with no trait. So GET-1 has two tests by name, SELL-1 one, and the
plumbing method belongs to no rule.

**Expected, and how it was checked:** the lines above were counted by hand in the two files and checked with
`grep -n`. The README does not claim a `render-trace check` label: this fixture has no trail.
