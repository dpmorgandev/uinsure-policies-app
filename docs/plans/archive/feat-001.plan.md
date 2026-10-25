---
plan_id: feat-001
kind: feature
title: The full user guides, as persona journeys
created: 2026-10-25
dag: feat-001.dag.yaml
parent: null
---
# feat-001: The full user guides, as persona journeys

## Why

The delivered guides (F7 `API_UserGuide.pdf`, F8 `UI_UserGuide.pdf`) are the 2026-10-23 short form, rushed for
the interview. They read as a feature list with top-of-page screenshots. David, 2026-10-25:

> "red circles with 1 and 2 are hard to follow we should use a red box with step label so say a text box is step
> one the text box will have a red box drawn around it so user can clearly see where they need to drive from.
> Most of the screenshot are just top of page - I dont see any responses shown at end of pages or plan pictures-
> perhabs we should try to tell a story user flows and think how a user will use this and bring them on a journey
> to learn the app how they would use it rather than sell, quote, cancel etc [...] and we need full coverage of
> all feature- human decisions for example how do I use it how does it benefit me as a user of docket"

His follow-ups the same day:
- "Stay 1 pdf": each guide stays one PDF, with no separate start-here guide.
- "Three personsa sounds fine as long as we have full coverage": a policy servicer in the workbench, an assessor
  in the explorer, and a developer joining. Coverage is the condition.
- "Split: guides move out": the guide work bug-002/N6 gave up comes here.

The outcome: a reader picks up one PDF and follows a persona's journey. At each step they see the exact element
boxed in red with its "Step n" label, and the result it produces. Every feature of that half appears on some step.

Requirement lines: `docs/documentation-requirements.md` LRN-6 (amended), LRN-12, LRN-13 and LRN-14 (new), plus
§6, §7 and §8 unchanged. These are guide requirements, not API or Docket rules, so the node has `rules: []`.

## Approach

### N1: Rebuild both guides as persona journeys (docs node)

- **Requirements first.** The approval commit carries the LRN-6 amendment and the three new LRN rows (David's
  words above). The builder then amends `docs/specs/guide-format.spec.md` (the red box and "Step n" label replace
  `span.marker`), `ui-guide.spec.md` and `api-guide.spec.md` (the question bank re-grouped by persona, the
  journey outline and the coverage map).
