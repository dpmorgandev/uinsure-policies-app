# real-trailers

Commit bodies in the shapes the real trail writes them (U1 round D3: findings I1, I3 and I4, for RULE-2, RULE-1 and
NAV-3). Every fixture before this one built its trailer block from a JSON object, so no commit could carry a key
twice; the real trail does it often. This one has, each cut from a real commit:

- a body that repeats `Rule:` (build/F1's domain green, `docs/trace/build/F1/packet/trailers.txt` lines 420-431:
  seven `Rule:` lines, SELL-1 to SELL-7; here two);
- a body that repeats `Fixes-Finding:` beside the `Rule: none` sentinel (`trailers.txt` lines 163-175, the
  `fix(none)` commit with seven `Fixes-Finding:` lines; here two);
- a slash rule's commits, one trailed by the slash ID and one by its parts (`docs/trace/build/F4/packet/trailers.txt`
  lines 25-31, `Rule: RENEW-1/2`, and lines 253-259, `Rule: RENEW-1, RENEW-2, RENEW-3a`; here without RENEW-3a,
  which is no row in this fixture).

Every commit closes on its `Co-Authored-By:` line, as the real ones do.

## The rules (`base/docs/requirements.md`)

| ID | Line | Feature | Node |
|---|---|---|---|
| SELL-1 | 12 | Sell | build/F1 |
| SELL-2 | 13 | Sell | build/F1 |
| RENEW-1/2 | 19 | Renew | build/F4 |

No row is `RENEW-1` or `RENEW-2`: those are the parts the C# tests and some commits trail, never rules of their own.

## The commits (one branch, `feature/build/F4`, each at its own `date`)

| Id | Node | Agent | TDD | Trailer lines as written | Walkthrough row |
|---|---|---|---|---|---|
| c0 | F1 | main | | no `Rule:` | F1 #1 |
| c1 | F1 | tester | red | `Rule: SELL-1` | F1 #2 |
| c2 | F1 | tester | red | `Rule: SELL-2` | F1 #3 |
| c3 | F1 | builder | green | `Rule: SELL-1` then `Rule: SELL-2`, two lines | F1 #4 |
| c4 | F1 | builder | green | `Rule: none`; `Fixes-Finding: A1/I1` then `Fixes-Finding: A1/I2`, two lines | F1 #5 |
| c5 | F4 | main | | no `Rule:` | F4 #1 |
| c6 | F4 | tester | red | `Rule: RENEW-1/2` | F4 #2 |
| c7 | F4 | builder | green | `Rule: RENEW-1, RENEW-2`, one line, the parts | F4 #3 |

c4's real `Fixes-Finding` values are bare (`I1` to `I7`) and a later commit's read `D1/I2`; here they are `A1/I1`
and `A1/I2`, the form the compiler reads today, so a test of the repeated lines is not also a test of the round forms
(the `D<n>/I<n>` round is U3's).

## The matrix (`trail/docs/trace/requirements-matrix.md`, rows from line 6)

| Line | Rule | plan/node | Tests | Red | Green |
|---|---|---|---|---|---|
| 6 | SELL-1 | build/F1 | 22/22 | c1 | c3 |
| 7 | SELL-2 | build/F1 | 9/9 | c2 | c3 |
| 8 | RENEW-1/2 | build/F4 | 30/30 | c6 | c7 |

## The facts a test reads

- **c3's rules** are SELL-1 and SELL-2, in that order: both lines, never only the last.
- **c4's findings** are A1/I1 and A1/I2, in that order; **c4's rules** are none, an empty list: `none` is the
  harness's sentinel for a commit that proves no rule, not a rule ID.
- **c7's parts** RENEW-1 and RENEW-2 are both RENEW-1/2's, so RENEW-1/2's spine is red c6 (#2) then green c7 (#3).
- **SELL-1's spine** is red c1 (#2) then green c3 (#4); **SELL-2's** is red c2 (#3) then green c3 (#4).

**Expected, and how it was checked:** the rows and lines were counted by hand. The repeated lines are not taken on
trust: the compiler tests read c3's and c4's bodies back with `git log -1 --format=%B` on the replayed repo before
asserting what the compiler made of them. The README claims no `render-trace check` label: no node here has a README.
