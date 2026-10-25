# Lessons

One entry per node that took three or more attempts, was escalated or was cut (`/feature` §8 step 3). Each
names what cost the attempts and the rule it leaves. The evidence is the node's trail, `docs/trace/<plan>/<node>/`.

## bug-002/N1: a fresh clone F5s straight into Docket (attempt 3, inv-010)

**What cost the attempts.**
- **Attempt 1 failed on a race in the test, not in the product.** The test read two pipes, the compiler's
  problems on stderr and Vite's `Local:` line on stdout, and assumed an order between them. The product's order
  was fixed (`vite.config.ts`), so no finding-red was possible, and the fix was to the observation: wait until
  every expected problem is captured, bounded by a deadline.
- **Attempt 2 met the real cause, which the first reading had missed.** The loader read `trace.json` once and
  took the dev server's "compiling" 503 as final. Vite's `--open` on listen triggered it. inv-010 found it with
  four smaller defects beside it.

**The rule it leaves.** When a test watches two processes or two streams, first prove which order the product
guarantees. Never let the test assume one. And when the app polls something that answers "not yet", test the
not-yet answer as a state, not as an error.

## bug-002/N2: the workbench shows the request it sent and the response it got (attempt 4, inv-011)

**What cost the attempts.**
- **Attempt 1:** tests read the wrong reference. A WB-3 scan read the live inspector, and WB-4 parity read W2's
  reference, which still drew the inspector as a placeholder. Two drawers were also moved into new regions,
  breaking parity elsewhere.
- **Attempt 2:** three things at once. The sell receipt's heading shared the drawer's sticky range. A test
  checked presence, not visibility. And an exchange whose fetch was rejected stayed "Waiting". inv-011 split
  them out.
- **Attempt 3:** display code round-tripped JSON through JavaScript numbers and lost tokens. The tests derived
  their expected values from parsed JSON, so they lost the same tokens, and the defect hid behind its own
  oracle. The kit's JsonViewer already indented token-exact, but its helper wasn't exported.

**The rule it leaves.**
- A node that builds a region a signed screen drew as a placeholder needs its own derived reference before red
  (N4 met the same thing again, A1).
- Assert visibility, not presence, for anything that docks or scrolls.
- Never derive a test's expected value with the same transformation the code under test uses. Read the wire
  text.
