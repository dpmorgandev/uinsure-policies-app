# Requirements (fixture excerpt)

Cut from the shape of docs/requirements.md section 2: a feature heading with its priority, then a table of
rule, title and agreed interpretation. One rule for the node in flight, one for the node after it.

## 2. Functional requirements

### Sell (MUST-1)

| ID | Rule | Agreed interpretation |
|---|---|---|
| SELL-1 | Policy reference must be unique | The client supplies the reference. It is trimmed and upper-cased, then must match `^[A-Z0-9-]{3,20}$` (else **400**). A duplicate returns **409** |

### Retrieve (MUST-2)

| ID | Rule | Agreed interpretation |
|---|---|---|
| GET-1 | Retrieve a policy | By reference. Returns the policy and its terms. **404** if not found |
