# QA script — build / F1 — Sell

Rule IDs: SELL-1, SELL-2
Commit under test: {{c8:7}}

| # | Rule | Step | Expected |
|---|---|---|---|
| 1 | SELL-1 | POST /policies with a new reference | 201 |
| 2 | SELL-2 | POST /policies with a start date of today + 61 | 422 |

## Sign-off

| | |
|---|---|
| Tester | David Morgan |
| Date | 2026-10-18 |
| Commit signed off | {{c8}} |
| Steps passed | 2 of 2 |
| Verdict | ☐ Reject (findings above)  ☑ Accept F1 |
| Signature | David Morgan 18/10/2026 11:00 |
