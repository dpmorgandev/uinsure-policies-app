# Requirements (fixture excerpt)

Cut from docs/requirements.md section 2 as it stands: three of the build plan's rules in the real file's order,
one of them RENEW-1/2, the ID that names two rules.

## 2. Functional requirements

### Sell (MUST-1)

| ID | Rule | Agreed interpretation |
|---|---|---|
| SELL-1 | Policy reference must be unique | The client supplies the reference. It is trimmed and upper-cased, then must match `^[A-Z0-9-]{3,20}$` (else **400**). A duplicate returns **409** |

### Cancel (SHOULD-1)

| ID | Rule | Agreed interpretation |
|---|---|---|
| CANCEL-5 | Cancelling a renewed policy | Ends the policy. The current term follows the normal rules. A future term is refunded in full (it is before its start date) |

### Renew (SHOULD-2)

| ID | Rule | Agreed interpretation |
|---|---|---|
| RENEW-1/2 | Renew within 30 days of the end date, not after it | Window: **end − 30 days to the end date, inclusive**, measured from the latest term's end. Otherwise **422** |
