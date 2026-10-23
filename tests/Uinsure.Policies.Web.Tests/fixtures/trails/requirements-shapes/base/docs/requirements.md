# Requirements (fixture excerpt)

Cut from docs/requirements.md section 2 as it stands: a feature heading with its priority tag, except the
could-haves, whose heading has none; one ID that names two rules (RENEW-1/2); a note row whose ID cell is a
dash; and the data appendix, which is a list and holds no rule.

## 2. Functional requirements

### Sell (MUST-1)

| ID | Rule | Agreed interpretation |
|---|---|---|
| SELL-1 | Policy reference must be unique | The client supplies the reference. It is trimmed and upper-cased, then must match `^[A-Z0-9-]{3,20}$` (else **400**). A duplicate returns **409** |

### Retrieve (MUST-2)

| ID | Rule | Agreed interpretation |
|---|---|---|
| GET-1 | Retrieve a policy | By reference. Returns the policy and its terms. **404** if not found |
| — | Status | Derived from today, never stored: `Pending`, `Active`, `Expired`, or `Cancelled`, which overrides the others |

### Renew (SHOULD-2)

| ID | Rule | Agreed interpretation |
|---|---|---|
| RENEW-1/2 | Renew within 30 days of the end date, not after it | Window: **end − 30 days to the end date, inclusive**, measured from the latest term's end. Otherwise **422** |

### Could-haves (all in scope)

| ID | Rule | Agreed interpretation |
|---|---|---|
| COULD-1 | Quote the cancellation refund without cancelling | A read-only version of the cancel calculation |

### Data (appendix, plus our additions)

- **Policy:** reference, type, start date, end date, amount.
- **Status codes:** **422** for every numbered rule (SELL-2, RENEW-1/2); **404** for GET-1.
