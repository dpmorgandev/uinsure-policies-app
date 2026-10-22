# Requirements (fixture excerpt)

Cut from docs/requirements.md section 2 as it stands: two Sell rules a real commit body trails on repeated lines,
and RENEW-1/2, the ID that names two rules, whose commits trail either it or its parts.

## 2. Functional requirements

### Sell (MUST-1)

| ID | Rule | Agreed interpretation |
|---|---|---|
| SELL-1 | Policy reference must be unique | The client supplies the reference. It is trimmed and upper-cased, then must match `^[A-Z0-9-]{3,20}$` (else **400**). A duplicate returns **409** |
| SELL-2 | Can only be sold up to 60 days in advance | Start date must be between today and today + 60, inclusive. **No backdating**: otherwise **422** |

### Renew (SHOULD-2)

| ID | Rule | Agreed interpretation |
|---|---|---|
| RENEW-1/2 | Renew within 30 days of the end date, not after it | Window: **end − 30 days to the end date, inclusive**, measured from the latest term's end. Otherwise **422** |
