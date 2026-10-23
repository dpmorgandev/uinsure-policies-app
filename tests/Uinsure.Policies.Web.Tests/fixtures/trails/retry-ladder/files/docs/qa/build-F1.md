# QA: build/F1

| # | Rule | Step | Expected |
|---|---|---|---|
| 1 | SELL-1 | POST /policies with a reference | 201 |
| 2 | SELL-2 | POST the same reference again | 409 |