- **Personas to guides** (Claude's mapping of David's three personas; change it at approval if it's wrong):
  - `UI_UserGuide.pdf`: the policy servicer (workbench: sell, view, quote and cancel, claim, renew, inspect a
    request, the error states) and the assessor (explorer: a rule's evidence from requirement to tests and
    commits, a node's walkthrough, a verdict and its findings, the matrix).
  - `API_UserGuide.pdf`: the developer joining (clone, run, the test suites by hand, where a rule lives) and the
    servicer driving the API directly (Postman and curl, each response shown).
- **Shots.** `docs/guides/ui/capture.mjs` re-captures from the app on `main`. It draws the red box from region
  tags, as the markers are drawn now, and frames each step's result: the response panel, the end of the page,
  the plan picture.
- **Coverage check.** A new check under `docs/guides/` reads the coverage map and fails on any §6 or §7 feature
  with no journey step. It runs beside the existing link check (`docs/guides/api/check.test.mjs`).
- **The carried N6 work.** The API guide's launch and test sections are reprinted against `main`, with counts
  from a run on `main`, which removes the two "not on this branch" callouts and the stale 637. `api-guide.spec.md`
  moves to one diagram per big idea (LRN-4) and gets the four missing diagrams. F8's R6–R12 and the A2.2 note
  are applied. Both PDFs are reprinted.
- **Loop.** The docs sequence, with David's lighter docs loop (2026-10-23): only a P1 reopens (a command that
  fails as printed, or a privacy leak), and a P2 becomes a PR note. The node's acceptance commands are the link
  check, the coverage check, the privacy scan and the reprint.
- **Out.**
  - The matrix screen's Step 3 re-sign, routed here on 2026-10-25. It needs `/screen-resign` extended to
    redraw a region, which is a design stage. It is deferred to its own plan, and the U1 DATA-4 test holds
    N4's line meanwhile.
  - Any change to `src/` or `tests/` (documentation-requirements §9).

## Rejected alternatives

- **Two nodes, one per guide.** Two PRs and two review rounds. The guides share the format change and the
  capture script, so splitting them doubles the loop overhead within David's window ("2hours can be extended to
  4-5", 2026-10-25) for no reviewable gain.
- **Keep numbered markers and only add outcome shots.** David rejected the circles in so many words ("red circles
  with 1 and 2 are hard to follow").
- **A separate start-here guide per persona.** David: "Stay 1 pdf".
- **Doing the matrix Step 3 re-sign here.** It's a screen-contract change, which is a design stage, not a docs
  task. Putting it on the guide PR would hold the guides up behind G4-style sign-off.

## Prior work consulted

- `docs/plans/active/build.dag.yaml:433`: F8's acceptance, with highlight markers measured from region tags. Kept,
  and the box replaces the marker.
- `docs/plans/archive/bug-002.plan.md:91-99, 150-153`: the guide work N6 gave up (the "not on this branch"
  callouts, the 637 count, one diagram per big idea, F8 R6–R12, the A2.2 note, the reprint). Carried here.
- `docs/plans/archive/bug-002.plan.md:192`: the matrix Step 3 re-sign was routed to feat-001. It is deferred (see Out).
- `docs/guides/ui/index.html`, `UI_UserGuide.pdf`: last changed in `5ab3eadd` (F8 A1.2/R13).
- `docs/guides/api/index.html`, `API_UserGuide.pdf`: last changed in `64eb6808` (F7 LRN-5 green).
- `docs/specs/guide-format.spec.md`: last changed in `fc1ee5bc`. Its `span.marker` component (`:26`) becomes the red box.

## Attempt log
- N1 attempt 1: the t1 gate failed at 6f2e8efc. Check A1/I8 counted the 7 diagram rows, not the 30 persona questions. The investigator found the check at fault, not the spec (findings/A1.md), and the builder fixed it in 1f548620. Attempt 1 → 2.
- N1 attempt 2: t2 shots and the coverage check landed at 6db22f48, the UI guide at 6bf608d2 and da7ac832, and the API guide at ae30479f. Gates passed at 0e0cc637. Review A2 at a9c3f83b: reviewer PASS (7 P2), security PASS.
- Steer D1 (David, 2026-10-25, "Fix now"): reviewer R1 (fixed capture-day dates), R4 (dotnet-ef prerequisite) and R5 (stale receipt note) went through findings/D1.md. Red checks 947b66ba came first (written by the builder, because guard G1 keeps the tester out of docs/guides/**), then the fix 11872be5. Review A2.2: reviewer PASS (4 P2), security PASS. No attempt increment.
- The full Playwright run was repeated once at David's ruling ("Re-run once"): 446 passed / 486 failed, against 475 / 457 the first time. The guide prints the failing run as it happened; the cause goes to bug-003.

## Completion record
- N1: PR #134, merged by David as c438c1ff on 2026-10-25. Integrate receipt 6113586e (652/652); trail check OK.
- Sign-offs on David's behalf: the From David paragraph and the Pause 2 sign-off at 5f2b47ab, under his delegation of 2026-10-25 ("Delegate + sign-off"). He merged.
- Pause 2 Postman receipt was skipped: this is a docs node with no API change, and the Postman CLI won't start on the capture machine.
- The hitl → done commit (2419dbcf) was pushed after the merge, so this archive commit carries N1's done state, pr 134 and t9-t11.
- Moved to bug-003 (parked until after 2026-10-30): e2e timeouts under full parallel load (A2 R3, two runs); the cold-start timeouts; the README "once per clone" wording; F8 t9 and U10 t14 bookkeeping; the test:kit path filter; the N4/N6 code P2s.
- Harness carry-overs (one harness PR): the tester's write scope for docs-node checks; the SubagentStop hook not firing for the D1 investigator (its findings were filed by replaying the same hook with the agent's own final message); render-trace has no gate.postman(skipped) event form.
- PR notes, not fixed: four hand-capture placeholders (VS x2, Postman x2) at David's ruling "Leave placeholders"; A2 R2 and A2.2 R4 (check depth); A2.2 R1-R3 (receipts provenance, clean-machine dotnet-ef); A2 R7 (TDD label on 1f548620).
- Still deferred from the plan's Out list: the matrix Step 3 re-sign.
