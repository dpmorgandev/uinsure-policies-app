# plans

Three plans of the three kinds the plan page must tell apart (U2: DAG-1, NODE-1): a `build` DAG, a `ui`
DAG and an investigation, `inv-001`, written as `inv-001.plan.md` with front matter and no DAG. Cut from
the real plan files' shapes: `build.dag.yaml` and `ui.dag.yaml` with their header scalars, each node's
`depends_on`, `rules`, `pr`, `acceptance` and one-line `tasks`, and `inv-<n>.plan.md`'s front matter and
sections.

## The build plan (`base/docs/plans/active/build.dag.yaml`), in file order

| Node | Title | Status | Attempt | Depends on | Rules | PR | Tasks (status) |
|---|---|---|---|---|---|---|---|
| F0a | Harness | done | 0 | none | none | none | t1 done |
| F0b | Walking skeleton | done | 1 | F0a | none | #3 | t1 done |
| F1 | Sell | done | 2 | F0b | SELL-1, SELL-2 | #10 | t1, t2, t3 done |
| F2 | Retrieve | in_progress | 1 | F1 | GET-1 | none | t1 done, t2 done, t3 pending, t4 pending |
| F5 | Pipeline (evidence only) | pending | 0 | F0b | none | none | t1 pending |
| F3 | Cancel | pending | 0 | F2, F5 | CANCEL-1 | none | t1 pending |

The header: `status: approved`, approved by David Morgan on 2026-10-15, `requirements_rev: 1a2b3c4`.

The file order (F0a, F0b, F1, F2, F5, F3) is neither alphabetical (F3 before F5) nor the graph's layer
order (F5 sits beside F1), so a page that lists the nodes "in file order" is checked against both. F5
branches off F0b, and F3 joins F2 and F5: two lines meet at F3.

**The graph's layers**, one below the deepest node each waits for: F0a 1, F0b 2, F1 3, F5 3, F2 4, F3 5.

**F1's acceptance**, in order: "POST /policies sells a policy under a reference no other policy has"; "A start
date more than 60 days ahead answers 422". **F2's tasks**, in order: t1 "Acceptance tests for the retrieve"
done, t2 "Stub the retrieve route" done, t3 "Pause 1: David reads the stub" pending, t4 "Read a policy back
by its reference" pending. No task title holds the word done or pending.

## The ui plan and the investigation

- `ui.dag.yaml`: U0 Kit and fixtures (done, PR #57), then U1 Overview and rules (pending, depends on U0).
- `inv-001.plan.md`: "F2 stub-gate escalation", parent `build/F2`, `dag: null`, so it has no nodes.

## The trail

- **F1:** a README whose completeness is `OK`.
- **F2:** in flight: `loop.jsonl` with setup, `state(in_progress)` and a red gate, and its first two commits
  (c1 the state change, c2 the red test); no README, no walkthrough.
- Every other node has no trail.

**Expected, and how it was checked:** the layers above are worked by hand from the kit's `DagGraph` rule (a
node sits one layer below the deepest node it waits for); the rest is read off the plan files as written.
